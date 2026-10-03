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
| .NET | ASP.NET Core, Blazor Server | ASP.NET file counter and Blazor SQLite write/read/restart; Blazor interactive server UI passed |
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
later passing attempts do not erase them. Automated coverage is **58 passing
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
`evidence/stack-angular-ssr-google.json`. The optimized artifact retest below
also adds Codespaces HTTP/database coverage for this fixture.

## Native Quarkus JVM workflow

The real developer form prepared Quarkus + SQLite from repository revision
`00df7c09ea97` in **222.751 seconds**, producing a 138.0 MB prebuilt download.
Cloud Shell opened the real Quarkus page. A browser write changed SQLite 0→1;
reload and full stop/relaunch retained 1.

- Cloud Shell uncached: **46.008 seconds** to ready, including **34.982 seconds**
  loading the image.
- Cloud Shell cached: **8.442 seconds** to ready; **9.923 seconds** from the launch
  click until the native product displayed the saved record.
- Codespaces: **72.764 seconds** uncached and **8.207 seconds** cached to ready.
  Authenticated HTTP product/database interaction is recorded separately;
  native browser sign-in is still pending.

An independent Chrome session started without a PODS connection or history,
opened the shared link, selected the already-authorized Google account, and
continued automatically to the native product. Its write 1→2 survived reload.
The server confirms two distinct PODS sessions. This proves a separate browser
journey using the same Google identity and compute; it does not test a second
Google account. No terminal, access-token entry or manual installation was needed
in that browser journey.

See `evidence/stack-quarkus-url.json`, `evidence/stack-quarkus-google.json`,
`evidence/stack-quarkus-codespaces.json` and its interaction evidence.

## Native Laravel workflow

After the existing preparation quota window opened, the real developer form
prepared Laravel + SQLite at revision `00df7c09ea97` in **270.053 seconds**. The
222.1 MiB image was built once on aswin and reused on both providers.

| Scenario | Observed result |
| --- | --- |
| Cloud Shell, uncached image | 80.740 seconds to ready; 70.087 seconds receiving/loading the image |
| Cloud Shell, cached relaunch | 5.571 seconds to ready; **8.187 seconds** click-to-native product with saved data |
| Cloud Shell, browser interaction | SQLite write 0→1, reload 1, full stop/relaunch 1 |
| Codespaces, resumed compute and uncached image | 110.093 seconds to ready; 76.423 seconds receiving/loading the image |
| Codespaces, cached relaunch | 6.777 seconds to ready |
| Codespaces, authenticated HTTP interaction | Write/read 0→1, confirmed stop, a fresh launch retained 1, then write/read 1→2 |

The Codespaces test now fails if stop is not confirmed, the repeat launch reuses
the previous ID, or the saved counter does not survive. This is HTTP/database
evidence inside the Codespace; native browser sign-in remains pending. The
Cloud Shell browser measurement uses one continuous click/navigation/value check.
Uncached launches exceed the 20-second target even when compute already exists.

Evidence: `evidence/stack-laravel-url.json`, `evidence/stack-laravel-google.json`,
`evidence/stack-laravel-codespaces.json`. The earlier rate-limit observation is
retained in `evidence/stack-laravel-url-pending.json`; the quota was not bypassed.

The current deployment has Google browser OAuth configured. GitHub browser OAuth
is **not configured** (`oauthReady: false`); its tested API path uses an explicit
preview token connection. Native GitHub sign-in and configured PODS GitHub OAuth
are both required before claiming the complete Codespaces one-click flow.

## Smaller prepared npm containers

Generated npm containers now install and build with a temporary download cache,
then remove that cache in the same Docker layer. Installed dependencies and
build output are retained. Existing Dockerfiles and other package managers are
unchanged. Eight affected real fixtures were rebuilt, launched, restarted and
exercised in the browser after this change; all passed.

