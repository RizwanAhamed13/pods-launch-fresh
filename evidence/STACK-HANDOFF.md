# Broad stack checkpoint

Goal active. Do not mark complete: native evidence for remaining frameworks,
GitHub browser OAuth/sign-in and Cloud Shell VM replacement remain unverified.

## Code and evidence

- Core: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
- Fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh (public), 00df7c0.
- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- Aswin: /home/aswin/pods-launch-fresh and /home/aswin/pods-launch-runtime-fresh.
- Latest product fix: 004c64b, pushed/deployed. Runner SHA matches public bytes:
  75cfd87f58a02353b48a080ee480b9b5ac246e2e189474f57e318fa11fdc0a0f.
- 54 distinct framework/application/database fixtures pass isolated builds,
  reusable launches and meaningful browser interaction. They are not 54 frameworks.
  SUPPORT.md and stack-coverage.json preserve exact coverage and historical failures.
- 54 automated checks pass locally/aswin (container-liveness-unit-tests*.txt).
- 4417 source lines: 2556 product/tooling, 836 tests, 868 examples, 157 browser tools.
  code-lines.json defines the count; docs/config/generated files are excluded.
- Native Google browser product families: Flask/PostgreSQL,
  React/Express/PostgreSQL, Angular SSR/SQLite, Quarkus/SQLite, Laravel/SQLite,
  Blazor/SQLite, Gin/persistent file, and Flask/Python worker/Redis.
- Codespaces authenticated HTTP covers those eight families. Native browser
  authorization remains separate and pending. Full Codespaces rebuild retained
  PostgreSQL data; Cloud Shell VM replacement is not proven.

## Latest completed gate: worker and dependency liveness

- Developer form submitted examples/stacks/worker-redis after its normal quota
  window opened. Build ZYqbMj9idqJ8tOowQiSLNB_SWZ6mj8dw completed in 138.088 seconds.
- App: repo-90eed92544a3c9d01cc828e7-00df7c09ea97-19cac81e0f89.
  Two immutable images total 65.3 MiB; web and worker share one image.
- Google existing VM/images absent: health 29.905s; native product <=32.321s.
  The early 304ms heading match was the launcher title and is excluded.
  First job GOOGLE WORKER ONE completed in 444ms and survived reload.
- Confirmed stop then new Google launch: health 8.254s, retained product 11.233s,
  new job GOOGLE WORKER TWO complete 11.543s continuously from launch. Reload retained it.
- Codespaces: health 31.143s/images absent and 9.308s/cached. Both real worker
  probes passed: completed distinct jobs, retained first job after full restart,
  and both applications confirmed stopped. No native GitHub browser claim.
- Evidence: stack-worker-redis-{url,google,codespaces}.json. Completed jobs only;
  do not claim exactly-once or in-flight crash recovery.
- Fixed src/container-runtime.mjs: check every service before readiness and on
  heartbeats, including missing/stopped/paused/restarting/unhealthy services.
  Explicit service_completed_successfully dependencies may exit successfully.
- Fixed src/runner.mjs: report failure before graceful cleanup, preserve data.
- Real isolated fault test: web remained HTTP 200, worker death reported 2.576s,
  DB unhealthy reported 2.564s. Cleanup 6.867s/17.933s; saved job retained on restart.
  A completed migration remained valid. container-liveness.json; first delayed
  callback failure retained in container-liveness-initial.json.
- Reproducer scripts/test-container-liveness.mjs runs only as the isolated QA
  user, reusing existing worker-redis images. Its synthetic artifact adds a
  migration service and fault-injectable healthcheck; it never publishes a version.

## WebSocket probe gate completed; native Bun next

- New scripts/probe-websocket.mjs is self-contained and serialized through the
  authorized Codespace SSH connection. PODS_WEBSOCKET_CHECK=1 is exclusive with
  counter/worker flags and requires two launches. Stop cleanup is now confirmed
  on both successful and failed probes.
- Real prepared Bun QA: WebSocket ping/pong, increment 0→1, socket reconnect,
  HTTP readback, full application restart retains1, second increment2. Isolated
  data identity websocket-probe-bun; both QA applications stopped.
- Negative native control against healthy Gin: HTTP ready, WebSocket handshake
  rejected as expected, stop confirmed. This is expected validation, not a Bun
  failure. Gin saved4 unchanged; no Codespaces application remains running.
