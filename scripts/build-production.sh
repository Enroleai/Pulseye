#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
readonly ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd -- "$ROOT"
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ "$(node --version)" == 'v22.23.4' ]] || fail 'Build/API tests require Node 22.23.4 (set up Node before this script).'
[[ "$(node -p 'process.platform')" == linux ]] || fail 'Native releases must be built on Linux.'
readonly ARCH="$(node -p 'process.arch')"
OUTPUT="$ROOT/release"
if [[ "${PULSEYE_BUILD_VALIDATION_ONLY:-0}" == 1 ]]; then
  # The ARM sandbox may check the build, but must never produce release/ for x64 EC2.
  OUTPUT="$ROOT/.pulseye-build-check/release"
  printf 'LOCAL VALIDATION ONLY: %s dependencies; output cannot be deployed to EC2.\n' "$ARCH"
else
  [[ "$ARCH" == x64 ]] || fail 'Production artifact must be built on Linux x64 for the authorized amd64 EC2 host.'
fi
[[ ! -L "$OUTPUT" && ! -L "${OUTPUT%/*}" ]] || fail 'Unsafe build output path.'
readonly OUTPUT
readonly WORK="$(mktemp -d "${RUNNER_TEMP:-/tmp}/pulseye-native-build.XXXXXX")"
trap 'rm -rf -- "$WORK"' EXIT

printf 'Installing locked API dependencies and running Node 22 API tests...\n'
(
  cd api
  npm ci --legacy-peer-deps --no-audit --no-fund
  npm test
  node test/native-startup.test.js
)
printf 'Installing locked Angular dependencies and compiling production frontend...\n'
(
  cd frontend
  npm ci --legacy-peer-deps --no-audit --no-fund
  # Angular 11/Webpack 4 requires the legacy digest provider under Node 22.
  # This is build-only; the production API never receives NODE_OPTIONS.
  export NG_CLI_ANALYTICS=false
  export NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=6144'
  npm run build -- --configuration production
  if [[ -z "${CHROME_BIN:-}" ]]; then
    export CHROME_BIN="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
  fi
  [[ -n "$CHROME_BIN" && -x "$CHROME_BIN" ]] || fail 'Headless Chrome is required for Angular tests (set CHROME_BIN).'
  CI=true npm run test:ci
)
[[ -f frontend/dist/project/index.html ]] || fail 'Angular production output is missing.'

printf 'Installing locked production API dependencies into a clean staging directory...\n'
cp -- api/package.json api/package-lock.json "$WORK/"
(
  cd "$WORK"
  npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund
  node - <<'JS'
const assert = require('assert');
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('offline-native-binding-check', 4);
assert(bcrypt.compareSync('offline-native-binding-check', hash));
assert(!bcrypt.compareSync('wrong-value', hash));
console.log(`bcrypt native binding verified on ${process.platform}/${process.arch}, ${process.version}.`);
JS
)

printf 'Packaging allowlisted application source and compiled frontend...\n'
python3 - "$ROOT" "$WORK" "$OUTPUT" <<'PY'
import json, os, pathlib, shutil, stat, subprocess, sys
root, work, output = map(pathlib.Path, sys.argv[1:])
forbidden = {'.git', '.github', '.ssh', '.aws', '.env', 'production.env', 'deploy.conf', 'credentials', 'secrets', 'id_rsa', 'id_ed25519', '.pulseye-release'}
credential_extensions = ('.pem', '.key', '.p12', '.pfx')

def forbidden_name(name):
    return name in forbidden or name.startswith('.env') or name.endswith(credential_extensions)

def check_regular_tree(tree, allow_dependency_links=False):
    resolved_root = tree.resolve(strict=True)
    for directory, dirs, files in os.walk(tree, followlinks=False):
        for name in dirs + files:
            path = pathlib.Path(directory) / name
            metadata = path.lstat()
            if stat.S_ISLNK(metadata.st_mode):
                if not allow_dependency_links:
                    raise SystemExit(f'Symlink forbidden outside node_modules: {path.relative_to(root) if path.is_relative_to(root) else path}')
                try:
                    target = path.resolve(strict=True)
                    target.relative_to(resolved_root)
                except (OSError, ValueError, RuntimeError):
                    raise SystemExit('Dependency link is dangling, cyclic or escapes node_modules; packaging refused.')
                if not target.is_file():
                    raise SystemExit('Only internal dependency file links may be normalized; directory/special links are refused.')
            elif not (stat.S_ISREG(metadata.st_mode) or stat.S_ISDIR(metadata.st_mode)) or metadata.st_mode & 0o7000:
                raise SystemExit('Unsafe build file type or set-id mode; packaging refused.')

if output.exists():
    if not output.is_dir(): raise SystemExit('Output must be a directory.')
    shutil.rmtree(output)