| Fixture | Previous gzip MiB | New gzip MiB | Reduction |
| --- | ---: | ---: | ---: |
| angular-ssr | 238.0 | 141.8 | 40.4% |
| adonis | 85.1 | 82.3 | 3.3% |
| nestjs | 83.3 | 81.3 | 2.4% |
| next | 282.2 | 181.0 | 35.9% |
| nuxt | 245.2 | 126.6 | 48.4% |
| sveltekit | 137.8 | 98.4 | 28.6% |
| astro | 188.1 | 119.1 | 36.7% |
| react-router | 146.3 | 95.7 | 34.6% |

Filesystem probes inside all eight new images confirm the temporary npm cache
and default download cache are absent, with installed dependencies still present.
The 52 automated checks also pass locally and on aswin. See
`evidence/stack-npm-cache-comparison.json`, `stack-npm-cache-footprint.json`,
`stack-matrix-24.json` and `stack-browser-24.json`. The rejected QA invocation is
retained in `stack-matrix-23.json`.

A new real developer submission prepared the optimized Angular artifact in
**155.221 seconds**. Its source folder is unchanged between fixture revisions
`5f376f60ed9c` and `00df7c09ea97`; the prepared image is 141.8 MiB.

| Optimized Angular scenario | Observed result |
| --- | --- |
| Cloud Shell, existing VM and uncached image | 61.933 seconds to ready, including 51.701 seconds image transfer/loading |
| Cloud Shell, cached | 5.867 seconds to ready; **8.312 seconds** click-to-native saved product |
| Cloud Shell, database | Previous artifact's value 1 retained; write 1→2, reload 2, confirmed stop/relaunch 2 |
| Codespaces, resumed VM and uncached image | 94.454 seconds to ready, including 50.404 seconds image transfer/loading |
| Codespaces, cached | 7.179 seconds to ready |
| Codespaces, authenticated HTTP/database | Write 0→1; confirmed stop and fresh launch retained 1; second write/read 1→2 |

The uncached Google observation improved from 72.289 to 61.933 seconds but still
exceeds the 20-second target. These are individual observations, not a guarantee
or a controlled latency benchmark. The first browser wait expired while the
same launch continued; its later 75.069-second observation includes tool-call
gaps. Only the cached browser timing was measured in one continuous check.
Codespaces native browser authorization remains unverified. Other seven recipe
fixtures have rebuilt server/browser evidence but no new provider timing claims.
See `evidence/stack-angular-ssr-optimized-{url,google,codespaces}.json`.

## Native Blazor Server workflow

The developer form prepared the real Blazor Server + SQLite application at
revision `00df7c09ea97` in **186.353 seconds**, producing a 102.6 MiB image. The
generated .NET recipe published it on aswin without a developer-written PODS
manifest. The same artifact launched on both providers.

| Scenario | Observed result |
| --- | --- |
| Cloud Shell, existing VM and uncached image | 31.573 seconds to health; 23.626 seconds receiving/loading the image |
| Cloud Shell, cached launch | 6.523 seconds to health; 7.844 seconds to native page with saved SQLite value |
| Cloud Shell, interaction and persistence | Blazor button wrote 0→1; reload and stop/relaunch retained 1; later writes/reloads reached 3 |
| Cloud Shell, cached successful interaction | **14.714 seconds upper bound** from launch click through native button write 2→3, including a browser-tool gap |
| Codespaces, resumed compute and uncached image | 57.435 seconds to health |
| Codespaces, cached launch | 7.068 seconds to health |
| Codespaces, authenticated HTTP/database | Write/read 0→1; confirmed stop and fresh launch retained 1; second write/read 1→2 |

Blazor's server-rendered page can appear before its interactive connection. One
immediate button click after page visibility was ignored; a later click after
the WebSocket connected worked. That observation is retained. The final measured
launch waited for evidence of the new connection before one successful button
click; its 14.714-second upper bound includes a tool-call gap. It does not claim
the first rendered frame is interactive or establish a latency guarantee.

The PODS title now decodes HTML character references safely, so this application
appears as `Blazor + SQLite` instead of `Blazor &#x2B; SQLite`. Browser checks cover
encoded symbols and literal markup rendered as text. All 52 automated checks pass
locally and on aswin. Codespaces native browser sign-in and OAuth remain pending.
See `evidence/stack-blazor-{url,google,codespaces}.json` and `browser-title.json`.

