# Broad stack checkpoint

Goal active and incomplete. Do not claim universal compatibility or complete
provider/browser acceptance. This checkpoint replaces stale operational notes;
historical results remain in SUPPORT.md, PRODUCT.md and their evidence files.

## Source and coverage

- Private core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  revision 9eee994ba7f70d1793bc449573ddb36e01003818.
- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- 55 real isolated app fixtures pass build, artifact run and meaningful browser
  interaction. stack-coverage.json records precise scope and historical failures.
- 24 fixtures pass native Google browser interaction and Codespaces authenticated
  HTTP/protocol checks. Codespaces native browser authorization remains pending.
- 31 remaining native fixtures: actix, adonis, alpine, aspnet, astro, axum, deno,
  echo, express, fastapi, fastify, fiber, flask-mariadb, flask-mongodb7, flask-redis,
  flask-sqlite, flask-valkey, go, gradio, hono, koa, ktor, micronaut, nestjs,
  phoenix, php, react-router, rocket, sinatra, streamlit, symfony.
- 5,487 physical source lines: 2,944 product/tooling, 1,476 tests, 903 examples,
  164 browser tools. code-lines.json states the exclusions.
- Latest source/runtime5e5b4a0:111 automated checks passed locally/aswin.
  MainPID946172. Public /support remains55isolated/24native.

## Latest completed gate: provider state observations

- Runtime5e5b4a0 records compute.initialState and observedAt before provider
  startup, plus actual creation/resume/start request timestamps. Missing state
  stays null. Runner cache status remains separate. Historical measurements are
  never retroactively labeled cold/warm. Google adds one initial environment GET;
  its overhead is included in total timing. Official state references are in README.
- Nine new state scenarios were red before;111checks now pass locally/aswin.
  Test files /tmp/pods-provider-observations-before.txt,
  /tmp/pods-provider-observations-after.txt and
  /tmp/pods-compute-state-tests-{local,aswin}.txt. Graph reindexed through5e5b4a0.
- Idle restart23:36:28UTC,938367→946172,health320ms,SQLitequick_checkok.
  Native Google Lit recorded RUNNING, health5.679s, cachetrue, retained3→4/reload4
  and stopped. Browser13.457svisible/13.746sinteraction are upper bounds after an
  observation deadline, not continuous performance measurements. No duplicate launch.
- Explicitly stopped the idle Lit test Codespace7vrw57jpjjppcww57 to exercise
  resume state recording. Harness72611 ended0: initialShuttingDown→resume request
  recorded, health57.025s; repeatinitialAvailable,health7.857s. Same environment,
  cachetrue on both, compiled product/nested route/missing asset probes passed.
  Both stopped. Evidence compute-state-codespaces.json/provider-compute-state.json.
  Final audit23:39:09UTC activebuild0/launch0,localhealth200,port26163private.
- Alpine draft remains unsubmitted; normal quota watcher58240 is live for
 23:44:08.679UTC. Resume existing handles; do not duplicate them.

## Previous gate: native Lit

- Actual developer form submitted once after quota watcher66841 ended0, with
  account2/global2/active0 at23:24:12UTC. Build47.476s; artifact10,615bytes,
  public9eee994. No quota changes, alternate identities or QA imports.
- App repo-b2cd87ee9e8063ac61d2b4e0-9eee994ba7f7-56f291e44a0c; port26163.
  Google first health5.136s, visible7.398s, interaction7.886s; cached
  health4.727s, visible5.441s, interaction5.735s. Browser localStorage0→1,
  full app stop/relaunch retained1→2. Nested URL rendered and2→3/reload3.
- Codespaces harness26088 ended0, environment7vrw57jpjjppcww57. First
  health28.477s/delivery12.680s/cachefalse, repeat8.116s/7.135s/cachetrue.
  Both compiled entry/nested URL/missing asset checks passed. Initial provider
  state unrecorded. Browser sign-in/JavaScript execution remains pending.
