# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Do not claim universal compatibility, native Codespaces browser acceptance,
VM replacement durability, or a universal 20-second cold launch.

## Current state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  revision d6da2ed780aec8ae0178fc181f1d24113c322e15.
- Koa native acceptance was published at d7dbc22 and verified on the public
  support page (55/30/30, Koa all passed, Codespaces browser pending warning).
  Hono transport preflight was published at 176a79a; native acceptance at
  3102caf. Runtime77cf340 added automatic storage migration; provider73bd9f4 now gates
  saved format changes on actual environment capabilities.
- Coverage: 55 isolated build/artifact/browser passes; 32 Google native browser
  and 32 Codespaces authenticated HTTP/protocol passes. All eight static frontend
  and six SSR fixtures pass both paths. Every native Codespaces browser check
  remains pending. The 23 fixtures awaiting both native acceptance paths are:
  actix, adonis, aspnet, axum, deno, echo, fastapi, fiber, flask-mariadb,
  flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, ktor,
  micronaut, phoenix, php, rocket, sinatra, streamlit, symfony.
- Deployed provider73bd9f4 passes134 tests locally and in isolated aswin QA;
  logs /tmp/pods-provider-full-{local,qa}.txt. Adds3 provider compatibility
  cases after17 storage cases. Baselines114/131 remain historical; do not
  rerun unchanged passing checks.
- Physical code: 5,920 lines = 3,204 product/tooling + 1,619 tests + 933 examples
  + 164 browser tools. Scope excludes evidence scripts, JSON, docs and generated
  files; includes .astro. Storage handoff is deployed; native same-format regressions follow below.

## Current storage migration implementation

- src/storage-transition.mjs now performs staged, journaled transitions for
  default single-service app-data at/data; originals remain as private backups.
  src/storage.mjs copyApplicationData imports a tiny empty helper image and
  copies protected files without executing a helper process. Helpers/images
  are cleaned. src/runner.mjs and container-runtime.mjs call the transition.
- Before persistentVolumes, container launches recover any interrupted target
  rename; otherwise existing missing-data checks would prevent recovery.
- Tests17new cover both directions/four crash checkpoints, partial copy, data
  conflict, missing bundle storage, stateless transitions, topology and path
  guards. Full131passed local/isolatedQA. Control-plane account lock and stable
  product-port checks exclude another live app before mutation.
- Real automatic probe34228 ended0 at02:16:59.407UTC: old legacy container
  wrote1, new runner bundle retained1→2, container2→3, bundle3→4. No manual
  copy. Source snapshot hashes and cleanup evidence recorded in
  stack-express-automatic-transition-probe.json. Disposable volume/root and
  helper images removed. Candidate tree /output/storage-candidate-3102caf
  in QA guest remains for reproduction; dependency symlink points to/opt/pods.
- Root-protected record copying probe21960 ended0; directory0700/file0600
  uid0 copied asuid1000 without application image or executable. Root-only
  QA fixture removed via guest root.
- Native format transition and optional bundling are NOT verified by the storage
  change. Codespaces label adaptation is now capability-gated as below. Keep packaging unchanged.
  Multi-service or conflicting data requires explicit migration. Backups
  remain; retention policy and power-loss durability are not proven.

## Storage deployment and native regression

- Runtime 77cf340 deployed 2026-10-04 02:22:17.800750 UTC after fresh idle
  audit: builds0/launches0, SQLite quick_check ok, matching service PID/cwd/port.
  New service PID1032728; health200; bundled runner SHA256
  2b346a88a772b11270734361db0d2d50b66c1868e3e0c75f23e487ee40ccd486.
- Native Google Hono bundle retained value2→3 and reload3: page8357ms,
  saved record8471ms, successful write8754ms; health6971, delivery2993.
  Native Google Express container retained2→3 and reload3: page9085ms,
  saved record9200ms, write9481ms; health7769, delivery4247. Both initial
  compute RUNNING, console errors/warnings0, explicit full stops confirmed.
- Evidence stack-storage-deployment.json; these are same-format regression
  checks, not native cross-format migration acceptance. Current Google values:
  Hono3, Express3. Codespaces Hono regression session20241 ended0, preserved
  2→3 then full stop/relaunch3→4. First Shutdown health29387ms/delivery14393;
  cached Available health7605/delivery6973. Both stopped; native browser
  remains pending. Evidence stack-storage-hono-codespaces.json.
- Audit02:24:43.123781UTC: health200, activebuild0/launch0, servicePID1032728,
  SQLite quick_check ok, Codespaces Hono port25759 private. Current Hono
  Codespaces value4; do not reset stored records.

## Provider runtime format compatibility

