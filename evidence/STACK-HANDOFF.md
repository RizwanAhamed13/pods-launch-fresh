# Broad stack checkpoint

Goal active. Do not claim universal support or complete provider/browser acceptance.

## Source and coverage

- Core private https://github.com/RizwanAhamed13/pods-launch-fresh; public fixtures
  https://github.com/RizwanAhamed13/pods-launch-runtime-fresh at 00df7c0.
- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin /home/aswin/pods-launch-fresh.
- 54 distinct real fixtures pass isolated build, artifact run and meaningful browser
  interaction. SUPPORT.md and stack-coverage.json retain exact evidence and failures.
- 4565 physical source lines: 2608 product/tooling, 925 tests, 868 examples,
  164 browser tools. Exclusions in code-lines.json.
- 58 automated checks pass locally and on aswin after image timing change3b8fd11.
- Native Google browser families: Flask/PostgreSQL, React/Express/PostgreSQL,
  Angular SSR/SQLite, Quarkus/SQLite, Laravel/SQLite, Blazor/SQLite, Gin/file,
  Flask/Python worker/Redis, Bun WebSocket/SQLite, Rails/SQLite, Nuxt, Django/SQLite: twelve.
- Same twelve families have Codespaces authenticated SSH HTTP/protocol checks;
  native Codespaces browser authorization and interaction remain pending.

## Latest completed gate: image phase diagnostics

- Runtime change3b8fd11 preserves delivery integrity and adds imageCacheCheckMs,
  imageDownloadMs, imageLoadMs, imageArchiveCacheHits; total imagesMs retained.
  Failure timings are preserved; server accepts bounded whitelisted numeric values.
- 58 tests pass locally/aswin. Real deployed Django Google cached browser retained2,
  displayed it7.870s, wrote3 at8.140s and reloaded3. Health7.128s, cache check66ms.
- Codespaces cached health6.881/6.386s, retained2→3 then3→4 across full stop/relaunch.
  Authenticated HTTP only; native browser pending. All three launches stopped.
- Native cache hits correctly show zero transfer/load. First-image phase breakdown
  still pending next normally admitted build. No quota/cache manipulation.
- Existing isolated Python image inspected read-only/no-network, no compiler or
  pip download cache found. No recipe optimization made. Inspect exec26339 ended0.
- Evidence image-phases.json and image-phases-codespaces.json. Native harness13102
  and record readers56200/5550 completed0. No test runners left active.
- Updated control server PID774112, exec75146. Public health and runner hash
  9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b verified.
- No new build this turn. Same-account next ordinary slot remains18:58:14UTC
  (then19:20:19/19:33:57 absent other builds). No quota observer running.

## Previous completed gate: Django and SQLite

- Real developer URL preparation109.340s; source fixture examples/stacks/django at
  unchanged public00df7c0. BuildKbEietsWkyvU_03zGLLIt0dvrqQvOpvb, app
  repo-2f3eccf055bfd890686f5122-00df7c09ea97-63c8734bb2d2, image58765738bytes.
- Ordinary account slot opened18:33:45UTC; submission18:33:57UTC. No quota or
  identity manipulation. Observer22726 and Codespaces harness53742 completed0.
- Google first image absent: health21.853s, DB0 visible23.694s, write1 at23.974s;
  reload1. Cached: health6.461s, retained1 visible7.788s, write2 at8.067s; reload2.
  Both browser timings measured continuously with bounded locator retries.
- Codespaces existing running VM first image absent25.116s/write0→1; cached6.903s,
  retained1→2. Actual authenticated HTTP/SQLite full restart passed. Browser
  authorization still pending. All four launches confirmed stopped, data retained.
- Evidence stack-django-{url,google,codespaces}.json and coverage index updated.
  No runtime/source changes; the previously passing56tests remain valid, not rerun.
- Next ordinary same-account slot18:58:14UTC absent other builds. Quota observers
  must match build.account, not browser owner, because limits bind provider identity.
  Remaining native fixtures42. First-image delivery still misses20s for Django;
 14.059s Google and14.207s Codespaces spent receiving/loading the56MiB image;
  those earlier combined timings do not distinguish transfer from Docker load.

## Previous completed gate: Nuxt and session recovery

- Actual developer form prepared examples/stacks/nuxt in 241.125s after normal
  quota availability. Build LyS0ndmZTHrMBdMDra0Ms28ZOHNdJu08. App:
  repo-17942c0277f8155e2cc154ce-00df7c09ea97-5a5b1d9df9e5.
- Prepared image132785944bytes (126.6MiB), real Nuxt SSR and client entry.
- Google first image absent: health64.995s; images55.911s. Page observed by65.516s,
  first SSR-visible click ignored before hydration. Later click0→1 observed by94.010s
  (upper bounds with tool gaps). Reload0 by design: transient client state, no DB claim.
- Google cached: health6.865s; product0 visible7.642s; click0→1 at7.936s measured
  continuously. Reload0. Both runs confirmed stopped.
- Codespaces first/resumed/image absent100.893s; cached6.801s. Both SSR0 and
  /_nuxt/Xrz7lXV0.js (47938bytes, JavaScript) HTTP checks passed. Both stopped.
  This does not prove native Codespaces browser hydration.
