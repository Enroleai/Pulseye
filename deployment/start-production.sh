#!/usr/bin/env bash
set -Eeuo pipefail
# Runtime dependencies are already included in the immutable release; no npm,
# nodemon, build tools, environment files or package downloads run on EC2.
readonly RELEASE_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
readonly NODE='/usr/local/bin/node'
[[ -x "$NODE" ]] || { echo 'Native Node runtime is missing.' >&2; exit 1; }
[[ "$("$NODE" --version)" == 'v22.23.4' ]] || { echo 'Native runtime must be Node 22.23.4.' >&2; exit 1; }
export NODE_ENV=production
export NODE_CONFIG_DIR="$RELEASE_ROOT/api/config"
export PORT="${PORT:-3000}"
export HOST="${HOST:-127.0.0.1}"
cd -- "$RELEASE_ROOT"
exec "$NODE" "$RELEASE_ROOT/api/index.js"