- Deployed provider73bd9f4 preserves an app's preferred Codespace across either known
  PODS label, with exact name/repository verification unchanged. It checks
  Node>=22, Linuxx64, usable local Linuxx64Docker and Compose over readonlySSH
  before preview registration or runner dispatch. No installer, replacement
  environment, label mutation or data copy happens in the capability probe.
- Provider tests23passed; full134 passed locally and isolatedQA. QA snapshot
  /output/provider-candidate-c0931da is retained; originalstorage candidate
  /output/storage-candidate-3102caf remains unchanged. Provider sourceSHA
  bc4ec4b03c3d13e50374323764d6111d7d6cc5e465c6847ba0011f43952b67fe.
- Native readonlyprobe24316 ended0 at02:35:15.512UTC: existing Node profile
  pods-launch-jj497rpqpp7529v7 and containerprofile
  pods-launch-containers-69rw5vx4xp46c5qw5 both Available and compatible.
  No application launched or data modified. Evidence
  stack-codespaces-runtime-capabilities.json plus its -probe.mjs and
  stack-provider-format-adapter.json. Full native format migration still pending.
- Deployment62661 ended0: fresh idle precheck, service restarted02:37:28.804718
  UTC toPID1041360, health200, SQLite quick_check ok, activebuild0/launch0.
  Runner hash unchanged (provider-only change). Deployment recorded in
  stack-provider-format-adapter.json; no need to rerun unchanged native apps.

## Previous native gate: Koa acceptance

- Ordinary quota watcher 67969 ended0 at 01:45:25.124874 UTC, account2/global2/
  active0. Actual form submitted once at 01:45:29.115 UTC.
- Public source folder examples/stacks/koa at d6da2ed; production preparation
  22,767ms; Node bundle 101,539 bytes, SHA256
  4cf6f2739c10d5c7072c855ea4886a4ad8bd9fdafd5ac57cdcde898501700240.
  No QA artifact import or quota bypass. Source SHA matches the earlier browser
  transport preflight, which passed empty chunked POST and restart persistence.
- App repo-54e71d97ff4cca1baf2be123-d6da2ed780ae-4cf6f2739c10; private port24886.
- Google first initial RUNNING: health6196ms, delivery3023, page8334, read8345,
  successful write8626. Cached full relaunch initial RUNNING: health5016,
  delivery1806, page5525, saved value5643, successful write5932.
  Actual browser SQLite0→1, reload1, full stop retained1→2, reload2. No browser
  warnings/errors. Both launches stopped. These are not cold-VM measurements.
- Codespaces harness44477 ended0. Environment pods-launch-7vrw57jpjjppcww57.
  First initial Shutdown: health28280ms, delivery16005, SQLite0→1.
  Cached initial Available: health8227ms, delivery7515, full stop retained1→2.
  Both stopped. HTTP checks are not native browser acceptance.
- Final audit 01:47:26.519349 UTC: active builds0/launches0, health200,
  port24886 private. Evidence stack-koa-{url,google,codespaces}.json.
- /tmp/pods-koa-{browser,production-evidence,ports}.json, health.txt and
  /tmp/pods-record-koa.py retain evidence inputs/validation. Both providers now
  hold Koa value2; never reset existing data when retesting.

## Latest native gate: Hono acceptance

- Quota watcher58800 ended0 at02:01:34.197091UTC:account2/global2/active0.
  Actual form submitted once02:01:49.625UTC; preparation29,554ms.
- Public folder examples/stacks/hono atd6da2ed, Node bundle23,851bytes, hash
  matches isolated preflight below. App
  repo-ed8c5f1d6937fe793390cb79-d6da2ed780ae-6bb59210268a; private port25759.
- Google first initialRUNNING:health6446ms,delivery2943,page7726,read7742,
  successful write8018. Cached initialRUNNING:health6035,delivery2285,page7172,
  retained value7291,write7594. BrowserSQLite0→1→2,reload passed,no console
  warning/error. Both full app stops confirmed. Not cold-VM measurements.
- Codespaces20710 ended0. Environment pods-launch-jj497rpqpp7529v7.
  First initialShutdown:health26220ms,delivery13810,SQLite0→1.
  Cached initialAvailable:health8060,delivery7393,retainedSQLite1→2.
  Both stopped. Authenticated HTTP only; native browser remains pending.
- Audit02:03:25.608973UTC:activebuild0/launch0,health200,port25759private.
  Evidence stack-hono-{url,google,codespaces}.json. Compatibility3 tests passed.
- Inputs /tmp/pods-hono-{production-evidence,browser,ports}.json, health.txt and
  /tmp/pods-record-hono.py. Both providers now hold Hono value2; do not reset.

## Hono isolated browser transport gate

