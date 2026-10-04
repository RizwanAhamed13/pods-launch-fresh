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
- Coverage: 55 isolated build/artifact/browser passes; 34 Google native browser
  and 34 Codespaces authenticated HTTP/protocol passes. All eight static frontend
  and six SSR fixtures pass both paths. Every native Codespaces browser check
  remains pending. The 21 fixtures awaiting both native acceptance paths are:
  actix, aspnet, axum, deno, echo, fiber, flask-mariadb,
  flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, ktor,
  micronaut, phoenix, php, rocket, sinatra, streamlit, symfony.
- Runtimeprovider73bd9f4 had134 passing tests locally and in isolated aswin QA;
  logs /tmp/pods-provider-full-{local,qa}.txt. Adds3 provider compatibility
  cases after17 storage cases. Baselines114/131 remain historical; do not
  rerun unchanged passing checks. Currentbuilder2553fc8 adds4 cases: all138
  passed locally and on QA after restoring its missing coveragefile and rerunning
  the3 affectedcompatibility checks; details below.
- Physical code: 6,120 lines = 3,250 product/tooling + 1,773 tests + 933 examples
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
- The storage change alone did not prove native format continuity. The later
  Express gate below now covers it on both providers with optional bundling.
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
  stack-provider-format-adapter.json. Native format migration is now covered by the latest Express gate below.
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

## Previous native gate: Hono acceptance

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

## Previous native gate: NestJS acceptance

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

- Express optional-import preparation2553fc8 is deployed and native format
  continuity is now verified, with one retained Google compute-start timeout.
  See the latest gate below. No quota watcher remains live. Watcher5345 ended0
  at03:02:16.517065UTC and Express submitted once03:02:21.944UTC.
- Current Express values: Google6, Codespaces5, both last launched as bundles.
  Never reset existing data; use these only after rechecking current evidence.
- Choose one of22 remaining native fixtures after a fresh normal quota check.
  Limits3/account/hour and12/global/hour; no identity switching or QA imports.
- Google compute startup timed out once before artifact delivery on a RUNNING
  environment. Terminal failure was confirmed; one retry passed. Investigate
  provider timeout handling before claiming consistently one-click success.
  Do not add blind retries or change Google identity. Existing evidence retains
  the failed launch and distinguishes its metrics from successful samples.
- /tmp/pods-capture-native.py uses readonlySQLite and whitelisted fields;
  explicit fixture allowlist:astro,react-router,express,fastify,koa,hono,nestjs,adonis.
  /tmp/pods-capture-transition.py includes both old/new apps for one fixture.
- scripts/live-codespaces.mjs uses tokenstdin and explicit fixture checks.
  New evidence/stack-express-native-transition-probe.mjs validates same-dataKey,
  exactsavedCodespace and values across bundle→container→bundle with fullstops.
- Default storage format migration is implemented and natively verified for
  ExpressSQLite. Multi-service/schema migrations, conflicts, backup retention,
  power-loss durability and VM replacement durability are separate open gates.
- Fastify's original Google empty chunked POST415 and corrected passing fixture
  remain preserved. Its existing values areGoogle2/Codespaces4. Older manual
  Express bridge/provider rejection probes are historical, not current behavior.

## Browser and environment handoffs

After compaction first CUA call must be cua.rewriteDocumentation. Reuse bindings;
mark pending tabs each new turn. Never duplicate a launch/build after timeout.

- stackQa6: IAB2 tab13, completed Express bundle preparation and exact link.
  Ready region name includes period: Your application is ready to share.
- accountWorker: IAB2 tab12, stopped Express bundle launcher. Bindings
  expressBundleLaunchUrl,expressLegacyLaunchUrl,expressOptimizedSubmittedAt,
  expressTransitionBrowserChecks (threepassed/onecompute-startfailure),
  expressTransitionLogs (threeempty),expressBeforeMigrationBrowser persist.
  measureExpressCounter expects h1express counter,#value,Add one;50sec deadline.
  stopPreparedProduct confirms fullstop. Never duplicate an in-flight launch.
- supportQa: IAB2 tab29, public support deliverable. After d1c23f1 was pushed
  and synced to aswin, native DOM verified55/33/33, Adonis allPassed and the
  visible Codespaces browser-pending warning. Compatibility3 tests passed.
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
  native Codespaces browser,22 remaining fixture paths,
  VM replacement durability, stable hosting and cold performance remain open.


## Latest native gate: AdonisJS acceptance

