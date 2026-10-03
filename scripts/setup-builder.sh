#!/bin/sh
# Run on aswin. Only creates/updates the fresh PODS build resources named here.
set -eu
cd "$(dirname "$0")/.."
LXC=${PODS_LXC:-/snap/lxd/current/bin/lxc}
BASE=pods-fresh-builder-base
NODE_DIST=${PODS_NODE_DIST:-/home/aswin/pods-tools/node-v24.21.0-linux-x64}

"$LXC" storage show pods-fresh-build-quota >/dev/null 2>&1 || "$LXC" storage create pods-fresh-build-quota btrfs size=12GiB
"$LXC" network show podsbuildfresh >/dev/null 2>&1 || "$LXC" network create podsbuildfresh ipv4.address=10.238.91.1/24 ipv4.nat=true ipv6.address=none
if ! "$LXC" network acl show pods-fresh-build-egress >/dev/null 2>&1; then
  "$LXC" network acl create pods-fresh-build-egress
  "$LXC" network acl rule add pods-fresh-build-egress egress action=reject state=enabled \
    destination=0.0.0.0/8,10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.168.0.0/16,198.18.0.0/15,224.0.0.0/4,240.0.0.0/4
  "$LXC" network acl rule add pods-fresh-build-egress egress action=allow state=enabled protocol=tcp destination_port=80,443
fi
"$LXC" network set podsbuildfresh security.acls=pods-fresh-build-egress \
  security.acls.default.ingress.action=reject security.acls.default.egress.action=reject
if ! "$LXC" info "$BASE" >/dev/null 2>&1; then
  "$LXC" init ubuntu:24.04 "$BASE" --no-profiles --storage pods-fresh-build-quota --network podsbuildfresh \
    -c security.privileged=false -c security.idmap.isolated=true \
    -c limits.cpu=2 -c limits.memory=2GiB -c limits.processes=256
fi
"$LXC" config device set "$BASE" root size=4GiB
if [ "$("$LXC" list "$BASE" --format csv -c s)" != RUNNING ]; then "$LXC" start "$BASE"; fi
"$LXC" exec "$BASE" -- sh -c 'apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git curl ca-certificates xz-utils'
"$LXC" exec "$BASE" -- mkdir -p /opt/pods/src /opt/pods/scripts
"$LXC" file push -r "$NODE_DIST" "$BASE/opt/"
"$LXC" exec "$BASE" -- ln -sfn "/opt/$(basename "$NODE_DIST")" /opt/node
"$LXC" file push package.json package-lock.json "$BASE/opt/pods/"
"$LXC" file push src/*.mjs src/static-server.cjs "$BASE/opt/pods/src/"
"$LXC" file push scripts/prepare.mjs scripts/prepare-container.mjs scripts/build-worker.mjs "$BASE/opt/pods/scripts/"
"$LXC" exec "$BASE" --env PATH=/opt/node/bin:/usr/bin:/bin -- npm ci --ignore-scripts --prefix /opt/pods --no-audit --no-fund
"$LXC" exec "$BASE" -- install -d -o 1000 -g 1000 -m 0700 /work /output /home/pods
"$LXC" exec "$BASE" -- /opt/node/bin/node --version
"$LXC" stop "$BASE" --timeout 15
echo "Fresh builder ready: $BASE"
