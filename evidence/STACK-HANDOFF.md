# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Never claim universal compatibility, native Codespaces browser acceptance,
VM replacement durability or universal launches under20s without evidence.

## Current state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
- Fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pinned revision d6da2ed780aec8ae0178fc181f1d24113c322e15.
- Latest native acceptance: Deno, evidence revisionecbcafa, publicationc1ce216.
  Both pushed and synced. Public support verified55/49/49 at08:37:32UTC.
- Coverage:55 isolated build/artifact/browser passes;49 Google native browser
  and49 Codespaces authenticated HTTP/protocol passes. All8static frontends,
  6SSR,6Node,4Go,3Rust,2.NET and7database-family representatives pass native paths.
  Native Codespaces browser interaction remains pending authorization.
  The6 fixtures awaiting native acceptance are:
  gradio, ktor, micronaut, phoenix, streamlit, symfony.
- Current full suite:189/189 passed locally and in isolated aswin QA.
  Evidence stack-sqlite-file-tests.json; logs /tmp/pods-sqlite-file-full-{local,qa}.txt.
  Source7128physical lines:3717product/tooling +2314tests +933examples +164browser.
  Evidence code-lines.json defines exclusions; do not count generated/evidence files.

## Next native gate: Gradio

- Developer draft examples/stacks/gradio, not submitted. Existing quota watcher
  session83972 is live; next ordinary slot2026-10-04T08:47:21.377000+00:00.
  Re-poll the same handle. Quota3/account/hour,12global/hour: never bypass,
  switch account to evade quota, or import isolated QA artifacts into production.
- Browser1 handles: stackQa6/tab1 developer draft; echoTab/tab2 stoppedDeno;
  mongodbSupport/tab3 publicsupport. Re-markHandoff each new turn. After a browser
  context compaction, call cua.rewriteDocumentation before browser actions.
- Submit through actual developer form only after availability. Record actual
  submittedAt. Observer /tmp/pods-watch-gradio-build.py expects that timestamp;
  start with ssh aswin python3- and stdin script. A timeout is not build failure:
  resume same build via /tmp/pods-watch-existing-build.py ID FOLDER, never resubmit.
- Use ready region Your application is ready to share. → scoped Try this version
  link, not recent history. GoogleOpen → producth1 → meaningful write → reload →
  full stop → reopen saved value → next write → reload → full stop, before Codespaces.
- Gradio h1 Gradio + SQLite; number label Saved count; button Add one. Inspect
  actual DOM for counter locator; the old continueCounter helper expects #value.
  Record first-visible/read/write timings without resetting timers on wait yields.
- Codespaces exactappID: PODS_DASHBOARD_FIXTURE=gradio PODS_EXPECT_INITIAL_COUNT=0
  PODS_EVIDENCE_FILE=evidence/stack-gradio-codespaces.json node scripts/live-codespaces.mjs
  ORIGIN github APPID, with gh auth token on stdin. No PODS_COUNTER_CHECK flag.
  Gradio6.29.1 SSE and Streamlit1.65.0 WebSocket helpers already passed serialized
  real-artifact QA in stack-dashboard-helper-preflight.json and current189suite.
- After both providers finish/stopped, collect whitelisted capture using
  /tmp/pods-capture-native.py gradio, private ports via gh codespace ports --json
  sourcePort,visibility, /health200, and /tmp/pods-storage-deploy-audit.py.
- Save observed browser JSON to /tmp/pods-gradio-browser.json. Prepared temp helpers
  /tmp/pods-{record,document}-dashboard-native.py validate evidence/update docs;
  syntax checked only, not yet executed on native dashboard evidence. Do not claim
  the file-counter helper's exact startup-command check for dashboards.
- After recording: compatibility3tests, diffcheck, commit/push/ff-sync, publicDOM
  verification, save publication evidence and a concise next-gate handoff.

## Remaining framework checks

- Ktor/Micronaut: producth1 Ktor + SQLite / Micronaut + SQLite, #value, Add one.
  Phoenix/Symfony: h1 Phoenix + SQLite / Symfony + SQLite, #count, Save +1.
  Real empty chunked POST and restart checks passed in stack-sqlite-framework-transport-preflight.json.
