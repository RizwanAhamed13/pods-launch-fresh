# Broad stack checkpoint

Goal status: active. The 54-fixture server/browser QA matrix passes; remaining
provider and authorization gates prevent a complete one-click compatibility claim.

Core: https://github.com/RizwanAhamed13/pods-launch-fresh
Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh
Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2
Aswin: /home/aswin/pods-launch-fresh and /home/aswin/pods-launch-runtime-fresh
Public fixture commit: 00df7c0. Latest product fix: bb35fc0, pushed and deployed.

## Current evidence

- 54 distinct genuine framework/application fixtures pass isolated server builds,
  reusable artifact launches and browser interaction. See SUPPORT.md and
  stack-coverage.json; historical failures remain recorded.
- 52 automated checks pass locally and on aswin. The current aswin rerun is recorded in
  stack-unit-tests-aswin.txt. Source LOC 4116: 2314 product/tooling, 132 browser
  tools, 802 tests, 868 example sources. code-lines.json defines the count.
- React/Express/PostgreSQL, Angular SSR/SQLite, Flask/PostgreSQL and now
  Quarkus/SQLite have native Google browser/product evidence. These results do
  not automatically cover the other frameworks or arbitrary applications.
- Quarkus real developer URL preparation: 222.751 seconds. Native Google first
  launch: 46.008 seconds to ready. Cached: 8.442 seconds to ready and 9.923 seconds
  from click until the native product displayed its saved SQLite record.
  Write 0→1, reload 1, full stop/relaunch 1 all passed.
- Independent Chrome/PODS session: initially disconnected and without history;
  selected the already-authorized Google identity and automatically reached the
  Quarkus product without terminal/token/manual installation. Write 1→2 and
  reload 2 passed. Two distinct PODS session owners were confirmed. This is a
  separate browser using the same Google account, not a second Google account.
- Quarkus Codespaces: 72.764 seconds uncached, 8.207 cached to ready. Authenticated
  SSH HTTP checked the real product and SQLite write 0→1/read 1. Native browser
  still reaches GitHub sign-in. Post-write Codespaces restart was not tested for
  this fixture. Earlier Flask/PostgreSQL full Codespaces rebuild durability passed.
- Fixed developer form hydration race: workspace stays inert until account and
  history restoration finish. Delayed-history (15 seconds), simulated OAuth
  continuation and distinct new repository/folder submission passed in the real
  browser UI. Browser fixture is now self-contained. See browser-initialization.json.

## Pending actions

1. Laravel real developer submission reached the existing hourly preparation
   limit. Keep the rate limit; retry when its window resets. The Laravel QA
   fixture already passes. See stack-laravel-url-pending.json.
2. Cloud Shell VM replacement: a confirmation question is pending. The actual
   Restart dialog preserves home but terminates all processes and provisions a
   new VM. Do not click final Restart before the user approves. Current native
   Quarkus SQLite baseline is 2. Do not delete/reset the home directory.
3. GitHub browser OAuth is not configured (public API oauthReady=false). Its
   access-token/API test path does not satisfy the one-click browser authorization
   goal. Native GitHub sign-in is also pending; do not repeat that earlier question
   or make the private preview public. Google oauthReady=true.
4. Continue representative native provider coverage. Cold downloads exceed the
   20-second target; retain separate cached, uncached, health and visible timings.

## Runtime and browser handoff

Origin: https://collection-conferences-ages-clearly.trycloudflare.com
Server port 8787, last verified PID 445141. Use scripts/serve.sh for restart so
/home/aswin/pods-tools/bin is in PATH. Ordinary non-login SSH lacks node/npm/gh;
set PATH explicitly for checks. Never print .env, tokens or authorization codes.
Public frontend files are read per request, so this client fix required no restart.

Quarkus app ID: repo-8a0fc5a97608c34acbbc9951-00df7c09ea97-e90b6e712c0c
Google current launch belongs to the independent Chrome session, SQLite value 2.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 currently serves Quarkus, value 1.
These previews stop at their 30-minute deadlines; no pending matrix build job.

CUA in-app browser 2: developerWide tab12 launch controls; stackQa6 tab13 Laravel
rate-limit form; cloudLifecycle tab14 pending Restart confirmation; nativeGithubKeep
tab10 existing sign-in handoff. Chrome browser 1: independentUser tab2083874416
is the verified native Google product. The duplicate Chrome GitHub sign-in tab and
local regression browser were closed. Reapply handoff/deliverable marks each turn.

QA guest pods-fresh-matrix-01: /opt/pods, /work/stacks, /output; use
/snap/lxd/current/bin/lxc and /opt/node/bin/node with uid/gid 1000. Pool 60 GiB,
QA root 50 GiB, production builder root remains 12 GiB. Do not prune unrelated
work. Browser QA proxy is localhost:18890 via the existing SSH tunnel. No need to
repeat the completed 54-fixture matrix without a relevant source change.