- Evidence stack-websocket-probe-{qa,negative,guards,validation}.json; product
  runtime unchanged, so previous 54 automated product checks remain applicable.
- Positive native Bun is pending. Quota observer exec session96624 waits until
  2026-10-03T17:17:40.701Z, confirmed live. Poll the same handle; do not duplicate
  builds or change identities. Developer tab13 currently completed worker.
- At that time submit examples/stacks/bun using the existing Google developer
  account and public fixture revision00df7c0, once. No need to rebuild QA fixtures.
  Stop the current Google worker through its PODS controls before launching Bun.
  Browser acceptance: button enables after WebSocket opens, increment, reload,
  full stop/relaunch retains counter, new increment. Measure actual enabled
  interaction continuously, not the identical launcher heading.
- Run Codespaces with PODS_WEBSOCKET_CHECK=1 and the new prepared app ID; native
  browser authentication remains separate. Current QA/probe sessions71335/7982
  completed (negative intentionally exit1, cleanup confirmed).

## Next gates and pending user actions

1. Continue remaining representative native framework/provider coverage; a
   native Bun/WebSocket product would cover another application type. Check the
   existing connected account's normal preparation window first. Do not switch
   identities or bypass quotas. The old quota observer 98803 finished successfully.
2. GitHub preview tab10 requires two-factor authentication after existing-account
   Google sign-in. No SMS was sent or code entered. User step already requested;
   do not repeat the question or make the private preview public.
3. GitHub web OAuth is not configured (oauthReady=false), Google=true. Token/CLI
   launches do not satisfy browser authorization acceptance.
4. Cloud Shell tab14 has a pending Restart confirmation (home retained, processes
   terminated/new VM). No approval yet; do not click final Restart/reset home.
   A separate background Authorize Cloud Shell modal was visible. User request pending.
5. Preserve separate preparation, uncached/cached health and native interaction
   timings. Cold images exceed 20s; no universal cold/new-VM guarantee.

## Runtime and browser handoff

Origin: https://collection-conferences-ages-clearly.trycloudflare.com
Server localhost8787, PID708830, exec session83087. Use scripts/serve.sh if a
restart is necessary; it adds /home/aswin/pods-tools/bin to PATH. Ordinary SSH
needs that PATH for node/npm/gh. Never print .env, tokens or OAuth codes.
No active build/QA/probe job; session80247 finished successfully. Build-window
observer session96624 is live until 2026-10-03T17:17:40.701Z. It does not submit a job.

Current Google worker launch: NnAO3SfXlvZx_PL8G9cQMJUe9tkieXmi, ready with
GOOGLE WORKER TWO, expires 2026-10-03T17:32:54.669Z. Previous worker launch
fnXEedamp3h-TZcODSyPg-v1ee3tfn3v is stopped. Gin2, Blazor3, Angular2,
Laravel1 and Quarkus2 remain stored but those apps are stopped.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 has no test app running.
Both worker launches 2QYXoiHsl7RDemnQU5tYy6VOfvEwUBOw and
uGe7hTV_P6gTx1bceZOFs83SRjQFrl_2 are stopped. Latest saved job NATIVE WORKER 2;
first job retained. Gin saved4, Blazor2, Angular2, PostgreSQL3 also retained.

CUA bindings: stackQa6 (IAB2 tab13, developer page, completed worker);
nativeGithubKeep (IAB2 tab10, 2FA handoff); cloudLifecycle (IAB2 tab14,
pending restart handoff); independentUser (Chrome1 tab2083874416, native worker
product, marked deliverable). workerLaunchUrl holds current launch link.
After compaction call cua.rewriteDocumentation before using browsers. Re-mark
handoff/deliverable tabs each turn. Browser wait timeouts do not cancel real jobs.

SQLite /home/aswin/pods-launch-fresh/.data/pods.sqlite: readonly mode, whitelist
public fields; never dump owner/account/token/session/connection records.
LXD binary /snap/lxd/current/bin/lxc. QA pods-fresh-matrix-01, sources /opt/pods,
fixtures /work/stacks, prepared results /output/<fixture>. Node /opt/node/bin/node,
uid/gid1000, PODS_ISOLATED_BUILD=1. Root50GiB/pool60GiB; no host Docker.
No broad fixture rebuild is needed unless a relevant source change justifies it.
Code graph project Users-rizwanahamed-Documents-ChatGPT-podsv2; use graph-first
code discovery, targeted fallback when graph lacks scripts/examples.