- All four launches stopped, provider port26163 private. Final readonly audit
 23:28:31UTC: activebuild0/launch0. Evidence stack-lit-{url,google,codespaces}.json,
  whitelisted capture /tmp/pods-lit-production-evidence.json.
- Coverage explicit flags now24/24; isolated55; native31 pending. Runtime
  remains e5033d1,102passing checks,5,423source lines; no service restart required.
- Next native candidate Alpine. Ordinary quota next opens23:44:08.679UTC;
  fresh readonly availability check before submitting. Watcher58240 is live,
  started23:31:41UTC with a20minute bound; resume it instead of creating another.
  The latest poll confirmed account3/global3/active0, same next-slot timestamp.
  GitHub2FA remained pending on a fresh browser check this turn.

## Previous gate: public compatibility page

- Source/runtime e5033d1, MainPID938367; public /support is linked in the footer.
  Filterable55rows, independent23Googlebrowser/23Codespacesprotocol acceptance.
  Reads stack-coverage.json on request; counts update with evidence, no restart.
- Crucial: after a new native fixture passes, update that row's nativeAcceptance
  flags (googleBrowser / codespacesProtocol) separately alongside its evidence.
  Evidence filenames alone are not passes. Existing23flags reflect accepted gates.
- All102tests pass locally/aswin; graph reindexed through b9c5a00. Public HTML
  equals current renderer exactly. Browser Angular2/PostgreSQL2/no-match0,
  keyboard clear55; mobile page390px/table viewport341px and internal scroll620px.
  fill-empty CUA action did not clear; fresh DOM proved unchanged input, keyboard
  clear worked. No product bug inferred. Evidence public-compatibility.json.
- Controlled idle restarts913910→937070→938367 verified unit/cwd/cmdline/listener,
  activebuild0/launch0, health200 and SQLitequick_checkok. Runtimee5033d1 now serves
  the explicit acceptance flags. Last restart23:22:01UTC, health359ms.
- Local fixture23250/PID10324 ended0; tab29supportQa is now the public /support
  page marked deliverable. Viewport restored. No QA guest changes this gate.
- Quota watcher66841 later finished0 and Lit completed; see latest gate above.

## Previous gate: nested SPA entrypoint acceptance

- bc1e2c7 extends the static frontend probe: direct nested URL must return the
  app document, compiled entry URLs must resolve at that location (honoring base),
  and missing assets must return404. Three new rejection cases were red before;
  all99 automated checks pass locally/aswin after. No production runtime edits.
- All eight real existing compiled frontend artifacts passed the new probe in
  the isolated QA guest, then stopped. Evidence spa-entrypoint-qa.json.
  Ad-hoc runner2271 finished0; port18092 free. No production artifact imports.
- Native Google Solid direct /pods-spa-check/nested rendered, counter2→3 and
  reload3 passed. Browser logs[], launchstopped. Evidence spa-entrypoint-checks.json.
  Final audit23:11:52UTC: active builds0/launches0, localhealth200. This is browser
  localStorage and SPA fallback, not database durability or arbitrary route tests.
- Source5,328lines, counts55isolated/23native/32pending unchanged. Local test
  session62327 finished0. Backend6cfadb6 and frontend2cbfc93 unchanged.
- The developer form now stages examples/stacks/lit, with no stale ready result.
  Nothing was submitted while at the quota. Nextordinaryslot23:23:54.313UTC.
- Readonly quota watcher66841 is LIVE; /tmp/pods-next-native-quota-watch.py extends
  only the observation deadline to20minutes. No production limit changed. Last
  emitted account3/global3/activebuild0. Resume the same handle, do not duplicate.
- Asked which permanent public hostname should be used for launch/OAuth callbacks;
  no answer yet. Existing GitHub2FA and CloudShellRestart handoffs unchanged.

## Previous gate: native Solid

