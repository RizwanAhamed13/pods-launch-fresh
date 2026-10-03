# Broad stack goal checkpoint

The active goal is not complete. Continue the existing goal; do not create a new
one or claim universal support. Core container support was pushed in `f2369e1`.
The public runtime repository is at `c13d84c` (React + Express + PostgreSQL fixture).

## Established evidence

- 40 automated checks pass (`stack-unit-tests.txt`).
- Batch 01: 13 passed plus an initial Express bundling failure. The automatic
  container fallback subsequently passed Express in batch 02.
- Eight frontend frameworks passed real production builds and browser interaction:
  React, Angular, Vue, Svelte, Solid, Preact, Lit, Alpine.
- First browser matrix also passed Fastify/SQLite, Koa/SQLite and Flask with
  SQLite/PostgreSQL/Redis. This browser used the aswin artifact through SSH, not a
  native provider. Evidence explicitly records that boundary.
- Batch 02 snapshot committed: Express, FastAPI, Django, Go, Spring Boot,
  ASP.NET Core, PHP passed, including write/read/stop/relaunch data checks.
  Sinatra also passed in the later live log; import the final batch evidence.
- Actual developer form submitted public runtime repository folder
  `examples/stacks/flask-postgres` at `ce433b05441c`. Build completed in 179.9s.
  Launch URL: https://collection-conferences-ages-clearly.trycloudflare.com/launch/repo-a8b5cf7306c523deda321181-ce433b05441c-c986084e2034
- Native Google browser: PostgreSQL record 0 → 1, reload → 1, stop/relaunch → 1.
  Cold server ready 63.897s; warm server ready 7.632s; product observed 10.621s
  after warm click. No image cache on cold run; both cached on warm run.
- Codespaces: cold 189.456s, cached 13.280s, then another restart 9.270s.
  HTTP write/read inside the actual Codespace and record persistence after full
  runner stop/relaunch passed. Native browser is pending GitHub sign-in.
  The user has an async sign-in request; do not ask for credentials in chat.

## Live execution on aswin

Authoritative deployment: `/home/aswin/pods-launch-fresh`, SSH alias `aswin`.
Local mirror: `/Users/rizwanahamed/Documents/ChatGPT/podsv2`.
Node/gh tools: `export PATH=/home/aswin/pods-tools/bin:$PATH`.
LXD: `/snap/lxd/current/bin/lxc`.

- Control plane PID 259870, port8787; Google OAuth and the tunnel are working.
  Do not restart during a live preparation/authorization.
- Stopped production builder base `pods-fresh-builder-v2`, selected via `.env`.
  No secrets should be logged or committed.
- Disposable isolated QA guest `pods-fresh-matrix-01`: 4 GiB RAM, 2 CPUs; its
  cumulative test cache root quota was increased from12 to17 GiB. Production
  build guests retain12 GiB. Pool `pods-fresh-build-v2` is20 GiB total.
- Batch02 main Node process PID10410 inside guest. Log
  `/home/aswin/pods-matrix-02.log`. Exec session9873.
  Cases: express fastapi django go spring-boot aspnet php sinatra axum next nuxt
  flask-mysql flask-mariadb flask-mongodb flask-valkey.
- Axum failed compilation: its raw HTML Rust string used `r#"..."#` despite
  containing `"#value`. Fixed to `r##"..."##` in local/aswin source and queued
  guest copy. Retest is in batch04; do not claim Rust passed yet.
  Docker legacy-builder stderr omitted the compiler output; bounded stdout in
  build errors would improve diagnostics. Docker logging driver cannot read
  the failed intermediate container's logs.
- Batch03 queued (exec7216): waits for PID10410 to exit, saves
  `/output/evidence/matrix-02.json`, tests react-express-postgres, then saves
  `/output/evidence/matrix-03.json`. Host log `/home/aswin/pods-matrix-03.log`.
- Batch04 queued (exec37193): after matrix-03.json exists, prunes only this
  disposable guest's Docker build cache, then runs axum sveltekit astro
  react-router hono nestjs, saves `/output/evidence/matrix-04.json`.
  Host log `/home/aswin/pods-matrix-04.log`.
- `/output/evidence/matrix.json` is overwritten by each active batch. Use the
  numbered snapshots once available; never mislabel the next batch as batch02.
- Poll coarse intervals. Import numbered JSON into core `evidence/`, fix real
  failures, and rerun only affected cases. Monitor remaining pool space.
- Browser QA driver stopped. After queued batches finish, combine the passed
  evidence and restart `scripts/browser-stack-matrix.mjs` inside guest. It uses
  `/output/evidence/matrix.json` to enumerate artifacts. It listens on8081 and
  runs selected artifacts on8080; do not run it alongside the matrix.
- LXD proxy host127.0.0.1:18890 → guest8081; SSH forward exec90902 remains open.
  Browser catalog: http://127.0.0.1:18890/_pods. Driver needs WebSocket upgrade
  forwarding before Streamlit/Gradio or explicit WebSocket fixtures are tested.

## Browser state

Use CUA and re-read its documentation after context compaction. IAB browser1.
- Tab9 (`podsWide`) is the native Google PostgreSQL product, marked deliverable.
- Tab10 is Codespaces private preview at GitHub sign-in, marked handoff. User
  action is pending. Do not substitute SSH evidence for native browser evidence.
- Tab8 (`stackQa`) is the earlier local SSH browser matrix catalog.
- Keep user-owned Google Console/setup tabs intact.
- Native Codespace: `pods-launch-containers-69rw5vx4xp46c5qw5`, private8080 URL.
  It has PostgreSQL record1 after restart. Stop this test Codespace when native
  browser testing is complete; do not change its port to public.

## Outstanding acceptance work

1. Finish batches02–04 and browser-check all new passing fixtures.
2. Exercise combined React + Express + PostgreSQL through developer URL workflow.
3. Cover remaining explicit targets in SUPPORT.md with real fixtures/adapters:
   Angular SSR, legacy Remix as needed, AdonisJS, Streamlit, Gradio, Quarkus,
   Micronaut, Ktor, Gin/Echo/Fiber, Actix/Rocket, Blazor, Laravel/Symfony, Rails,
   Deno/Bun and Phoenix. Do not infer support from language name alone.
4. Database named volumes currently survive app restarts within the same Docker
   engine. Persistence across Cloud Shell VM replacement / Codespace rebuild is
   NOT implemented or tested. Keep that limitation explicit until addressed.
5. Test WebSockets, full-stack routing and worker-with-web-output application
   types. Native mobile/desktop/GPU apps are outside these browser environments.
6. Collect package locks for reproducibility where appropriate. Public fixture
   repository needs the Axum correction and five new framework fixture folders.
7. Core `SUPPORT.md` status is a checkpoint; refresh from evidence before claims.
   Update code line counts after remaining edits. Last count3086 preceded the
   five new fixtures and one-line test-harness option.
8. Push code/evidence at verified milestones. Keep goal active until its supported
   compatibility scope and remaining limitations are honestly fulfilled.
