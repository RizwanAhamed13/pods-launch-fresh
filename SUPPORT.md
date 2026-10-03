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

**54 distinct application fixtures** have passed a real server build, prepared
artifact launch and browser interaction. All named framework fixture families in the target matrix now have a passing representative. Each fixture is a genuine framework application, not a replacement
HTML page. The browser checks use an authenticated SSH tunnel to aswin's isolated
QA guest; provider tests are recorded separately below.

| Application family | Tested fixtures | Browser / persistence result |
| --- | --- | --- |
| Browser frontends | React, Angular, Vue, Svelte, Solid, Preact, Lit, Alpine | Interactive product and reload passed |
| SSR / full-stack | Next.js, Nuxt, SvelteKit, Astro, React Router, Angular SSR | Hydrated/interactive product passed; fixture-specific persistence |
| Node servers | Express, Fastify, Koa, Hono, NestJS, AdonisJS | Product interaction and persistent data passed |
| Python servers/tools | Flask, FastAPI, Django, Streamlit, Gradio | Product/dashboard interaction passed; database persistence checked |
| JVM | Spring Boot, Quarkus, Micronaut, Ktor | SQLite write/read/restart and browser reload passed |
| Go | net/http, Gin, Echo, Fiber | Persistent record write/read/restart and browser reload passed |
| Rust | Axum, Actix Web, Rocket | Persistent record write/read/restart and browser reload passed |
| .NET | ASP.NET Core, Blazor Server | SQLite write/read/restart; Blazor interactive server UI passed |
| PHP | Plain PHP, Laravel, Symfony | SQLite write/read/restart and browser reload passed |
| Ruby | Sinatra, Rails | SQLite write/read/restart and browser reload passed |
| Other runtimes | Compiled Deno, compiled Bun, Elixir/Phoenix | Product and persistent record passed; Bun WebSocket ping/pong and live UI passed |
| Combined application | React + Express + PostgreSQL | Browser write/reload and full database restart passed |
| Background processing | Flask web + Python worker + Redis | Job submitted, worker result displayed, completed job survives relaunch |
| Private databases/services | SQLite, PostgreSQL 17, MySQL, MariaDB, Redis, Valkey, MongoDB 7.0.43 | Write/read/stop/restart/read passed; no public database ports |

The database variants account for several of the 54 distinct applications.
Frontend fixtures use localStorage or deliberately transient client state; they
are not evidence of backend database durability. Next.js and Nuxt counters reset
on reload by design. Their original batch02 harness did not relaunch non-API
fixtures; batch22 closes that gap with real artifact stop/relaunch checks.
Streamlit and Gradio separately retained SQLite data through full artifact
relaunches. Worker evidence covers completed jobs, not exactly-once processing
or in-flight crash recovery.

Evidence is in numbered `evidence/stack-matrix-*.json` and
`evidence/stack-browser-*.json` files. Original failed attempts are retained;
later passing attempts do not erase them. Automated coverage is **52 passing
checks locally and on aswin**.

## Actual repository URL to native product

The real developer form prepared the public repository's
`examples/stacks/react-express-postgres` folder at commit `5f376f60ed9c` in
**144.175 seconds**. It produced one reusable launch artifact with three prepared
images. No source compilation or installation commands were required from the
user at launch.

| Provider / scenario | Observed result |
| --- | --- |
| Google Cloud Shell, absent images | Ready in 67.816 seconds, including 54.699 seconds receiving/loading images |
| Google, cached relaunch | Ready in 9.281 seconds; a second measured launch showed the React heading at 10.876 seconds and saved database value by 18.158 seconds |
| Google, actual product | React button wrote PostgreSQL record 0→1; reload and full stop/relaunch retained 1 |
| Codespaces, resumed environment | Ready in 87.033 seconds, including image transfer/loading |
| Codespaces, cached relaunch | Ready in 10.106 seconds; authenticated HTTP product and database write/read passed |
| Codespaces, native browser | Pending GitHub browser sign-in; private preview remains private |

The 18.158-second saved-value measurement is an observation upper bound including
the gap between browser tool calls. Server ready time and browser-visible time
are different measurements. An earlier Google API timeout is retained in the
same evidence. The cold cases exceed the 20-second target; cached results do
not imply a universal cold-launch guarantee.

See `evidence/stack-react-express-postgres-url.json`,
`evidence/stack-react-express-postgres-google.json`,
`evidence/stack-react-express-postgres-codespaces.json` and
`evidence/stack-react-express-postgres-codespaces-interaction.json`.