- Native SQLite inspection: PODS_COUNTER_CHECK=1 PODS_SQLITE_FILE_RUNTIME_CHECK=1
  PODS_EXPECT_INITIAL_COUNT=0. New28083b6helper briefly pauses only its explicit test
  container, copies database and WAL consistently, resumes, queries private copy
  read-only, cleans copy. InspectorSQLite version is not the application's driver.
  Exact serialized probes on all4pinned artifacts passed0→1→2 and cleanup; Phoenix
  WAL included. Evidence stack-sqlite-file-preflight.json. No native acceptance yet.
- Streamlit uses PODS_DASHBOARD_FIXTURE=streamlit without PODS_COUNTER_CHECK.
  Native browser must interact with its real dashboard; protocol pass is separate.

## Running service and constraints

- ServicePID1063107, provider5dde1e5, builder2553fc8, storage77cf340.
  RunnerSHA2b346a88a772b11270734361db0d2d50b66c1868e3e0c75f23e487ee40ccd486.
  Preserve cloudflaredPID2322522 and temporary origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- No service restart for evidence/helper changes. Before runtime deployment, verify
  idle real service PID/cwd/8787listener, SQLite quick_check, health and zero active.
  Existing .env/auth credentials must remain private; never print token/account,
  computeKey or privateGoogle previewURL. SQLite queries mode=ro with whitelisted output.
- Sync only after push: gh auth token piped into ssh aswin, GH_TOKEN from stdin,
  credential helper /home/aswin/pods-tools/bin/gh auth git-credential, git pull --ff-only.
- Runtime storage migration is journaled for one service and default/data only.
  Existing format regression tests preserveExpress/Hono values; don't reset storage.
  Provider preserves supported existingNode>=22/Linuxx64DockerCompose environments.
  Lost Google start-response reconciliation uses the sameRUNNINGenv and uniqueSSHkey.
- Existing GitHub2FA, VMreplacement authorization and stablehostname inputs remain
  pending. Do not repeat those questions. Localgcloud identity is suspended/wrong.
- Latest Deno audit08:36:33UTC: health200, SQLiteok, zero active, unchangedPID/SHA.
  BothGoogle andCodespaces savedcount2. Codespace69rw5vx4xp46c5qw5, privateport23310;
  preserve data. All four launches stopped. First/cached visible22.944/7.835sGoogle;
  Codespaces healthy53.678/8.944s. First deliveries missed20s.

## Isolated QA and authoritative evidence

- LXD guest pods-fresh-matrix-01. Use /snap/lxd/current/bin/lxc; snapwrapper broken.
  Run as uid/gid1000. Node /opt/node/bin/node, deps /opt/pods/node_modules.
  Current candidate /output/sqlite-file-candidate-a6a7f5d, all322manifest hashes checked.
  Tests189local/Linux. First incomplete snapshot failure is preserved, not a product bug.
- Retain unrelated QA serverPID292107, app18090/proxy8081/host18890. All current scoped
  preflight containers, volumes and storage directories were cleaned. Cleanup only
  explicitly recorded dataKey/project paths; keep shared runtime and caches.
- Prepared isolated fixtures /output/FIXTURE/artifact.gz, images /output/FIXTURE/images,
  source /work/stacks/FIXTURE. No production artifact import.
- Machine-readable acceptance: stack-coverage.json. Failed historical flask-mongodb
  remains; replacement flask-mongodb7 is accepted. Do not erase failed attempts.
- Native timings: stack-native-timings.{json,md}, generator stack-native-timing-report.py.
  Currently98observations;49provider/fixture pairs excluded for incomplete timing
  provenance. Explicit states/cache fields only; missing timing stays unknown.
  Mixed historical fixtures/revisions are not a controlled benchmark or universalSLA.
- Detailed verification: STACK-VERIFICATION-HISTORY.md, per-fixture evidence files,
  and verbatim archived operational history STACK-HANDOFF-ARCHIVE-20261004.md.
