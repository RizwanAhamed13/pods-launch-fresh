# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Do not claim universal compatibility, native Codespaces browser acceptance or a
20-second cold-launch guarantee. Historical results remain in SUPPORT.md and evidence.

## Current source and acceptance

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Private core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  revision9eee994ba7f70d1793bc449573ddb36e01003818.
- 55 isolated real build/artifact/browser fixture passes. 28 native Google browser
  and28 Codespaces authenticated HTTP/protocol passes. 27 await native acceptance:
  actix, adonis, aspnet, axum, deno, echo, fastapi, fastify, fiber, flask-mariadb, flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, hono, koa, ktor, micronaut, nestjs, phoenix, php, rocket, sinatra, streamlit, symfony.
- All eight static frontend and all six SSR fixtures pass both acceptance paths.
  Codespaces native browser interaction remains pending for every fixture.
- Latest tooling source18026bb:114 automated tests pass locally/aswin. Logs
  /tmp/pods-ssr-complete-tests-{local,aswin}.txt. Live runtime remains5e5b4a0.
  Source updates only native QA scripts/tests; no runtime restart was necessary.
- 5,523 physical source lines:2,960 product/tooling,1,492 tests,907 examples,
  164 browser tools. The extension filter now includes the four-line .astro file.

## Latest completed gate: native Express + SQLite

- Actual form submitted once00:44:59.218UTC after watcher71223 confirmed ordinary
  capacity00:44:54UTC (account2/global2/active0). Preparation57.777s, manifest275
  bytes, image82,250,849bytes. Runtime5e5b4a0, checkoutfdcc305 during native tests.
- App repo-6c2ac75a42b5f46c775a3028-9eee994ba7f7-53e4f5be199d; private port24378.
  ImageSHA1ec6d596b67cedb0c3c264baaaab32ed88c6ab7b460cc3d3e130ea436edf09b3.
- Cloud Shell initialRUNNING on both launches. First-image health24.220s,
  delivery21.125s, visible26.290s, interaction26.585s; cached health5.986s,
  delivery3.158s, visible6.371s, restored database value6.381s, interaction6.677s.
  Both browser calls continuous. SQLite0→1/reload1, full stop/relaunch retained
  1→2/reload2; warnings/errors[]. This is backend SQLite persistence, not browser
  localStorage. Provider VM replacement remains untested.
- Codespaces harness46698 ended0 in pods-launch-containers-69rw5vx4xp46c5qw5.
  FirstinitialShutdown/resume/image-absent:health52.999s,delivery40.331s.
  RepeatinitialAvailable/cached:health9.201s,delivery8.535s. HTTP product and SQLite
  write/read passed0→1, then expected retained1→2 after a full application stop.
- All four launches stopped. Final00:48:24UTC audit:active builds0/launches0,
  control health200; Codespaces port24378 verifiedprivate. No public preview.
- Evidence stack-express-{url,google,codespaces}.json, explicit acceptance flags,
  temp /tmp/pods-express-production-evidence.json and /tmp/pods-express-ports.json.
  /tmp/pods-record-express.py wrote the verified evidence.

## Next bounded gate

- Next native framework: Fastify, followed by the remaining backend/database
  fixtures. No new production preparation or launch has been submitted.
- Express packaging diagnosis is now reproduced: esbuild0.25.12 emits one
  unresolved optional require of supports-color in debug/src/node.js. The current
  non-builtin external guard selects a full container. Promoting esbuild's
  ignored-dynamic-import diagnostic identifies the handled missing import;
  ordinary required missing imports still fail and require.resolve is distinct.
- Experimental isolated bundle:338,173bytes, versus the production82,250,849byte
  image. Real Express HTTP product and SQLite0→1, stop/relaunch1→2 passed at
  418ms/288ms local health. This is not a native/browser performance result and
  production preparation remains unchanged. Evidence stack-express-packaging-
  diagnosis.json and stack-express-optional-bundle-probe.json; probe44620 ended0.
- Do not switch packaging until format-transition storage is implemented/tested:
  bundles use <root>/data/<dataKey>, default containers use
  <root>/volumes/pods-<key-hash>/app-data/data. A format change would currently
  choose a different database. Container recipes also run with their image's
  default identity; handle file ownership without weakening directory checks.
- Live quota watcher52715 started00:51:13UTC; at00:51:16 account3/global3/active0,
  next ordinary slot01:01:09.984UTC. Poll the existing handle coarsely; do not
  duplicate it. No Fastify preparation submitted yet. Production limits remain
  3/account/hour and12/global/hour; never bypass them or import QA artifacts.
- /tmp/pods-next-native-quota-watch.py is a reusable bounded watcher. Anchor Svelte
  buildNLXLM6VYS1P01fMd4cFhdzEoXVCJy0Fp account privately; never print identity.
- /tmp/pods-capture-native.py runs on aswin with argument astro, react-router, express or fastify;
  readonly SQLite, whitelisted build/app/launch fields, compute and derived timings.
- scripts/live-codespaces.mjs: gh token via stdin; use the existing fixture's
  matching interaction probe and an explicit evidence file. Two launches required.
  SSR checks use PODS_SSR_CHECK/PODS_SSR_FIXTURE and reject wrong source folders.
  Do not combine interaction/persistence checks with SINGLE_LAUNCH.
- Stop/history observation corrected on the next turn: existing poll() already
  awaits history() after terminal state. A fresh read WITHOUT reloading showed
  every recent row stopped. The earlier screenshot caught the history request
  in flight; there is no evidenced persistent UI bug and no fix was made.
