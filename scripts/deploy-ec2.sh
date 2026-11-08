#!/usr/bin/env bash
# Future source contract: scripts/build-production.sh creates complete release/.
# release/deployment/start-production.sh must be executable, foreground-running,
# honor PORT and PULSEYE_CANARY=1 (disable migrations/background side effects),
# and include all runtime dependencies. Runtime installation is not guessed.
# Archive contains release/ only: regular files/directories, no links or special files.
set -Eeuo pipefail
umask 077
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
readonly INSTANCE_ID='i-04bb8daa577fcfd9d'
readonly PUBLIC_HOST='ec2-43-204-141-131.ap-south-1.compute.amazonaws.com'
readonly ENV_FILE='/etc/pulseye/production.env'
readonly CONF_FILE='/etc/pulseye/deploy.conf'
readonly RELEASES='/opt/pulseye/releases'
readonly CURRENT='/opt/pulseye/current'
readonly SERVICE='pulseye.service'
readonly MAX_ARCHIVE=1500000000
readonly MAX_EXPANDED=2147483648
readonly HEALTH_SECONDS=180

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }
usage() { fail 'Usage: preflight [ready] | diskcheck ARCHIVE_BYTES EXPANDED_BYTES | deploy COMMIT ARCHIVE_SHA256 ARCHIVE_BYTES EXPANDED_BYTES RUN_ID /tmp/pulseye-COMMIT-RUN_ID.XXXXXX/release.tar.gz'; }
secure_file() {
  [[ -f "$1" && ! -L "$1" && "$(stat -c '%u:%a' -- "$1")" == '0:600' ]] || fail 'Runtime configuration must be a regular root-owned file with mode 0600.'
}
check_instance() {
  local token actual
  token=$(curl --noproxy '*' --fail --silent --show-error --connect-timeout 2 --max-time 5 --request PUT \
    --header 'X-aws-ec2-metadata-token-ttl-seconds: 60' http://169.254.169.254/latest/api/token) || fail 'IMDSv2 token unavailable.'
  [[ -n "$token" ]] || fail 'Empty IMDSv2 token.'
  actual=$(curl --noproxy '*' --fail --silent --show-error --connect-timeout 2 --max-time 5 \
    --header "X-aws-ec2-metadata-token: $token" http://169.254.169.254/latest/meta-data/instance-id) || fail 'Instance identity unavailable.'
  [[ "$actual" == "$INSTANCE_ID" ]] || fail 'Instance mismatch; only the authorized application instance is allowed.'
}
read_config() {
  local line key value count=0
  local -A config_seen=() env_seen=()
  secure_file "$CONF_FILE"; secure_file "$ENV_FILE"
  DEPLOYMENT_READY='' APP_PORT='' HEALTH_PATH=''
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" =~ ^[A-Z_]+=[^[:space:]]+$ ]] || fail 'Invalid deploy.conf syntax; use plain KEY=value entries.'
    key=${line%%=*}; value=${line#*=}
    [[ -z "${config_seen[$key]+present}" ]] || fail 'Duplicate deployment configuration key.'
    config_seen[$key]=1
    case "$key" in
      DEPLOYMENT_READY) DEPLOYMENT_READY=$value ;;
      APP_PORT) APP_PORT=$value ;;
      HEALTH_PATH) HEALTH_PATH=$value ;;
      *) fail 'Unsupported deployment configuration key.' ;;
    esac
  done < "$CONF_FILE"
  [[ "$DEPLOYMENT_READY" =~ ^[01]$ ]] || fail 'DEPLOYMENT_READY must be 0 or 1.'
  [[ "$APP_PORT" == 3000 ]] || fail 'APP_PORT must match the provisioned upstream: 3000.'
  [[ "$HEALTH_PATH" =~ ^/[A-Za-z0-9/_-]*$ && ${#HEALTH_PATH} -le 128 ]] || fail 'Unsafe HEALTH_PATH.'
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= && "$line" != *$'\r'* ]] || fail 'Invalid production.env syntax; use Unix KEY=value lines.'
    key=${line%%=*}; value=${line#*=}
    [[ -z "${env_seen[$key]+present}" ]] || fail 'Duplicate runtime environment key.'
    env_seen[$key]=1; count=$((count + 1))
    case "$key" in
      PORT) [[ "$value" == 3000 ]] || fail 'Runtime PORT must be 3000.' ;;
      AWS_REGION) [[ "$value" == ap-south-1 ]] || fail 'Runtime region mismatch.' ;;
      S3_BUCKET|PULSEYE_S3_BUCKET) [[ "$value" == pulseyeprod ]] || fail 'Runtime bucket mismatch.' ;;
    esac
  done < "$ENV_FILE"
  for key in PORT AWS_REGION S3_BUCKET PULSEYE_S3_BUCKET; do
    [[ -n "${env_seen[$key]+present}" ]] || fail 'Baseline runtime configuration is incomplete.'
  done
  info "Protected runtime configuration verified: $count keys; no values logged."
}
require_ready() {
  [[ "$DEPLOYMENT_READY" == 1 ]] || fail 'Application runtime is not approved. Configure app-required secrets and the actual native runtime, then set DEPLOYMENT_READY=1. Build and transfer are prohibited while readiness is 0.'
}
preflight() {
  check_instance
  [[ "$(ps -p 1 -o comm= | tr -d '[:space:]')" == systemd ]] || fail 'systemd is not PID 1.'
  systemctl is-active --quiet nginx || fail 'Nginx is not active.'
  nginx -t >/dev/null 2>&1 || fail 'Nginx configuration validation failed.'
  id pulseye >/dev/null 2>&1 || fail 'Least-privileged pulseye application user is missing.'
  local directory mode
  for directory in /opt/pulseye "$RELEASES"; do
    [[ -d "$directory" && ! -L "$directory" && "$(stat -c '%u' "$directory")" == 0 ]] || fail 'Protected release directory is missing or unsafe.'
    mode=$(stat -c '%a' "$directory")
    [[ "$mode" == 755 || "$mode" == 750 ]] || fail 'Release paths require root ownership and mode 0755 or 0750.'
    runuser -u pulseye -- test -x "$directory" || fail 'Application user cannot traverse the protected release directory.'
  done
  [[ -f /opt/pulseye/deploy.lock && ! -L /opt/pulseye/deploy.lock && "$(stat -c '%u' /opt/pulseye/deploy.lock)" == 0 ]] || fail 'Root-owned deployment lock is missing or unsafe.'
  [[ "$(systemctl show "$SERVICE" --property=LoadState --value)" == loaded ]] || fail 'The native application service scaffold is not loaded.'
  [[ "$(systemctl show "$SERVICE" --property=User --value)" == pulseye ]] || fail 'Application service must use the pulseye user.'
  [[ "$(systemctl show "$SERVICE" --property=WorkingDirectory --value)" == "$CURRENT" ]] || fail 'Application service WorkingDirectory must point to the current release.'
  [[ "$(systemctl show "$SERVICE" --property=EnvironmentFiles --value)" == "$ENV_FILE (ignore_errors=no)" ]] || fail 'Application service must use the protected production EnvironmentFile.'
  local exec_start
  exec_start=$(systemctl show "$SERVICE" --property=ExecStart --value)
  [[ "$exec_start" == *"path=$CURRENT/deployment/start-production.sh ; argv[]=$CURRENT/deployment/start-production.sh ;"* ]] || fail 'Application service ExecStart must be the current release start-production.sh without extra commands.'
  [[ "$(systemctl show "$SERVICE" --property=NoNewPrivileges --value)" == yes ]] || fail 'Application service must enable NoNewPrivileges.'
  read_config
  info 'Authorized instance, Nginx, systemd service scaffold and protected native release paths verified.'
}
validate_sizes() {
  [[ "$1" =~ ^[1-9][0-9]{0,9}$ && "$2" =~ ^[1-9][0-9]{0,9}$ ]] || fail 'Invalid archive sizes.'
  (( $1 <= MAX_ARCHIVE && $2 <= MAX_EXPANDED )) || fail 'Release archive exceeds size limits.'
}
check_disk() {
  local archive=$1 expanded=$2 required available path
  validate_sizes "$archive" "$expanded"
  required=$((archive * 3 + 1073741824))
  (( required >= 2147483648 )) || required=2147483648
  (( required >= archive * 2 + expanded + 1073741824 )) || required=$((archive * 2 + expanded + 1073741824))
  for path in /tmp "$RELEASES"; do
    available=$(df -B1 --output=avail "$path" | tail -n 1 | tr -d '[:space:]')
    [[ "$available" =~ ^[0-9]+$ ]] && (( available >= required )) || fail "Insufficient disk headroom: require $required bytes before transfer/extraction."
  done
  info "Conservative disk headroom verified: $required bytes."
}
http_ok() {
  local code
  code=$(curl --noproxy '*' --silent --output /dev/null --write-out '%{http_code}' --connect-timeout 2 --max-time 5 \
    --header "Host: $PUBLIC_HOST" "http://127.0.0.1:$1$HEALTH_PATH") || return 1
  [[ "$code" == 200 ]]
}
wait_healthy() {
  local unit=$1 port=$2 deadline=$((SECONDS + HEALTH_SECONDS))
  while (( SECONDS < deadline )); do
    if systemctl is-active --quiet "$unit" && http_ok "$port"; then return 0; fi
    [[ "$(systemctl show "$unit" --property=ActiveState --value)" != failed ]] || return 1
    sleep 2
  done
  return 1
}
proxy_ok() { systemctl is-active --quiet nginx && nginx -t >/dev/null 2>&1 && http_ok 80; }
atomic_current() {
  local target=$1 temporary="$CURRENT.next-$commit-$run_id"
  [[ ! -e "$temporary" && ! -L "$temporary" ]] || return 1
  ln -s -- "$target" "$temporary" && mv -Tf -- "$temporary" "$CURRENT"
}
validate_archive() {
  # Validate every member before extraction. Reject links, traversal, duplicates,
  # device files, set-id modes and credential/source-control paths. No extractall.
  python3 - "$1" "$2" "${3:-}" <<'PY'
import os, pathlib, sys, tarfile
archive, expected, destination = sys.argv[1:]
forbidden = {'.git', '.github', '.ssh', '.aws', '.env', 'production.env', 'deploy.conf', 'credentials', 'secrets', 'id_rsa', 'id_ed25519', '.pulseye-release'}
seen = set(); total = 0; start = None; members = []
with tarfile.open(archive, 'r:gz') as tar:
    for member in tar:
        name = member.name
        path = pathlib.PurePosixPath(name)
        parts = path.parts
        if (not name or len(name) > 4096 or len(seen) >= 250000 or name.startswith('/') or '\\' in name or any(ord(c) < 32 for c in name)
                or not parts or parts[0] != 'release' or '..' in parts
                or any(p in forbidden or p.startswith('.env') or p.endswith(('.pem', '.key', '.p12', '.pfx')) for p in parts)
                or not (member.isdir() or member.isfile()) or member.mode & 0o7000):
            raise SystemExit('Unsafe release archive member; extraction refused.')
        canonical = str(path)
        if canonical in seen:
            raise SystemExit('Duplicate release archive member; extraction refused.')
        seen.add(canonical)
        if member.isfile():
            total += member.size
            if total > 2147483648:
                raise SystemExit('Expanded release exceeds the 2 GiB limit.')
        if canonical == 'release/deployment/start-production.sh': start = member
        members.append(member)
    if total != int(expected): raise SystemExit('Expanded release size differs from immutable manifest.')
    if not start or not start.isfile() or not start.mode & 0o111:
        raise SystemExit('Release must provide executable deployment/start-production.sh.')
    if destination:
        root = pathlib.Path(destination)
        for member in members:
            relative = pathlib.PurePosixPath(member.name).relative_to('release')
            target = root.joinpath(*relative.parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True); os.chmod(target, 0o750)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                # Exclusive create also rejects file/parent shape collisions.
                with target.open('xb') as out, tar.extractfile(member) as inp:
                    while chunk := inp.read(1024 * 1024): out.write(chunk)
                os.chmod(target, 0o750 if member.mode & 0o111 else 0o640)
        for directory, _, _ in os.walk(root): os.chmod(directory, 0o750)
print('Release archive structure and executable entrypoint verified.')
PY
}
prune_releases() {
  local directory name
  # Only SHA-named directories explicitly created and marked by this deployer.
  for directory in "$RELEASES"/*; do
    [[ -d "$directory" && ! -L "$directory" ]] || continue
    name=${directory##*/}; [[ "$name" =~ ^[0-9a-f]{40}$ ]] || continue
    [[ "$directory" != "$new_release" && "$directory" != "$old_target" ]] || continue
    [[ -f "$directory/.pulseye-release" && ! -L "$directory/.pulseye-release" && "$(cat "$directory/.pulseye-release")" == "$name" ]] || continue
    [[ "$(stat -c '%u' "$directory")" == 0 && "$(stat -c '%u' "$directory/.pulseye-release")" == 0 ]] || continue
    rm -rf --one-file-system -- "$directory"
  done
}
finish() {
  local rc=$? rollback_failed=0
  trap - EXIT HUP INT TERM
  set +e
  if [[ -n "$candidate_unit" ]]; then
    if systemctl show "$candidate_unit" --property=LoadState --value 2>/dev/null | grep -qx loaded; then
      systemctl stop "$candidate_unit" || rollback_failed=1
      systemctl reset-failed "$candidate_unit" >/dev/null 2>&1 || true
    fi
  fi
  if (( committed == 0 && swap_started == 1 )); then
    info 'Activation failed; restoring the previous native application release.'
    if [[ -n "$old_target" ]]; then
      atomic_current "$old_target" || rollback_failed=1
      systemctl restart "$SERVICE" || rollback_failed=1
      wait_healthy "$SERVICE" "$APP_PORT" && proxy_ok || rollback_failed=1
      (( rollback_failed != 0 )) || info 'Previous application release and health/proxy restored.'
    else
      systemctl stop "$SERVICE" || rollback_failed=1
      if [[ -L "$CURRENT" && "$(readlink "$CURRENT")" == "$new_release" ]]; then rm -f -- "$CURRENT"; fi
      info 'First activation failed; no previous release existed and no replacement application was invented.'
    fi
  fi
  if (( committed == 0 && created_release == 1 && rollback_failed == 0 )); then
    rm -rf --one-file-system -- "$new_release"
  fi
  if [[ -n "$protected_dir" ]]; then
    rm -f -- "$protected_dir/release.tar.gz"
    rmdir -- "$protected_dir" 2>/dev/null || true
  fi
  rm -f -- "$archive_path" "$CURRENT.next-$commit-$run_id"
  rmdir -- "${archive_path%/*}" 2>/dev/null || true
  if (( committed == 1 )); then prune_releases || info 'Old app-release cleanup needs attention.'; fi
  if (( rollback_failed != 0 )); then
    printf 'ERROR: rollback or candidate shutdown could not be verified; operator intervention required.\n' >&2
    rc=1
  fi
  (( committed == 1 )) || { (( rc != 0 )) || rc=1; }
  exit "$rc"
}

