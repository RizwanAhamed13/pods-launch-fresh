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
later passing attempts do not erase them. Automated coverage is **214 passing checks in full local and isolated aswin QA runs**. Native coverage is 55 Google browser fixtures and
55 Codespaces HTTP/protocol fixtures. Every representative has passed both paths.
Codespaces native browser authorization and interaction remain pending.

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

A [breakdown of four recent single-image fixtures](evidence/stack-image-delivery-analysis.md)
records 22.525–30.117s for uncached image delivery alone, at 5.514–5.555 MB/s
including HTTP, hashing and disk writes. Smaller images or faster delivery need
a measured follow-up; runtime startup tuning alone cannot meet20s for those
observations. This does not identify the limiting network segment or compare
provider performance under controlled conditions.

A [byte-identical Micronaut recompression probe](evidence/stack-image-recompression.json)
found that stronger outer gzip saves only 0.1726% of the published 125.123 MB image;
all six image layers were already gzip-compressed. Production compression is unchanged.

A [private artifact-delivery experiment](evidence/stack-artifact-cdn.json) uploaded
that exact image once from aswin in 29.576s, then downloaded it to already available
Codespaces compute in 14.985s and 0.792s. Both fresh temporary files matched the
published SHA-256 and were removed. Unauthenticated asset access returned404;
the compute download used a short-lived signed URL without a GitHub token.
The artifact repository is private. The large difference between the two download
observations must not be treated as a guarantee for new clients or regions.

The optional delivery implementation passes [204 local and Linux checks](evidence/stack-image-delivery-tests.json)
and is [deployed with existing artifacts preserved](evidence/stack-image-delivery-deployment.json).
A [fresh developer build and native acceptance run](evidence/stack-image-delivery-native.json)
prepared Micronaut + SQLite in 247.080s and published its new image to private
artifact storage. Both providers downloaded that image through the authorized CDN
path, with zero image-cache hits and no origin fallback. Image transfer took
16.400s on Cloud Shell and 17.602s on Codespaces, including hashing and disk writes.

| New-image native run | Initial compute | Application ready | Cached relaunch ready |
| --- | --- | --- | --- |
| Google Cloud Shell | Suspended | 45.924s | 10.671s |
| GitHub Codespaces | Shutdown | 64.944s | 11.686s |

Cloud Shell's real product page passed button writes, reload and full stop/relaunch;
the cached page was observed in 12.004s. Its first browser observation includes a
measurement gap and a corrected test-selector wait, so 56.620s is an observed
upper bound, not an exact paint measurement. Codespaces passed authenticated
product HTTP and SQLite integrity checks; native browser interaction remains pending.
Both providers retained the earlier count of 2 across the new build, then saved
3 and 4 across full application restarts. All four launches were stopped.

The 20-second first-launch target remains unmet. After compute became ready,
delivery and startup still took 32.549s and 49.537s respectively. These results
do not prove an uncached launch beginning on already-ready compute. CDN timings
are nested within image-download timings; the historical origin tests are not a
controlled side-by-side comparison. VM replacement durability is a separate gate.

A [fresh-asset transfer comparison](evidence/stack-cdn-range-experiment.json) verified the same 125.121 MB image in 5.504s using four concurrent ranges, versus 15.326s for a single request including the extra disk check. The two methods used separate new private asset paths on the same available Codespace; this is one sequential comparison, not a guaranteed speedup. Both temporary assets were removed. The large-image range implementation passes [211 local and Linux checks](evidence/stack-cdn-range-tests.json). [Native acceptance of the range path](evidence/stack-cdn-range-native.json) used a new ordinary developer build prepared in 257.820s. Both providers reported an absent image, one successful range download and no origin fallback.

| Range-download launch | Initial compute | Image delivery | Application healthy | Cached healthy |
| --- | --- | --- | --- | --- |
| Google Cloud Shell | Running | 6.215s | 20.755s | 10.058s |
| GitHub Codespaces | Available | 5.218s | 25.357s | 11.149s |

