# Broad stack goal checkpoint

The active unlimited goal is NOT complete. Continue it; do not create another or
claim universal support. Core parent commit was a4edf13. This checkpoint's commit
contains further fixes and evidence. Public runtime main is 45ccbd0 (pushed).

## Immediate environment interruption

Aswin went offline during this stage. Tailscale reports local backend Running,
local Online=true, aswin Online=false; last seen 2026-10-03T13:30:00.1Z. Configured
SSH host100.119.226.124 port2222 times out. An async user request to bring aswin
back online is pending. Do not ask again or treat timeout as permission.

Two source transfers failed before receiving any bytes. Therefore the newest
build-worker verification identity, LxdBuilder worker delivery and build error-tail
fixes are LOCAL ONLY until deployed after recovery. No live gate for those fixes
has passed yet. The runner's 60-second container health deadline, bounded stale
runc retry, provider missing-gh diagnostic and callback error tail WERE deployed
before the interruption. Local automated suite:47 passed.

## Evidence established

- Completed matrices01–04:33 unique fixture build/artifact launch passes.
  Batch01 has an early Express failure; later batch02 passed it. Batch02 Axum
  initially failed raw string syntax; batch04 fixed and passed it.
- Browser passes:30 unique fixtures in stack-browser-local/02/04.json.
  React, Angular, Vue, Svelte, Solid, Preact, Lit, Alpine; Fastify/Koa+SQLite;
  Flask+SQLite/Postgres/Redis; Express, FastAPI, Django, net/http Go, Spring Boot,
  ASP.NET, PHP, Sinatra; Next/Nuxt; Flask+MySQL/MariaDB/Valkey; Axum, Hono,
  React+Express+Postgres and Astro.
- Next/Nuxt client counter intentionally resets on reload; this is not data
  persistence. Their batch02 repeat timing is not an actual server restart.
- SvelteKit first browser click did not update before deadline; hydration retest
  needed. React Router first click similarly did nothing; a later click showed1,
  then the server/tunnel went offline before reload proof. NestJS browser pending.
- Real storage migration/recreation repro now self-contained; no old checkout.
  It seeds a unique legacy PostgreSQL volume, migrates, removes only Docker
  volume metadata and restores record2. stack-storage-repro.json passed.
- MongoDB8 refuses this kernel7.0.0: documented incompatibility6.19–7.0.13, fixed
  kernel7.0.14+. Do not bypass its guard. Mongo7.0.45 separate test is queued.

## Native provider proof

Google historical native browser: developer URL folder examples/stacks/flask-postgres
prepared in179.9s, immutable app
repo-a8b5cf7306c523deda321181-ce433b05441c-c986084e2034.
Cold63.897s, warm product observed10.621s, PostgreSQL0→1→reload1→stop/relaunch1.
Cloud Shell VM replacement still unverified.

Codespace: pods-launch-containers-69rw5vx4xp46c5qw5, private8080 preview.
Cold189.456s, warm13.280s, later durable warm12.595s. Native browser is still at
GitHub sign-in; earlier async user request remains pending. Do not expose port
publicly or substitute SSH evidence for browser evidence.

Full Codespace rebuild PASSED data durability via actual provider + SSH HTTP:
record2 survived gh codespace rebuild --full, then accepted write3. Recovery
56.444s included40.962s reloading removed images. See rebuild-proof/recovery JSON.
Two earlier failed dispatches were caused by control-plane restart omitting
pods-tools/bin from PATH (NOT SSH readiness). Use scripts/serve.sh when starting
server. The missing-gh case now has a clear error and no pointless retry.

The React+Express+PostgreSQL combined fixture passed isolated build, restart and
browser. Actual developer URL form preparation FAILED after243.3s at verification.
Its old error truncation lost the terminal Docker diagnostic; exact cause remains
unconfirmed. Record is stack-combined-url.json. Do not claim this native workflow
passed. Retry after deploying fixes and inspect final error if it fails again.

## Aswin layout / restoration

Core /home/aswin/pods-launch-fresh. Local /Users/rizwanahamed/Documents/ChatGPT/podsv2.
Tools PATH=/home/aswin/pods-tools/bin:$PATH; LXD=/snap/lxd/current/bin/lxc.
Public fixture repo /home/aswin/pods-launch-runtime-fresh.
Last control-plane PID334901 at8787. Live origin:
https://collection-conferences-ages-clearly.trycloudflare.com
This is a temporary tunnel; verify it survived. Never print .env or launch tokens.

