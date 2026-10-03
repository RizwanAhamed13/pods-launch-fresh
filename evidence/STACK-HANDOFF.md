# Broad stack checkpoint

The existing goal remains active. Broad framework tests are complete; native
provider coverage is narrower and must not be presented as universal support.
Core repository: https://github.com/RizwanAhamed13/pods-launch-fresh.
Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
commit00df7c0 pushed. Local root: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
Aswin roots: /home/aswin/pods-launch-fresh and /home/aswin/pods-launch-runtime-fresh.

## Verified

54 distinct fixtures passed real server builds, artifact launches and browser
interaction. SUPPORT.md lists every family. stack-coverage.json maps fixtures to
specific evidence and preserves failed attempts. Batch19 fixed Quarkus resolver
thread exhaustion; batch20 fixed Laravel middleware and verified direct Adonis
container detection; batch21 fixed Phoenix module order. All passed SQLite
write/read/restart and browser reload. Batch22 closes Next/Nuxt's old harness gap
with real artifact stop/relaunch. No matrix queues remain running.

52 automated checks pass locally and in the isolated aswin guest. Source LOC4110:
2311 product/tooling,129 browser tools,802 tests,868 example sources. Includes
extensionless PHP/Ruby entrypoints; see code-lines.json for exact scope.

React + Express + PostgreSQL: real developer URL preparation144.175s; nativeGoogle
product button and PostgreSQL persistence across stop/relaunch passed. Cold ready
67.816s; cached9.281/9.585s. Browser heading10.876s, saved value observed by18.158s
(upper bound includes tool-call gap). Codespaces cold/resumed87.033s,cached10.106s;
authenticated HTTP/DB write/read passed. Its native browser still needs GitHub
sign-in. Private preview remains private; do not weaken it to avoid sign-in.

Angular SSR: real developer URL preparation208.096s; actual nativeGoogle Angular
hydration/button/SQLite0→1→reload1→full stop/relaunch1 passed. Cold ready72.289s,
cached ready5.849s, click-to-visible-saved-product7.223s measured in one browser
call. Appid repo-ce3c167a84b230196d7bf924-5f376f60ed9c-5592c22c08f5.
Native Angular remains running until its30-minute deadline.

Historical Flask/PostgreSQL nativeGoogle browser and Codespaces API/full-rebuild
durability also passed. Cloud Shell VM replacement remains unverified.

## Environment

QA guest pods-fresh-matrix-01: /opt/pods, /work/stacks, /output.
Use /snap/lxd/current/bin/lxc and /opt/node/bin/node, uid/gid1000, and
PODS_ISOLATED_BUILD=1. PODS_MATRIX_BATCH gives atomic numbered evidence files.
Pool pods-fresh-build-v2 is60GiB; QA root50GiB; production root remains12GiB.
Watch capacity before new large builds. Do not prune unrelated work.
Batch13–22 evidence is imported. Older batch11/12 quota failures are separately
retained in stack-builder-quota-failures.json. Do not wait for those stale jobs.

Browser driver session63767 uses appport18090; tunnel97981 exposes
http://127.0.0.1:18890/_pods. Catalog has54 passes. CUA browser2:
stackQa6 tab13 Phoenix counter2; developerWide tab12 nativeAngular count1.
nativeGithubKeep tab10 remains the sign-in handoff; tab9 is an olderGoogletab.
Call cua.rewriteDocumentation after compaction; mark retained tabs each turn.

Production https://collection-conferences-ages-clearly.trycloudflare.com,
port8787, lastPID445141. Restart only with scripts/serve.sh (gh PATH), when no
active build/dispatch. Never print .env, tokens, authorization codes or credentials.
Core src/scripts/test changes are deployed to aswin and QA; active control-plane
routes are unchanged. A final commit/push and clean aswin alignment follow this
checkpoint; verify git status/HEAD before subsequent work.

## Remaining goal gates

Native per-fixture provider coverage remains narrower than the54-framework QA
matrix. Codespaces native browser requires the pending user sign-in. Do not repeat
the already pending question or expose its port publicly. Cloud Shell VM replacement
is still unverified. Cold launches exceed20seconds; report cached and cold timings
separately. Existing Dockerfile/Compose is the extension contract for additional
Linux web apps; native mobile/desktop/GPU applications need other environments.
