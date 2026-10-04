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
later passing attempts do not erase them. Automated coverage is **292 passing checks in full local and isolated aswin QA runs**. Native coverage is 55 Google browser fixtures and
55 Codespaces HTTP/protocol fixtures. Every representative has passed both paths.
Codespaces native browser authorization and interaction remain pending.

## Preview registration diagnostic

A [Codespaces registration comparison](evidence/stack-codespace-preview-latency.json)
measured four initially absent product ports and four existing private mappings.
Starting the temporary loopback forwarder alongside the initial lookup produced
no useful measured benefit: absent-map means were 4.488s with the current ordering
and 4.468s with overlap; existing-map means were 1.766s and 1.835s respectively.
Every completed sample independently confirmed private visibility. This small
sequential probe does not measure full application launch or prove a general
performance difference. Production ordering remains unchanged; failed diagnostic
attempts and provider cleanup are retained in the receipt.

A subsequent [poll-interval comparison](evidence/stack-codespace-preview-poll.json)
measured 1,000 ms / 0 ms / 500 ms / 500 ms / 0 ms / 1,000 ms across six initially
absent fixture ports. Mean registration was 4.448s, 5.276s and 3.914s respectively.
Both zero-wait samples needed a third lookup; both 500 ms samples retained two
lookups and independent private confirmation. The default is now 500 ms, with the
same privacy gate and overall deadline. The observed 0.535s reduction comes from
two samples per interval on one Codespace, not a general launch-speed guarantee.

The change passed [264 local/Linux checks](evidence/stack-codespace-preview-poll-tests.json)
and [deployment preservation checks](evidence/stack-codespace-preview-poll-deployment.json).
[Two native cached-image launches](evidence/stack-codespace-preview-poll-native.json)
passed authenticated product HTTP and online SQLite integrity checks, retaining
19 → 20 → 21 through full application stops. Initially stopped compute took
43.431s to application health; the already-available relaunch took 9.663s.
These checks add neither first-image timing nor native browser acceptance.

## Browser readiness handoff

The browser polls every 250 ms during delivery/downloading/startup; build,
provisioning and stop polling stay at 1,000 ms, with existing failure backoff.
A [controlled browser comparison](evidence/stack-browser-handoff-comparison.json)
measured health-to-readiness-response delays of 726/896 ms before and 138/169 ms
after, with four versus seven status reads per launch. Real client/server/runner
and product save/reload/relaunch were exercised; provider and authorization were
simulated. These two samples per variant do not establish a native speedup.
Six new actual-client cases join the [270 passing local/Linux checks](evidence/stack-browser-handoff-tests.json).

[Native Google browser integration](evidence/stack-browser-handoff-native.json)
preserved SQLite 14 → 15 → 16 across writes, reloads and full application stops.
The first run resumed SUSPENDED compute with no image cache and fell back from
CDN to origin: 54.875s to health, with click-to-product time unmeasured. The RUNNING,
cached relaunch reached health in 9.333s and showed the product in 9.877s from the
browser action, completing a write in 10.598s. The client was deployed without a
server restart; all launches stopped. First-image 20s and native Codespaces
browser acceptance remain open. The fallback cause was not diagnosed in this gate.

## Image transfer failure diagnostics

[272 local/Linux checks](evidence/stack-cdn-fallback-tests.json) cover bounded
failure categories, first-failure preservation across cancelled range requests,
and server sanitization of the optional HTTP status. Existing deadlines, integrity
verification and the single origin fallback remain unchanged. No raw upstream
error message, signed URL, header or body enters this telemetry.

A [native diagnostic transfer](evidence/stack-cdn-fallback-diagnostic.json) verified
the existing 125,123,048-byte image in 5.532s on RUNNING Cloud Shell, using baseline
code and warm CDN paths. The earlier fallback did not reproduce; its cause remains
unknown. This probe neither started the product nor measured a cold transfer.

