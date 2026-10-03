#!/bin/sh
# Dedicated nested Docker engine, inside an unprivileged LXD container. No host socket.
set -eu
cd "$(dirname "$0")/.."
LXC=${PODS_LXC:-/snap/lxd/current/bin/lxc}
BASE=pods-fresh-builder-v2
"$LXC" info pods-fresh-builder-base >/dev/null
"$LXC" storage show pods-fresh-build-v2 >/dev/null 2>&1 || "$LXC" storage create pods-fresh-build-v2 btrfs size=20GiB
"$LXC" info "$BASE" >/dev/null 2>&1 || "$LXC" copy pods-fresh-builder-base "$BASE" --storage pods-fresh-build-v2 --instance-only
"$LXC" config set "$BASE" security.nesting=true security.syscalls.intercept.mknod=true security.syscalls.intercept.setxattr=true limits.memory=4GiB limits.cpu=2 limits.processes=512
"$LXC" config device set "$BASE" root size=12GiB
if [ "$("$LXC" list "$BASE" --format csv -c s)" != RUNNING ]; then "$LXC" start "$BASE"; fi
"$LXC" exec "$BASE" -- sh -c 'n=0; until test -d /run/systemd/system; do n=$((n+1)); [ "$n" -le 30 ] || exit 1; sleep 1; done; apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2'
"$LXC" file push package.json package-lock.json "$BASE/opt/pods/"
"$LXC" file push src/*.mjs src/static-server.cjs "$BASE/opt/pods/src/"
"$LXC" file push scripts/prepare.mjs scripts/prepare-container.mjs scripts/build-worker.mjs scripts/test-stack-matrix.mjs "$BASE/opt/pods/scripts/"
"$LXC" exec "$BASE" --env PATH=/opt/node/bin:/usr/bin:/bin -- npm ci --ignore-scripts --prefix /opt/pods --no-audit --no-fund
"$LXC" stop "$BASE" --timeout 20
echo 'Container builder ready. Set PODS_BUILDER_BASE=pods-fresh-builder-v2 to enable.'
