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
- Latest native acceptance: Phoenix + SQLite; stack-phoenix-{url,google,codespaces,audit}.json.
  Acceptance revisiond546b3a pushed and synced. Public support verified55/53/53
  at10:02:17UTC; Phoenix row shows all three passes. Evidence stack-phoenix-published.json.
- Coverage:55 isolated build/artifact/browser passes;53 Google native browser
  and53 Codespaces authenticated HTTP/protocol passes. All8static frontends,
  6SSR,6Node,4JVM,4Go,3Rust,2.NET and7database-family representatives pass native paths.
  Native Codespaces browser interaction remains pending authorization.
  The2 fixtures awaiting native acceptance are:
  streamlit, symfony.
- Current full suite:189/189 passed locally and in isolated aswin QA.
  Evidence stack-sqlite-file-tests.json; logs /tmp/pods-sqlite-file-full-{local,qa}.txt.
  Source7128physical lines:3717product/tooling +2314tests +933examples +164browser.
  Evidence code-lines.json defines exclusions; do not count generated/evidence files.

## Next native gate: Streamlit

- Phoenix is complete; no build/launch watcher is running. Quota snapshot at09:57:10UTC
  showed3account/global builds in the last hour and zero active builds. Next ordinary
  slot2026-10-04T10:05:47.894000+00:00; recheck actual availability before submitting.
  Quota3/account/hour,12global/hour: never bypass, switch account to evade quota,
  or import isolated QA artifacts into production.
- Browser1 handles: stackQa6/tab1 completedPhoenix developer form; echoTab/tab2 stoppedPhoenix;
  mongodbSupport/tab3 publicsupport. Re-markHandoff each new turn. After a browser
  context compaction, call cua.rewriteDocumentation before browser actions.
- Set application folder examples/stacks/streamlit and submit through the actual developer
  form only after availability. Record actual submittedAt. Adapt the bounded
  /tmp/pods-watch-phoenix-build.py observer to Streamlit with timestamp guard. A timeout is not build failure:
  resume same build via /tmp/pods-watch-existing-build.py ID FOLDER, never resubmit.
- Use ready region Your application is ready to share. → scoped Try this version
  link, not recent history. GoogleOpen → producth1 → meaningful write → reload →
  full stop → reopen saved value → next write → reload → full stop, before Codespaces.
- Inspect Streamlit's real DOM for h1, Saved count metric and Add one button.
  It differs from Gradio's input and the framework counter's #count. Record
  first-visible/read/write timings without resetting timers; require a completed
  reload. Google0→1→2 with reload and full stop/relaunch.
- Codespaces exactappID: PODS_DASHBOARD_FIXTURE=streamlit
  PODS_EXPECT_INITIAL_COUNT=0 PODS_EVIDENCE_FILE=evidence/stack-streamlit-codespaces.json
  node scripts/live-codespaces.mjs ORIGIN github APPID, with gh auth token on stdin.
  Do not set PODS_COUNTER_CHECK or PODS_SQLITE_FILE_RUNTIME_CHECK for dashboards.
- After both providers finish/stopped, collect whitelisted capture using
  /tmp/pods-capture-native.py streamlit, private ports via gh codespace ports --json
  sourcePort,visibility, /health200, and /tmp/pods-storage-deploy-audit.py.
- Save actual browser JSON. Helpers /tmp/pods-{record,document}-sqlite-native.py
  now passed Ktor/Micronaut/Phoenix and validate counterCheck plus sqliteFileRuntimeCheck, identity,
  restart persistence, private ports and stopped runs. Reuse for the remaining
  SQLite frameworks; preserve inspector/runtime version distinction and test-only pause.
- /tmp/pods-native-evidence-audit.py FIXTURE now validates the production identities,
  timing agreement, stopped runs and evidence privacy; passed Phoenix. Syntax and
  result checks are separate from the production application tests.
- Dashboard helpers /tmp/pods-{record,document}-dashboard-native.py passed Gradio and
  are ready for Streamlit. Do not claim exact startup-command checks for dashboards.
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
  WAL included. Evidence stack-sqlite-file-preflight.json. Ktor/Micronaut now pass
  native acceptance, as does Phoenix; Symfony still needs native runs.
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
- Latest Phoenix audit09:59:07UTC: health200, SQLiteok, zero active, unchangedPID/SHA.
  BothGoogle andCodespaces savedcount2. Codespacepods-launch-containers-69rw5vx4xp46c5qw5,
  privateport23905; preserve data. All four launches stopped. First/cached visible
  54.511/9.338sGoogle; Codespaces healthy87.260/9.708s. First deliveries missed20s.

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
  Currently114observations;49provider/fixture pairs excluded for incomplete timing
  provenance. Explicit states/cache fields only; missing timing stays unknown.
  Mixed historical fixtures/revisions are not a controlled benchmark or universalSLA.