- Same-account quota watcher 66741 finished0 at23:00:01UTC, account2/global2,
  active builds0. Submitted Solid once via the actual developer form at23:00:50UTC.
  Isolated build59.956s, artifact8,310bytes, public9eee994. No quota changes,
  identity swaps or QA imports. A ready-region observation used a label missing
  the final period, so it waited longer; fresh DOM found the completed build.
  The preparation was not resubmitted and browser launch measurements are unaffected.
- App repo-afb358c19eb4451f3ac34fe3-9eee994ba7f7-8fd329781c5f;
  dataKey repo-afb358c19eb4451f3ac34fe3; stable private port24730.
- Google first: health5.411s, visible6.774s, interaction7.057s,0→1/reload1.
  After confirmed full app stop: health4.088s, visible5.173s, interaction5.469s,
  retained1→2/reload2. Continuous timing within each browser call; final logs[].
  Both launches stopped. This proves browser localStorage, not database durability.
- Codespaces harness41895 finished0. Existing7vrw57jpjjppcww57 served compiled
  Solid entry10,991bytes: first health27.546s/delivery14.619s/cachefalse, repeat
  health7.458s/delivery6.697s/cachetrue. Both probes passed, both launches stopped.
  Provider port24730 confirmed private. First launch included environment preparation;
  initial provider state was not recorded. Do not claim native browser execution.
- Evidence stack-solid-{url,google,codespaces}.json. Whitelisted production capture
  /tmp/pods-solid-production-evidence.json; final audit /tmp/pods-solid-final-audit.json.
- Final audit23:04:55UTC: active builds0, active launches0, local/public health200;
  service active/running MainPID913910. Quota3/account3/global in rolling hour.
- Next ordinary slot23:23:54.313UTC (04:53:54.313IST). Watcher66841 is live.
  Fresh readonly check before the next submission; do not change limits, switch
  identity or import QA artifacts. Normal limits3/account/hour,12/global/hour.
- Next native candidate: Lit, then Alpine; existing static probe covers both.
  Select the folder in the form and prepare only after ordinary capacity opens.

## Recent fixes retained

- 2cbfc93 clears completed preparation results after repository/folder changes,
  retains old versions in history, and clears stale results after OAuth draft restore.
  preparation-draft-state.json records actual production before/after plus three
  loopback simulated-provider requests, all202/ready, no launches. Fixture19889
  stopped, exec62150finished0, tab28closed. All96tests passed local/aswin.
- Served frontend SHA256:
  3e7a44a59fbf72c499e03305587d61d69f2922e5875a29792f56404a44b84fa3.
  Backend runtime remains6cfadb6; static frontend updated without service restart.
- 6cfadb6 handles Codespaces ShuttingDown, waits for Shutdown, resumes the same
  environment once within the deadline. Three red-before regressions,96green.
  codespaces-shutdown.json and codespaces-shutdown-live.json retain exact scope.
- Provider read retries are bounded to transient failures; auth/quota failures are
  immediate. Creation is not retried. Affinity prevents silently replacing a saved
  app's environment/data. Stable app ports20000–29999 and private forwarding isolate
  product origins. Existing native cases using historical8080 are not all retested.
- Previous Preact native evidence: stack-preact-{url,google,codespaces}.json;
  first/repeat Google interactions7.293s/5.809s; Codespaces10.446s/6.814s.
  Previous Svelte native evidence: stack-svelte-*.json. Historical details are in
  SUPPORT.md; do not rerun passing isolated checks without a changed concern.

## Browser handoffs

After compaction call cua.rewriteDocumentation, then reuse bindings. Mark pending
workflow tabs for handoff each turn. Never repeat a launch/build because a readonly
observation timed out; the action may already have completed.

- stackQa6: IAB2tab13, Alpine draft staged after Lit acceptance; not submitted.
  Exact ready region label is `Your application is ready to share.` (with period).
- accountWorker: IAB2tab12, stopped Lit launcher; browser localStorage count4.
  CUA litLaunchUrl, litBrowserChecks, litNestedCheck and litBrowserLogs retain evidence.
