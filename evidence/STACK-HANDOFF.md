# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Do not claim universal compatibility, native Codespaces browser acceptance or a
20-second cold-launch guarantee. Historical results remain in SUPPORT.md and evidence.

## Current source and acceptance

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Private core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  revision9eee994ba7f70d1793bc449573ddb36e01003818.
- 55 isolated real build/artifact/browser fixture passes. 26 native Google browser
  and26 Codespaces authenticated HTTP/protocol passes. 29 await native acceptance:
  actix, adonis, aspnet, axum, deno, echo, express, fastapi, fastify, fiber, flask-mariadb, flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, hono, koa, ktor, micronaut, nestjs, phoenix, php, react-router, rocket, sinatra, streamlit, symfony.
- All eight static frontend fixtures pass both native acceptance paths. SSR
  React Router remains; Next/Nuxt/SvelteKit/Astro/AngularSSR pass.
- Latest tooling source18026bb:114 automated tests pass locally/aswin. Logs
  /tmp/pods-ssr-complete-tests-{local,aswin}.txt. Live runtime remains5e5b4a0.
  Source updates only native QA scripts/tests; no runtime restart was necessary.
- 5,523 physical source lines:2,960 product/tooling,1,492 tests,907 examples,
  164 browser tools. The extension filter now includes the four-line .astro file.

## Latest completed gate: native Astro

- Actual form submitted once00:01:09.051UTC after watcher73961 confirmed ordinary
  capacity00:01:06UTC (account2/global2/active0). Preparation188.748s, manifest277
  bytes, image124,919,529bytes. Runtime5e5b4a0, checkoutfc24da9 during native tests.
- App repo-f398a17ba5a400573450613f-9eee994ba7f7-df71063ff47f; stable private port26566.
  ImageSHA c99af19d71357fc3b51d0c2da0b92ef022f56ba93bc82280167993a0a6e9277a.
- Cloud Shell initialRUNNING on both launches. First-image health43.208s,
  delivery39.829s, visible45.363s, interaction45.645s; cached health6.768s,
  delivery3.754s, visible7.489s, interaction7.787s. Both browser calls continuous.
  Counter0→1/reload1, full stop/relaunch retained1→2/reload2; warnings/errors[].
  This proves browser localStorage, not backend DB/VM replacement durability.
- Codespaces harness76764 ended0 in pods-launch-containers-69rw5vx4xp46c5qw5.
  FirstinitialShutdown/resume/image-absent:health82.430s,delivery61.944s.
  RepeatinitialAvailable/cached:health9.256s,delivery8.415s. Both HTTP probes
  verify server timestamps advance and inline client script is delivered.
- All four launches stopped. Final00:07:14UTC audit:active builds0/launches0,
  control health200; Codespaces port26566 verifiedprivate. No public preview.
- Evidence stack-astro-{url,google,codespaces}.json and explicit acceptance flags.
  Temp /tmp/pods-astro-production-evidence.json and /tmp/pods-astro-ports.json.

## Next bounded gate

- React Router developer draft staged; NOT submitted. SSR probe already supports
  it and passed actual isolated artifact with root688-byte and entry224,210-byte
  client assets. Astro probe also passed isolated real artifact. Evidence
  stack-{astro,react-router}-ssr-probe.json. Both QA apps stopped.
- Ordinary capacity next00:24:34.464UTC. Watcher49084 is LIVE, started00:07:34UTC
  with20-minute bound,30-second readonly sampling. Reuse this handle; do not
  duplicate, bypass quota, change identities or import QA artifacts into production.
  Watcher73961 and build watch21846 are finished. Prod limits3/account/hour,12global.
- /tmp/pods-next-native-quota-watch.py is the live watcher source. Anchor Svelte
  buildNLXLM6VYS1P01fMd4cFhdzEoXVCJy0Fp account privately; never print identity.
- /tmp/pods-capture-ssr.py runs on aswin with argument astro or react-router;
  readonly SQLite, whitelisted build/app/launch fields, compute and derived timings.