Flask + PostgreSQL also passed the real developer URL and native Google product
flow: cold 63.897 seconds, warm browser-visible product with saved data in
10.621 seconds. Its Codespaces API launch took 189.456 seconds cold and
13.280 seconds cached. Native provider results for these two applications are
not automatically attributed to every framework in the matrix.

## Native Angular SSR workflow

The developer form prepared Angular SSR from its repository folder in **208.096
seconds**. Cloud Shell received the prebuilt image and automatically opened the
real Angular page. Its hydrated button wrote SQLite record 0→1; reload and a
full application stop/relaunch retained 1.

- Uncached launch: **72.289 seconds** to ready, including **61.689 seconds**
  receiving/loading the 238.1 MB image.
- Cached launch: **5.849 seconds** to ready; **7.223 seconds** from clicking
  launch until the actual native product visibly displayed the saved record.

This also verifies the exact provider hostname configuration in the native SSR
runtime. Evidence: `evidence/stack-angular-ssr-url.json` and
`evidence/stack-angular-ssr-google.json`. Codespaces remains untested for this
specific fixture.

## Database durability

Container data lives beneath Cloud Shell's persistent home or Codespaces'
persistent `/workspaces` directory. Legacy Docker volume migration and volume
metadata recreation passed against real PostgreSQL, retaining its record.
A full native Codespaces rebuild retained PostgreSQL record 2 and accepted a
new write to 3 after relaunch. Recovery took 56.444 seconds, including 40.962
seconds loading images removed by the rebuild. Two preceding failed dispatches
were traced to missing `gh` in the control-plane PATH and are retained.

Cloud Shell VM replacement remains unverified. Application stop/relaunch,
Docker volume metadata recreation and provider VM replacement are separate gates.
See `evidence/stack-storage-live.json` and
`evidence/stack-codespaces-rebuild-proof.json`.

## Constraints and resolved failures

- MongoDB 8 refuses to start on aswin's Linux 7.0.0 kernel. Its documented
  affected range is 6.19–7.0.13, fixed in 7.0.14+. MongoDB 7.0.43 was tested
  independently; PODS does not disable MongoDB's startup guard.
- PostgreSQL health checks use TCP readiness. A deterministic reproduction
  showed that socket readiness during initial database creation could start
  the API too early. Both PostgreSQL fixtures use the corrected check.
- Angular SSR preserves application host restrictions and adds only loopback
  hosts and the exact provider preview hostname through `NG_ALLOWED_HOSTS`.
  Its corrected artifact and real SSR browser interaction passed.
- Maven packaging retains the Quarkus fast-JAR directory and excludes shaded
  JAR originals. Quarkus's blocking dependency resolver resolved the initial
  native-thread exhaustion failure without raising the builder process limit;
  full build, SQLite restart and browser interaction now pass.
- Laravel's first fixture omitted standard middleware registration. A targeted
  correction passed the full artifact build, database restart and browser
  interaction tests. PHP recipes now install the required multibyte and XML extensions.
- Phoenix's first fixture declared its router after its endpoint in one file,
  causing a compile-time module lookup failure. The declaration order is
  corrected; the rebuilt release, SQLite restart and browser interaction passed.
- Rust/Deno artifact exports exhausted the original QA storage quota. The QA
  pool and quota were expanded, and corrected batches passed. Production
  guests retain their 12 GiB quota; QA capacity does not relax that limit.

Existing Dockerfile/Compose support is an extension mechanism, not proof that
arbitrary applications, native desktop/mobile software or GPU workloads work.
Private repositories, unknown external secrets and unsupported Compose options
remain explicit constraints. All advertised runtime examples target Linux amd64.

References: [Compose service model](https://docs.docker.com/reference/compose-file/services/),
[dependency health ordering](https://docs.docker.com/compose/how-tos/startup-order/),
[Docker inside unprivileged LXD](https://ubuntu.com/tutorials/how-to-run-docker-inside-lxd-containers),
[Cloud Shell persistent home](https://docs.cloud.google.com/shell/docs/how-cloud-shell-works),
[Codespaces rebuild lifecycle](https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle),
[Angular host configuration](https://angular.dev/best-practices/security#configuring-allowed-hosts),
[MongoDB 8 release notes](https://www.mongodb.com/docs/v8.0/release-notes/8.0/).