- Ordinary quota watcher14019 ended0 at02:45:30.645736UTC, account2/global2,
  active0. Actual developer form submitted once02:45:43.987UTC; build92087ms.
- Public fixture examples/stacks/adonis atd6da2ed. Image83631279bytes.
  App repo-4083e3f707cf3d21b636b324-d6da2ed780ae-9ec0984392a8, port23608.
- Google initialRUNNING both runs: first health35982/delivery32602ms,
  page38321/read38333/write38620ms; cached health7830/delivery4546ms,
  page8800/read8914/write9196ms. Browser0→1,reload1,fullstop1→2,reload2.
  Both stopped; warning/error logs empty. These are not cold-VM measurements.
- Codespaces32135 ended0 in pods-launch-containers-69rw5vx4xp46c5qw5.
  InitialAvailable both runs: uncached health41977/delivery41474ms;
  cached health9286/delivery8755ms. HTTP0→1,fullstop1→2 passed; bothstopped.
  Native CS browser remains pending. Both providers now hold Adonisvalue2.
- Audit75515 ended0 at02:49:06.930211UTC: activebuild0/launch0,health200,
  Codespacesport23608private. Evidence stack-adonis-{url,google,codespaces}.json.
  Inputs /tmp/pods-adonis-{production-evidence,browser,ports}.json,health.txt,
  recorder /tmp/pods-record-adonis.py. Runtime73bd9f4/checkout615fe80 atbuild.
- Isolated emptychunkedPOST/fullrestart probe30327 ended0 at02:43:35.401UTC,
  sourceSHA5cc3fe656531ad5c784b6e97adc5c7e8cc3325d7445b3b8da8453e9895afecf3.
  Existingmatrix24artifact, provider-candidate-c0931da runner. Both200,0→1→2;
  temporaryvolume/rootremoved. Original30273 wrong-title assertion and40077
  uploadownershipfailure were probe-only; no product code changed. Evidence
  stack-adonis-chunked-probe.{json,mjs}. No temporary probes remain live.
- Evidence checkpoint d1c23f1 is pushed and synced; docs/evidence only, so no
  service restart. Compatibility3 tests and probe syntax check passed.
- Adonis quota watcher14019 and Express watcher5345 are complete. No duplicate
  builds, identity switching or QA imports.
- Goal active. Express bundling is deployed; native migration acceptance now
  passes with one retained compute-start timeout. Do not repeat pending
  browser2FA, CloudShellRestart
  or stable-hostname questions. No product source change in this checkpoint.


## Optional Node packaging and latest native migration gate

- Builder2553fc8 synced to aswin; preparerSHA
  77686545d8259cd2a0f8a41edc7745b5989804d05e96d9e47a03f952abc38810.
  Pinned esbuild0.25.12 preserves compiler-confirmed handled literal requires;
  required/native/resolve/dynamic imports retain previous fallback. Deployed
  builder pushes current scripts into every build; no service restart needed.
- Local138/138 passed. QA snapshot/output/optional-candidate-aa02036 first
  fullrun136/138 because source tar omitted evidence/stack-coverage.json.
  Restored exactfile; affected3/3 passed. No product fix for QA setup failure.
  Logs/tmp/pods-optional-full-{local,qa}.txt and compatibility-qa.txt.
- Actualprepare+isolatedmigration23446 ended0 at02:53:28.934UTC: bundle338173B,
  SHAc469dd8aefc5439253a2ea76bb7d7642cd5c0bb6e27e7845277bb4b89a38b3c0.
  Container0→1,bundle1→2,container2→3,bundle3→4; allcleanuptrue. Hono/Koa
  regression39160 retained exact bundle bytes/hashes; temp root removed.
- ActualURLform submitted03:02:21.944UTC after ordinaryquota5345 ended0.
  Build17311ms, same338173B/hash, publicsource d6da2ed. Newapp
  repo-6c2ac75a42b5f46c775a3028-d6da2ed780ae-c469dd8aefc5.
  Oldcontainer repo-6c2ac75a42b5f46c775a3028-9eee994ba7f7-53e4f5be199d.
  Same dataKeyrepo-6c2ac75a42b5f46c775a3028 and port24378.
- Google pre-migration readonlybaseline restored3 at24618ms, RUNNING with
  imageabsent; stopped. Bundle health6001/page6514/write6906ms restored3→4.
  First reverse attempt failed compute-starttimeout before providerReady/delivery.
  Confirmedterminal, one retry:health6489/page7950/write8357, restored4→5.
  Backtobundle:health5162/page6561/write6969, restored5→6. Reloadretainedeach.
  AllinitialRUNNING; threebrowserlogs empty. Allsuccessfulapps stopped.