- scripts/live-codespaces.mjs: gh token via stdin, PODS_SSR_CHECK=1 and
  PODS_SSR_FIXTURE=react-router; evidence file explicitly set. Two launches required.
  Native checks reject wrong source folder. Do not combine with SINGLE_LAUNCH.
- Small observed UI issue for a future bounded fix: immediately after Stop,
  Application stopped is correct but the newest recent-launch row still says
  ready until refreshed. Both DB records confirm stopped; not a failed cleanup.

## Browser handoffs

First CUA call after compaction must be cua.rewriteDocumentation. Reuse bindings.
Mark pending workflow tabs each turn; no duplicate launch/build after read timeout.

- stackQa6: IAB2tab13, React Router draft. Ready region exact name includes period:
  Your application is ready to share. → Try this version link.
- accountWorker: IAB2tab12, stopped Astro launcher; localStorage count2.
  astroLaunchUrl, astroBrowserChecks, astroBrowserLogs=[], astroPreparationSubmittedAt.
- measureSsrCounter(tab,heading,scenario,openLabel): bounded50s visibility and
  successful increment, reload retained value. Label must come from observed UI.
  measurePreparedCounter is older static helper hardcoded to Open PODS counter.
  stopPreparedProduct(tab,url) navigates to launcher, clicks Stop once, confirms.
- supportQa: IAB2tab29, public/support deliverable. Check synced26/26 after commit.
- nativeGithubKeep: IAB2tab10, pending GitHub two-factor authentication; fresh
  read23:57UTC still2FA. User action already requested. No SMS/code sent.
- cloudLifecycle: IAB2tab14, Cloud Shell Restart confirmation pending. No approval
  to replace VM. Do not click Restart or accept background Authorize prompt.
- Redact Connected-account text and private Cloud Shell hostnames from snapshots.
  Never print tokens, accounts, sessions or computeKeys.

## Operations and evidence rules

- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
- systemd user pods-launch-fresh.service,MainPID946172,runtime5e5b4a0. Node/gh:
  /home/aswin/pods-tools/bin. Health/health on127.0.0.1:8787 (not/api/health).
  XDG_RUNTIME_DIR=/run/user/1000; DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus.
- Before any runtime restart: prove idle, confirm unit PID/cwd/cmdline/listener.
  No restart required for evidence/docs. Never use retired manual PID marker or
  touch unrelated pods-j03 services. Last controlled restart23:36:28UTC.
- Cloudflared manualPID2322522, same hostname. Fixedhostname answer and durable
  DNS/tunnel supervision remain pending; do not change callback hostname.
- RunnerSHA9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b.
- Prod DB URIfile:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro.
  records(kind,id,value JSON), singular build/launch. Use whitelisted fields only.
  Provider initial state must be observed, never inferred/backfilled from duration.
- Public/support renders evidence/stack-coverage.json each request. Acceptance
  requires nativeAcceptance.googleBrowser/codespacesProtocol booleans after evidence.
  Filenames alone never confer a pass. No raw private evidence is served publicly.
- QA LXDpods-fresh-matrix-01 via/snap/lxd/current/bin/lxc,not snap wrapper.
  Source/opt/pods,fixtures/work/stacks,output/output,node/opt/node/bin/node,uid1000.
  Existing QAserverPID292107/session86855,app18090/proxy8081/tunnel18890; one-shot
  SIGTERM handler consumed. Don't blindly signal. New probe tests used18094 and
  stopped it. LXC file push could not overwrite existing root-owned/tmp paths;
  unique reviewed helper paths worked without changing permissions.
- Graph projectUsers-rizwanahamed-Documents-ChatGPT-podsv2,indexed through5e5b4a0.
  public/scripts/examples/deploy excluded; targeted fallback is appropriate.
- npm test = node --test test/*.test.mjs. set -e before validation/commit.
  No passing-check reruns absent changes/concerns. User requests no subagents.
- All native Codespaces browser interactions remain unverified. Cloud Shell VM
  replacement persistence, durable hosting and cold20-second target are pending.
  Arbitrary dependencies/secrets/migrations and native/mobile/GPU interfaces are
  outside the currently tested contracts. Goal remains active, not complete.