- Detailed verification: STACK-VERIFICATION-HISTORY.md, per-fixture evidence files,
  and verbatim archived operational history STACK-HANDOFF-ARCHIVE-20261004.md.


## Gradio native dashboard acceptance

The real developer form prepared `examples/stacks/gradio` from source revision
`d6da2ed780ae` after ordinary same-account quota availability. Server preparation
took **197.356s**; saved artifact `61950a67d4e0f297237e34bec24f93a00e9d7b49d0442b57e171be62a9c4c93a` contains
**151,999,097 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell initially RUNNING, first delivery | Healthy 51.038s; product visible 53.263s; saved count read 134.153s; button write 134.450s |
| Cloud Shell cached relaunch | Healthy 11.022s; visible 12.148s; saved count restored 12.174s; next write 12.467s |
| Codespaces initially Shutdown | Healthy 86.579s; delivery/startup 73.553s |
| Codespaces cached relaunch | Healthy 11.025s; protocol write/read, SQLite integrity and saved row passed |

Cloud Shell verified the real dashboard h1, saved-count control, Add one button,
reload and full application stop/relaunch: **0→1→2**, with no console warnings
or errors. Codespaces exercised the framework protocol, verified the same
sequence and directly queried the actual SQLite file. Framework version
**6.29.1**, SQLite version **3.46.1**, database
integrity and saved rows were recorded. The checks verified one web service,
its project network, persistent workspace volume and private product port
**29623**. No database port was published.

Both Google runs finished and stopped before Codespaces testing began. All four
launches ended stopped. Audit at 2026-10-04T08:58:47.692174+00:00 confirmed health200, SQLite
integrity ok, zero active builds/launches and unchanged service PID/runner SHA.
These timings describe this fixture and observed compute/cache states. Native
Codespaces browser execution and provider VM replacement durability remain
unverified.

Evidence: `stack-gradio-{url,google,codespaces,audit}.json`. Coverage now
**55 isolated / 50 Google browser / 50 Codespaces protocol**, with
**5** native fixtures pending. Full suite **189/189** and
physical source **7,128 lines** remain valid; this acceptance changed only
evidence and documentation. App `repo-c4c5dae76225abe8b74bac37-d6da2ed780ae-61950a67d4e0`; preserve saved native counters2.

Browser measurement note: Saved-count read/write timing includes a browser test selector recovery after the product h1 was visible; it is an observed upper bound, not application processing latency.


## Ktor native SQLite acceptance

The real developer form prepared `examples/stacks/ktor` from source revision
`d6da2ed780ae` after ordinary same-account quota availability. Server preparation
took **235.533s**; saved artifact `8664bd05ad3ea90c02e07411d1aba1e14f9432e993e4ed96246cd12bc412066d` contains
**138,946,648 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell initially RUNNING, first delivery | Healthy 41.186s; product visible 42.431s; saved count read 43.019s; button write 48.585s |
| Cloud Shell cached relaunch | Healthy 7.958s; visible 8.731s; saved count restored 9.275s; next write 9.563s |
| Codespaces initially Shutdown | Healthy 74.982s; delivery/startup 59.946s |
| Codespaces cached relaunch | Healthy 9.871s; HTTP write/read, SQLite integrity and saved row passed |

Cloud Shell verified the real product h1, saved-count control and increment button,
reload and full application stop/relaunch: **0→1→2**, with no console warnings
or errors. Codespaces exercised the product HTTP API, verified the same sequence and queried
a read-only copy of the actual SQLite file. The fixture container was briefly
paused to copy the database and any WAL consistently, then resumed before the
query. Inspector SQLite **3.53.4**, integrity and saved
rows were recorded; this is the inspector version, not the application's driver.
The checks verified the exact compiled/runtime startup command, one web service,
its project network, persistent workspace volume and private product port
**26525**. No database port was published.

Both Google runs finished and stopped before Codespaces testing began. All four
launches ended stopped. Audit at 2026-10-04T09:15:49.778820+00:00 confirmed health200, SQLite
integrity ok, zero active builds/launches and unchanged service PID/runner SHA.
These timings describe this fixture and observed compute/cache states. Native
Codespaces browser execution and provider VM replacement durability remain
unverified.

Evidence: `stack-ktor-{url,google,codespaces,audit}.json`. Coverage now
**55 isolated / 51 Google browser / 51 Codespaces protocol**, with
**4** native fixtures pending. Full suite **189/189** and
physical source **7,128 lines** remain valid; this acceptance changed only
evidence and documentation. App `repo-acd8cc8280c3ab2983d8e2b5-d6da2ed780ae-8664bd05ad3e`; preserve saved native counters2.