## Native Go Gin workflow

The developer form prepared the Gin application from its repository folder at
revision `00df7c09ea97` in **287.355 seconds**. Its existing Dockerfile compiles a
Go executable on aswin and packages it in an **11.1 MiB** runtime image. Its
counter uses a persistent file; this fixture does not demonstrate a database.

| Cloud Shell scenario | Observed result |
| --- | --- |
| Existing VM, image initially absent | 9.822 seconds to health; 2.867 seconds receiving/loading the image |
| First-image browser interaction | **12.764 seconds** from launch click through native button write 0→1 |
| Cached launch | 6.256 seconds to health; 8.858 seconds to native product with saved count |
| Cached browser interaction | **9.174 seconds** from launch click through native button write 1→2 |
| Persistence | Reload retained 1; confirmed stop/relaunch retained 1; later reload retained 2 |

Both browser timings use one continuous launch/navigation/value/write check.
These observations meet the 20-second target for this small compiled application
on already-running Cloud Shell compute, including its first image transfer.
They do not measure new VM provisioning or generalize to larger runtime images.
See `evidence/stack-gin-url.json` and `evidence/stack-gin-google.json`.

Codespaces was already available. Its initial attempt correctly failed because
the previous Blazor test still owned port 8080. After verifying and stopping only
that test runner, Gin reached health in **10.828 seconds with its image absent**
and **7.393 seconds cached**. The small artifact manifest was already cached by
the failed attempt; the first successful launch still downloaded and loaded the
Gin image. Authenticated HTTP write/read 0→1, confirmed stop, fresh launch retaining
1, and write/read 1→2 all passed. The final test application was stopped without
removing its persistent data. Native Codespaces browser interaction remains
unverified. See `evidence/stack-gin-codespaces.json`, its `-before` environment
snapshot and retained `-conflict` attempt/recovery evidence.

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

## Native background worker and Redis

The real developer form prepared `examples/stacks/worker-redis` at public fixture
commit `00df7c0` in **138.088 seconds**, producing 65.3 MiB across two immutable
images shared by the web, worker and Redis services. The deployed launcher is
`004c64b`.

| Check | Result |
|---|---|
| Cloud Shell, existing VM with both images absent | 29.905 seconds to health; 32.321-second upper bound to native product |
| Cloud Shell, cached launch | 8.254 seconds to health; 11.233 seconds to product displaying the retained job |
| Cloud Shell, actual worker interaction | First job completed in 444 ms; cached launch to a new completed job took 11.543 seconds continuously |
| Cloud Shell persistence | Completed result retained after reload and confirmed full stop/relaunch; a second job also survived reload |
| Codespaces, both images absent | 31.143 seconds to health |
| Codespaces, cached launch | 9.308 seconds to health |
| Codespaces authenticated HTTP | Completed job, confirmed stop, fresh launch, retained job and distinct new completed job; both launches stopped |

The initial 304 ms browser heading match was the PODS launcher title and is
excluded from product timing. Native Google verification waits for the actual
worker input and completed result. Codespaces native browser sign-in remains
pending; its authenticated HTTP results do not certify that browser journey.
Evidence: `stack-worker-redis-{url,google,codespaces}.json`.
These checks cover completed jobs, not exactly-once delivery or in-flight recovery.

The launcher now checks all services, including worker and database health,
before readiness and on subsequent heartbeats. An isolated real-container fault
test reported worker death in 2.576 seconds and database health failure in 2.564
seconds while the web page still returned HTTP 200. Graceful cleanup completed
later and preserved the completed job across relaunch. A successful one-time
migration remained valid. The initial delayed-failure test is retained alongside
the passing result in `evidence/container-liveness*.json`.