- Probe71414 ended0. Bundle23,851bytes, SHA256
  6bb59210268add349aa1e3ca6519073ed94c78a0b6a4bd2750da2c8400ef8bc0.
  SourceSHA5036890b643f4366ee590012b00db206b0413e870eba20cd003398a3ff3c5096
  matches local and isolated Hono server.mjs.
- Actual browser01:52:54.600→01:53:12.035UTC:0→1,reload1,full app
  stop/relaunch1→2,reload2,no warning/error. Both empty chunked POSTs returned200.
- Temporary tab33 closed, tunnel8540 stopped, hono-transport-qa LXD proxy
  removed, probe stopped and removed its artifact root. No probe remains live.
- Evidence stack-hono-browser-transport.{json,mjs}; replay script is named
  stack-hono-browser-transport-probe.mjs. No QA artifact imported to production.
- Browser binding honoTransportResult retains raw browser observations.

## Latest native gate: NestJS acceptance

- Public fixture d6da2ed, ordinary URL form preparation101382ms; Docker image
  83083824bytes. App repo-4ce4a27db492259d64c087b5-d6da2ed780ae-a96fe128e4ec.
- Google first initialSUSPENDED:health47775ms,delivery36546,page49890,
  restored49903,write50185. Cached initialRUNNING:health7615,delivery4300,
  page9092,restored9207,write9491. BrowserSQLite0→1→2,reload passed,
  consolewarning/error0; both full stops confirmed. First launch exceeds20s.
- Codespaces56755 ended0, environment pods-launch-containers-69rw5vx4xp46c5qw5.
  First initialShutdown:health64204ms/delivery51813; cachedAvailable:
  health9082/delivery8272. HTTPSQLite0→1→2 retained across full stop.
  Native browser pending2FA, freshly observed02:25 this turn.
- Audit02:30:01.414932UTC:activebuild0/launch0,health200,port22269private.
  Evidence stack-nestjs-{url,google,codespaces}.json. Compatibility3tests pass.
  Current NestJS saved values bothproviders2.
- Inputs /tmp/pods-nestjs-{production-evidence,browser,ports}.json,health.txt
  and /tmp/pods-record-nestjs.py. Runtime77cf340; checkoutfa976b1 at preparation.

## Next gate and performance work

- NEXT native fixture: AdonisJS URL preparation/browser/HTTP persistence. Check
  for current data before writing. Readonly audit02:37UTC found Adonis build0.
  The developer form is now staged at examples/stacks/adonis, not submitted.
- Quota watcher96793 ended0 at02:25:27.009292UTC: account2/global2/active0.
  NestJS submitted once02:26:01.546UTC. Fresh quota02:30:33.292750UTC is
  account3/global3/active0, next ordinary slot02:45:29.969UTC. Watcher14019 is LIVE since02:33:00.602172UTC, bounded20min/30sec
  samples. Poll the same handle, never restart solely on timeout. The helper
  is /tmp/pods-next-native-quota-watch.py. Keep limits3/account/hour and
  12/global/hour. Never bypass quotas or import QA artifacts into production.
- /tmp/pods-capture-native.py reads aswin SQLite readonly, whitelists fields and
  derives timings. Its explicit fixture allowlist currently includes astro,
  react-router, express, fastify, koa, hono and nestjs.
- scripts/live-codespaces.mjs receives gh token on stdin. Use the correct fixture
  probe, explicit output file and expected initial count. Counter/SSR/static/
  WebSocket/worker checks require two launches, including confirmed full stop.
- Express optional-import optimization remains experimental. esbuild0.25.12
  bundles a compiler-confirmed handled supports-color require into338,173 bytes
  versus production82,250,849-byte image. Real same-format persistence passed.
  Production packager unchanged: native format-transition acceptance is still needed.
- Real transition probe43765 ended0: same dataKey, container saved1, bundle saw0,
  returning to container saw1. Original data retained but continuity FAILED.
  Its unique volume/root were removed. See stack-express-transition-probe.json
  and replay .mjs. This asserts the failure, not successful migration.
- Historical mocked adapter probe at60b7960 rejected both saved container→Node
  and Node→container runtime-label changes before mutations; the current
  candidate adds capability-gated reuse, verified as above. Server environmentKey
  binds account+dataKey independently of runtime; preserve that saved environment.
  See stack-provider-format-transition-probe.{json,mjs}. The public devcontainer includes Node24, sshd and Docker-in-Docker.
  Two actual saved profiles passed capabilities; older uninspected environments
  are not covered by that observation.