Google's actual product was observed at 22.006s, then 11.465s on the cached relaunch. Both providers retained SQLite value 4 across the new version and saved 5 then 6 across reload and full stop/relaunch. Codespaces passed product HTTP and online SQLite integrity inspection with private ports; native browser acceptance remains pending. Existing Docker layers and saved data were retained, so these are new-image launches on previously used compute, not empty-machine benchmarks.

The [first Codespaces attempt failed](evidence/stack-cdn-range-preview-failure.json) after 15.831s during preview-port lookup, before the runner or image download began. A subsequent read-only lookup on aswin took 24.147s; GitHub was observed transitioning through Starting to Available. Two later application launches passed. The failed attempt and its unsuccessful stop confirmation remain recorded; no active launch or application was left running. The preview lookup's premature 15-second command bound is corrected by a [shared deadline fix with 214 passing local/Linux checks](evidence/stack-preview-budget-tests.json). Commands and polling now use the remaining 60-second stage budget. [Two native Codespaces launches after deployment](evidence/stack-preview-budget-native.json) passed at 11.259s and 11.736s with cached images, preserving SQLite values 6→7→8 through full app restarts. The original 24.147s delay is covered by a deterministic before/after regression; it was not reproduced as a slow native response on demand. These functional retries do not establish a first-click success guarantee or meet the 20-second product target.

A [Google setup probe](evidence/stack-google-key-registration-probe.json) compared
two `start` and two `addPublicKey` calls on the same running environment. Mean
registration-through-SSH time was 2.793s and 2.329s respectively, excluding key
generation and the initial environment read. All four SSH checks passed and all
temporary keys were removed. The observed 0.464s difference is a small-sample
optimization candidate, not a full-launch result or a latency guarantee.
Production behavior is unchanged; the 20-second product target remains open.

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
- [Published matrix verification](evidence/stack-wide-support-published.json)
  records the live 55/55/55 summary, latest framework rows and healthy deployment.
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
- Deno native acceptance: [developer build](evidence/stack-deno-url.json),
  [Cloud Shell browser](evidence/stack-deno-google.json), and
  [Codespaces product and file persistence](evidence/stack-deno-codespaces.json).
  Both paths retained the counter across full application stop/relaunch.
