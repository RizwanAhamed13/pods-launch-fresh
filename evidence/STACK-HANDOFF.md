# Broad stack checkpoint

Goal active: do not claim universal support or complete provider acceptance.

## Source and coverage

- Core private https://github.com/RizwanAhamed13/pods-launch-fresh; fixtures public
  https://github.com/RizwanAhamed13/pods-launch-runtime-fresh at 00df7c0.
- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin /home/aswin/pods-launch-fresh.
- 54 distinct real fixtures pass isolated build, artifact run and meaningful browser
  interaction. SUPPORT.md and stack-coverage.json list exact evidence and failures.
- 4500 physical source lines: 2592 product/tooling, 883 tests, 868 examples,
  157 browser tools. Exclusions in code-lines.json.
- 56 automated checks pass locally and on aswin after Ruby change.
- Native Google browser families: Flask/PostgreSQL, React/Express/PostgreSQL,
  Angular SSR/SQLite, Quarkus/SQLite, Laravel/SQLite, Blazor/SQLite, Gin/file,
  Flask/Python worker/Redis, Bun WebSocket/SQLite, Rails/SQLite: ten families.
- Codespaces authenticated SSH HTTP/protocol additionally covers Rails/SQLite:
  ten families. Native browser authorization remains separate and pending.

## Current Nuxt gate

- Previous goal turn made progress: optimized Rails and Bun native acceptance.
- New `scripts/probe-ssr.mjs` checks the Nuxt fixture's real server-rendered heading
  and initial counter, then fetches each same-origin Nuxt JavaScript entry.
  `PODS_SSR_CHECK=1` integrates it into both Codespaces launches. It does not
  claim browser hydration or database durability; Nuxt counter resets on reload.
- Passed on existing real Nuxt artifact in isolated QA. Five negative HTTP cases
  and three harness guards passed. Evidence stack-nuxt-ssr-probe-qa.json and
  stack-ssr-probe-controls.json include the probe source hash. QA app stopped,
  port8080 free; temporary Nuxt tab20 closed. No framework rebuild was needed.
- Normal developer quota is still full as of18:09UTC. Read-only live observer
  exec32847 is waiting for the ordinary slot after18:18:13UTC. Poll this SAME
  handle no more than once per minute; do not duplicate it. Script
  /tmp/pods-wait-nuxt-window.py, output /tmp/pods-nuxt-build-window.json. It uses
  readonly SQLite and only reports availability/count; no quota change or submission.
- IABtab13 `stackQa6` now has folder examples/stacks/nuxt, correct public repo URL,
  Google selected/connected. Existing Rails result remains on screen until a
  NEW submission. Nuxt has NOT been submitted yet. After allowance becomes
  available, click Prepare another version once and observe the actual build.
- Then use PODS_SSR_CHECK=1 for Codespaces HTTP/asset/restart checks and native
  Cloud Shell Add one interaction0→1/reload0, confirmed stop/relaunch, interaction
  again. Measure launch-to-interaction continuously; HTML visibility is insufficient.

## Latest completed gates

Ruby recipe now uses separate build/runtime stages, keeping installed native gems
and required PostgreSQL/SQLite/C++ shared libraries while omitting compilers, git
and gem download caches. Both real builds, SQLite restart and browser write/reload
pass. Rails retained the older image count2, matrix wrote3, browser wrote4.
Sinatra matrix0→1/restart1, browser1→2/reload2. Isolated QA containers stopped;
port8080 free, data retained. Evidence stack-matrix-25.json, stack-browser-25.json,
stack-ruby-{before,runtime-audit,image-comparison}.json. Rails compressed image
251119273→93313156 bytes (62.8%); Sinatra216259334→72508238 (66.5%).

Real developer Rails preparation took280.507s, build2g5Mpxvv0g74VnnP_kZjmhslrE50GqJf.
App repo-7acf8b761b239213c2c6cd7c-00df7c09ea97-b935554e124a. Codespaces launches
d0_8_8R7U71xyySR04GoGbVA3TnixCkd and BRqAPCVye8tu4wiVk-Y_37KnV7CexT0h passed
HTTP/SQLite0→1, restart1→2; both stopped. Health104.115s resumed/image absent,
8.193s cached. THIS uses old239.5MiB image, not optimized recipe.
See stack-rails-{url,codespaces}.json.