The WebSocket gate uses `PODS_WEBSOCKET_CHECK=1`: real message-based counter
updates, socket reconnect and SQLite persistence after application restart.
The actual developer URL submission prepared Bun in **106.981 seconds** and
produced a 62.4 MiB image. Codespaces reached health in **24.716 seconds** with
that image absent and **7.138 seconds** cached. Both authenticated SSH probes
passed: ping/pong, WebSocket counter update, reconnect and HTTP readback;
the second launch retained count 1 before incrementing to 2. Both stopped.
This proves the protocol on user compute, not native browser/proxy authorization.

The first native Cloud Shell Bun attempt failed safely because port 8080 was
occupied. The earlier worker had stopped; another browser session had since
launched a new worker on the same environment. Its actual product remained
visible. PODS now prevents cross-session concurrent launches for the same
provider account before dispatch, without revealing or handing over the other
session’s launch. Existing active records acquire a private account lock on
upgrade when their connection identity is available. Legacy records whose
identity has already been swept still rely on the runner’s port check.

The newer worker expired naturally and was confirmed stopped before retry. Bun
then passed native Cloud Shell WebSocket button writes, reload and full stop /
relaunch SQLite persistence (0→1, then retained 1→2). With the image absent but
the manifest cached by the failed attempt, health took **20.170 seconds**; fully
cached health took **5.678 seconds**. The cached native browser displayed the
retained record in **9.125 seconds** and completed its WebSocket write in
**9.430 seconds** continuously from launch. The first interaction was observed
within 31.359 seconds, including an unrelated tool-call gap; it is not a precise
readiness measurement. Both successful previews were confirmed stopped.
A healthy Gin application on Codespaces remains the negative protocol control:
HTTP succeeds, its WebSocket handshake fails, and cleanup is confirmed. See
`evidence/stack-bun-{url,codespaces,google}.json`,
`evidence/compute-account-lock-tests.txt`, and
`evidence/stack-websocket-probe-{qa,negative,guards}.json`.

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

## Ruby runtime preparation and native Rails evidence

The real developer form prepared Rails + SQLite in **280.507 seconds**. Its
original 239.5 MiB image passed two Codespaces authenticated HTTP/database
launches: **104.115 seconds** resumed with the image absent, then **8.193 seconds**
cached. Writes 0→1 and 1→2 survived readback and full application stop/relaunch.
The first launch included 62.846 seconds of image loading. Native Codespaces
browser authorization is still pending. See `evidence/stack-rails-url.json` and
`evidence/stack-rails-codespaces.json`.

Ruby preparation now compiles native gems in a build stage and delivers a
separate runtime with the required shared libraries. Real isolated rebuilds
reduced compressed Rails images from **251,119,273 to 93,313,156 bytes (62.8%)**
and Sinatra from **216,259,334 to 72,508,238 bytes (66.5%)**. Both passed artifact
launch, SQLite write/read/full restart and actual browser write/reload. Rails
also retained data from its previous image. Offline probes loaded PostgreSQL,
SQLite and C++ shared libraries and verified compiler tools and gem download
caches are absent. This size improvement was subsequently retested natively for Rails below.
Sinatra native provider speed remains unmeasured. Existing prepared versions are unchanged.
See `evidence/stack-ruby-image-comparison.json`, `stack-ruby-runtime-audit.json`,
`stack-matrix-25.json` and `stack-browser-25.json`.

The optimized Rails version was then prepared through the actual developer form
in **390.875 seconds**, producing a **93,312,249-byte (89.0 MiB)** image.

| Optimized Rails scenario | Measured result |
| --- | --- |
| Cloud Shell, image absent on existing compute | Health 32.105s; saved record visible 33.931s; completed browser write 34.230s |
| Cloud Shell, cached | Health 9.345s; retained record visible 10.687s; completed browser write 10.966s |
| Codespaces, resumed/image absent | Health 59.936s; image loading 23.563s; earlier version's SQLite record 2 retained, then wrote 3 |
| Codespaces, cached | Health 9.112s; retained 3, then wrote 4 |