- Evidence stack-nuxt-{url,google,codespaces,build-window,session-rejection}.json.
  Observers79266 and9961 finished0. No duplicate jobs or quota changes.
- Initial developer submission failed stale CSRF before creating a build. Manual
  refresh showed disconnected accounts/empty form; ordinary same-account OAuth
  resumed once refilled. Underlying reason for session change remains unknown.
- Fix c24dc4a emits SESSION_CHANGED only for rejected CSRF and forces one provider
  reauthorization while preserving exact app/repository/folder. Other403s retain
  normal rejection. No mutation is replayed without authorization.
- Local browser fixture verified preparation403→202, repeated403→403 with one
  recovery/no build, and GitHub launch403→202 into actual notes save/reload.
  OAuth/providers/build were simulated; artifact/runner/storage real local.
  Evidence browser-session-recovery.json. Fixture19889 stopped via cleanup;
  sessionQa IABtab21 can close. Tests enforce CSRF no work and distinct origin403.
- scripts/probe-ssr.mjs negative controls remain valid from e269f9e; no source change.

## Recent retained evidence

Ruby recipe3544609 separates build/runtime native gems/shared libraries, excludes
compiler/git/cache. Rails image251119273→93313156bytes (62.8%); Sinatra
216259334→72508238 (66.5%). Real isolated build, SQLite restart and browser checks
passed. Evidence stack-matrix-25.json, stack-browser-25.json and stack-ruby-*.

Optimized real Rails URL preparation390.875s, image93312249bytes. Google first
health32.105s/write34.230s; cachedhealth9.345s/write10.966s; reload/full restart
SQLite passed. Codespaces59.936s/9.112s, previous-image count2 retained→3→4.
All stopped; evidence stack-rails-optimized-{url,google,codespaces}.json.
Sinatra native provider evidence still pending.

Bun real URL preparation106.981s. Google initial port conflict retained; conflicting
worker expired naturally, never manually interrupted. Successful uncached image
health20.170s (manifest cached), cachedhealth5.678s/native write9.430s. WebSocket
SQLite/reload/full restart passed. Codespaces24.716s/7.138s with ping/pong,
message updates/reconnect/SQLite restart. All stopped; stack-bun-* evidence.

Account-lock46a907c prevents concurrent dispatch across sessions sharing a provider
identity; private computeKey never exposed. Runner all-service liveness004c64b
revokes readiness on worker/database failure even with healthy web HTTP.
Runner SHA75cfd87f58a02353b48a080ee480b9b5ac246e2e189474f57e318fa11fdc0a0f.

## Next gates and pending user actions

1. Continue a remaining native family through normal real developer URL submission,
   preparation, both providers and meaningful product interaction. All isolated
   fixtures already passed; do not repeat them without a changed recipe/concern.
   Never bypass quota, switch identities to evade it or import QA artifacts into
   production. Build limits bind provider identity independently of browser session.
2. GitHub IABtab10 /sessions/two-factor/sms/confirm: user action already requested,
   no SMS/code sent. GitHub browser OAuth remains unconfigured. Keep preview private.
3. Cloud Shell IABtab14 pending Restart confirmation: processes stop, VM replaced,
   home remains. No approval; do not click Restart/reset or accept background
   Authorize modal. Codespaces full rebuild retained PostgreSQL; Cloud Shell VM
   replacement remains unverified.
4. Native support for every remaining framework and durable deployment still pending.
   Cold image transfers frequently exceed20s. Cached samples are not a guarantee.
   Nuxt demonstrates SSR visibility can precede interactivity; retain this distinction.

## Operational state

Origin https://collection-conferences-ages-clearly.trycloudflare.com.
Control server PID774112, persistent exec75146; PID file matches verified cwd.
Deployment3b8fd11 passed public health, runner hash and native cached persistence
checks. The earlier structured CSRF checks remain in browser-session-recovery.json.
Always verify PID file, cwd, cmdline
and listener before targeted restart. Use scripts/serve.sh from the repository;
Node/gh in /home/aswin/pods-tools/bin. Do not restart with active builds/launches.

No live PODS apps after image-phase checks; data retained. Codespace
pods-launch-containers-69rw5vx4xp46c5qw5. Google Django3/Rails2/Bun2; Codespaces Django4/Rails4/Bun2.

CUA bindings: stackQa6 IAB2tab13 Django build result; accountWorker IAB2tab12 stopped
Django launcher; independentUser Chrome1tab2083874416 prior failed Bun/expired
connection; nativeGithubKeep IAB2tab10; cloudLifecycle IAB2tab14.
After compaction call rewriteDocumentation; re-mark pending tabs. Locator timeouts
do not cancel launches: never resubmit because an observation timed out.

QA LXD pods-fresh-matrix-01, /opt/pods source, /work/stacks fixtures,/output results,
/opt/node/bin/node uid/gid1000,PODS_ISOLATED_BUILD=1. Browser QA PID125572 listens
8081; prior SIGTERM stopped only its runner. SSH tunnel localhost18890 remains.
All QA apps stopped/port8080 free at prior checkpoint; no new QA apps this turn.
SQLite reads must use readonly mode and whitelist public fields. Never dump
credentials or owner/identity/session values. Code graph project
Users-rizwanahamed-Documents-ChatGPT-podsv2; targeted fallback for absent scripts.