- CS23093 ended0, samepods-launch-containers-69rw5vx4xp46c5qw5 throughout.
  AllinitialAvailable: bundlehealth15548,container8225,bundle10215ms.
  HTTP retained2→3→4→5 withfullstops. Native browser stillpending.
- Finalaudit71368 ended0 at03:06:23.039235UTC: health200,SQLiteok,active0/0,
  port24378private,PID1041360,runnerSHAunchanged2b346a88.... Provider73bd9f4
  andrunner77cf340 unchanged; builder2553fc8,checkout55ca3dc atpreparation.
- Evidence stack-express-bundle-url.json, stack-express-native-transition-
  {baseline,google,codespaces}.json, stack-optional-node-packaging.json and
  isolated/unchanged-bundle probes. RetainedGooglefailure is not a pass.
  /tmp/pods-record-express-transition.py assertsallcounts andjoinsbrowserchecks
  tolaunch timestamps; inputs /tmp/pods-express-transition-{browser,final,ports,audit}.json.
- Source5978=3210product+1671tests+933examples+164browsertools. Coverageunchanged
  55/33/33,22pending. Compatibility3/3 passedafteradding evidence references.
- Goalactive. No live watcher, test, or migrationprobe remains. All testpreview
  apps stopped; saved data and required migrationbackups retained.

## Google startup recovery

- The retained Express failure occurred before delivery, with initial RUNNING
  and a transport timeout. Exact request was not recorded; do not claim a
  reproduced provider root cause. Evidence: stack-google-start-recovery.json.
- Start is sent once. An uncertain transient response is reconciled only when
  the same default environment is RUNNING and contains this attempt’s unique
  SSH public key. GETs have bounded transient retries; acknowledged operations
  retain their handle. Authorization/quota errors and explicit failures stop.
- Response-body transport failures now propagate to provider recovery.
  Start accepted/uncertain/reconciled timestamps distinguish future incidents.
- Eight new cases; full146/146 passed locally and isolated aswin QA. Snapshot
  /output/google-recovery-candidate-f598e07 contains source and coverage data.
- Deployed5dde1e5 at03:15:31.783701UTC after fresh idle audit, PID1063107,
  health200, SQLiteok, runner SHA unchanged. The lost-response recovery is
  simulated; the real timeout has not recurred and its original failure remains.
- Native Google Express bundle kept SQLite6→7, reload7, full stop, retained7→8,
  reload8. Pages7220/5227ms, writes7542/5624ms, health4999/4828ms;
  delivery2144/1545ms. Both initialRUNNING and startAcceptedAt recorded;
  no startUncertainAt and no browser errors/warnings. Both fully stopped.
- Native Codespaces regression21792 ended0, same saved containerprofile;
  retained5→6→7 across full stops. Available health11554/10698ms and delivery
  11149/10129ms, privateport24378. Native browser remains unverified.
- Finalaudit03:17:04.855862UTC: activebuild0/launch0, health200, SQLiteok,
  PID1063107. Current Express counters: Google8, Codespaces7, both bundles.
- Code6120lines=3250product/tooling+1773tests+933examples+164browsertools.
  Coverage remains55/33/33;22nativefixtures pending. Source graph refreshed.
- Nextfixture selected: FastAPI + SQLite. Browser stackQa6/tab13 holds an
  unsubmitted draft: public runtime repository, examples/stacks/fastapi.
  Normalquota watcher98548 still running; next ordinaryslot03:26:06.781UTC.
  Resume the same handle, no duplicate watcher/submission/quota bypass.


## Native FastAPI acceptance

- Quota watcher98548 ended0 at03:26:10.100945UTC, sameaccount2/global2/active0.
  Actual form submitted once03:26:15.847Z. Production isolated build71888ms,
  source d6da2ed; image54898173bytes, app
  repo-46dbc56878c4f438c7ed70d3-d6da2ed780ae-309b54492909; privateport27215.
- Google firstRUNNING: health21348/delivery18375, page23248/read23259/
  write23537ms. Cached after fullstop RUNNING: health6720/delivery3198,
  page7560/read7675/write7959ms. SQLite0→1→2, reloads1/2, both fullystopped,
  browserwarn/error0. First-image sample exceeds20seconds on readycompute.