After [deployment](evidence/stack-cdn-fallback-deployment.json), two
[native browser launches](evidence/stack-cdn-fallback-native.json) reached health
in 10.079s/9.669s, displayed the product in 11.636s/10.050s, and completed button
writes in 12.370s/10.859s. Both had RUNNING compute and a cached image. SQLite
16 → 17 → 18 survived reload and full application stop/relaunch. All launches
stopped; saved artifacts and configuration were preserved. No native fallback
occurred in this integration gate. First-image speed and native Codespaces browser
acceptance remain open.

## Ready compute with an absent image

[Four native Google browser launches](evidence/stack-ready-first-image.json)
separate an older origin-only artifact from an existing CDN-backed artifact. All
began with RUNNING compute, retained saved data and used ordinary prepared links.

| Application / delivery | Image state | Health | Product visible | Button write |
| --- | --- | --- | --- | --- |
| Ktor / origin | Absent | 36.275s | 36.943s | 37.799s |
| Ktor | Cached | 7.029s | 7.585s | 8.473s |
| Micronaut / CDN | Absent | 20.875s | 21.632s | 22.556s |
| Micronaut | Cached | 9.056s | 9.516s | 10.375s |

Ktor spent25.271s downloading its138.947MB image from aswin; it had no CDN mapping
and made no CDN attempt. Micronaut's125.120MB image downloaded in7.682s, including
6.558s on the range path, then loaded into Docker in2.894s. It had no fallback.
These different-app observations are not a controlled origin/CDN comparison.

Both apps passed writes, reloads and full stop/relaunch, preserving SQLite
2 → 3 → 4 and18 → 19 → 20 respectively. Images and local image archives were
absent on first runs; existing Docker layers, manifest cache and database data
were preserved. CDN cache warmth was not measured. Neither first-image product
interaction met 20s, and no new transfer failure reproduced.

That inventory recorded 59 distinct prepared images with 4 stored CDN mappings;
55 older images (5.620GB total) used origin. These are image counts, not framework
counts. The following migration gate adds one mapping without rebuilding.

## Bounded image preparation

The launcher now prepares at most two images concurrently while serializing Docker
loads. Downloads may overlap a load, but each image retains its slot until that
load finishes. Full archive size/hash and Docker identity checks remain required.
A terminal failure cancels peer transfers, awaits cleanup and avoids an origin
retry caused solely by peer cancellation.

[292 local and isolated Linux checks](evidence/stack-image-pipeline-tests.json)
include eight new concurrency, cancellation and file-preservation regressions.
The [controlled comparison](evidence/stack-image-pipeline-comparison.json) used the
existing React + Express + PostgreSQL images (226,330,909 bytes), real Docker loads,
a shared 20 MiB/s HTTP limit and four alternating samples. Image preparation
averaged **21.570s before / 16.043s after**, a **25.6% reduction**. Docker content
was equally warmed and image-cache misses were simulated for each sample. This is
an isolated scheduling comparison, not native provider or full-product timing.
The 20-second product target remains unproven for general first-image launches.

The [protected deployment](evidence/stack-image-pipeline-deployment.json) preserved
all 59 prepared images, 135 artifact files and configuration. [Native Google
regression acceptance](evidence/stack-image-pipeline-native.json) passed two cached
React + Express + PostgreSQL launches and retained values **3 → 4 → 5** through
reloads and a complete stop. The second launch reached health in9.206s, showed the
actual product in9.852s and completed its button write in10.148s. First-launch
browser timing was not measured across token refresh. These cached results do
not measure transfer overlap or establish first-image performance.


## Existing-artifact delivery migration

The operator command documented in [README.md](README.md) verifies one explicitly
selected application's existing manifest, archive and every image before publishing
to the configured private release. Its default is an offline dry-run. Repeating
publication reuses verified assets; a partial failure retains completed mappings.
Developers and users keep their existing preparation and launch flow.
[284 passing local/Linux checks](evidence/stack-image-migration-tests.json) include
integrity rejection, partial-upload recovery, identity checks, safe CLI output and
unchanged artifact bytes.

[Live operator validation](evidence/stack-image-migration-operator.json) migrated
the existing 54,898,173-byte FastAPI image in 12.954s; repeat publication reused its
asset in 1.342s. Build records, immutable artifacts, configuration and the running
service stayed unchanged. At that checkpoint, 54 unmapped images totaled
5,565,417,613 bytes.