Both Google native browser launches passed write/reload and full application
restart persistence. Both Codespaces authenticated HTTP launches passed product
and database checks. All four previews stopped cleanly. Codespaces native browser
authorization is still pending. Compared with the original Rails sample, image
loading fell from 62.846s to 23.563s and resumed launch health from 104.115s to 59.936s;
these are separate observed runs, not a controlled benchmark or cold-launch
guarantee. The uncached launches still exceed 20s.
Evidence: `evidence/stack-rails-optimized-{url,google,codespaces}.json`.

## Nuxt SSR native acceptance and session recovery

The actual developer form prepared Nuxt in **241.125 seconds** and produced a
126.6 MiB image. It then passed two native Cloud Shell browser launches and two
Codespaces authenticated HTTP/JavaScript asset checks.

| Nuxt scenario | Measured result |
| --- | --- |
| Cloud Shell, existing compute/image absent | Health 64.995s, including 55.911s image loading |
| Cloud Shell, cached | Health 6.865s; actual counter visible 7.642s; successful browser interaction **7.936s** |
| Codespaces, resumed/image absent | Health 100.893s, including 56.193s image loading |
| Codespaces, cached | Health 6.801s; SSR counter and JavaScript entry fetch passed |

The first Google page was visible by 65.516s, but its first click before client
hydration did not change the counter. A later click worked by 94.010s; these are
observation upper bounds with tool gaps, not continuous interaction measurements.
The cached measurement was continuous and passed on its first click. Both
launches reset the counter to zero on reload, as this fixture intentionally uses
transient client state. This is not database durability evidence. All four
previews were confirmed stopped. Codespaces browser hydration and authorization
remain pending. See `evidence/stack-nuxt-{url,google,codespaces}.json`.

The initial developer attempt was rejected for stale CSRF before any build was
created. Ordinary reconnection then succeeded; the reason the original session
changed is unknown. The browser now handles that precise rejection with one
forced provider reconnection, preserving the intended repository, folder or app.
CSRF and origin checks remain enforced, and arbitrary 403s do not trigger recovery.
A local real-browser fixture verified preparation recovery, bounded repeated
failure, and automatic launch into a working notes product with save/reload.
Those provider/OAuth components were simulated. All 56 automated tests pass.
See `evidence/browser-session-recovery.json` and `stack-nuxt-session-rejection.json`.

## Django and SQLite native acceptance

The actual developer URL form prepared Django in **109.340 seconds**, producing
one **58,765,738-byte (56.0 MiB)** reusable image. No launch-time installation or
manual configuration was required from the user.

| Django scenario | Measured result |
| --- | --- |
| Cloud Shell, existing compute/image absent | Health 21.853s; saved record visible 23.694s; browser database write **23.974s** |
| Cloud Shell, cached | Health 6.461s; retained record visible 7.788s; browser database write **8.067s** |
| Codespaces, existing compute/image absent | Health 25.116s; authenticated HTTP/SQLite write 0→1 and readback passed |
| Codespaces, cached | Health 6.903s; retained 1, wrote 2 and readback passed |

Both Google browser writes survived reload, and record 1 survived full application
stop/relaunch before write 2. Codespaces independently passed the same database
restart sequence through authenticated HTTP. All four previews were confirmed
stopped. These are existing-compute measurements, not fresh VM provisioning;
first-image launches exceeded 20s. Codespaces native browser authorization and
Cloud Shell VM replacement remain pending. Evidence:
`evidence/stack-django-{url,google,codespaces}.json`.

## Image delivery diagnostics

The launcher now records cache checks, verified image download and Docker load
separately, including failed attempts. Archive reuse is distinguished from an
already installed image. This adds diagnostics, not a claimed speedup. All 58
automated checks pass locally and on aswin; corrupt/truncated/oversized downloads
and mismatched loaded identities remain rejected.

The deployed runner retained Django SQLite data on both providers. Cloud Shell
showed the saved record in 7.870s and completed a browser write in 8.140s. Two
Codespaces authenticated HTTP launches reached health in 6.881s and 6.386s and
retained SQLite data across a full stop/relaunch. All three previews stopped.
These were cached-image checks; native uncached phase measurements remain pending.
See `evidence/image-phases.json` and `evidence/image-phases-codespaces.json`.