[[ "$EUID" == 0 ]] || fail 'Root required; invoke with sudo -n bash.'
mode=${1:-}; [[ -n "$mode" ]] || usage; shift
case "$mode" in
  preflight)
    (( $# <= 1 )) || usage; [[ $# == 0 || "$1" == ready ]] || usage
    preflight; if (( $# == 1 )); then require_ready; fi
    ;;
  diskcheck)
    (( $# == 2 )) || usage; preflight; require_ready; check_disk "$1" "$2"
    ;;
  deploy)
    (( $# == 6 )) || usage
    commit=$1 archive_sha=$2 archive_bytes=$3 expanded_bytes=$4 run_id=$5 archive_path=$6
    [[ "$commit" =~ ^[0-9a-f]{40}$ && "$archive_sha" =~ ^[0-9a-f]{64}$ && "$run_id" =~ ^[0-9]{1,20}-[0-9]{1,6}$ ]] || fail 'Invalid immutable release identifiers.'
    [[ "$archive_path" =~ ^/tmp/pulseye-${commit}-${run_id}\.[A-Za-z0-9]{6}/release\.tar\.gz$ ]] || fail 'Unsafe incoming archive path.'
    validate_sizes "$archive_bytes" "$expanded_bytes"
    preflight; require_ready
    exec 9<>/opt/pulseye/deploy.lock
    flock -w 600 9 || fail 'Another deployment holds the application lock.'
    # Recheck operator-controlled runtime approval after acquiring the lock.
    read_config; require_ready; check_disk "$archive_bytes" "$expanded_bytes"
    new_release="$RELEASES/$commit" old_target='' candidate_unit='' protected_dir=''
    created_release=0 swap_started=0 committed=0
    trap finish EXIT
    trap 'exit 129' HUP; trap 'exit 130' INT; trap 'exit 143' TERM
    [[ -f "$archive_path" && ! -L "$archive_path" && ! -L "${archive_path%/*}" ]] || fail 'Incoming artifact is missing or unsafe.'
    [[ "$(stat -c '%s' "$archive_path")" == "$archive_bytes" ]] || fail 'Incoming archive size mismatch.'
    [[ ! -e "$new_release" && ! -L "$new_release" ]] || fail 'An immutable release for this SHA already exists; dispatch a new commit or resolve the retained release explicitly.'
    if [[ -L "$CURRENT" ]]; then
      old_target=$(readlink "$CURRENT")
      [[ "$old_target" =~ ^${RELEASES}/[0-9a-f]{40}$ && -d "$old_target" && ! -L "$old_target" ]] || fail 'Current release link does not target an authorized immutable release.'
      [[ "$(stat -c '%u' "$old_target")" == 0 && -f "$old_target/.pulseye-release" && ! -L "$old_target/.pulseye-release" && "$(cat "$old_target/.pulseye-release")" == "${old_target##*/}" ]] || fail 'Current release is not owned and marked by the native deployer.'
      wait_healthy "$SERVICE" "$APP_PORT" && proxy_ok || fail 'Current app is not a verified healthy rollback baseline.'
    else
      [[ ! -e "$CURRENT" ]] || fail 'Current application path must be a managed symlink.'
      ! systemctl is-active --quiet "$SERVICE" || fail 'Active application service has no managed release link.'
    fi
    protected_dir=$(mktemp -d "$RELEASES/.incoming-$commit-$run_id.XXXXXX")
    install -m 0600 -- "$archive_path" "$protected_dir/release.tar.gz"
    actual_sha=$(sha256sum "$protected_dir/release.tar.gz"); actual_sha=${actual_sha%% *}
    [[ "$actual_sha" == "$archive_sha" && "$(stat -c '%s' "$protected_dir/release.tar.gz")" == "$archive_bytes" ]] || fail 'Protected release checksum/size mismatch.'
    rm -f -- "$archive_path"; rmdir -- "${archive_path%/*}" 2>/dev/null || true
    validate_archive "$protected_dir/release.tar.gz" "$expanded_bytes"
    mkdir -- "$new_release"; created_release=1; chmod 750 "$new_release"
    validate_archive "$protected_dir/release.tar.gz" "$expanded_bytes" "$new_release"
    printf '%s\n' "$commit" > "$new_release/.pulseye-release"
    chmod 640 "$new_release/.pulseye-release"
    chown --recursive root:pulseye "$new_release"
    runuser -u pulseye -- test -x "$new_release/deployment/start-production.sh" || fail 'Application user cannot execute the native release entrypoint.'
    requested_unit="pulseye-candidate-${commit:0:12}-$run_id.service"
    [[ "$(systemctl show "$requested_unit" --property=LoadState --value)" == not-found ]] || fail 'Candidate service name already exists; refusing to alter it.'
    candidate_unit=$requested_unit
    systemd-run --quiet --collect --unit "$candidate_unit" --uid pulseye --gid pulseye \
      --property "WorkingDirectory=$new_release" --property "EnvironmentFile=$ENV_FILE" \
      --property NoNewPrivileges=yes --property PrivateTmp=yes --property ProtectHome=yes \
      --property ProtectSystem=strict --property ReadWritePaths=/var/lib/pulseye \
      --property UMask=0027 --property Restart=no --property KillMode=control-group --property TimeoutStopSec=30 \
      --property StandardOutput=null --property StandardError=null \
      /usr/bin/env PORT=33001 PULSEYE_CANARY=1 "$new_release/deployment/start-production.sh"
    wait_healthy "$candidate_unit" 33001 || fail 'Native canary failed HTTP health checks; current application was not changed.'
    systemctl stop "$candidate_unit"
    candidate_unit=''
    info 'Native canary healthy; beginning atomic release switch and brief service restart.'
    swap_started=1
    atomic_current "$new_release"
    systemctl restart "$SERVICE"
    wait_healthy "$SERVICE" "$APP_PORT" || fail 'Promoted native application failed upstream HTTP health checks.'
    proxy_ok || fail 'Nginx loopback request with the pinned Host header did not return 200.'
    committed=1
    info "Production activation verified for commit $commit; current and one previous native release retained."
    ;;
  *) usage ;;
esac