(output / 'api').mkdir(parents=True)
allowed_dirs = {'config', 'email', 'imageUpload', 'middleware', 'models', 'routes', 'soket'}
source_files = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z', '--', 'api']).decode().split('\0')
for name in filter(None, source_files):
    relative = pathlib.PurePosixPath(name)
    parts = relative.parts
    if len(parts) < 2: continue
    if not (parts[1] in {'index.js', 'package.json', 'package-lock.json'} or parts[1] in allowed_dirs): continue
    if any(forbidden_name(part) for part in parts):
        raise SystemExit('Credential/control path found in allowlisted source.')
    source = root / name
    metadata = source.lstat()
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_mode & 0o7000:
        raise SystemExit('Allowlisted application source must be safe regular files.')
    target = output / pathlib.PurePosixPath(*parts)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)

# Source manifests/locks stay untouched. The artifact exposes no nodemon or
# broken cd-client build command; its only package script is native startup.
manifest_path = output / 'api/package.json'
manifest = json.loads(manifest_path.read_text())
manifest['scripts'] = {'start': 'node index.js'}
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')

frontend = root / 'frontend/dist/project'
check_regular_tree(frontend)
shutil.copytree(frontend, output / 'frontend', symlinks=False)
start = root / 'deployment/start-production.sh'
if not stat.S_ISREG(start.lstat().st_mode): raise SystemExit('Startup source must be a regular file.')
(output / 'deployment').mkdir()
shutil.copy2(start, output / 'deployment/start-production.sh')
os.chmod(output / 'deployment/start-production.sh', 0o755)

modules = work / 'node_modules'
check_regular_tree(modules, allow_dependency_links=True)
# Only shipped dependency TLS/private-key test fixtures are omitted. Runtime
# credential files or unexpected forbidden paths are never silently stripped.
def dependency_ignore(directory, names):
    relative = pathlib.Path(directory).relative_to(modules)
    ignored = []
    for name in names:
        if forbidden_name(name):
            if name == '.github':
                # Published package CI metadata is not runtime code or secrets.
                ignored.append(name)
                continue
            # AWS SDK ships credential-provider CODE here, not credential data.
            # The workflow/host archive validators need this exact same exception.
            if name == 'credentials' and relative == pathlib.Path('aws-sdk/lib'):
                provider_dir = pathlib.Path(directory) / name
                if not provider_dir.is_dir() or provider_dir.is_symlink():
                    raise SystemExit('AWS SDK provider source path must be a regular directory.')
                for provider in provider_dir.iterdir():
                    if not provider.is_file() or provider.is_symlink() or provider.suffix not in {'.js', '.ts'}:
                        raise SystemExit('Unexpected non-code file in AWS SDK credential-provider source.')
            elif name.endswith(credential_extensions) and any(part.lower() in {'test', 'tests', 'fixture', 'fixtures', '__tests__'} for part in relative.parts):
                ignored.append(name)
            else:
                raise SystemExit(f'Unexpected credential/control dependency path: {relative / name}; packaging refused.')
    return ignored
# npm's .bin links are copied as regular files only after every target has been
# verified to stay within this exact node_modules tree.
shutil.copytree(modules, output / 'api/node_modules', symlinks=False, ignore=dependency_ignore)
check_regular_tree(output)
total = 0
for directory, dirs, files in os.walk(output):
    for name in dirs + files:
        path = pathlib.Path(directory) / name
        allowed_sdk_code = (path.relative_to(output) == pathlib.Path('api/node_modules/aws-sdk/lib/credentials') and path.is_dir())
        if forbidden_name(name) and not allowed_sdk_code: raise SystemExit('Forbidden release archive path.')
        if path.is_file(): total += path.stat().st_size
if not 0 < total <= 2147483648: raise SystemExit('Release exceeds immutable archive expanded-size limit.')
print(f'Validated regular-files-only release: {total} expanded bytes; output {output}.')
PY
NODE_ENV=production NODE_CONFIG_DIR="$OUTPUT/api/config" \
  JWT_PRIVATE_KEY=offline-package-check MONGODB_URI=mongodb://127.0.0.1:1/offline_check \
  CORS_ORIGIN=http://localhost PULSEYE_CANARY=1 node - "$OUTPUT" <<'JS'
const path = require('path');
const release = process.argv[2];
const { createApplication } = require(path.join(release, 'api/index.js'));
const application = createApplication();
if (!application.canary || application.server.listening) throw new Error('Packaged application must load without starting side effects.');
console.log('Packaged API loaded successfully without connecting to MongoDB or any provider.');
JS
printf 'Native build complete: %s (Node 22.23.4, Linux/%s).\n' "$OUTPUT" "$ARCH"