- Readonly production audit00:10UTC found no already-prepared production builds
  for any of the then29 pending fixtures. React Router has since passed; the other
  27 still require ordinary preparation capacity; Express has now also passed.
- Astro compression experiment completed: session36583 ended0. Levels6 and9
  reduced124,914,593bytes to124,901,410/124,901,306 respectively (0.011%). Both
  decoded to identical tarSHA427fe3c86896feeac0555e1bb57b573cee195b4800263e0d3e5c08674f44a882.
  Tar payload125,437,883 of125,448,998bytes is itself gzip-compressed layers.
  Keep level1; stronger outer compression cannot materially improve first-launch
  transfer. Evidence stack-astro-compression-trial.json. Temporary outputs removed.
  No source/runtime change or test rerun was warranted.

## Browser handoffs

First CUA call after compaction must be cua.rewriteDocumentation. Reuse bindings.
Mark pending workflow tabs each turn; no duplicate launch/build after read timeout.

- stackQa6: IAB2tab13, Fastify folder staged, preparation NOT submitted. Ready region includes period:
  Your application is ready to share. → Try this version link.
- accountWorker: IAB2tab12, stopped Express launcher; SQLite count2.
  expressLaunchUrl, expressBrowserChecks, expressBrowserLogs=[],
  expressPreparationSubmittedAt. Older React Router and Astro bindings remain.
- measureExpressCounter(tab,record,openLabel,expectedBefore) preserves start time
  and verifies exact heading express counter, restored DB count, click and reload.
  Use expected0 first and1 on repeat for a fresh fixture. No duplicate launch on
  an observation timeout. Fastify needs its actual fixture heading and selectors.
- Codespaces Express options: PODS_COUNTER_CHECK=1, PODS_EXPECT_INITIAL_COUNT=0,
  PODS_EVIDENCE_FILE=evidence/stack-express-codespaces.json. Two launches mandatory.
  /tmp/pods-express-native-handoff.json is now HISTORICAL waiting-state data;
  its watcher71223 is terminal. Prefer this updated checkpoint.
- measureSsrCounter(tab,heading,scenario,openLabel): bounded50s visibility and
  successful increment, reload retained value. Label must come from observed UI.
  measurePreparedCounter is older static helper hardcoded to Open PODS counter.
  stopPreparedProduct(tab,url) navigates to launcher, clicks Stop once, confirms.
- supportQa: IAB2tab29, public/support deliverable. After3452f41 sync, browser
  verified55 isolated/28 Google/28 Codespaces and Express Passed/Passed/Passed.
  Codespaces browser-pending warning remains visible. No further rerun is needed.
- nativeGithubKeep: IAB2tab10, pending GitHub two-factor authentication; fresh
  read00:40UTC still2FA. User action already requested. No SMS/code sent.
- cloudLifecycle: IAB2tab14, Cloud Shell Restart confirmation pending. No approval
  to replace VM. Do not click Restart or accept background Authorize prompt.
- Redact Connected-account text and private Cloud Shell hostnames from snapshots.
  Never print tokens, accounts, sessions or computeKeys.

## Operations and evidence rules

- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
- systemd user pods-launch-fresh.service,MainPID946172,runtime5e5b4a0. Node/gh:
  /home/aswin/pods-tools/bin. Health/health on127.0.0.1:8787 (not/api/health).
  XDG_RUNTIME_DIR=/run/user/1000; DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus.
- Before any runtime restart: prove idle, confirm unit PID/cwd/cmdline/listener.
  No restart required for evidence/docs. Never use retired manual PID marker or
  touch unrelated pods-j03 services. Last controlled restart23:36:28UTC.
- Cloudflared manualPID2322522, same hostname. Fixedhostname answer and durable
  DNS/tunnel supervision remain pending; do not change callback hostname.
- RunnerSHA9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b.
- Prod DB URIfile:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro.
  records(kind,id,value JSON), singular build/launch. Use whitelisted fields only.
  Provider initial state must be observed, never inferred/backfilled from duration.
- Public/support renders evidence/stack-coverage.json each request. Acceptance
  requires nativeAcceptance.googleBrowser/codespacesProtocol booleans after evidence.
  Filenames alone never confer a pass. No raw private evidence is served publicly.
- QA LXDpods-fresh-matrix-01 via/snap/lxd/current/bin/lxc,not snap wrapper.
  Source/opt/pods,fixtures/work/stacks,output/output,node/opt/node/bin/node,uid1000.
  Existing QAserverPID292107/session86855,app18090/proxy8081/tunnel18890; one-shot
  SIGTERM handler consumed. Don't blindly signal. New probe tests used18094 and
  stopped it. LXC file push could not overwrite existing root-owned/tmp paths;
  unique reviewed helper paths worked without changing permissions.
- Graph projectUsers-rizwanahamed-Documents-ChatGPT-podsv2,indexed through5e5b4a0.
  public/scripts/examples/deploy excluded; targeted fallback is appropriate.
- npm test = node --test test/*.test.mjs. set -e before validation/commit.
  No passing-check reruns absent changes/concerns. User requests no subagents.
- All native Codespaces browser interactions remain unverified. Cloud Shell VM
  replacement persistence, durable hosting and cold20-second target are pending.
  Arbitrary dependencies/secrets/migrations and native/mobile/GPU interfaces are
  outside the currently tested contracts. Goal remains active, not complete.