[Two native Google browser launches](evidence/stack-image-migration-native.json)
used the original prepared link and began on RUNNING compute:

| FastAPI + SQLite | Health | Product visible | Button write |
| --- | --- | --- | --- |
| Image absent, migrated CDN delivery | 15.539s | 17.309s | 17.939s |
| Cached relaunch | 5.461s | 5.946s | 6.389s |

The first run had no Docker image or image archive cache. Its four-range CDN
transfer succeeded without fallback: 4.338s image download, including 3.189s on the
range path, then 4.026s Docker load. Manifest cache, existing Docker layers and
database data were preserved; CDN cache warmth was not measured. SQLite 2 → 3 → 4
survived button writes, reloads and full application stops. Both launches stopped.
This representative met 20s; other first-image failures remain recorded, and native
Codespaces browser acceptance is still pending.

### React, Express and PostgreSQL migration

The [next operator gate](evidence/stack-multiservice-migration-operator.json)
published the three existing images (226,330,909 bytes) in 51.817s. Repeating the
same explicit selection reused all three assets in 3.549s. Artifact hashes, build
records, configuration and runtime process stayed unchanged. The PostgreSQL image
mapping also serves another existing prepared application that references the
same archive; that other application was not relaunched in this gate.

[Native Google browser acceptance](evidence/stack-multiservice-migration-native.json)
used the original React + Express + PostgreSQL launch link:

| Image state on RUNNING compute | Health | Product observed | Button write |
| --- | --- | --- | --- |
| All three absent | 48.805s | Within 52.609s* | At 52.899s* |
| All three cached | 9.433s | 9.938s | 10.339s |

*The first run includes a 6.514s gap between bounded browser observations. Its
product timing is an upper bound; it still clearly misses 20s. Cached timings are
continuous from the launch click. All three CDN downloads succeeded without
fallback. Image preparation took 37.624s, including 23.523s download and 13.955s
Docker load. Manifest cache and data were retained; CDN cache warmth was unknown.

PostgreSQL 1 → 2 → 3 survived writes, reloads and full application stops. Live
container inspection verified healthy API/database services, no published ports
for either dependency, and the database volume backed by persistent home storage.
Only the product port was published, on `0.0.0.0:21747`, as required by the current
runtime contract. Failed diagnostic attempts are retained: Node discovery needed
the launcher’s NVM search, and an incorrect loopback-only web assertion was fixed
in the inspector. Product code did not change. All temporary inspection keys were
removed while preserving the nine pre-existing keys; both previews stopped.

The current inventory is 59 distinct prepared images, eight CDN mappings and
51 unmapped images totaling 5,339,086,704 bytes. These are image counts, not
framework counts. Full-stack first-image speed and native Codespaces browser
acceptance remain open.

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
That experiment did not change production behavior. The subsequent implementation
uses direct key registration for already-running Cloud Shell compute and preserves
the normal start path for suspended or pending compute. If registration races
suspension, PODS resumes the same environment after confirming its key, within
one shared deadline. Lost responses are reconciled without repeating mutations;
authorization failures stop immediately. [Regression and full-suite evidence](evidence/stack-google-ready-tests.json)
covers both paths, cleanup and the suspension race. The 20-second product target
remains open.

[Deployment and native Google browser acceptance](evidence/stack-google-ready-native.json)
passed with the same prepared Micronaut + SQLite artifact. Both launches began on
the same already-running environment; the cached product appeared in 10.319s and 10.325s, with servers
healthy in 9.755s and 9.706s. Button writes, reload and full stop/relaunch retained
values 6→7→8. Direct key registration took 1.257s and 1.337s; neither launch issued
a start request. These are cached integration results, not first-image timings or
a controlled whole-launch comparison. Cold compute and a suspension race were
covered by automated regression tests, not forced during this native gate.

[Codespaces stage observations](evidence/stack-codespace-timings-native.json)
now separate provider readiness, private preview setup and runner delivery. Two
launches of the same cached Micronaut image passed authenticated product HTTP,
SQLite integrity and full stop/relaunch checks, retaining values 8→9→10.