- Explicit storage-bridge prototype79883 ended0 at01:58:40.629UTC. It copied
  only stopped disposable Express data and preserved container0→1, bundle1→2,
  container2→3, bundle3→4. Initial file uid0 became uid1000 using docker cp
  from a never-started helper. Temporary volume/root removed.
  Evidence stack-express-storage-bridge-probe.{json,mjs}. This is not automatic
  production migration: no journal, ambiguity handling or provider adaptation.
  Earlier probe attempts31201/2863 ended1 because of probe-only filename and
  staging-directory mistakes; both cleaned up. Corrected79883 is the evidence.
- Storage paths still differ, with automatic handoff now implemented: bundles <root>/data/<dataKey>; default container
  <root>/volumes/pods-<key-sha256-first24>/app-data/data. run() creates the bundle
  directory even for a container, so existence alone does not prove data is there.
  Container files may be root-owned. Preserve ownership checks, refuse ambiguity,
  and prove native/provider continuity before enabling smaller bundles. Do not weaken checks.
- Fastify originally failed Google empty chunked POST with HTTP415; corrected
  JSON-body fixture passed native browser and Codespaces checks. Historical failure
  retained. Evidence stack-fastify-fixed-*.json, stack-fastify-google.json and
  isolated before/after regressions. Existing Fastify values: Google2, Codespaces4.
- Astro stronger outer gzip saved only0.011% because Docker layers already gzip.
  No production compression change warranted; recorded trial remains valid.

## Browser and environment handoffs

After compaction first CUA call must be cua.rewriteDocumentation. Reuse bindings;
mark pending tabs each new turn. Never duplicate a launch/build after timeout.

- stackQa6: IAB2 tab13, Adonis folder filled, button Prepare application.
  No submission yet; wait for normal quota handle14019. Ready region name includes period: Your application is ready
  to share. Try this version link in that region identifies the exact artifact.
- accountWorker: IAB2 tab12, stopped NestJS launcher. nestjsLaunchUrl,
  nestjsPreparationSubmittedAt, nestjsBrowserChecks (both passed), nestjsFirstLogs
  and nestjsSecondLogs (empty) persist. measureNestjsCounter records page/read/
  write timing and reload;50sec deadline. Stop helper stopPreparedProduct confirms
  terminal state. History may briefly lag while its async refresh finishes.
- supportQa: IAB2 tab29, public support deliverable; refresh after publication to verify55/32/32,
  NestJS allPassed. Native CS browser warning remains visible.
- nativeGithubKeep: IAB2 tab10; freshly checked this turn, still Two-factor
  authentication. User already asked; no SMS/code sent. Do not repeat question.
- cloudLifecycle: IAB2 tab14; previous Restart confirmation and
  background Authorize request remain pending. No VM replacement approval;
  do not click Restart or accept the unrelated background permission request.
- Redact Connected-account text and private Google preview hosts from snapshots.
  Never print tokens, accounts, sessions or computeKeys. Local gcloud is signed
  into a DIFFERENT, SUSPENDED Google environment; do not use that CLI identity.
- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
  Support /support renders coverage each request; flags, not filenames, grant
  acceptance. No raw private evidence is served publicly.
- User service pods-launch-fresh.service on aswin; last observed PID1041360,
  provider73bd9f4; bundled runner unchanged from77cf340. Node/gh /home/aswin/pods-tools/bin. /health at127.0.0.1:8787.
  Before any restart prove idle and revalidate unit PID/cwd/cmdline/listener and
  SQLite integrity. Docs/evidence sync needs no restart. Never use old PID files
  or touch unrelated pods-j03 services. Last restart2026-10-04 02:37:28 UTC.
- Cloudflared manualPID2322522; fixed hostname/DNS supervision still awaits user
  input. Keep callback hostname unchanged. RunnerSHA
  2b346a88a772b11270734361db0d2d50b66c1868e3e0c75f23e487ee40ccd486.
- DB: file:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro;
  records(kind,id,value JSON), singular build/launch. Use whitelisted output.
- QA guest pods-fresh-matrix-01 via /snap/lxd/current/bin/lxc. Source /opt/pods,
  fixtures /work/stacks, output /output, Node /opt/node/bin/node, uid/gid1000.
  Existing QAserverPID292107/session86855, app18090/proxy8081/host18890. Its
  one-shot SIGTERM handler was consumed; do not blindly signal. Temporary Koa/
  Fastify probes/tunnels/devices are stopped and removed; no current probe.
- Graph project Users-rizwanahamed-Documents-ChatGPT-podsv2, indexed through
  73bd9f4 runtime source. scripts/public/examples/deploy excluded; targeted fallback appropriate.
- Use set -e for validation→commit. User requests no subagents. Keep goal active;
  native Codespaces browser,23 remaining fixture paths, native format migration,
  VM replacement durability, stable hosting and cold performance remain open.
