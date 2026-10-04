# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Do not claim universal compatibility, native Codespaces browser acceptance,
VM replacement durability, or a universal 20-second cold launch.

## Current state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  revision d6da2ed780aec8ae0178fc181f1d24113c322e15.
- This milestone adds Koa native acceptance on parent d915ec1. Use git log for
  publication commit. Product runtime is unchanged at 5e5b4a0.
- Coverage: 55 isolated build/artifact/browser passes; 30 Google native browser
  and 30 Codespaces authenticated HTTP/protocol passes. All eight static frontend
  and six SSR fixtures pass both paths. Every native Codespaces browser check
  remains pending. The 25 fixtures awaiting both native acceptance paths are:
  actix, adonis, aspnet, axum, deno, echo, fastapi, fiber, flask-mariadb,
  flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, hono, ktor,
  micronaut, nestjs, phoenix, php, rocket, sinatra, streamlit, symfony.
- Full-suite baseline 18026bb: 114 tests passed locally/aswin; logs
  /tmp/pods-ssr-complete-tests-{local,aswin}.txt. Product source unchanged since
  that baseline's subsequent recorded runtime fixes; do not rerun unchanged
  passing checks without cause. Latest compatibility check: 3 tests passed.
- Physical code: 5,622 lines = 3,033 product/tooling + 1,492 tests + 933 examples
  + 164 browser tools. Scope excludes evidence scripts, JSON, docs and generated
  files; includes .astro. No product source changed during this milestone.

## Latest gate: Koa native acceptance

- Ordinary quota watcher 67969 ended0 at 01:45:25.124874 UTC, account2/global2/
  active0. Actual form submitted once at 01:45:29.115 UTC.
- Public source folder examples/stacks/koa at d6da2ed; production preparation
  22,767ms; Node bundle 101,539 bytes, SHA256
  4cf6f2739c10d5c7072c855ea4886a4ad8bd9fdafd5ac57cdcde898501700240.
  No QA artifact import or quota bypass. Source SHA matches the earlier browser
  transport preflight, which passed empty chunked POST and restart persistence.
- App repo-54e71d97ff4cca1baf2be123-d6da2ed780ae-4cf6f2739c10; private port24886.
- Google first initial RUNNING: health6196ms, delivery3023, page8334, read8345,
  successful write8626. Cached full relaunch initial RUNNING: health5016,
  delivery1806, page5525, saved value5643, successful write5932.
  Actual browser SQLite0→1, reload1, full stop retained1→2, reload2. No browser
  warnings/errors. Both launches stopped. These are not cold-VM measurements.
- Codespaces harness44477 ended0. Environment pods-launch-7vrw57jpjjppcww57.
  First initial Shutdown: health28280ms, delivery16005, SQLite0→1.
  Cached initial Available: health8227ms, delivery7515, full stop retained1→2.
  Both stopped. HTTP checks are not native browser acceptance.
- Final audit 01:47:26.519349 UTC: active builds0/launches0, health200,
  port24886 private. Evidence stack-koa-{url,google,codespaces}.json.
- /tmp/pods-koa-{browser,production-evidence,ports}.json, health.txt and
  /tmp/pods-record-koa.py retain evidence inputs/validation. Both providers now
  hold Koa value2; never reset existing data when retesting.

## Next gate and performance work

- NEXT: Hono URL preparation and native browser/HTTP persistence checks, then
  remaining fixtures. No Hono production build has been submitted.
- Latest quota snapshot 01:47:36.323269 UTC: account3/global3/active0; next ordinary
  slot 02:01:21.388 UTC. No live watcher. /tmp/pods-next-native-quota-watch.py is a
  bounded20min readonly watcher with30sec samples; anchor Svelte build
  NLXLM6VYS1P01fMd4cFhdzEoXVCJy0Fp privately. Poll a running handle, never recreate
  on observation timeout. Keep limits3/account/hour and12/global/hour. Never
  bypass quota, change identity to evade it, or import QA artifacts to production.
- /tmp/pods-capture-native.py reads aswin SQLite readonly, whitelists fields and
  derives timings. Its explicit fixture allowlist currently includes astro,
  react-router, express, fastify, koa; add hono before its capture.
- scripts/live-codespaces.mjs receives gh token on stdin. Use the correct fixture
  probe, explicit output file and expected initial count. Counter/SSR/static/
  WebSocket/worker checks require two launches, including confirmed full stop.
- Express optional-import optimization remains experimental. esbuild0.25.12
  bundles a compiler-confirmed handled supports-color require into338,173 bytes
  versus production82,250,849-byte image. Real same-format persistence passed.
  Production packager unchanged: cross-format storage must be fixed first.
