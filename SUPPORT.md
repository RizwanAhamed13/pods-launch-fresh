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

**55 distinct application fixtures** have passed a real server build, prepared
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
| .NET | ASP.NET Core, Blazor Server | ASP.NET file counter and Blazor SQLite write/read/restart; Blazor interactive server UI passed |
| PHP | Plain PHP, Laravel, Symfony | Plain PHP file persistence; Laravel/Symfony SQLite write/read/restart and browser reload passed |
| Ruby | Sinatra, Rails | Sinatra file persistence; Rails SQLite write/read/restart and browser reload passed |
| Other runtimes | Compiled Deno, compiled Bun, Elixir/Phoenix | Product and persistent record passed; Bun WebSocket ping/pong and live UI passed |
| JSON API product | FastAPI API + SQLite | Existing Swagger UI discovered automatically; browser API write/read and database restart passed |
| Combined application | React + Express + PostgreSQL | Browser write/reload and full database restart passed |
| Background processing | Flask web + Python worker + Redis | Job submitted, worker result displayed, completed job survives relaunch |
| Private databases/services | SQLite, PostgreSQL 17, MySQL, MariaDB, Redis, Valkey, MongoDB 7.0.43 | Write/read/stop/restart/read passed; no public database ports |

The database variants account for several of the 55 distinct applications.
Spring Boot was corrected to use real SQLite in matrix30/browser30; its earlier
matrix02/matrix15/browser02 results exercised a plain file and are retained as
historical evidence only. The SQLite file signature, integrity and saved values
were also checked directly.

Frontend fixtures use localStorage or deliberately transient client state; they
are not evidence of backend database durability. Next.js and Nuxt counters reset
on reload by design. Their original batch02 harness did not relaunch non-API
fixtures; batch22 closes that gap with real artifact stop/relaunch checks.
Streamlit and Gradio separately retained SQLite data through full artifact
relaunches. Worker evidence covers completed jobs, not exactly-once processing
or in-flight crash recovery.

Evidence is in numbered `evidence/stack-matrix-*.json` and
`evidence/stack-browser-*.json` files. Original failed attempts are retained;
later passing attempts do not erase them. Automated coverage is **189 passing checks in full local and isolated aswin QA runs**. Native coverage is 48 Google browser fixtures and
48 Codespaces HTTP/protocol fixtures; 7 still lack at least one native acceptance path. Codespaces
native browser authorization and interaction remain pending.

## Native launch performance

[Recorded native timing summary](evidence/stack-native-timings.md) separates
explicitly observed compute states, first/repeat runs, server readiness and product
visibility. It preserves missing timing as unknown and lists excluded historical
records; its mixed-fixture observations are not a controlled benchmark.

Builds happen once on the PODS server. Provider launch measurements start when
the user requests the prepared application. A healthy server, a visible page,
and a completed product interaction are recorded separately.

A recent SQLite acceptance illustrates why compute state and image
cache state must both be reported:

| Scenario | Server healthy | Product interaction |
| --- | --- | --- |
| Cloud Shell already running; image absent | 18.612s | Visible at 20.220s; button write at 20.983s |
| Cloud Shell cached relaunch | 6.274s | Saved value restored at 7.870s; next write at 8.172s |
| Codespaces initially stopped; image absent | 52.502s | Authenticated HTTP write/read passed |
| Codespaces available; cached relaunch | 8.407s | HTTP write/read and direct SQLite inspection passed |

These are fixture-specific results, not a universal latency guarantee. First
image transfers and provider startup frequently exceed the 20-second target.
Cloud Shell runs finished and stopped before Codespaces tests started. Native
Codespaces browser sign-in and interaction remain pending.

## Persistence and operational limits

Database fixtures verify a product write, read, complete application stop,
relaunch and retained value. Engine-specific inspection additionally checks the
actual saved data, database identity, private ports and persistent storage.
This does not prove replacement of a provider VM, arbitrary database migrations,
power-loss durability or exactly-once background processing.

Current preparation accepts public GitHub repository URLs. A repository folder
can be selected for monorepos. Conventional recipes and supported existing
Dockerfile/Compose projects need no new PODS-specific file. Required external
secrets, third-party services and application-specific migrations must still be
provided by the developer. The current demonstration hostname is temporary;
a stable production hostname remains a deployment requirement.

## Evidence and implementation

- [Machine-readable fixture coverage](evidence/stack-coverage.json) records
  separate isolated, Cloud Shell browser and Codespaces protocol acceptance.
- Numbered `evidence/stack-matrix-*.json` and `stack-browser-*.json` retain real
  builds, browser interactions, persistence checks and failed attempts.
- [Latest SQLite developer build](evidence/stack-flask-sqlite-url.json),
  [Cloud Shell browser evidence](evidence/stack-flask-sqlite-google.json), and
  [Codespaces evidence](evidence/stack-flask-sqlite-codespaces.json) record the
  performance example above.