- Codespaces16323 ended0; same saved containerprofile, bothAvailable.
  Health27278/8907, delivery26768/8354ms. HTTPproduct and SQLite0→1→2 across
  fullstops passed. Native browser stillpending2FA, reobserved03:21UTC.
- Finalaudit03:29:57.033769UTC: health200, SQLiteok, activebuild0/launch0,
  PID1063107, runnerunchanged. All4launchesstopped; productport27215private.
- Isolated chunkedPOST preflight84313 ended0, recorded03:19:32.456Z;
  artifact4f3d6902…, sourceSHAf73acf70…matchescurrentfixture; SQLite0→1→2.
  Unique testvolume/root and containerscleaned. Not nativeprovider evidence.
- Evidence stack-fastapi-{url,google,codespaces}.json and
  stack-fastapi-chunked-probe.{json,mjs}. Coverage55/34/34,21nativepending.
  Source6120lines unchanged; no productcode changed during this gate.
- Browser accountWorker/tab12 retains stoppedFastAPIlauncher; stackQa6/tab13
  has completedFastAPIpreparation. fastapiLaunchUrl, fastapiBrowserChecks,
  fastapiBrowserLogs, measureFastapiCounter and stopPreparedProduct retained.
- Next normal quota watcher35120 started after this completed native gate;
  watcher98548 is terminal. Resume35120 rather than launching a duplicate.
- Compatibility checks3/3 passed after coverage update. Updated README,
  PRODUCT and SUPPORT also reflect the prior Google recovery gate146tests.
- Native acceptance published41249c7 to local/aswin. Public support DOM verified
  55/34/34, FastAPI Passed/Passed/Passed and Codespaces browserpendingwarning.
- Nextfixture selected: Flask + MariaDB (new native database coverage).
  stackQa6/tab13 holds an unsubmitted draft examples/stacks/flask-mariadb.
  Its existing Compose uses mariadb:11.4 with private /var/lib/mysql storage;
  existing MySQL runtime inspection must not be misattributed to MariaDB.
- Watcher35120 last confirmedlive: own3/global3/active0; nextordinaryslot
  03:45:44.827UTC. Poll the samehandle. No other jobs/apps remain running.


## MariaDB runtime inspection and isolated preflight

- Added scripts/probe-mariadb-runtime.mjs, restricted native CLI flag
  PODS_MARIADB_RUNTIME_CHECK=1 with PODS_COUNTER_CHECK=1. Inspects actual
  MariaDB version and product-saved counter using fixed SELECT queries, private
  DB boundaries and durable Codespaces volume. Credentials never leave db.
- Shared MySQL inspection now accepts the assigned product port instead of
  assuming8080. Four new cases, including fresh-process serialized execution.
  Full150/150passed local and isolated QA; logs /tmp/pods-mariadb-full-{local,qa}.txt.
  QA snapshot /output/mariadb-candidate-9d9e1b6. No provider/runner edits/restart.
- Actual isolated preflight15936 ended0, recorded03:38:51.158UTC. Stored artifact
  f019c61e… and sourcecd4b48fa… verified. MariaDB11.4.13, privateDB, selected
  volume, chunkedPOST and fullstop/relaunch0→1→2 passed. Cleanup80326 ended0:
  unique containers/volume/storage removed, sharedruntime/cache retained.
  Evidence stack-flask-mariadb-chunked-probe.{json,mjs}, not native acceptance.
- Source6207lines=3283product/tooling+1827tests+933examples+164browsertools.
  Coverage unchanged55/34/34,21nativepending.
- Quota watcher35120 remains the only pending native gate; ordinaryslot
  03:45:44.827UTC. Resume samehandle; no alternate accounts/quota overrides.
- Browser stackQa6/tab13 remains the unsubmitted MariaDB preparation form.
  measureMariadbCounter helper uses exact heading "Flask + mariadb counter",
  #value and Addone; first native launch expected0, fullrelaunch expected1.
  50s observation deadline may need continuing the same launch for image delivery.
- /tmp/pods-capture-native.py allowlist includes flask-mariadb. Recorder template
  /tmp/pods-record-flask-mariadb.py expects twoGoogle/twoCSstopped launches;
  update checkoutRevision to the newly published tooling commit before use.
  It requires actual MariaDB runtime checks in both CS results.
- Next: submit form once quota available, wait production build, Google real UI
  0→1→2 with reload/fullstop, native CLI with counter+MariaDB flags and expected0,
  privateport/health/idle audits, then update native counts only on actual success.
