# Broad stack goal checkpoint

Goal remains active and incomplete. Continue it; do not create a new goal or
claim universal support. Core implementation checkpoint0950f62 is pushed and aswin matches it cleanly.
This file records the remaining verification. Public fixture main5f376f6 is pushed.

## Verified at this checkpoint

- 38 unique server build/artifact launch fixture passes: batches01–04, Streamlit08,
 MongoDB7 batch10, Gin/Echo/Fiber batch11 progress snapshot. Earlier failures stay.
- 38 browser fixture passes across browser-local/02/04/08/10/11 evidence.
 SvelteKit, React Router and Nest browser retests passed after hydration.
 Streamlit SQLite0→1→reload1→full artifact relaunch1 passed through its WebSocket UI.
 MongoDB7/Gin/Echo/Fiber browser1→2→reload2 passed; server matrices prove restart.
- 51 automated checks pass locally and in QA on aswin. The first QA full-suite
 attempt lacked public/ and examples/notes; the failed log is retained separately.
 Delivering these test prerequisites fixed it. No test expectations were weakened.
- Source LOC3685:2291 product/tooling,129 browser tools,793 tests,472 examples.
 See code-lines.json for definition; recount after subsequent source changes.

## Fixes deployed, with remaining verification

Aswin SSH recovered. Current worker/runtime source is deployed in core and QA.
Production LXD clones receive current src/scripts before start; observed in a
real production build. Verification uses unique verify-* storage identity and
QA uses matrix-<stack>, avoiding old volume identity collisions.

Docker image tags strip random nonalphanumeric separators; trailing dashes had
broken Gradio/Deno/Bun intermittently. Registry transport failures retry once
inside the same builder and original deadline; compile/auth/notfound do not.
Node recipes choose start:prod or unique Angular serve:ssr:* production scripts.

Angular SSR fixture22.2.1 compiled after using createRequire for node:sqlite;
its next runtime failed400 because of an unapproved hostname. runtimeCompose now
passes NG_ALLOWED_HOSTS containing localhost,127.0.0.1 and exact config.previewUrl
hostname, preserving existing entries. Unit coverage passes; actual Angular
runtime retry is queued in batch13. The running browser driver and control-plane
runner bundle need restart to pick up these latest runtime changes before native
Angular/browser testing. Do not claim this runtime gate passed yet.

Gradio batch10 failed a harness check because its /api/count404 JSON was mistaken
for a counter API. Harness now requires response.ok. Batch13 is queued. Real
Gradio browser/button/reload/full-relaunch SQLite proof remains required.
MongoDB7.0.45 did not exist; corrected7.0.43 passed. MongoDB8 remains explicitly
unsupported on builder kernel7.0.0; do not disable its startup guard.

## Production React+Express+PostgreSQL URL workflow

Failures retained: original243.3s truncated verification, then359.3s image CDN
connection reset, then132.4s API exited1 during verification. Official base Node,
nginx andPostgres images are now cached in stopped production builder.
Deterministic diagnose-combined-start.mjs reproduces the PostgreSQL socket-only
initialization race with an8s init script: old healthcheck launches API too early
and fails ECONNREFUSED; TCP healthcheck passes. Evidence stack-postgres-readiness.
Both PG fixtures now use pg_isready -h127.0.0.1 and are pushed in fixture5f376f6.
Production retry from developer browser hit account preparation limit3/hour.
Earliest prior failed build expires2026-10-03T14:19:31.833Z. Retry then; do not
weaken/remove rate limiting or delete history. URL→native product remains pending.

## Aswin / queue state

Core /home/aswin/pods-launch-fresh; local /Users/rizwanahamed/Documents/ChatGPT/podsv2.
Public fixtures /home/aswin/pods-launch-runtime-fresh. SSH aswin works.
PATH=/home/aswin/pods-tools/bin:$PATH; LXD=/snap/lxd/current/bin/lxc.
Server lastPID365353, port8787; restart using scripts/serve.sh ONLY when no active
build/dispatch. This restores gh in PATH. Never print .env, tokens or OAuth codes.
Origin https://collection-conferences-ages-clearly.trycloudflare.com

QA guest pods-fresh-matrix-01, uid/gid1000; /work/stacks,/opt/pods,/output.
Pool pods-fresh-build-v2 is40GiB, QA root30GiB; lastused30.10GiB before Rust builds.
Watch capacity before adding more large frameworks. Host had50GiB free.
Base pods-fresh-builder-v2 is STOPPED, root12GiB. Official image cache archive
created for seeding remains /home/aswin/pods-base-images.tar and guest/output/
pods-base-images.tar; these temporary copies may be removed if needed.

Batch10 complete and imported: AngularSSRandGradio fail, Mongo7 pass.
Batch11 currently running Actix then Rocket; Gin/Echo/Fiber passed. Host log
/home/aswin/pods-matrix-11.log; only progress snapshot imported. Final will be
/output/evidence/matrix-11.json. Queue session86389 then runs batch12 Deno/Bun,
log pods-matrix-12.log, saves matrix-12.json. New queue session61830 waits for12
then runs batch13 AngularSSR/Gradio, log pods-matrix-13.log andmatrix-13.json.
Do not duplicate these tests or mislabel mutable matrix.json. Pull final numbered
JSONs after completion, preserve failures, add passes to browser catalog.
All queues pass PODS_ISOLATED_BUILD=1; old batch07 lacked it and never built.

## Browser state

Use CUA only; rewriteDocumentation after compaction. IABbrowser2.
stackQa6 tab13 currentlyFiber counter2 at http://127.0.0.1:18890/.
developerWide tab12 real/develop form, ReactExpressPG folder, shows rate-limit
error. Connected Google. nativeGoogleKeep tab9 oldFlaskPGproduct; GitHubsign-in
handoff tab10 remains pending. Tab11 is stale data:error URL: do not use it.

SSH forwarding session97981: local18890→aswin127.0.0.1:18890→QA8081.
Browser driver session50897; QA PID78053 observed, appport18090.
Catalog /output/evidence/browser-matrix.json has38 passes, reloads everyselect.
Driver was started before NG_ALLOWED_HOSTS runtime change; stop it and restart
with PODS_QA_APP_PORT=18090 and PODS_QA_CATALOG pointing to that catalog before
Angular testing. SIGTERM first invokes runner.stop and can leave driver alive;
verify actual PID/port ownership before second termination. Do not kill matrix.

## Native provider evidence / remaining work

Google historicalFlaskPG app repo-a8b5cf7306c523deda321181-ce433b05441c-c986084e2034:
cold63.897s; warm product observed10.621s; DB0→1→reload1→stop/relaunch1.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 private8080:
cold189.456s,warm13.280s,later12.595s. Full rebuild durability via API/SSH HTTP
passed: record2survived→write3; recovery56.444s includes40.962s image reload.
Native Codespaces browser remains at GitHub sign-in; earlier user question is
pending. Do not request again or expose port publicly. Cloud Shell VM replacement
is still unverified. These provider passes do not apply to every fixture.

Next: finish11–13 and their browser gates; retry combined real developerURL after
14:19:32Z, then one-click native product and database persistence. Deployed core Git HEAD
0950f62 is aligned; .env/.data were preserved. Remaining explicit targets:
Adonis,Quarkus,Micronaut,Ktor,Blazor,Laravel,Symfony,Rails,Phoenix and workers with
web output. Existing Dockerfile/Compose is the broader extension contract.
Native desktop/mobile/GPU/non-web interactive products are outside these browser
provider environments. SUPPORT.md distinguishes tested/pending/unsupported.