- supportQa: IAB2tab29, public /support deliverable, counts24/24 after evidence sync.
- nativeGithubKeep: IAB2tab10, still pending two-factor authentication at this gate.
  User action already requested; no SMS/code sent. GitHub browser OAuth unconfigured.
  Keep previews private; do not send another authorization request.
- cloudLifecycle: IAB2tab14, pending Cloud Shell Restart confirmation. No approval
  to replace the VM. Do not click Restart or accept background Authorize modal.
  Home persistence across VM replacement remains unverified.
- For Google launch timing, use continuous Date.now before the Open button through
  actual framework heading, button action and read; then reload and full appstop.
  Heading locator uses h1 plus exact text, not unsupported role level options.
- Snapshot redaction: strip Connected account text and private Cloud Shell hostnames.

## Operational state

- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
- systemd user unit pods-launch-fresh.service is the sole control server authority.
  MainPID946172, backend5e5b4a0. Node/gh in /home/aswin/pods-tools/bin.
  XDG_RUNTIME_DIR=/run/user/1000 and
  DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus for remote systemctl.
- Before intentional restart, prove no active builds/launches, verify unit PID,
  cwd/cmdline/listener, then restart only this unit. Never use retired manual PID
  /home/aswin/pods-launch-server.manual-retired.pid. Unrelated pods-j03 units untouched.
- Health endpoint /health on loopback8787. Cloudflared PID2322522 remains manual;
  durable DNS/tunnel supervision remains open. Do not change callback hostname.
- RunnerSHA 9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b.
- Production SQLite reads use URI readonly mode and whitelist public fields only:
  file:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro.
  records(kind,id,value JSON), singular build/launch. Never print tokens, root
  owner/account/session/computeKey values. Build repository.owner is public repo owner.
- /tmp/pods-native-quota-watch.py is a readonly bounded watcher, Svelte account
  anchor NLXLM6VYS1P01fMd4cFhdzEoXVCJy0Fp. Existing66741 and66841 are finished. Watcher58240 is live for the Alpine slot;
  /tmp/pods-next-native-quota-watch.py,20minute bound,30second readonly sampling.
- Latest Solid/Lit Codespace pods-launch-7vrw57jpjjppcww57 Available at inspection;
  Svelte/Preact pods-launch-jj497rpqpp7529v7 Shutdown. Container fixtures use
  pods-launch-containers-69rw5vx4xp46c5qw5 and97qw56gjg47gf7vrv. Recheck actual state.
- QA guest pods-fresh-matrix-01: direct /snap/lxd/current/bin/lxc, /opt/pods source,
  /work/stacks, /output, /opt/node/bin/node, uid1000. Existing QA server PID292107,
  exec86855, app18090/proxy8081/tunnel18890. Its one-shot SIGTERM handler is consumed;
  do not send another SIGTERM blindly. Draft test19889 stopped; QA guest unchanged.
- Code graph project Users-rizwanahamed-Documents-ChatGPT-podsv2. Indexed through
 5e5b4a0; public/scripts/examples/deploy absent, so targeted fallback is appropriate.
- npm test = node --test test/*.test.mjs; never bare node --test. Validation before
  commit uses set -e. Token stdin for gh harness; never print it.

## Remaining completion gates

Continue the31native fixtures and preserve separate health/visible/interactive
measurements, first artifact/image delivery versus cached and cold compute.
Native Codespaces browser interaction/OAuth, Cloud Shell VM replacement persistence,
durable DNS/tunnel and cold20s are unproven. Many cold/container cases exceed20s.
No representative matrix can establish arbitrary-application compatibility; retain
explicit supported recipes and Dockerfile/Compose contract, declared dependencies,
secrets and migrations. Non-web/native desktop/mobile/GPU apps remain outside this
browser-product scope. Goal remains active with meaningful progress this gate.