| Stage | Initially Shutdown | Initially Available |
| --- | --- | --- |
| Before provider readiness | 12.636s | 0.504s |
| Private preview setup | 4.788s | 1.726s |
| Runner delivery over SSH | 9.213s | 4.381s |
| After delivery until healthy | 10.729s | 5.551s |
| Total until healthy, including small gaps | 37.381s | 12.171s |

These are server observations; Codespaces browser interaction remains pending.
Runner-internal timings are separate intervals and must not be added to these
stages again. The observation changes pass [225 local/Linux checks](evidence/stack-codespace-timings-tests.json).

A [four-sample command experiment](evidence/stack-bootstrap-overlap-probes.json)
found that opening SSH while checking private preview access reduced their combined
time from 5.492–6.897s sequentially to 3.788–3.871s. The probe withheld all script
bytes until the port was confirmed private, verified the same runner file, and
never started an application. Production was still sequential at that checkpoint.
The candidate required cancellation, deadline, privacy-gate and native application checks;
the small sample does not establish a full-launch speedup. A separate inline runner
transfer comparison saved only 0.371s on average and is not prioritized.

The gated SSH overlap is now deployed and passes [239 local/Linux checks](evidence/stack-ssh-overlap-tests.json),
including real child-process cancellation/reaping, separate wait/delivery deadlines,
privacy failures, retries and server shutdown. All bootstrap/config bytes remain
withheld until private preview setup succeeds. A waiting transport has a 65-second
limit; preview setup retains its 60-second budget and each delivery attempt gets
its own 60 seconds. The three-attempt limit and saved compute identity are preserved.

[Two native cached launches](evidence/stack-ssh-overlap-native.json), both initially
Available, became healthy in **9.788s and 8.597s**. Combined preview and bootstrap
time was 4.755s and 3.587s; those intervals include overlapping SSH setup and must
not be summed with it again. Authenticated product HTTP writes, online SQLite
integrity inspection and full stop/relaunch passed, retaining values 10→11→12.
The product port stayed private and no database port was exposed. Both launches
finished and stopped. These samples do not establish a universal speedup, first-image
performance, cold-compute performance or native Codespaces browser interaction.

A prior [ordinary developer URL build and native acceptance](evidence/stack-fresh-image-native.json)
exercise a new Micronaut + SQLite image after both provider optimizations.
Preparation took 218.662s on the server. Google reconnection returned to the
developer page and automatically continued the build; the finished launch link
opened the real application without terminal or configuration steps.

| Provider | Initial compute | New image: healthy | New image: product visible | Cached: healthy | Cached: product visible |
| --- | --- | --- | --- | --- | --- |
| Google Cloud Shell | Running | 20.323s | 21.115s | 9.044s | 10.291s |
| GitHub Codespaces | Available | 20.633s | Unverified | 8.946s | Unverified |

Both providers reported an image cache miss on the first launch and a hit on
the repeat. Existing Docker layers and other caches were preserved. A separate
cached Google launch kept compute ready and is excluded from these timings.
Image download/load took 7.506s/2.834s on Google and 6.507s/3.401s on Codespaces.
These are sequential integration samples, not an empty-machine benchmark or a
guaranteed speedup. **The 20-second first-image product target remains unmet.**

Google browser writes and reloads retained values 8→9→10 across full stops;
Codespaces authenticated product HTTP and SQLite online integrity checks retained
12→13→14. Every launch stopped successfully. Codespaces browser interaction,
provider VM replacement and power-loss durability remain separate, unverified gates.

This acceptance also uncovered and fixed an account-page initialization regression:
the provider API accidentally exposed its shutdown helper as a compute choice.
It now returns only Google and GitHub. A [real API/document regression and the full
240-check local/Linux suite](evidence/stack-provider-bootstrap-tests.json) pass;
the developer page and automatic reconnection/build continuation were verified live.

A subsequent [four/eight-range comparison](evidence/stack-image-range-parallelism.json)
downloaded identical 125.120 MB bytes from four distinct new private asset paths
on ready Codespaces compute, in 4/8/8/4 order. Verified downloads took
4.777/2.616/3.443/5.905s. Eight ranges averaged 3.030s versus 5.341s for four;
shared CDN caches and network variation remain uncontrolled. All temporary assets
were deleted and their absence verified. This measures transfer only, not Google
performance, Docker loading or product readiness.