Browser measurement note: The first write completed at the end of a bounded browser observation window; interactionMs was recorded on the resumed observation and is an upper bound.


## Micronaut native SQLite acceptance

The real developer form prepared `examples/stacks/micronaut` from source revision
`d6da2ed780ae` after ordinary same-account quota availability. Server preparation
took **225.217s**; saved artifact `b8c6e3de8016153880530a6c1f84f777d43e201c455ca37249a3f9c22357844c` contains
**125,122,726 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell initially RUNNING, first delivery | Healthy 37.183s; product visible 38.257s; saved count read 39.844s; button write 40.138s |
| Cloud Shell cached relaunch | Healthy 10.456s; visible 11.800s; saved count restored 12.358s; next write 12.637s |
| Codespaces initially Shutdown | Healthy 70.406s; delivery/startup 57.827s |
| Codespaces cached relaunch | Healthy 11.256s; HTTP write/read, SQLite integrity and saved row passed |

Cloud Shell verified the real product h1, saved-count control and increment button,
reload and full application stop/relaunch: **0→1→2**, with no console warnings
or errors. Codespaces exercised the product HTTP API, verified the same sequence and queried
a read-only copy of the actual SQLite file. The fixture container was briefly
paused to copy the database and any WAL consistently, then resumed before the
query. Inspector SQLite **3.53.4**, integrity and saved
rows were recorded; this is the inspector version, not the application's driver.
The checks verified the exact compiled/runtime startup command, one web service,
its project network, persistent workspace volume and private product port
**26630**. No database port was published.

Both Google runs finished and stopped before Codespaces testing began. All four
launches ended stopped. Audit at 2026-10-04T09:38:20.913418+00:00 confirmed health200, SQLite
integrity ok, zero active builds/launches and unchanged service PID/runner SHA.
These timings describe this fixture and observed compute/cache states. Native
Codespaces browser execution and provider VM replacement durability remain
unverified.

Evidence: `stack-micronaut-{url,google,codespaces,audit}.json`. Coverage now
**55 isolated / 52 Google browser / 52 Codespaces protocol**, with
**3** native fixtures pending. Full suite **189/189** and
physical source **7,128 lines** remain valid; this acceptance changed only
evidence and documentation. App `repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-b8c6e3de8016`; preserve saved native counters2.


## Phoenix native SQLite acceptance

The real developer form prepared `examples/stacks/phoenix` from source revision
`d6da2ed780ae` after ordinary same-account quota availability. Server preparation
took **356.602s**; saved artifact `93e7177def98dd34acc8b880c6e6cdfdc0af9ee82844f3ad91930ef6ca3e1e02` contains
**166,072,328 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell initially RUNNING, first delivery | Healthy 52.891s; product visible 54.511s; saved count read 59.496s; button write 59.787s |
| Cloud Shell cached relaunch | Healthy 8.031s; visible 9.338s; saved count restored 9.361s; next write 9.652s |
| Codespaces initially Shutdown | Healthy 87.260s; delivery/startup 72.491s |
| Codespaces cached relaunch | Healthy 9.708s; HTTP write/read, SQLite integrity and saved row passed |

Cloud Shell verified the real product h1, saved-count control and increment button,
reload and full application stop/relaunch: **0→1→2**, with no console warnings
or errors. Codespaces exercised the product HTTP API, verified the same sequence and queried
a read-only copy of the actual SQLite file. The fixture container was briefly
paused to copy the database and any WAL consistently, then resumed before the
query. Inspector SQLite **3.53.4**, integrity and saved
rows were recorded; this is the inspector version, not the application's driver.
The checks verified the exact compiled/runtime startup command, one web service,
its project network, persistent workspace volume and private product port
**23905**. No database port was published.

Both Google runs finished and stopped before Codespaces testing began. All four
launches ended stopped. Audit at 2026-10-04T09:59:07.912749+00:00 confirmed health200, SQLite
integrity ok, zero active builds/launches and unchanged service PID/runner SHA.
These timings describe this fixture and observed compute/cache states. Native
Codespaces browser execution and provider VM replacement durability remain
unverified.

Evidence: `stack-phoenix-{url,google,codespaces,audit}.json`. Coverage now
**55 isolated / 53 Google browser / 53 Codespaces protocol**, with
**2** native fixtures pending. Full suite **189/189** and
physical source **7,128 lines** remain valid; this acceptance changed only
evidence and documentation. App `repo-c9d884e81c64dde53b2afef0-d6da2ed780ae-93e7177def98`; preserve saved native counters2.
