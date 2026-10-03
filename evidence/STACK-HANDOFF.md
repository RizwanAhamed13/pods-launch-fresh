# Broad stack checkpoint

Goal status: active. The 54-fixture server/browser QA matrix passes; remaining
provider and authorization gates prevent a complete one-click compatibility claim.

Core: https://github.com/RizwanAhamed13/pods-launch-fresh
Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh
Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2
Aswin: /home/aswin/pods-launch-fresh and /home/aswin/pods-launch-runtime-fresh
Public fixture commit: 00df7c0. Latest product fix: 4c1b887, pushed and deployed.

## Current evidence

- 54 distinct genuine framework/application fixtures pass isolated server builds,
  reusable artifact launches and browser interaction. See SUPPORT.md and
  stack-coverage.json; historical failures remain recorded.
- 52 automated checks pass locally and on aswin. The latest aswin rerun is recorded in
  browser-reconnect-unit-tests-aswin.txt. Source LOC 4201: 2365 product/tooling, 156 browser
  tools, 812 tests, 868 example sources. code-lines.json defines the count.
- Expired submission authorization reconnects and resumes the exact build or
  launch on the first click. One automatic recovery attempt survives OAuth
  navigation; repeated failures stop without a loop or duplicate work. Cancelled
  authorization preserves and expands the developer folder, including with no
  history. Google build and GitHub launch browser regressions, real local notes
  save/stop/relaunch persistence, cancellation and non-401 validation all pass.
  These regressions use simulated OAuth/providers/preparation and are explicitly
  not new native-provider evidence. See browser-reconnect.json. Public app.js
  bytes match the committed source and /health passes. OAuth availability remains
  Google=true, GitHub=false. No live connection was forcibly expired.
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

- npm container recipes now keep download caches temporary in the build layer.
  All eight affected fixtures passed real rebuild/start/restart/browser checks
  (matrix/browser24). Image probes confirm caches absent and dependencies
  present. gzip reductions: Angular40.4%, Next35.9%, Nuxt48.3%, SvelteKit28.6%,
  Astro36.7%, ReactRouter34.6%, Adonis3.3%, Nest2.4%. New optimized Angular
  native provider results are recorded below; other seven recipe fixtures have
  no new native timing claim. 52 automated checks passed locally and on aswin
  (stack-npm-cache-unit-tests*.txt). Batch23
  retained the initial missing-isolation-marker QA invocation failure.

- New real Angular submission (same source folder across fixture revisions)
  prepared in 155.221 seconds. Developer Google session had expired; at that time,
  pressing prepare again reconnected the already-authorized account and resumed
  the saved draft. The extra-click defect is now fixed and covered by the browser
  regression above. No new permission prompt or terminal work.
- Optimized Angular on Cloud Shell: uncached image 61.933 seconds to health,
  cached 5.867 seconds to health and 8.312 seconds to native saved product.
  Old artifact's value 1 retained; new write 2/reload2/full stop/relaunch2.
  First browser observation timed out at 48 seconds while launch continued;
  later 75.069 seconds is only an upper bound including tool gaps.
- Optimized Angular on Codespaces: resumed/uncached 94.454 seconds, cached
  7.179 seconds. HTTP counter 0→1, confirmed stop, fresh launch retained1,
  second write/read2. Native browser/OAuth still pending. Evidence:
  stack-angular-ssr-optimized-{url,google,codespaces}.json.

## Pending actions

1. Continue representative native provider coverage; the Laravel gate is complete
   for Google browser and Codespaces authenticated HTTP. No quota bypass needed.
2. Cloud Shell VM replacement: a confirmation question is pending. The actual
   Restart dialog preserves home but terminates all processes and provisions a
   new VM. Do not click final Restart before the user approves. Current native
   optimized Angular SQLite baseline is 2; prior Laravel1 and Quarkus2 remain stored. Do not delete/reset the home directory.
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
Each isolated build receives src/scripts from the current deployed checkout;
the new recipe was used by the real developer preparation without a server restart.

Optimized Angular app ID: repo-ce3c167a84b230196d7bf924-00df7c09ea97-4da6dd64ea03
Google launch alDHTjLLANfC-WVOlYHiYge3AQOQ8iX8 belongs to independent Chrome, value2.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 currently serves Angular, value2.
These previews stop at their 30-minute deadlines; no pending matrix build job.
The local expired-session browser fixture and its products were stopped after
validation. Its temporary tab17 is closed; no test fixture process remains.

CUA in-app browser 2: developerWide tab12 launch controls; stackQa6 tab13 completed optimized Angular
preparation; cloudLifecycle tab14 pending Restart confirmation; nativeGithubKeep
tab10 existing sign-in handoff. Chrome browser 1: independentUser tab2083874416
is the verified native Google product. The cache-regression QA tab16 was closed after all eight browser checks. Reapply handoff/deliverable marks each turn.

QA guest pods-fresh-matrix-01: /opt/pods, /work/stacks, /output; use
/snap/lxd/current/bin/lxc and /opt/node/bin/node with uid/gid 1000. Pool 60 GiB,
QA root 50 GiB, production builder root remains 12 GiB. Do not prune unrelated
work. Browser QA proxy is localhost:18890 via the existing SSH tunnel. No need to
repeat the completed 54-fixture matrix without a relevant source change.