Images of at least 64 MiB now use eight concurrent ranges; smaller ranged downloads
retain four. The [242-check local/Linux suite](evidence/stack-eight-ranges-tests.json)
verifies uneven archive reconstruction and cancellation of all seven peers on a
failure, alongside existing integrity and fallback checks. The 30-second deadline,
private temporary files, full SHA verification before Docker loading and authenticated
origin fallback remain unchanged.

[Fresh native acceptance](evidence/stack-eight-ranges-native.json) used an ordinary
developer URL build prepared in 217.780s. Both providers initially missed the new
image cache and completed a verified range download without origin fallback.

| Eight-range launch | New image: healthy | New image: product visible | Cached: healthy | Cached: product visible |
| --- | --- | --- | --- | --- |
| Cloud Shell, running | 19.377s | 20.667s | 9.188s | 10.223s |
| Codespaces, available | 28.725s | Unverified | 9.277s / 8.512s | Unverified |

Image download/load took 5.923s/2.797s on Google and 4.545s/3.209s on Codespaces.
Codespaces preview setup took 11.808s on its first launch. Its initial test harness
failed while parsing an HTML status-poll response after launch creation; the HTTP
status and cause were not retained. The same running product was subsequently
verified and stopped through its original authenticated session. Both following
cached launches passed the uninterrupted harness. The original failure is retained,
so this is not an all-attempts-passed result.

Google browser writes/reloads/full stops retained SQLite values 10→11→12.
Codespaces product HTTP and online SQLite inspection retained 14→15→16→17 through
full stops, with private product access, no exposed database ports and no pause.
All five launches stopped. The [deployment](evidence/stack-eight-ranges-deployment.json)
and final health/SQLite/idle audit passed. These small samples do not establish a
controlled full-launch speedup. **The 20-second first-image product target remains
unmet**, and native Codespaces browser interaction remains unverified.

The native test harness now saves each attempt before launch creation and each
known launch before status polling. Unexpected HTML or malformed JSON preserves
HTTP status/content type without saving response bodies. A later attempt cannot
overwrite an earlier success, and an ambiguous stop response is reconciled with
GET without repeating the stop request. [Eight CLI regressions and the full
250-check local/Linux suite](evidence/stack-live-evidence-tests.json) pass. This
improves test evidence and cleanup; production launch behavior is unchanged.
[Two native cached launches with the corrected harness](evidence/stack-live-evidence-native.json)
passed at 10.829s and 9.249s, retained SQLite values 17→18→19 across full stops,
and recorded both stop confirmations. The same prepared image was reused. These
checks add no new-image timing or native Codespaces browser acceptance.

The product browser now automatically recovers temporary build/launch status-read
failures, preserving the original operation and automatic product navigation.
It bounds recovery to three retries, times out stalled reads, stops on denied
requests and ignores responses from operations the user has left or stopped.
Creation, stop and product writes are never automatically resubmitted.
[Fourteen client regressions and the full 264-check local/Linux suite](evidence/stack-browser-recovery-tests.json)
pass. A [real-browser before/after check](evidence/stack-browser-recovery-browser.json)
reproduced the old stuck progress screen, then recovered two simulated errors
during preparation and two during launch without an extra progress click. The
actual notes product opened automatically and retained a saved note on reload.
These injected faults used local simulated providers, not native cloud failures.
[Two deployed Cloud Shell browser launches](evidence/stack-browser-recovery-native.json)
then opened the actual product automatically in 11.548s and 10.726s, retained
SQLite values 12→13→14 through reload and full stop/relaunch, and stopped normally.
Both reused a cached image on running compute. The server and runner stayed
running unchanged; the served browser source matched the tested revision.

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
- [Full-suite result](evidence/stack-image-pipeline-tests.json): **292/292**
  checks passed locally and in isolated aswin Linux QA.
- [Physical source count](evidence/code-lines.json): **8,597 lines**, including
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