After host returns inspect processes and guests before launching duplicates.
Deploy current src/,scripts/,test/ directories (rsync without flattening their
contents into repo root); run remote tests; restart via scripts/serve.sh only
when no active production build/dispatch. Align remote Git HEAD after push without
removing .env/.data. Production clone now receives deployed src and scripts before
start; base keeps compiler/dependency installation. Validate this actual LXD path.

Base pods-fresh-builder-v2 stopped, production root quota12GiB. Dedicated Btrfs
pool pods-fresh-build-v2 resized20→40GiB, QA root quota30GiB. Last pool22GiB used.
QA pods-fresh-matrix-01, uid/gid1000, /work/stacks, /opt/pods, /output.
Do not run host Docker or remove other user workloads.

## Queues at interruption (reconcile, do not assume alive)

Batch04 completed and imported: axum,sveltekit,astro,react-router,hono,nestjs.
Batch05 was running Streamlit,Gradio,Deno,Bun. Streamlit FAILED with 'Application
volume points to unexpected storage': old build verification used the same
project identity at /output/<stack>/verification that the matrix later used at
/output/<stack>/compute. New build-worker assigns unique verify-* identity. The
QA scripts now use matrix-<stack> identity so old verification metadata cannot
collide. These script fixes were not delivered before host went offline.
Batch05 old process68180; queue shell34604. Host log pods-matrix-05.log.

Batch06 queued Mongo7.0.45 after /output/evidence/matrix-05.json, shell39872,
log pods-matrix-06.log. Batch07 queued Gin/Echo/Fiber/Actix/Rocket after06,
exec41548, log pods-matrix-07.log. All five new sources were copied into QA and
public fixture repo. Native framework versions pinned in manifests.

Save numbered snapshots before reruns. /output/evidence/matrix.json is overwritten
per batch. Deploy fresh worker/harness before rerunning05 cases or continuing
06/07. Existing legitimate data should not be deleted to bypass storage guards.
Import actual final evidence, not logs mistaken for passes. Images compiled in
QA remain cached if guest survives. Monitor pool capacity.

## Browser QA

CUA only. Re-read documentation after compaction. IAB browserID2 (ChromeID1 is
unrelated). Tab11 stackQa5 now on unreachable localhost error page after tunnel
loss; do not operate on data: error URL. Restore tunnel and navigate original
http://127.0.0.1:18890/_pods. Tab12 developerWide is failed combined preparation.
Tab9 nativeGoogle product, tab10 GitHubsign-in; tab1 olderGoogle product.

QA driver lastPID66318, listens8081, productport18090, catalog
/output/evidence/browser-matrix.json. It now reloads catalog per selection so
new batch evidence requires no driver restart. Last catalog has33 passes.
LXD proxy aswin127.0.0.1:18890→guest8081. Local SSH forwarding session90902 died;
recreate after server returns. Driver SSH session48828 may also have died.

Browser goto may time out before slow selected app starts. Check actual heading
before interacting; after verified server selection, reload root if navigation
was abandoned. A stale old React page once fetched Hono's counter; Hono was only
marked passed after reloading and seeing Hono heading. SSR controls can be visible
before hydration. CUA networkidle wait is NOT supported despite generic API docs;
use visible DOM state and meaningful interactions. SvelteKit/React Router need
these rechecks; never claim initial HTML alone proves hydration.

## Remaining acceptance

Deploy and verify latest fixes, then production combined URL→native product.
Complete05–07, browser checks and provider proof for advertised scope. Add remaining
explicit targets: Angular SSR, Adonis, Quarkus/Micronaut/Ktor, Blazor,
Laravel/Symfony/Rails/Phoenix. Exercise dashboards, WebSockets and workers with a
web output. Lock dependency resolutions where appropriate. Native desktop/mobile,
GPU and non-web interactive programs are outside this browser delivery scope.

Current source LOC3485 including tests/examples,2358 product+tooling including
browser tools. Exact definition in evidence/code-lines.json. SUPPORT.md is the
user-facing compatibility matrix and records unverified rows/failures honestly.
Keep goal active; this checkpoint is not completion.