Optimized real URL preparation completed390.875s, buildd0WxpqT60m-fN8HLVg2YF7NacQlN_Nzt.
New app repo-7acf8b761b239213c2c6cd7c-00df7c09ea97-2a2459426f5c, image93312249bytes.
Google sIZFuKrIFCkPbBDcUZffqG-bC9yoKcbM first image absent health32.105s,
record0 visible33.931s, browserwrite1 completed34.230s, reload1. Cached
nW-hfqPsstwrm36E9UXfcsEFiGjU4POv health9.345s, retained1 visible10.687s,
write2 completed10.966s, reload2. Continuous browser measurements include bounded
locator retries. Both confirmed stopped.
Codespaces s4y_u8Kfg1YRwqMiEKhdVkhM28F7kQiW health59.936s resumed/image absent,
image load23.563s; OLD VERSION count2 retained→3. Repeat
cHjB-xBXODQVLl9_3NFD1GUnShO0wFek health9.112s cached, retained3→4. Both HTTP/SQLite
checks pass and confirmed stopped. Native Codespaces browser remains pending.
Evidence stack-rails-optimized-{url,google,codespaces}.json. Observer29930 and
Codespaces harness6042 both finished0. Do not rerun these passing checks.

Bun native Cloud Shell now passes after conflicting worker expired naturally
17:49:05UTC. No manual interruption or inferred permission. First failed port
attempt preserved. Successful6swZtjuz9-nhjtam74HqnhasqHyu7joT health20.170s,
image absent but manifest cached; native WebSocket0→1/reload1. Repeat
zW5KWDhsAP7D8FpKtliNxAfrYyvnxlkv health5.678s, saved1 visible9.125s, WebSocket
write2 completed9.430s continuously from launch (one locator timeout included).
Reload2, both confirmed stopped. First interaction31.359s is an upper bound
including unrelated tool calls. Evidence stack-bun-google.json. Codespaces Bun
24.716s image absent/7.138s cached, protocol/reconnect/SQLite restart passed.

Account locking fix46a907c prevents separate sessions on the same provider account
from dispatching concurrent launches. Private computeKey is not in API responses;
locks survive disconnect/restart; legacy identity migration passed live.
Runner all-service liveness fix004c64b still deployed; runner SHA unchanged
75cfd87f58a02353b48a080ee480b9b5ac246e2e189474f57e318fa11fdc0a0f.

## Next and pending user actions

1. Ruby source/evidence commit3544609 pushed and deployed;56checks pass on aswin.
   Optimized Rails acceptance completed and is included with this checkpoint. LXD builds copy current
   src/scripts; recipe-only changes require no control-plane restart. Next normal
   developer quota slots18:18:13,18:33:45,18:58:14UTC absent other builds. Continue
   a remaining native framework (e.g. Nuxt) after the ordinary slot, through real
   developer URL, on both providers with meaningful browser interaction. Never
   bypass quota, switch identities to evade it or import QA artifacts to production.
2. GitHub IABtab10 /sessions/two-factor/sms/confirm: user action already requested,
   no SMS/code sent. GitHub web OAuth remains unconfigured. Keep preview private.
3. Cloud Shell IABtab14 pending Restart confirmation: processes stop and VM
   replaced/home remains. No approval; do not click Restart/reset or accept
   background Authorize modal. Full Codespaces rebuild retained PostgreSQL;
   Cloud Shell VM replacement unverified.
4. Continue remaining native families. Cold image transfer often exceeds20s;
   cached samples do not guarantee universal speed. Local QA is not provider proof.

## Runtime and browser state

Origin https://collection-conferences-ages-clearly.trycloudflare.com.
Control server localhost8787 PID723437, persistent exec90587. PID file
/home/aswin/pods-launch-server.pid matches; verify cwd/cmdline/listener before
any future targeted restart. Use scripts/serve.sh; tools in/home/aswin/pods-tools/bin.
No live PODS apps after optimized Rails stops; data retained. Codespace
pods-launch-containers-69rw5vx4xp46c5qw5. Google Rails2/Bun2; Codespaces Rails4/Bun2.

CUA: stackQa6 IAB2tab13 Nuxt draft ready, prior optimized Rails result visible; accountWorker IAB2
tab12 stopped optimized Rails; independentUser Chrome1tab2083874416 prior failed Bun with
expired connection; nativeGithubKeep IAB2tab10 2FA; cloudLifecycle IAB2tab14 restart.
rubyQa IAB2tab19 completed isolated Sinatra check, QA app stopped and tab closed.
After compaction rewriteDocumentation; re-mark pending tabs. Locator timeout
does not cancel a launch; never resubmit solely because of observation timeout.

Isolated QA pods-fresh-matrix-01, /opt/pods source, /work/stacks fixtures,
/output results, /opt/node/bin/node uid/gid1000, PODS_ISOLATED_BUILD=1.
Browser QA PID125572 remains listening8081; gracefulSIGTERM stopped only its
runner and removed signal handler. SSH tunnel localhost18890 remains.
SQLite reads must be read-only and whitelist public fields, never dump credentials
or owner/identity/session values. Code graph project
Users-rizwanahamed-Documents-ChatGPT-podsv2; targeted fallback for absent scripts.