- Valkey native acceptance: [developer build](evidence/stack-flask-valkey-url.json),
  [Cloud Shell browser](evidence/stack-flask-valkey-google.json), and
  [Codespaces protocol and database inspection](evidence/stack-flask-valkey-codespaces.json).
  Both paths retained the product counter across full stop/relaunch.
- Go native acceptance: [developer build](evidence/stack-go-url.json),
  [Cloud Shell browser](evidence/stack-go-google.json), and
  [Codespaces protocol and compiled runtime inspection](evidence/stack-go-codespaces.json).
  Both paths retained the file counter across full stop/relaunch.
- Echo native acceptance: [developer build](evidence/stack-echo-url.json),
  [Cloud Shell browser](evidence/stack-echo-google.json), and
  [Codespaces protocol and framework inspection](evidence/stack-echo-codespaces.json).
  Both paths retained the file counter across full stop/relaunch.
- Fiber native acceptance: [developer build](evidence/stack-fiber-url.json),
  [Cloud Shell browser](evidence/stack-fiber-google.json), and
  [Codespaces protocol and framework inspection](evidence/stack-fiber-codespaces.json).
  All four Go fixtures now pass these native paths; Codespaces browser checks remain pending.
- Actix Web native acceptance: [developer build](evidence/stack-actix-url.json),
  [Cloud Shell browser](evidence/stack-actix-google.json), and
  [Codespaces product and file persistence](evidence/stack-actix-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- Axum native acceptance: [developer build](evidence/stack-axum-url.json),
  [Cloud Shell browser](evidence/stack-axum-google.json), and
  [Codespaces product and file persistence](evidence/stack-axum-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- Rocket native acceptance: [developer build](evidence/stack-rocket-url.json),
  [Cloud Shell browser](evidence/stack-rocket-google.json), and
  [Codespaces product and file persistence](evidence/stack-rocket-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
  All three Rust representatives now pass these native paths; Codespaces browser checks remain pending.
- ASP.NET Core native acceptance: [developer build](evidence/stack-aspnet-url.json),
  [Cloud Shell browser](evidence/stack-aspnet-google.json), and
  [Codespaces product and file persistence](evidence/stack-aspnet-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- PHP native acceptance: [developer build](evidence/stack-php-url.json),
  [Cloud Shell browser](evidence/stack-php-google.json), and
  [Codespaces product and file persistence](evidence/stack-php-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- Sinatra native acceptance: [developer build](evidence/stack-sinatra-url.json),
  [Cloud Shell browser](evidence/stack-sinatra-google.json), and
  [Codespaces product and file persistence](evidence/stack-sinatra-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- [Rust and ASP.NET transport preflight](evidence/stack-counter-transport-preflight.json)
  checks empty chunked POST and full-restart file persistence on isolated compute.
  These checks do not add native-provider acceptance.
- [Shared file-counter probe preflight](evidence/stack-file-counter-runtime-preflight.json)
  verifies the native inspection helper against real Rust and ASP.NET artifacts.
  These isolated checks do not add native-provider coverage.
- [Gradio and Streamlit protocol preflight](evidence/stack-dashboard-protocol-preflight.json)
  verifies real dashboard protocol writes and SQLite persistence after a full
  restart in isolated QA. Native provider acceptance remains pending for both.
- [Shared dashboard helper](evidence/stack-dashboard-helper-preflight.json) verifies
  the exact serialized native harness against real Gradio and Streamlit artifacts.
  Their native provider acceptance still needs separate runs.
- [PHP, Sinatra and Deno file persistence preflight](evidence/stack-file-profiles-preflight.json)
  verifies their exact launch commands, stored values and persistent volumes after
  full stops. These isolated checks do not add native-provider acceptance.
- [Ktor, Micronaut, Phoenix and Symfony transport preflight](evidence/stack-sqlite-framework-transport-preflight.json)
  verifies proxy-style requests and saved records after full application stops.
  Native provider acceptance remains pending for these four fixtures.
- [SQLite framework inspection preflight](evidence/stack-sqlite-file-preflight.json)
  independently queries saved SQLite records for Ktor, Micronaut, Phoenix and
  Symfony, including Phoenix WAL data, after product writes and full restarts.
  This opt-in test helper briefly pauses its explicit fixture container to copy
  a consistent database snapshot, resumes it, then queries the private copy.
  The reported SQLite version belongs to the inspector, not the application
  driver. These isolated checks do not add native-provider acceptance.
- [Full-suite result](evidence/stack-sqlite-file-tests.json): **189/189**
  checks passed locally and in isolated aswin Linux QA.
- [Physical source count](evidence/code-lines.json): **7,128 lines**, including
  product/tooling, tests, examples and browser test tools; excluding generated
  files, dependencies and documentation.
- [Historical verification details](evidence/STACK-VERIFICATION-HISTORY.md)
  preserve older measurements and the implementation timeline.
