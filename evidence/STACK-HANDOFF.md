# Broad stack checkpoint

Goal active: do not claim universal support or complete provider acceptance.

## Source and coverage

- Core private https://github.com/RizwanAhamed13/pods-launch-fresh; fixtures public
  https://github.com/RizwanAhamed13/pods-launch-runtime-fresh at 00df7c0.
- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin /home/aswin/pods-launch-fresh.
- 54 distinct real fixtures pass isolated build, artifact run and meaningful browser
  interaction. SUPPORT.md and stack-coverage.json list exact evidence and failures.
- 4475 physical source lines: 2567 product/tooling, 883 tests, 868 examples,
  157 browser tools. Exclusions in code-lines.json.
- 56 automated checks pass locally after Ruby change; aswin rerun is next.
- Native Google browser families: Flask/PostgreSQL, React/Express/PostgreSQL,
  Angular SSR/SQLite, Quarkus/SQLite, Laravel/SQLite, Blazor/SQLite, Gin/file,
  Flask/Python worker/Redis, Bun WebSocket/SQLite: nine families.
- Codespaces authenticated SSH HTTP/protocol additionally covers Rails/SQLite:
  ten families. Native browser authorization remains separate and pending.

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
See stack-rails-{url,codespaces}.json. New optimized real URL/native test pending.

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

1. Publish/pull current Ruby change and evidence; run56checks on aswin. Each
   LXD build copies current src/scripts, so recipe-only changes need no server
   restart. Normal next developer quota slot17:57:36UTC, then18:18:13/18:33:45
   absent other builds. Submit optimized Rails once through real developer UI,
   test both providers and retained Codespaces count2. Never bypass quota,
   change identity to evade it, or import QA artifacts into production.
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
No live PODS apps after Bun and Rails stops; data retained. Codespace
pods-launch-containers-69rw5vx4xp46c5qw5. Google Bun2; Codespaces Rails2/Bun2.

CUA: stackQa6 IAB2tab13 completed original Rails preparation; accountWorker IAB2
tab12 stopped Bun; independentUser Chrome1tab2083874416 prior failed Bun with
expired connection; nativeGithubKeep IAB2tab10 2FA; cloudLifecycle IAB2tab14 restart.
rubyQa IAB2tab19 completed isolated Sinatra check, QA app now stopped.
After compaction rewriteDocumentation; re-mark pending tabs. Locator timeout
does not cancel a launch; never resubmit solely because of observation timeout.

Isolated QA pods-fresh-matrix-01, /opt/pods source, /work/stacks fixtures,
/output results, /opt/node/bin/node uid/gid1000, PODS_ISOLATED_BUILD=1.
Browser QA PID125572 remains listening8081; gracefulSIGTERM stopped only its
runner and removed signal handler. SSH tunnel localhost18890 remains.
SQLite reads must be read-only and whitelist public fields, never dump credentials
or owner/identity/session values. Code graph project
Users-rizwanahamed-Documents-ChatGPT-podsv2; targeted fallback for absent scripts.
