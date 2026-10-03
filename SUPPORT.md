# Stack compatibility and acceptance matrix

Goal: repository URL → isolated server build → immutable artifact → one authorized
click → usable application on the user's own Cloud Shell or Codespaces.

React and Angular compile to browser HTML, JavaScript and CSS. Server-rendered
frameworks additionally need their server runtime. An HTML health response alone
is never evidence that the application works.

This is a **target matrix**, not a claim that every row is already supported.
Each row needs a real framework application, build, launch, meaningful interaction,
restart, and provider evidence before being described as fully supported.

| Family | Target stacks | Preparation path |
| --- | --- | --- |
| Browser frontends | HTML/CSS/JS, React, Angular, Vue, Svelte, Preact, Solid, Lit, Alpine | Production static output |
| Full-stack/SSR | Next.js, Nuxt, SvelteKit, Astro, Remix/React Router, Angular SSR | Prebuilt container, or static export when configured |
| Node backends | Express, Fastify, NestJS, Hono, Koa, AdonisJS | Node bundle or prebuilt container |
| Python | Flask, FastAPI, Django, Streamlit, Gradio | Prebuilt Python container |
| JVM | Spring Boot, Quarkus, Micronaut, Ktor | Precompiled JAR/container |
| Go | net/http, Gin, Echo, Fiber | Precompiled executable/container |
| Rust | Axum, Actix Web, Rocket | Precompiled executable/container |
| .NET | ASP.NET Core, Blazor | Published .NET container |
| PHP | Laravel, Symfony, plain PHP | Prepared PHP container |
| Ruby | Rails, Sinatra | Prepared Ruby container |
| Other runtimes | Deno, Bun, Elixir/Phoenix | Existing Dockerfile/Compose first |
| Relational databases | SQLite, PostgreSQL, MySQL, MariaDB | Embedded file or private service with persistent volume |
| Other data services | Redis/Valkey, MongoDB | Private service with persistent volume |
| Application types | SPAs, SSR sites, dashboards, CRUD apps, web APIs, WebSocket apps, web-based tools, workers with a web product | Existing product page or explicit API entrypoint |

Existing Dockerfile/Compose is the extensibility contract for Linux applications
outside automatic recipes. Dependencies, migrations and required configuration
must be declared by the application; PODS cannot infer unknown production secrets
or invent database schemas. No new PODS-specific file is required for conventional
recipes or supported existing Compose projects.

Native mobile/desktop binaries, GPU applications and non-web interactive programs
need different user environments and delivery interfaces. They are not advertised
as supported by a browser preview on these two providers.

Acceptance evidence must distinguish: detection tests; real server build/run;
local browser interaction; provider API launch; native provider browser interaction.
Database tests must write, read, stop, restart and read the same record, with no
database port exposed publicly. Cold provisioning and ready-compute performance
are measured separately. See `evidence/` for completed evidence.

## Verification status

| Application | Real build + artifact launch | Browser interaction + reload | Native provider |
| --- | --- | --- | --- |
| React, Angular, Vue, Svelte, Solid, Preact, Lit, Alpine | Passed | Passed | Pending for these fixtures |
| Fastify + SQLite, Koa + SQLite | Passed, including DB restart | Passed | Pending |
| Flask + SQLite, PostgreSQL, Redis | Passed, including DB restart | Passed | Pending |
| express, fastapi, django, go, spring-boot, aspnet, php | Passed, including data restart | Pending | Pending |
| Sinatra, Next.js, Nuxt, Flask + MySQL | Passed in the running second batch | Pending | Pending |
| Other target rows above | Pending unless a newer evidence file records a pass | Pending | Pending |

Server matrices are `evidence/stack-matrix-01.json` and
`evidence/stack-matrix-02.json` (the second batch is still running). Browser checks are in
`evidence/stack-browser-local.json`; those ran against real prepared artifacts on
aswin through an authenticated SSH tunnel. They are not Cloud Shell/Codespaces
native preview results. Frontend reload persistence uses browser localStorage;
backend fixtures exercise SQLite, PostgreSQL or Redis data on the runtime.

Implementation references: [Docker service model](https://docs.docker.com/reference/compose-file/services/),
[dependency health and startup order](https://docs.docker.com/compose/how-tos/startup-order/),
[Docker inside unprivileged LXD](https://ubuntu.com/tutorials/how-to-run-docker-inside-lxd-containers),
[Cloud Shell's preinstalled Docker](https://docs.cloud.google.com/shell/docs/launching-cloud-shell),
[Dev Container features](https://containers.dev/features).

## Native Google database workflow

The real developer form prepared the public `examples/stacks/flask-postgres`
repository folder at runtime-repository commit `ce433b05441c`. Clicking its launch
link started the prebuilt Flask and PostgreSQL images on the connected user's
Google Cloud Shell, then automatically opened the actual counter product.

- Cold launch: **63.897 seconds** to server-reported ready, including **42.735
  seconds** receiving/loading two previously absent images (165.2 MiB total).
- Warm relaunch: **10.621 seconds** from click until the native product was
  observed with its saved PostgreSQL record.
- Browser write, reload, full application stop and relaunch: **passed**. Record
  changed from 0 to 1 and remained 1 after relaunch.
- No source compilation, installation commands or terminal work were required
  from the user. Existing account authorization was reused.

Evidence: `evidence/stack-google-native.json`. These results do not establish
persistence after the provider replaces its VM or Docker storage, nor do they
establish a universal 20-second cold-launch guarantee.

## Codespaces container runtime

The same immutable Flask + PostgreSQL artifact passed the provider API launch and
health checks on a fresh Docker-enabled Codespace. Cold provisioning plus image
transfer took **189.456 seconds**; the repeat launch took **13.280 seconds** with
both images cached. The product port remains private. Native browser interaction
is pending the user's GitHub browser sign-in; it is not counted as a browser pass.
Evidence: `evidence/stack-codespaces-live.json`.

## Database durability work

The runner now keeps container data beneath Cloud Shell's persistent home and
Codespaces' persistent `/workspaces` directory. Legacy Docker volume migration
and volume metadata recreation passed against real PostgreSQL, retaining its
record (`evidence/stack-storage-live.json`). Full provider VM replacement/rebuild
verification remains pending. Unit coverage is now 44 passing checks.

Storage boundaries follow the provider documentation:
[Cloud Shell persistent home](https://docs.cloud.google.com/shell/docs/how-cloud-shell-works),
[Codespaces rebuild lifecycle](https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle).

Additional fixtures staged for testing: Streamlit and Gradio with SQLite,
compiled Deno, and compiled Bun with SQLite and WebSockets. Their presence in the
fixture repository is not a support pass.
