#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export PATH="$HOME/pods-tools/bin:$PATH"
exec node --env-file=.env src/server.mjs