- Gradio native acceptance: [developer build](evidence/stack-gradio-url.json),
  [Cloud Shell browser](evidence/stack-gradio-google.json), and
  [Codespaces dashboard protocol and SQLite inspection](evidence/stack-gradio-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- Ktor native acceptance: [developer build](evidence/stack-ktor-url.json),
  [Cloud Shell browser](evidence/stack-ktor-google.json), and
  [Codespaces HTTP and SQLite snapshot inspection](evidence/stack-ktor-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- Micronaut native acceptance: [developer build](evidence/stack-micronaut-url.json),
  [Cloud Shell browser](evidence/stack-micronaut-google.json), and
  [Codespaces HTTP and SQLite snapshot inspection](evidence/stack-micronaut-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- Phoenix native acceptance: [developer build](evidence/stack-phoenix-url.json),
  [Cloud Shell browser](evidence/stack-phoenix-google.json), and
  [Codespaces HTTP and SQLite snapshot inspection](evidence/stack-phoenix-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- Streamlit native acceptance: [developer build](evidence/stack-streamlit-url.json),
  [Cloud Shell browser](evidence/stack-streamlit-google.json), and
  [Codespaces dashboard protocol and SQLite inspection](evidence/stack-streamlit-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- Symfony native acceptance: [developer build](evidence/stack-symfony-url.json),
  [Cloud Shell browser](evidence/stack-symfony-google.json), and
  [Codespaces HTTP and SQLite snapshot inspection](evidence/stack-symfony-codespaces.json).
  Both paths retained the saved count across full application stop/relaunch.
- [Rust and ASP.NET transport preflight](evidence/stack-counter-transport-preflight.json)
  checks empty chunked POST and full-restart file persistence on isolated compute.
  These checks do not add native-provider acceptance.
- [Shared file-counter probe preflight](evidence/stack-file-counter-runtime-preflight.json)
  verifies the native inspection helper against real Rust and ASP.NET artifacts.
  These isolated checks do not add native-provider coverage.
- [Gradio and Streamlit protocol preflight](evidence/stack-dashboard-protocol-preflight.json)
  verifies real dashboard protocol writes and SQLite persistence after a full
  restart in isolated QA. Native Gradio and Streamlit evidence is linked above.
- [Shared dashboard helper](evidence/stack-dashboard-helper-preflight.json) verifies
  the exact serialized native harness against real Gradio and Streamlit artifacts.
  Native provider acceptance uses separate runs and evidence.
- [PHP, Sinatra and Deno file persistence preflight](evidence/stack-file-profiles-preflight.json)
  verifies their exact launch commands, stored values and persistent volumes after
  full stops. These isolated checks do not add native-provider acceptance.
- [Ktor, Micronaut, Phoenix and Symfony transport preflight](evidence/stack-sqlite-framework-transport-preflight.json)
  verifies proxy-style requests and saved records after full application stops.
  Native evidence for all four frameworks is linked above.
- [SQLite framework inspection preflight](evidence/stack-sqlite-file-preflight.json)
  independently queries saved SQLite records for Ktor, Micronaut, Phoenix and
  Symfony, including Phoenix WAL data, after product writes and full restarts.
  This earlier test helper briefly paused its explicit fixture container to copy
  a consistent database snapshot, resumes it, then queries the private copy.
  The reported SQLite version belongs to the inspector, not the application
  driver. These isolated checks do not add native-provider acceptance.
- [Full-suite result](evidence/stack-sqlite-online-tests.json): **193/193**
  checks passed locally and in isolated aswin Linux QA.
- [Physical source count](evidence/code-lines.json): **7,747 lines**, including
  product/tooling, tests, examples and browser test tools; excluding generated
  files, dependencies and documentation.
- [Historical verification details](evidence/STACK-VERIFICATION-HISTORY.md)
  preserve older measurements and the implementation timeline.

Streamlit native preparation hit the shared prepared-image storage budget before
publication; [the failed attempt](evidence/stack-streamlit-storage-failure.json) is
retained. The operator budget is now configurable, with [192 passing local and
isolated Linux checks](evidence/stack-image-budget-tests.json). The storage-budget
change itself added no native acceptance; subsequent fixture checks are recorded separately.
The [deployment audit](evidence/stack-image-budget-deployment.json) confirms an
8 GiB budget on aswin with existing images and artifacts preserved.

Streamlit's next ordinary-quota build succeeded, but its first Cloud Shell browser
attempt showed an empty dashboard and WebSocket errors. The [failed browser attempt](evidence/stack-streamlit-browser-failure.json)
is retained separately from HTTP readiness. An [isolated Streamlit 1.65 origin test](evidence/stack-streamlit-origin-probe.json)
reproduced a 403 behind a rewritten Host header. Setting the exact provider preview
hostname accepted that origin and kept an unrelated origin rejected, with CORS and
XSRF enabled. The native browser retry now passes button writes, reload and full restart;
its two successful runs used the image cached by the failed first attempt.

The first Symfony Codespaces run exposed a test-harness race: pausing its container
for database copying could trigger normal runtime liveness failure. That
[failed attempt](evidence/stack-symfony-snapshot-failure.json) is retained. The probe
now uses a SQLite online backup without pausing the application; [four real framework
checks](evidence/stack-sqlite-online-preflight.json) reproduced the old conflict and
passed continuous liveness, committed WAL reads and restart persistence with the
new method. The [193-check local/Linux suite](evidence/stack-sqlite-online-tests.json)
passes; production runtime health checks are unchanged.
