# Broad stack checkpoint

Goal status: active. The 54-fixture server/browser QA matrix passes; remaining
provider and authorization gates prevent a complete one-click compatibility claim.

Core: https://github.com/RizwanAhamed13/pods-launch-fresh
Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh
Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2
Aswin: /home/aswin/pods-launch-fresh and /home/aswin/pods-launch-runtime-fresh
Public fixture commit: 00df7c0. Latest product fix: 414e64a, pushed and deployed.

## Current evidence

- 54 distinct genuine framework/application fixtures pass isolated server builds,
  reusable artifact launches and browser interaction. See SUPPORT.md and
  stack-coverage.json; historical failures remain recorded.
- 52 automated checks pass locally and on aswin. The latest aswin rerun is recorded in
  stack-blazor-unit-tests-aswin.txt. Source LOC 4209: 2372 product/tooling, 157 browser
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
  Quarkus/SQLite, Laravel/SQLite, Blazor/SQLite and Go Gin (persistent file) have native Google browser/product evidence. These results do
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

- Blazor real developer form prepared .NET/SQLite in 186.353 seconds (102.6 MiB).
  Cloud Shell uncached health 31.573s; cached health 6.523s / saved page 7.844s.
  SQLite 0→1 / reload 1 / stop-relaunch 1 passed. A subsequent immediate click after SSR
  visibility was ignored before the interactive connection; later connected
  write 2 / reload 2 passed. The final cached launch retained 2 and wrote 3 within
  14.714s of launch, including a tool gap after an unsupported networkidle wait;
  this is an upper bound. Reload retained 3. Retain the early-input failure.
- Blazor Codespaces started from Shutdown: resumed/uncached 57.435s, cached 7.068s;
  authenticated HTTP write 0→1, confirmed stop/fresh launch retained 1, write/read 2.
  This does not verify browser interaction or OAuth. See stack-blazor-{url,google,
  codespaces}.json. No source fixture changes or quota bypass were required.
- Product fix 414e64a decodes HTML title entities as plain text. Browser regression
  checks encoded punctuation, emoji and literal markup; no elements are injected.
  The real Blazor preparation/launch title now reads Blazor + SQLite. 52 checks
  pass locally and on aswin (stack-blazor-unit-tests*.txt).

- Go Gin was submitted through the real developer form and prepared in 287.355s.
  Existing Dockerfile compiles a Go executable; the runtime download is 11.1 MiB.
  On existing Google compute with the image absent: health 9.822s, visible 12.454s,
  successful native button write 12.764s. Cached: health 6.256s, saved page 8.858s,
  successful write 9.174s. Both browser timings are continuous measurements.
  Counter 0→1, reload 1, confirmed stop/relaunch 1, write 2/reload 2 all passed.
  This fixture uses a persistent file, not a database. See stack-gin-{url,google}.json.
- Gin Codespaces: initial attempt failed before image loading because the earlier
  Blazor preview occupied port 8080. Verified its exact image and sole PODS runner,
  sent SIGTERM to that runner, and confirmed PODS status stopped. No data removed.
  Retry on the same available compute: image absent health 10.828s, cached 7.393s.
  The small manifest was already cached by the failed attempt; imageCacheHits=0
  on the retry. HTTP write 0→1 / read 1, confirmed stop/relaunch retained 1, write/read 2
  passed. Final Gin app stopped normally too. Preserve stack-gin-codespaces-conflict
  and -before evidence alongside stack-gin-codespaces.json. Native browser pending.
- No runtime code changes in this checkpoint; the preceding 52-check suite remains
  applicable. Native launches exercised the already deployed product.

## Pending actions

1. Continue representative native provider coverage; Gin now passes Google
   browser and Codespaces authenticated HTTP with file stop/relaunch persistence.
2. Cloud Shell VM replacement: a confirmation question is pending. The actual
   Restart dialog preserves home but terminates all processes and provisions a
   new VM. Do not click final Restart before the user approves. Current native
   Gin file-counter baseline is 2; prior Blazor SQLite 3, Angular 2, Laravel 1 and Quarkus 2 remain stored. Do not delete/reset the home directory.
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

Gin app ID: repo-32bb2b65f70a84def50a6fc2-00df7c09ea97-33bf34b1ce7d
Google launch 0HcsEZZLHbcWCRkSiLYJJOGYGxXGKRYw belongs to independent Chrome, value 2.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 has no running Gin/Blazor app
after confirmed cleanup. Gin launch 28wEQ8YjGrOatLBek9P_5wwJ5Y-hjcu8 is stopped,
with stored value 2. Its prior Blazor launch is also stopped, stored value 2.
These previews stop at their 30-minute deadlines; no pending matrix build job.
The local expired-session browser fixture and its products were stopped after
validation. Its temporary tab17 is closed; no test fixture process remains. The title browser
fixture was also stopped and its tab18 closed after passing encoded/literal text checks.

CUA in-app browser 2: developerWide tab12 launch controls; stackQa6 tab13 completed Gin
preparation; cloudLifecycle tab14 pending Restart confirmation; nativeGithubKeep
tab10 existing sign-in handoff. Chrome browser 1: independentUser tab2083874416
is the verified native Google product. The cache-regression QA tab16 was closed after all eight browser checks. Reapply handoff/deliverable marks each turn.

QA guest pods-fresh-matrix-01: /opt/pods, /work/stacks, /output; use
/snap/lxd/current/bin/lxc and /opt/node/bin/node with uid/gid 1000. Pool 60 GiB,
QA root 50 GiB, production builder root remains 12 GiB. Do not prune unrelated
work. Browser QA proxy is localhost:18890 via the existing SSH tunnel. No need to
repeat the completed 54-fixture matrix without a relevant source change.