- Real transition probe43765 ended0: same dataKey, container saved1, bundle saw0,
  returning to container saw1. Original data retained but continuity FAILED.
  Its unique volume/root were removed. See stack-express-transition-probe.json
  and replay .mjs. This asserts the failure, not successful migration.
- Mocked provider-adapter check also rejects both saved container→Node and
  Node→container runtime-label changes before mutations. Server environmentKey
  binds account+dataKey independently of runtime; preserve that saved environment.
  See stack-provider-format-transition-probe.{json,mjs}. Current public
  devcontainer includes Node24, sshd, Docker-in-Docker; this does not prove the
  capabilities of older saved environments.
- Storage currently differs: bundles <root>/data/<dataKey>; default container
  <root>/volumes/pods-<key-sha256-first24>/app-data/data. run() creates the bundle
  directory even for a container, so existence alone does not prove data is there.
  Container files may be root-owned. Preserve ownership checks, refuse ambiguity,
  and prove data continuity before enabling smaller bundles. Do not weaken checks.
- Fastify originally failed Google empty chunked POST with HTTP415; corrected
  JSON-body fixture passed native browser and Codespaces checks. Historical failure
  retained. Evidence stack-fastify-fixed-*.json, stack-fastify-google.json and
  isolated before/after regressions. Existing Fastify values: Google2, Codespaces4.
- Astro stronger outer gzip saved only0.011% because Docker layers already gzip.
  No production compression change warranted; recorded trial remains valid.

## Browser and environment handoffs

After compaction first CUA call must be cua.rewriteDocumentation. Reuse bindings;
mark pending tabs each new turn. Never duplicate a launch/build after timeout.

- stackQa6: IAB2 tab13, completed Koa preparation. Ready region name includes
  period: Your application is ready to share. Try this version link identifies
  the exact artifact. Next folder input should be examples/stacks/hono.
- accountWorker: IAB2 tab12, stopped Koa launcher. koaLaunchUrl,
  koaPreparationSubmittedAt, koaBrowserChecks (both passed), koaFirstLogs and
  koaSecondLogs (empty) persist. measureKoaCounter records continuous page/read/
  write timing and reload;50sec deadline. Stop helper stopPreparedProduct confirms
  terminal state. History may briefly lag while its async refresh finishes.
- supportQa: IAB2 tab29, public support deliverable; refresh after publishing to
  verify55/30/30 and Koa bothPassed. Native CS browser warning must remain visible.
- nativeGithubKeep: IAB2 tab10; freshly checked this turn, still Two-factor
  authentication. User already asked; no SMS/code sent. Do not repeat question.
- cloudLifecycle: IAB2 tab14; freshly checked this turn, Restart confirmation and
  background Authorize request remain pending. No VM replacement approval;
  do not click Restart or accept the unrelated background permission request.
- Redact Connected-account text and private Google preview hosts from snapshots.
  Never print tokens, accounts, sessions or computeKeys. Local gcloud is signed
  into a DIFFERENT, SUSPENDED Google environment; do not use that CLI identity.
- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
  Support /support renders coverage each request; flags, not filenames, grant
  acceptance. No raw private evidence is served publicly.
- User service pods-launch-fresh.service on aswin; last observed PID946172,
  runtime5e5b4a0. Node/gh /home/aswin/pods-tools/bin. /health at127.0.0.1:8787.
  Before any restart prove idle and revalidate unit PID/cwd/cmdline/listener and
  SQLite integrity. Docs/evidence sync needs no restart. Never use old PID files
  or touch unrelated pods-j03 services. Last restart23:36:28 UTC.
- Cloudflared manualPID2322522; fixed hostname/DNS supervision still awaits user
  input. Keep callback hostname unchanged. RunnerSHA
  9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b.
- DB: file:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro;
  records(kind,id,value JSON), singular build/launch. Use whitelisted output.
- QA guest pods-fresh-matrix-01 via /snap/lxd/current/bin/lxc. Source /opt/pods,
  fixtures /work/stacks, output /output, Node /opt/node/bin/node, uid/gid1000.
  Existing QAserverPID292107/session86855, app18090/proxy8081/host18890. Its
  one-shot SIGTERM handler was consumed; do not blindly signal. Temporary Koa/
  Fastify probes/tunnels/devices are stopped and removed; no current probe.
- Graph project Users-rizwanahamed-Documents-ChatGPT-podsv2, indexed through
  5e5b4a0. scripts/public/examples/deploy excluded; targeted fallback appropriate.
- Use set -e for validation→commit. User requests no subagents. Keep goal active;
  native Codespaces browser,25 remaining fixture paths, runtime migration,
  VM replacement durability, stable hosting and cold performance remain open.
