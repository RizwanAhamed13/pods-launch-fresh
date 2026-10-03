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
  stack-unit-tests-aswin.txt. Source LOC 4149: 2347 product/tooling, 132 browser
  tools, 802 tests, 868 example sources. code-lines.json defines the count.
- React/Express/PostgreSQL, Angular SSR/SQLite, Flask/PostgreSQL,
  Quarkus/SQLite and Laravel/SQLite have native Google browser/product evidence. These results do
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

- Laravel real developer URL preparation passed in 270.053 seconds after the
  existing quota window opened. Cloud Shell uncached 80.740 seconds, cached
  health 5.571 seconds and native saved product 8.187 seconds. Browser write
  0→1/reload 1/full stop and relaunch 1 passed. Codespaces resumed/uncached
  110.093 seconds, cached 6.777 seconds; authenticated HTTP write 0→1, confirmed
  stop and fresh launch retained 1, then write/read 1→2. Native GitHub browser
  still pending. Evidence: stack-laravel-{url,google,codespaces}.json.
- Strengthened scripts/live-codespaces.mjs: stop confirmation and fresh-launch-ID
  gates, optional PODS_COUNTER_CHECK=1 for fixture write/read/relaunch durability.
  Verified against the real Laravel Codespace. No product runtime source changes
  in this checkpoint; the prior 52-check product suite remains applicable.

## Pending actions

1. Continue representative native provider coverage; the Laravel gate is complete
   for Google browser and Codespaces authenticated HTTP. No quota bypass needed.
2. Cloud Shell VM replacement: a confirmation question is pending. The actual
   Restart dialog preserves home but terminates all processes and provisions a
   new VM. Do not click final Restart before the user approves. Current native
   Laravel SQLite baseline is 1; previous Quarkus value 2 remains stored. Do not delete/reset the home directory.
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

Laravel app ID: repo-8781a389be8b5e500f4239b9-00df7c09ea97-a063e2512975
Google current launch belongs to the independent Chrome session, SQLite value 1.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 currently serves Laravel, value 2.
These previews stop at their 30-minute deadlines; no pending matrix build job.

CUA in-app browser 2: developerWide tab12 launch controls; stackQa6 tab13 completed Laravel
preparation; cloudLifecycle tab14 pending Restart confirmation; nativeGithubKeep
tab10 existing sign-in handoff. Chrome browser 1: independentUser tab2083874416
is the verified native Google product. The duplicate Chrome GitHub sign-in tab and
local regression browser were closed. Reapply handoff/deliverable marks each turn.

QA guest pods-fresh-matrix-01: /opt/pods, /work/stacks, /output; use
/snap/lxd/current/bin/lxc and /opt/node/bin/node with uid/gid 1000. Pool 60 GiB,
QA root 50 GiB, production builder root remains 12 GiB. Do not prune unrelated
work. Browser QA proxy is localhost:18890 via the existing SSH tunnel. No need to
repeat the completed 54-fixture matrix without a relevant source change.
