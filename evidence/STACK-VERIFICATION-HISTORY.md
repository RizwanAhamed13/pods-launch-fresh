# Historical stack verification records

Archived from SUPPORT.md at commit ea5135e. Counts and timings below describe
their recorded checkpoints; consult [the current support guide](../SUPPORT.md)
for current coverage. Failed attempts and test limitations are retained.


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

Codespaces selection is bound to the provider account and stable application data
key. Relaunches and new prepared versions return to the saved Codespace, even
when another environment is already running. Missing or incompatible saved
environments fail explicitly; automatic data migration between Codespaces is not
implemented. This binding survives browser sessions and control-plane restarts.

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
These were cached-image checks; the FastAPI API measurements below add native
uncached phase evidence.
See `evidence/image-phases.json` and `evidence/image-phases-codespaces.json`.

## JSON API entrypoints

The `fastapi-api` fixture serves JSON at `/`; it does not add an HTML landing
page. PODS verifies that response and discovers the application's existing
Swagger UI at `/docs` only when a bounded, local OpenAPI 3 schema is available at
`/openapi.json`. Its launch URL then opens that existing interface automatically.
The same fixture passes SQLite write/read/restart and browser request-form checks.
External schema redirects and unverified or arbitrary preview paths are rejected.

This discovery currently covers that conventional OpenAPI/Swagger layout. Other
JSON APIs retain their root endpoint. A JSON response alone did not render as a
product navigation in the tested in-app browser; that initial failure is retained
in `evidence/stack-browser-27.json`. PODS does not yet discover every custom API
documentation route or provide a browser interface for APIs that have none.

The actual developer form built the public API fixture at `f58a3e357955` in
84.909s, producing a 52.4 MiB image. Both providers selected `/docs` automatically.

| API scenario | Measured result |
| --- | --- |
| Cloud Shell, existing compute/image absent | Health 18.676s; interface visible 19.995s; browser write 0→1 completed 26.383s |
| Cloud Shell, cached | Health 6.147s; interface visible 8.119s; retained record 1 read by 14.489s; subsequent write 2 by 21.017s |
| Codespaces, new environment/image absent | Health 156.195s, including 132.083s before provider readiness; JSON API and documentation HTTP checks passed |
| Codespaces, cached | Health 9.734s; retained record 1, wrote 2 and read it back |

Browser timings include the actual Swagger request-form actions. The cached
21.017s measurement includes a read and then a separate write; it is not the
time of first interaction. Both Google writes survived browser reload. Each
provider retained SQLite through a full application stop/relaunch. All four
previews stopped. Codespaces checks used authenticated HTTP over SSH; native
browser authorization remains pending.

The first image took 9.537s to download on each provider, then 2.078s to load on
Cloud Shell and 3.820s on Codespaces. Transfer dominated image preparation in
these samples. These measurements do not establish a general launch-time bound.
Evidence: `evidence/stack-fastapi-api-{url,google,codespaces}.json`.

## Native Next.js workflow

The actual developer form prepared Next.js from public revision `f58a3e357955`
in **117.854s**, producing a 181.0 MiB image. Cloud Shell automatically opened
the genuine Next.js counter. The cached launch displayed it in **8.132s** and
completed a working button click in **8.421s**, measured continuously from launch.
Reload resets its transient client state to zero by design.

The first-image launch reached health in 88.177s. The SSR page was observed by
89.243s, but the first click did not increment the counter. A later click worked
by 110.539s; these cold browser observations include tool boundaries. This retains
the distinction between a visible SSR page and working interaction.

Codespaces first reached health in 111.017s, then its test command failed because
the harness generated an extra closing parenthesis. The preview stopped, the
command was fixed, and a regression now executes the generated command in a
fresh Node process. Two subsequent cached launches reached health in 7.181s and
6.660s; both verified the real SSR product and all seven JavaScript entry scripts.
Native Codespaces browser authorization remains pending.

All five launches stopped. Initial image transfers overlapped between providers:
68.586s download / 10.195s load on Google, and 68.372s / 9.578s on Codespaces.
These are concurrent-test measurements, not isolated bandwidth benchmarks.
No database durability claim applies to this transient-state fixture. Evidence:
`evidence/stack-next-{url,google,codespaces,codespaces-first-attempt}.json`.


## Codespace selection and retained databases

A real regression showed that preferring any warm Codespace could route a returning
application away from its existing data. PODS now saves the environment per compute
account and stable application data key. Three regression tests failed before the
fix; all 70 automated checks pass locally and on aswin after it.

The native API replay started with its original Codespace stopped and a different
Codespace available. PODS resumed the original, read the existing SQLite value 2,
wrote 3, stopped, relaunched, read 3 and wrote 4. Both launches stopped cleanly.
Readiness was 53.049s for resumed compute and 6.789s for the cached relaunch. These
are authenticated SSH HTTP/SQLite checks; native Codespaces browser acceptance
remains pending. See `evidence/stack-codespaces-affinity.json` and
`evidence/stack-codespaces-affinity-live.json`.


## SvelteKit native product acceptance

The real developer form prepared `examples/stacks/sveltekit` from public revision
`f58a3e3` in **85.789 seconds**, producing a **98.4 MiB** reusable image. No isolated
QA artifact was imported into production.

| Scenario | Verified result |
| --- | --- |
| Cloud Shell, existing compute / image absent | Health 29.439s; browser product visible 30.912s; first observed click changed 0→1 by 38.854s, including a tool boundary |
| Cloud Shell, cached relaunch | Health 5.521s; visible 6.512s; restored state 6.517s; successful click 1→2 in 6.811s, measured continuously |
| Cloud Shell state | Reload retained 1; full app stop/relaunch retained 1; subsequent click/reload retained 2 |
| Codespaces, existing compute / image absent | Health 38.635s; real SSR document and both start/app client-entry requests passed |
| Codespaces, cached relaunch | Health 6.329s; repeated SSR and client-entry checks passed |

The SvelteKit fixture persists state in browser localStorage; it does not prove
backend database durability. No browser errors or warnings were present at the
final Cloud Shell check. All four previews stopped cleanly. Codespaces checks
used authenticated SSH HTTP, so native browser authorization and hydration remain
pending. Image download took 18.472s on Google and 18.459s on Codespaces; image
loading took 3.776s and 6.668s respectively. Both first-image launches exceeded 20s.

The SSR probe now handles SvelteKit's inline dynamic imports and checks both
same-origin start/app entry assets. Negative controls reject incomplete or external
bootstrap imports, and a fresh Node process executes the serialized native command.
All 71 automated checks pass locally and on aswin. Evidence:
`evidence/stack-sveltekit-{url,google,codespaces}.json`.

## Nuxt standalone artifact size and native checks

For conventional npm Nuxt projects starting `node .output/server/index.mjs`,
PODS packages the standalone production output and its bundled dependencies.
Custom start commands, pre/post start hooks, `.npmrc`, and other package managers
retain the full-project recipe. The same fixture's compressed image fell from
132,783,437 to 80,930,156 bytes (39.05%) and passed isolated build, startup,
restart, and browser interaction. The fresh production URL build took 241.807s
and produced an 80,930,828-byte image.

| Optimized Nuxt scenario | Measured result |
| --- | --- |
| Google first image download | Health 23.449s; product visible 24.793s |
| Google cached relaunch | Health 5.901s; visible 6.454s; successful click 6.738s |
| Codespaces first image download | Health 43.350s, including 15.223s provider startup |
| Codespaces cached relaunch | Health 7.252s |

Google counter interaction and reload passed twice with no final console errors
or warnings. The transient counter resets on reload; this is not database evidence.
Codespaces returned the actual SSR document and client JavaScript on both launches;
native Codespaces browser interaction remains pending. All four launches stopped.
Google/Codespaces first image downloads took 14.358s/14.354s and did not overlap.
Both first-image samples still exceed 20s. These measurements are not a controlled
before/after latency comparison and do not establish a universal timing guarantee.
Evidence: `stack-nuxt-standalone-{comparison,url,google,codespaces}.json` and
`stack-matrix-29.json` in `evidence/`.

## MySQL native URL, product and persistence acceptance

The real developer form prepared `examples/stacks/flask-mysql` at public fixture
revision `f58a3e3` in **191.104 seconds**. It saved separate prebuilt web and MySQL
images totaling 296,853,958 bytes (283.1 MiB). No QA artifact was imported and the
normal account/global build limits remained in effect.

| MySQL scenario | Measured result |
| --- | --- |
| Cloud Shell, images absent | Health 103.340s; product and first write observed by 128.437s |
| Cloud Shell, cached relaunch | Health 10.848s; product visible 11.352s; retained record visible 11.458s; successful write 11.742s |
| Codespaces, images absent | Health 146.425s, including 12.812s provider startup |
| Codespaces, cached relaunch | Health 10.393s |

The first Google browser observation includes a tool boundary and is an upper
bound, not exact visibility latency. The cached browser measurement is continuous.
Google wrote0→1, reloaded1, stopped the full application/database, relaunched and
read1 before writing2 and reloading2. Final console error/warning logs were empty.
Codespaces authenticated HTTP checks independently wrote0→1, stopped/relaunched,
read1 before writing2, then read2. All four launches stopped; data was retained.
Native Codespaces browser authorization and interaction remain pending.

The native Codespaces runtime probe passed on both launches: the database was
healthy on the application's network, no database port was published, only product
port8080 was published, and the same MySQL volume used its durable `/workspaces`
application directory. The probe selects bounded Docker metadata and avoids
reading environment variables. Its tests reject exposed ports, host networking,
unhealthy containers, wrong volumes and temporary storage. The earlier real
isolated probe is recorded separately in `stack-mysql-runtime-boundary.json`.

First-image downloads took 53.700s on each provider and did not overlap; Docker
loading took 22.859s on Google and 43.681s on Codespaces. Both first launches miss
20 seconds. Cached samples pass that target but are not a guarantee, and this
check does not claim persistence through provider VM replacement/rebuild.
Evidence: `evidence/stack-mysql-{url,google,codespaces}.json`.



## Spring Boot SQLite correction and native acceptance

The previous Spring Boot representative used a plain file. The fixture now uses
SQLite JDBC 3.53.4.0 and creates its database under the persistent application data
directory. The old results remain historical file-persistence evidence. Matrix30
and browser30 verify the rebuilt artifact, database signature/integrity, a saved
record across restart, and browser write/reload.

The normal developer form prepared public revision `9eee994` in **196.106 seconds**
and saved a 146,983,923-byte image (140.2 MiB). The Google first-image launch took
46.554s to health. Product visibility and a successful write were observed by
50.010s/50.332s across a tool boundary; these are upper bounds. The cached launch
was measured continuously: health 15.264s, product visible 16.055s, retained SQLite
record visible 16.704s and a successful new write 17.020s. Browser writes 0→1/reload1,
full application stop/relaunch, read1 before write2/reload2 passed. Both previews
stopped; final browser error/warning logs were empty.

The first image download took 26.566s and Docker loading 3.612s. Its first launch
missed 20s; the cached sample passed, without establishing a universal guarantee.
This tests application restart persistence, not replacement of the provider VM.
Codespaces authenticated HTTP checks independently passed: initial0 → write1 →
read1, full stop/relaunch → read1 before write2 → read2. First-image health took
77.906s, including 12.273s provider startup; cached health took 13.212s. Downloads
on Google/Codespaces took 26.566s/26.559s and did not overlap. Both Codespaces
previews stopped; native Codespaces browser interaction remains pending.

Evidence: `evidence/stack-spring-boot-{url,google,codespaces}.json` and
`evidence/stack-{matrix,browser}-30.json`.



## Frontend entry validation

The optional native QA harness now validates React and Angular product mounts
and their compiled JavaScript entry assets. It rejects missing bundles, HTML
fallbacks, unrelated JavaScript, external entries and unknown fixtures. A fresh
Node process executes the exact serialized command in regression tests. Both real
isolated artifacts passed this probe; Angular's un-hashed `main.js` is valid.
The initial overly strict hashed-filename check is retained as a QA probe failure
in `evidence/stack-static-probe-isolated.json`.

These HTTP checks do not execute JavaScript or establish browser interaction or
database persistence. Real browser checks remain separate. Run with
`PODS_STATIC_CHECK=1 PODS_STATIC_FIXTURE=react` (or `angular`) only for the explicit
matching fixture through `scripts/live-codespaces.mjs`.


## Standalone React frontend native acceptance

The normal developer form prepared `examples/stacks/react` at public revision
`9eee994` in **33.711 seconds**. The compiled frontend artifact is 103,755 bytes
(101.3 KiB), runs through the Node22+ static runtime and requires no Docker image.

| React scenario | Measured result |
| --- | --- |
| Cloud Shell, artifact absent on existing compute | Health 4.894s; React visible 5.899s; successful click 6.203s |
| Cloud Shell, cached relaunch | Health 4.904s; React visible 5.795s; saved state visible 5.802s; successful click 6.104s |
| Codespaces, first launch with provider provisioning | Health 131.308s, including 124.768s provider startup; delivery 6.540s |
| Codespaces, cached relaunch | Health 5.304s; delivery 4.752s |

Both Google browser measurements continuously cover launch click, actual React
rendering and successful interaction. Counter 0→1/reload1 and full application
stop/relaunch/read1→write2/reload2 passed. Final browser error/warning logs were
empty. This fixture uses browser localStorage, not a backend database.

Both Codespaces launches passed authenticated HTTP checks for the React mount
and its actual compiled JavaScript entry (219,983 bytes uncompressed). These
checks do not execute the frontend; native Codespaces browser authorization and
interaction remain pending. All four previews stopped. Ready-compute samples
meet 20s, while provider provisioning exceeds it. This is not a universal latency
or VM replacement persistence guarantee.

Evidence: `evidence/stack-react-{url,google,codespaces}.json`.

**Current native coverage: 18 representative fixtures** have Google browser and
Codespaces HTTP/protocol evidence; 37 of the 55 isolated fixtures remain to be
checked natively. All Codespaces browser claims remain pending authorization.

## Smaller full Java runtime

The automatic Maven recipe now uses the explicit Ubuntu Noble variants of the
official Maven builder and Temurin 21 JRE. The builder resolves to the same image
as before. The runtime keeps all 49 Java modules, with identical module versions;
no application-specific module trimming is used. Gradle is unchanged.

| Real application | Previous image archive | Rebuilt archive | Reduction |
| --- | ---: | ---: | ---: |
| Spring Boot + SQLite | 146,984,073 bytes | 131,468,332 bytes | 10.56% |
| Quarkus + SQLite | 144,756,244 bytes | 129,246,400 bytes | 10.71% |
| Micronaut + SQLite | 140,630,981 bytes | 125,122,408 bytes | 11.03% |
| Ktor + SQLite | 154,456,045 bytes | 138,945,817 bytes | 10.04% |

All four real server builds passed. Each retained its previous SQLite value 2
after the artifact upgrade, wrote 3, and retained 3 after stop/relaunch. The browser
then wrote 4 and retained 4 on reload, with no captured warnings or errors.
The local runner already had the images; its 4–10 second readiness samples do
not measure first-image download speed. Spring Boot's smaller artifact subsequently
passed the native checks below. Quarkus, Micronaut and Ktor native retests remain
pending. The 20-second goal is still unproven for first-image JVM
launches. Existing prepared artifacts are immutable and are not replaced.

Evidence: `evidence/stack-matrix-31.json`, `evidence/stack-browser-31.json`,
`evidence/stack-jvm-runtime-comparison.json`, and
`evidence/stack-jvm-runtime-modules.json`.

## Spring Boot runtime upgrade on user compute

The real developer form prepared the same public source revision `9eee994` with
the Noble JRE recipe in **185.843 seconds**. The production archive is
131,473,220 bytes; its new immutable launch version keeps the original data key.

| Scenario | Health ready | Native browser product | Successful browser write |
| --- | ---: | ---: | ---: |
| Cloud Shell, new image on existing compute | 49.033s | 49.900s | 50.732s |
| Cloud Shell, cached full relaunch | 14.743s | 15.274s | 16.085s |
| Codespaces, new image | 74.065s | Pending browser authorization | Authenticated HTTP passed |
| Codespaces, cached full relaunch | 13.655s | Pending browser authorization | Authenticated HTTP passed |

Both providers read the old artifact's SQLite value 2 before writing 3. After a
full application stop and relaunch, both read 3 before writing 4. Google browser
reloads retained each write and captured no warnings/errors. All four launches
stopped. Codespaces returned to the previously assigned `69rw5vx4xp46c5qw5`
environment despite a newer static-app environment, preserving database affinity.

Google image download fell from 26.566s to 23.722s, but loading increased from
3.612s to 7.623s; total first-image time did not improve in this sample. Codespaces
download took 23.737s, with 14.975s provider startup. First-image launches still
exceed 20 seconds. These are individual measurements with runtime variability;
only cached readiness and Google product interaction met the target here.
The two providers' first-image downloads did not overlap.

Evidence: `evidence/stack-spring-boot-noble-{url,google,codespaces}.json` and the
native comparison in `evidence/stack-jvm-runtime-comparison.json`.


## Application origin isolation and standalone Angular native acceptance

Core8b3dd9e reserves a private port per stable application data key and compute
account. Reservations survive artifact updates, browser-session changes, launch
history deletion and server restarts. Collision resolution never assigns the same
origin to two apps in that account. Codespaces registration finishes before the
runner starts and its forwarding process exits; the private mapping remains.
Cloud Shell uses the assigned port in its authenticated provider hostname.

The unchanged React and Angular fixtures both use `localStorage.count`. On the
same Cloud Shell environment, React now uses29528 and Angular21869: React0→1,
Angular0→1, React relaunch1→2, then Angular relaunch1→2. Every reload retained
its own value. The final Angular check still read1 after React had changed to2,
proving their browser state is separate. No storage keys were renamed or cleared.
Browser-only state previously stored at the shared8080 origin remains there;
PODS cannot reliably attribute that state to an individual app. Backend database
paths and saved Codespace affinity are unchanged.

The actual developer form prepared standalone Angular at public9eee994 in97.208s,
producing49,453bytes. On ready Cloud Shell compute, first product visibility took
5.768s and a successful click6.066s; cached visibility5.115s/click5.420s. Codespaces
returned an upstream timeout on its first attempt, then the bounded retry passed:
first health10.828s, cached6.807s, with the97,198-byte compiled JavaScript entry
verified through authenticated HTTP. Both previews stopped. Native Codespaces
browser sign-in and JavaScript interaction remain pending.

React Codespaces health took14.460s with its new mapping and6.695s on repeat.
Both static checks passed. Provider port inspection confirmed both app mappings
private after the temporary forwarding processes exited. These measurements use
existing compute; they do not establish cold provisioning latency.

Spring Boot's new Cloud Shell origin28486 read the existing SQLite4, wrote5,
then retained5 across full stop/relaunch and wrote6. The repeat browser interaction
completed in16.706s; the first browser observation includes tool gaps and is only
an upper bound. Two attempts to resume its saved Codespace returned provider
errors before delivery. After the same saved Codespace recovered to Available,
a native retest on private port 28486 retained SQLite 4→5, then 5→6 through full
stop/relaunch. Health took 24.997s first and 13.983s on repeat. Both stopped.
The failed attempts remain preserved; no new empty environment replaced its data.
This recovery passed before the retry changes below were deployed.

At the origin-isolation checkpoint:55 isolated fixtures,19 native Google browser fixtures and19
Codespaces authenticated HTTP/protocol fixtures.36 fixtures still need native
acceptance.87 automated checks pass locally and on aswin. Source totals5,214
physical lines under `evidence/code-lines.json`. All successful launches from this
checkpoint stopped; a final production audit found no active builds or launches.

Evidence: `evidence/preview-isolation*.json` and
`evidence/stack-angular-{url,google,codespaces,codespaces-retry}.json`.

## Codespaces transient-error recovery

Core `dec153c` retries discovery/state reads up to three attempts for transient
HTTP 500/502/503/504, timeouts and known connection failures. If a resume response
is uncertain, it observes the same saved environment within a bounded deadline.
It never automatically repeats create/resume mutations. Authorization and quota
errors are surfaced immediately. Four new regressions failed before the change;
all 92 checks passed locally and on aswin afterward. The live Spring recovery
above is separate evidence, not proof that this change caused provider recovery.

Evidence: `evidence/codespaces-retry.json` and
`evidence/preview-isolation-spring-codespaces-recovered.json`.

## Standalone Vue native acceptance

The normal developer form prepared `examples/stacks/vue` at public `9eee994` in
**33.055s**, producing a **99,466-byte** artifact. Core `dec153c` launched it at
private port 27260 on existing user compute, without a terminal step.

| Scenario | Result |
| --- | --- |
| Cloud Shell, artifact absent | Health 5.227s; real Vue rendered, counter 0→1 and reload retained 1 |
| Cloud Shell, cached after full stop | Health 4.267s; product visible 7.053s, successful interaction 7.367s; retained 1, wrote 2 and reload retained 2 |
| Codespaces, artifact absent | Health 10.840s; authenticated product shell and 186,439-byte compiled JavaScript entry passed |
| Codespaces, cached after full stop | Health 7.572s; compiled-entry check passed again |

The first Google browser observation was interrupted by a tool timeout; its
22.745s visibility / 23.038s interaction values are upper bounds including tool
gaps, not exact launch timings. The repeat browser measurement was continuous.
Browser error/warning logs were empty at the final check. All four launches
stopped, and provider inspection confirmed the Codespaces port private.
This fixture uses browser localStorage, not a backend database. Native Codespaces
browser sign-in and JavaScript interaction are still pending.

The serialized static probe now covers Vue alongside React and Angular, and
rejects a React bundle presented at an otherwise valid Vue mount/asset path.
All **93 checks** pass locally and on aswin. Current coverage is **55 isolated
fixtures**, **20 native Google browser fixtures**, and **20 Codespaces HTTP/protocol
fixtures**; **35** fixtures await native acceptance. Source totals **5,274 physical
lines** under `evidence/code-lines.json`. These are existing-compute observations,
not a cold-provisioning guarantee.

Evidence: `evidence/stack-vue-{url,google,codespaces}.json`.

## Control-plane service recovery and remaining frontend probes

Core `0a6047b` adds an enabled systemd user service on aswin. A controlled
SIGKILL of the verified idle service process triggered automatic recovery to
local health in **3.257s**; the public health check also returned 200. SQLite
integrity passed, and prepared-build records and preview-port reservations were
unchanged. An existing Google browser session then launched Vue, retained its
saved value 2, wrote 3, and retained 3 on reload; the continuous interaction took
**8.433s**. Codespaces compiled-entry checks passed at **8.186s / 7.095s**. All
three post-recovery launches stopped.

The unit is enabled and user lingering was already active. Host reboot, crashes
during active work, and tunnel recovery are not established by this idle-process
test. The temporary public hostname still needs a durable deployment. Service
`MainPID` replaces the retired manual PID file as the process authority.

The static QA probe now recognizes Svelte, Preact, Solid, Lit and Alpine as well
as React, Angular and Vue. It validates the expected mount, local compiled module
URLs, JavaScript responses and fixture-specific product code. Wrong-framework
bundles are rejected. All eight fixture variants pass unit/serialized-command
checks, and the five additions pass against their existing real isolated artifacts.
Those five results are **not native provider acceptance**. Coverage remains
55 isolated fixtures / 20 native fixtures / 35 pending, with 93 automated checks
passing locally and on aswin and **5,276 physical source lines** under the existing
scope. The systemd unit is configuration and is excluded from that source count.

Evidence: `evidence/control-service-recovery.json`,
`evidence/service-recovery-codespaces.json`, `evidence/static-probe-expanded.json`.


## Standalone Svelte native acceptance

The normal developer form built `examples/stacks/svelte` at public `9eee994` in
**36.962s**, producing a **16,155-byte** artifact under the supervised service.
This used the ordinary account quota and isolated builder; no QA artifact was
imported. All four launches stopped, and Codespaces port 28992 remained private.

| Scenario | Result |
| --- | --- |
| Cloud Shell, artifact absent on existing compute | Health 4.757s; product visible 5.752s; successful click 6.225s |
| Cloud Shell, cached after full app stop | Health 4.532s; product visible 5.503s; successful click 5.785s |
| Codespaces, new compute and absent artifact | Health 143.111s; delivery 10.913s; authenticated compiled-entry check passed |
| Codespaces, cached after full app stop | Health 6.469s; authenticated compiled-entry check passed |

The real Google browser retained localStorage 0→1/reload 1, then retained 1 after
restart and wrote 2/reload 2. This is browser storage, not a backend database.
Both click measurements were continuous. Codespaces checked its product mount
and 25,441-byte Svelte entry, without executing JavaScript in a native browser.
Its new-compute launch exceeded 20 seconds; browser authorization remains pending.

Coverage is **55 isolated browser fixtures**, **21 native Google browser fixtures**
and **21 Codespaces HTTP/protocol fixtures**; **34** await native acceptance.
Evidence: `evidence/stack-svelte-{url,google,codespaces}.json`.

## Codespaces shutdown transition

Core `6cfadb6` retains matching `ShuttingDown` environments and resumes the same
one once it reaches `Shutdown`. An environment that never finishes shutdown
reaches the bounded deadline without a create, start or app dispatch. Three
regressions failed before the fix; all 96 checks pass locally and on aswin. The initial live
Svelte discovery response was not recorded, so its new environment is not
attributed to this bug. Evidence: `evidence/codespaces-shutdown.json`.

The deployed fix also passed a controlled native compute stop/relaunch. GitHub
reported `ShuttingDown` before submission, then `Starting`; the same Codespace
served the Svelte compiled entry at **130.003s**, followed by **6.818s** cached.
Both artifact-cache checks hit, both apps stopped, and port 28992 stayed private.
This verifies live resume on the new revision; the exact state seen by the first
adapter lookup was not captured. The 96 checks pass on aswin, and the service was
restarted only after verifying no active builds or launches. Current source count:
**5,297 physical lines**. Evidence: `evidence/codespaces-shutdown-live.json`.


## Standalone Preact native acceptance

The same developer account submitted `examples/stacks/preact` through the normal
form after a verified quota slot opened. Core `6cfadb6` built public `9eee994` in
**41.126s**, producing a **10,279-byte** prepared artifact. No QA artifact was
imported and no source changes were needed.

| Scenario | Result |
| --- | --- |
| Cloud Shell, artifact absent on existing compute | Health 5.281s; Preact visible 6.994s; successful click 7.293s |
| Cloud Shell, cached after full app stop | Health 4.266s; Preact visible 5.505s; successful click 5.809s |
| Codespaces, artifact absent on existing compute | Health 10.446s; authenticated product and compiled-entry checks passed |
| Codespaces, cached after full app stop | Health 6.814s; compiled-entry check passed again |

The actual Google product retained localStorage 0→1/reload 1, then retained 1
after restart and wrote 2/reload 2. Both browser timings are continuous and the
final warning/error log was empty. This fixture does not prove backend database
persistence. Codespaces served the real 13,629-byte Preact entry; its native
browser sign-in and JavaScript execution remain pending. All four launches
stopped and provider inspection confirmed port 23682 private.

Coverage is **55 isolated browser fixtures**, **22 native Google browser fixtures**
and **22 Codespaces HTTP/protocol fixtures**, with **33** awaiting native acceptance.
The source and its existing 96-check validation are unchanged: **5,297 lines**.
Evidence: `evidence/stack-preact-{url,google,codespaces}.json`.


## Editing a prepared repository

Changing the repository URL or application folder now clears the previous
preparation's ready status and share link. Earlier immutable versions remain in
history. An edited draft restored after cancelled authorization also starts with
no stale result; reconnecting prepares the edited source automatically.

Core `2cbfc93` passed browser checks for folder changes, URL changes, authorization
cancellation and reconnect continuation. The same folder-change case passed on
the production developer page after deployment. The isolated browser fixture
made exactly three intended build requests; its providers were simulated. All
96 automated checks pass locally and on aswin. Public frontend bytes match the
checkout. Source totals **5,307 physical lines**; native coverage remains 22/55
until another framework completes acceptance.

Evidence: `evidence/preparation-draft-state.json`.


## Standalone Solid native acceptance

The same developer account prepared `examples/stacks/solid` once through the
normal developer form after ordinary quota became available. The isolated build
took **59.956 seconds** and saved an **8,310-byte** artifact from public revision
`9eee994`. No QA artifact was imported and the production quota was unchanged.

| Scenario | Measured result |
| --- | --- |
| Cloud Shell, artifact absent on existing compute | Health 5.411s; Solid visible 6.774s; successful click 7.057s |
| Cloud Shell, cached after full app stop | Health 4.088s; Solid visible 5.173s; successful click 5.469s |
| Codespaces, first launch with environment preparation | Health 27.546s, including 14.619s delivery; exceeded 20s |
| Codespaces, cached after full app stop | Health 7.458s, including 6.697s delivery |

The Cloud Shell product counter went 0→1, retained 1 across reload and full app
stop/relaunch, then went 1→2 and retained 2 after reload. Timing was continuous
from each launch click through the successful interaction. The final warning/error
log was empty. This is browser localStorage persistence, not database durability.
Codespaces served the real 10,991-byte compiled Solid entry on both launches;
its native browser sign-in and JavaScript interaction remain pending. All four
launches stopped, and provider inspection confirmed port 24730 stayed private.

Coverage is **55 isolated browser fixtures**, **23 native Google browser fixtures**
and **23 Codespaces HTTP/protocol fixtures**, with **32** awaiting native acceptance.
The source remains **5,307 physical lines**; its latest validation is **96 passing
checks locally and on aswin** at `2cbfc93`.
Evidence: `evidence/stack-solid-{url,google,codespaces}.json`.


## Nested SPA entrypoint verification

The frontend probe now checks a direct nested URL as well as the root page.
It requires the same application document, verifies that the compiled module
URLs still resolve correctly (including Angular's base URL), and requires HTTP404
for a missing asset. It rejects a healthy root page that hides a broken nested
entrypoint or serves HTML with HTTP200 in place of a missing file.

All eight existing compiled frontend fixtures passed these checks in isolated
compute. The native Cloud Shell Solid app also opened directly at
`/pods-spa-check/nested`, accepted a counter write 2→3 and retained 3 after reload;
its browser warning/error log was empty and the app was stopped afterwards.
This checks SPA document fallback and executable frontend delivery. It does not
claim that arbitrary application-specific routes have been tested.

Three new rejection tests failed before the probe was extended. All **99** tests
pass locally and on aswin at `bc1e2c7`. Source totals **5,328 physical lines**.
These are additional checks of existing fixtures; coverage remains 55 isolated,
23 native Google browser and 23 Codespaces HTTP/protocol fixtures, with32 pending.
The production application runtime did not change. Evidence:
`evidence/spa-entrypoint-qa.json` and `evidence/spa-entrypoint-checks.json`.


## Public compatibility page

The product now publishes this scope at `/support`, linked from the launch and
preparation pages. It lists all55 passing representative applications and allows
filtering by framework, language or database. Isolated build/browser, native
Cloud Shell browser and Codespaces HTTP/protocol results have separate columns.
Codespaces browser acceptance remains visibly pending. Account details and raw
private evidence are never included in the public page.

Counts and statuses come from the saved coverage record. Native passes require
explicit `nativeAcceptance.googleBrowser` or `nativeAcceptance.codespacesProtocol`
flags, assigned only after the corresponding acceptance gate passes. A filename
for a failed provider attempt does not count as a pass. Future evidence updates
refresh the page without changing the renderer.

At `e5033d1`, all102tests pass locally/aswin. Browser filtering, no-match handling,
keyboard clearing, the public footer link and narrow-screen overflow were checked.
A controlled idle service restart passed health and SQLite integrity checks;
public HTTPS HTML exactly matched the current evidence-backed rendering.
Source totals5,423physical lines. Evidence: `evidence/public-compatibility.json`.


## Standalone Lit native acceptance

The actual developer form prepared the Lit fixture in **47.476 seconds**, producing
a **10,615-byte** artifact at public revision `9eee994ba7f7`. It used ordinary
preparation capacity; no QA artifact was imported into production.

| Measurement | Observed result |
| --- | --- |
| Cloud Shell, artifact absent on existing compute | Health 5.136s; Lit visible 7.398s; successful click 7.886s |
| Cloud Shell, cached after full app stop | Health 4.727s; Lit visible 5.441s; successful click 5.735s |
| Codespaces, first delivery including environment preparation | Health 28.477s; delivery 12.680s |
| Codespaces, cached relaunch | Health 8.116s; delivery 7.135s |

Google browser interaction changed the counter 0→1, retained 1 after reload and
full application stop/relaunch, then changed it to 2. Direct entry at
`/pods-spa-check/nested` rendered the product, changed 2→3 and retained 3 after
reload. This is browser localStorage persistence, not database durability.

Both Codespaces launches served the real 15,621-byte compiled Lit entry, resolved
its assets at the nested URL and returned 404 for a missing asset. These are
authenticated HTTP checks; native browser execution remains pending. Initial
provider state was not captured, so the first timing is not classified as a
confirmed cold or resumed VM. Port 26163 was private, all four launches stopped,
and the final production audit found no active builds or launches.

Coverage is **55 isolated browser fixtures**, **24 native Google browser fixtures**
and **24 Codespaces HTTP/protocol fixtures**, with **31** awaiting native acceptance.
Source and automated-check totals remain **5,423 physical lines** and **102 passing
checks** from runtime revision `e5033d1`; this gate changed evidence and documentation.
Evidence: `evidence/stack-lit-{url,google,codespaces}.json`.


## Observed provider state and launch timing

Runtime `5e5b4a0` records the provider's initial state before startup, its
observation time and any create/resume/start request timestamp. Missing states
stay unknown; old measurements are not backfilled. Artifact cache status remains
a separate measurement. Cloud Shell adds one environment read before starting,
with that overhead included in accepted-request-to-health time.

Nine new state scenarios failed before this change. All **111 automated checks**
pass locally and on aswin. A controlled idle restart passed health and SQLite
integrity checks. Live verification reused the existing Lit artifact:

| Provider and observed initial state | Health time | Product verification |
| --- | --- | --- |
| Cloud Shell `RUNNING`, cached artifact | 5.679s | Native counter retained 3, wrote 4 and retained 4 after reload |
| Codespaces `ShuttingDown`, cached artifact | 57.025s | Same environment resumed once; compiled product and route checks passed |
| Codespaces `Available`, cached artifact | 7.857s | Same artifact and environment; compiled product and route checks passed |

The first Codespaces test followed an explicit stop of its idle test environment.
Its initial shutdown transition and later resume request are now recorded, so it
is not confused with ready compute or newly created compute. Both Codespaces
checks remain authenticated HTTP/protocol verification, not native browser tests.
The Google browser observation crossed a tool deadline; its 13.457s visibility
and 13.746s interaction measurements are upper bounds, not continuous timings.
No launch was resubmitted. All three previews stopped; port26163 stayed private;
the final audit found zero active builds or launches and health200.

Evidence: `evidence/provider-compute-state.json` and
`evidence/compute-state-codespaces.json`. Source totals **5,487 physical lines**.
Coverage stays55isolated/24nativeGooglebrowser/24Codespacesprotocol;31native pending.


## Standalone Alpine native acceptance

The actual developer form prepared Alpine in **35.172 seconds**, producing a
**30,945-byte** artifact at public revision `9eee994ba7f7`. Ordinary same-account
preparation capacity opened before submission; no QA artifact was imported.

| Measurement | Observed result |
| --- | --- |
| Cloud Shell, initial state RUNNING, artifact absent | Health 5.924s; product visible 6.805s; successful click 7.111s |
| Cloud Shell, RUNNING, cached after full app stop | Health 4.468s; visible 5.225s; successful click 5.515s |
| Codespaces, initial state Available, artifact absent | Health 10.609s; delivery 10.172s |
| Codespaces, Available, cached after full app stop | Health 6.612s; delivery 6.066s |

Actual Alpine browser interaction changed 0→1 and retained 1 after reload and full
app stop/relaunch, then changed 1→2. Direct `/pods-spa-check/nested` entry rendered
the product, changed 2→3 and retained 3 after reload. Browser logs were empty.
These are browser localStorage checks, not database durability checks.

Both Codespaces launches served the 55,217-byte compiled Alpine entry,
resolved entry assets at the nested URL and returned 404 for a missing asset.
Native Codespaces browser sign-in and JavaScript execution remain pending.
All four previews stopped, port 20343 stayed private, and the final production
audit found no active builds or launches and health 200.

All eight frontend fixtures now have native Cloud Shell browser acceptance and
Codespaces HTTP/protocol acceptance. Overall coverage is **55 isolated fixtures**,
**25 native Google browser fixtures**, **25 Codespaces HTTP/protocol fixtures**
and **30 awaiting native acceptance**. Source remains 5,487 physical lines with
111 passing checks at runtime `5e5b4a0`. Evidence: `evidence/stack-alpine-*.json`.

## Astro and React Router native probe preparation

The HTTP probe now covers all five standalone SSR fixtures. Astro verifies the
rendered counter, inline client delivery and advancing server timestamps on two
requests. React Router verifies the rendered counter and requests its actual root
and client entry modules. External, missing and wrong-framework entry points are
rejected. Native tests also verify the selected prepared app matches the fixture.

Both new checks passed against existing genuine isolated artifacts, with clean
application stops afterward. All 114 automated checks pass locally and on aswin.
These isolated probe results did not add native acceptance; the subsequent Astro
and React Router native results are recorded below.
Source totals 5,523 physical lines, now including the four-line Astro source file
previously omitted by the extension filter. Evidence: `stack-astro-ssr-probe.json`
and `stack-react-router-ssr-probe.json`.

## Astro native acceptance

The actual developer form prepared `examples/stacks/astro` at public revision
`9eee994` in **188.748 seconds** after normal quota availability. It produced a
277-byte launch manifest and a **124,919,529-byte** prebuilt runtime image. No QA
artifact was imported and no source compilation was required at user launch.

| Scenario | Health | Visible product / interaction |
| --- | --- | --- |
| Cloud Shell RUNNING, image absent | 43.208s | 45.363s / 45.645s |
| Cloud Shell RUNNING, cached full relaunch | 6.768s | 7.489s / 7.787s |
| Codespaces Shutdown, resume and image absent | 82.430s | Authenticated SSR check passed |
| Codespaces Available, cached full relaunch | 9.256s | Authenticated SSR check passed |

Both Cloud Shell timings were continuous within their browser calls. The real
Astro counter changed 0→1 and survived reload; a full stop/relaunch retained 1,
then changed 1→2 and survived reload. Browser warnings/errors were empty. This is
localStorage evidence, not backend database or VM-replacement durability.
Codespaces verified advancing server-render timestamps and inline client
delivery twice; browser sign-in and JavaScript interaction remain pending.

All four launches stopped. Port 26566 stayed private, and the final 00:07:14 UTC
audit found no active builds or launches and healthy control service. The first
image cases exceed 20 seconds; cached results do not establish a cold-launch promise.
Evidence: `stack-astro-url.json`, `stack-astro-google.json`,
`stack-astro-codespaces.json`. This checkpoint reached55 isolated, 26 Google browser,
26 Codespaces protocol, with29 native fixtures remaining.

## Astro image compression check

A measured attempt to reduce first-image delivery by changing outer gzip from
level1 to6/9 saved only **0.011%** (about13KB of a124.9MB archive). Both trials
preserved the exact uncompressed tar bytes. Inspection found125,437,883 of
125,448,998 payload bytes were already compressed gzip layers. Stronger outer
compression therefore offers no meaningful transfer reduction for this image.
The working packaging remains unchanged; this is isolated measurement evidence,
not a new native performance result. See `stack-astro-compression-trial.json`.

## React Router native acceptance

The actual developer form prepared `examples/stacks/react-router` at revision
`9eee994` in **133.577 seconds**, after ordinary preparation quota became available.
The reusable result contains a 276-byte manifest and a 100,372,817-byte runtime image.
User launch required no build command or installation step.

| Scenario | Health | Visible product / interaction |
| --- | --- | --- |
| Cloud Shell RUNNING, image absent | 30.349s | 32.614s / 32.930s |
| Cloud Shell RUNNING, cached full relaunch | 7.450s | 8.862s / 9.167s |
| Codespaces Shutdown, resume and image absent | 63.435s | Authenticated SSR and client-module checks passed |
| Codespaces Available, cached full relaunch | 8.714s | Authenticated SSR and client-module checks passed |

Both Google browser measurements were continuous. The hydrated button changed
0→1, reload retained 1, and a full application stop/relaunch restored 1 before the
next click changed it to 2; reload retained 2. There were no captured browser
warnings or errors. This proves browser localStorage persistence, not database
or provider VM replacement durability. Codespaces delivered the rendered counter
and both real root/client-entry JavaScript modules on each launch; its native
browser execution remains pending.

All four previews stopped. The 00:28:42 UTC audit found no active builds or launches,
healthy control service and a private Codespaces product port 24950. Evidence:
`stack-react-router-url.json`, `stack-react-router-google.json` and
`stack-react-router-codespaces.json`.

All eight listed static frontend fixtures and all six listed SSR fixtures now
have native Google browser and Codespaces HTTP/protocol acceptance. Total coverage
at that checkpoint was 55 isolated fixtures, 27 native Google browser fixtures and
27 Codespaces protocol fixtures, with 28 awaiting native acceptance. Uncached React Router launches exceed
20 seconds; the cached result does not establish a universal cold-launch guarantee.

## Express and SQLite native acceptance

The real developer form prepared `examples/stacks/express` at revision `9eee994`
in **57.777 seconds**, after normal quota availability. PODS saved a 275-byte
manifest and an **82,250,849-byte** runtime image. The Express application uses
Node's SQLite implementation and a database in the application's persistent data
directory. User launch required no build or installation commands.

| Scenario | Health | Visible product / interaction |
| --- | --- | --- |
| Cloud Shell RUNNING, image absent | 24.220s | 26.290s / 26.585s |
| Cloud Shell RUNNING, cached full relaunch | 5.986s | 6.371s / 6.677s |
| Codespaces Shutdown, resume and image absent | 52.999s | HTTP product and SQLite write/read passed |
| Codespaces Available, cached full relaunch | 9.201s | Saved SQLite count survived full restart |

The native Google product wrote 0→1, retained 1 after reload and full application
restart, then wrote 1→2 and retained 2 after reload. Both browser measurements
were continuous; the saved count was visible at 6.381 seconds on cached relaunch.
No browser warnings or errors were captured. Codespaces independently verified
0→1 and retained 1 before writing 2 on its second launch. Its native browser
interaction and provider VM replacement durability remain unverified.

All four previews stopped. The 00:48:24 UTC audit found zero active builds and
launches, healthy control service and a private Codespaces product port 24378.
Evidence: `stack-express-url.json`, `stack-express-google.json` and
`stack-express-codespaces.json`. Coverage is now **55 isolated / 28 Google browser /
28 Codespaces protocol**, with **27 fixtures awaiting native acceptance**.
First-image delivery still exceeds the 20-second goal; cached performance is
reported separately from compute startup and artifact transfer.


## Fastify preview transport regression

The real developer form prepared the original Fastify + SQLite fixture at
`9eee994ba7f7` in **29.529 seconds**, producing a **272,829-byte Node bundle**.
No Docker image or QA artifact import was needed.

| Check | Observed result |
| --- | --- |
| Google, initial compute RUNNING | Health 5.796s; page visible 7.043s; counter read by 7.054s |
| Google browser write | **Failed**: value remained zero, including after reload and another click |
| Codespaces, initial Shutdown | Health 28.162s, including resume; authenticated HTTP SQLite 0→1 |
| Codespaces, cached full relaunch | Health 7.722s; retained SQLite 1→2 |

A bounded metadata capture on the same Google environment found that its preview
forwarded the empty POST with `Transfer-Encoding: chunked` and no `Content-Type`.
Fastify returned HTTP 415 (`FST_ERR_CTP_INVALID_MEDIA_TYPE`). This explains why the
same fixture passed direct HTTP testing but failed through the browser preview.
No credentials, cookies or account identifiers were recorded.

The public fixture at `d6da2ed780aec8ae0178fc181f1d24113c322e15` now sends an explicit
JSON body and displays failed requests. The real prepared backend and its shipped
client script were tested under an emulated chunked transport: the old fixture
failed with 415, while the corrected fixture saved 0→1 and retained 1→2 after a
full application restart. A simulated HTTP 503 also displayed an error and
re-enabled the button. This isolated regression is **not native browser acceptance**.
The corrected revision subsequently passed the native retest below. The original
Google failure remains in the evidence.

All three native launches stopped; the final audit found no active builds or
launches, control health 200 and Codespaces port 20867 private. At that checkpoint,
coverage was
**55 isolated / 28 Google browser / 29 Codespaces HTTP**, with 27 fixtures still
missing at least one acceptance path. Every Codespaces native browser check
remains pending. Source count is **5,622 physical lines** under the scope in
`evidence/code-lines.json`.

Evidence: `stack-fastify-{url,google,codespaces}.json` and
`stack-fastify-preview-regression-{before,after}.json`. Reproduce the isolated
regression with `scripts/test-fastify-preview.mjs` in the QA guest.

## Corrected Fastify native acceptance

The normal developer form rebuilt public revision `d6da2ed780ae` in **25.747
seconds**, producing a **273,072-byte Node bundle**. The request was submitted
after the ordinary account quota opened; no QA artifact was imported.

| Check | Observed result |
| --- | --- |
| Cloud Shell, RUNNING compute, first artifact delivery | Health 5.703s; page visible 6.749s; first successful SQLite write 7.156s |
| Cloud Shell, cached artifact, full app relaunch | Health 4.597s; page visible 5.122s; saved value restored 5.238s; next write 5.531s |
| Codespaces, initial Shutdown | Health 28.548s including resume; old version's SQLite value 2 retained and incremented to 3 |
| Codespaces, initial Available, cached relaunch | Health 7.613s; retained SQLite 3 and incremented to 4 |

The real Cloud Shell page's button, reload and full application restart passed
with saved values 0→1→2 and no browser console warnings or errors. A separate
isolated browser check also passed through an emulated chunked-POST proxy; both
POST requests carried JSON and returned 200. Codespaces checks are authenticated
HTTP on user compute, not native browser interaction.

All four native launches stopped. The final audit found no active builds or
launches, control health 200 and preview port 20867 private. Coverage is now
**55 isolated / 29 Google browser / 29 Codespaces HTTP**, with **26 fixtures**
awaiting those native acceptance checks. Every Codespaces native browser check
remains pending. These results do not prove Cloud Shell VM replacement durability
or a universal 20-second cold launch.

Evidence: `stack-fastify-fixed-{url,google,codespaces}.json` and
`stack-fastify-browser-transport.json`; the original failed Google attempt is
retained in `stack-fastify-google.json`.

## Pending artifact-format transition

The smaller experimental Express bundle is not enabled in production. A real
isolated transition test with the same application data key confirmed that the
existing container saved SQLite value 1, the bundle opened a separate empty
database showing 0, and returning to the container restored 1. The original
record was retained, but continuity between the two artifact formats failed.

A separate mocked provider-adapter check confirmed that Codespaces rejects a
saved environment when its runtime label differs from the requested artifact
format. That check made no compute changes and is not native acceptance. A
complete format transition must preserve both the existing user environment and
the application's data, including file ownership, before the packaging
optimization can ship. Existing same-format persistence results remain valid.

Evidence: `stack-express-transition-probe.json` and
`stack-provider-format-transition-probe.json`, with their matching replay scripts.
Both diagnostics preserve the failing behavior explicitly; they are not passing
migration tests.

Koa's isolated browser preflight additionally passed empty chunked POST handling,
reload and full app restart with SQLite values 0→1→2. Its subsequent native
acceptance is recorded below. See `stack-koa-browser-transport.json`.

## Native Koa workflow

The normal developer form prepared `examples/stacks/koa` at public revision
`d6da2ed780ae` in **22.767 seconds**. Its **101,539-byte Node bundle** matched the
isolated preflight artifact's hash. No custom PODS configuration or user build
commands were required.

| Check | Observed result |
| --- | --- |
| Cloud Shell, RUNNING compute, first artifact delivery | Health 6.196s; page visible 8.334s; successful SQLite write 8.626s |
| Cloud Shell, cached artifact, full app relaunch | Health 5.016s; page visible 5.525s; saved value restored 5.643s; next write 5.932s |
| Codespaces, initial Shutdown | Health 28.280s including resume; HTTP SQLite 0→1 |
| Codespaces, initial Available, cached relaunch | Health 8.227s; retained SQLite 1 and incremented to 2 |

Cloud Shell's actual browser button, reload and full app restart passed without
console warnings or errors. Codespaces checks cover authenticated HTTP and
persistence on user compute; native browser interaction remains pending.

All four launches stopped. The final audit found no active builds or launches,
control health 200 and preview port 24886 private. Coverage is **55 isolated /
30 Google browser / 30 Codespaces HTTP**, with **25 fixtures** still awaiting
those native checks. This does not establish VM replacement durability or a
universal 20-second cold launch. Evidence: `stack-koa-{url,google,codespaces}.json`.

## Hono browser transport preflight

Hono produced a **23,851-byte Node bundle** in the isolated QA build. The actual
browser button passed through a proxy that sent an empty chunked POST without a
Content-Type header. SQLite values progressed 0→1, survived page reload and a
full application stop/relaunch, then progressed 1→2. Both POSTs returned 200;
no browser warnings or errors were observed.

This is a transport preflight. Hono's subsequent native Google browser and
Codespaces HTTP acceptance is recorded below. The temporary application,
artifact directory and private proxy tunnel were removed. Evidence and replay:
`stack-hono-browser-transport.json` and `stack-hono-browser-transport-probe.mjs`.

## Experimental Express storage handoff

An isolated prototype copied SQLite data only while the application was stopped.
It preserved successive values through container → bundle → container → bundle
(0→1→2→3→4). Docker copied the initial root-owned database into a staging directory
owned by the application user; no helper executable ran. All temporary runtimes,
volumes and data were removed after the test.

This validates a copying mechanism, not a production migration. Automatic format
selection, crash recovery, conflicting existing data and the saved Codespace
runtime check remain unresolved. The smaller Express bundle remains experimental.
See `stack-express-storage-bridge-probe.{json,mjs}`.

## Native Hono workflow

The real developer form prepared `examples/stacks/hono` at public revision
`d6da2ed780ae` in **29.554 seconds**, producing a **23,851-byte Node bundle**
identical to the isolated preflight artifact. The form was submitted once after
normal account quota became available. No QA artifact was imported.

| Check | Observed result |
| --- | --- |
| Cloud Shell, RUNNING compute, first artifact delivery | Health 6.446s; page visible 7.726s; successful SQLite write 8.018s |
| Cloud Shell, cached artifact, full app relaunch | Health 6.035s; page visible 7.172s; saved value restored 7.291s; next write 7.594s |
| Codespaces, initial Shutdown | Health 26.220s including resume; HTTP SQLite 0→1 |
| Codespaces, initial Available, cached relaunch | Health 8.060s; retained SQLite 1 and incremented to 2 |

The actual Cloud Shell button, reload and full stop/relaunch preserved SQLite
values 0→1→2 without browser warnings or errors. Codespaces authenticated HTTP
write/read and full restart checks passed; native browser interaction is pending.

All four launches stopped. The audit found no active builds or launches, control
health 200 and preview port 25759 private. Coverage is **55 isolated / 31 Google
browser / 31 Codespaces HTTP**, with **24 fixtures** awaiting those native paths.
These measurements do not prove VM replacement durability or universal cold
launches within 20 seconds. Evidence: `stack-hono-{url,google,codespaces}.json`.

## Automatic runner storage handoff

The runner now migrates a default single-service `/data` store between container
and Node-bundle formats. It copies into private staging, records the transition,
keeps the previous destination as a backup, and resumes an interrupted transition
before launching the application. It preserves copies of older data under the
managed storage directory; these backups consume space until explicitly removed.

A real isolated test started with the old runner's Express container database,
then used the new runner for bundle → container → bundle. SQLite values advanced
0→1→2→3→4 without manual copying. Temporary copying containers never execute code
and are removed along with their empty helper images. The test left no runtime,
volume or helper image behind.

All **131 automated tests** pass locally and in isolated aswin QA. Added checks
cover interruption at four stages in both directions, partial copies, conflicting
legacy databases, unexpected volume bindings, active containers, unsafe paths,
missing saved data and unsupported database topologies. The copying helper also
passed a real check against a root-owned directory and mode-0600 record.

This does not migrate application schemas or arbitrary multi-service databases.
Conflicting saved datasets require an explicit choice; existing records are
preserved. Process-interruption recovery does not prove power-loss or provider
VM replacement durability. Native format-transition acceptance and saved Codespace
runtime-label adaptation remain pending, so the smaller Express bundle is still
experimental. Source count: **5,867 physical lines**. Evidence and reproduction:
`stack-express-automatic-transition-probe.{json,mjs}`.

The updated runner was deployed at revision `77cf340`. Native Cloud Shell
same-format regression retained existing Hono and Express SQLite values 2→3,
including reload; successful browser writes took 8.754s and 9.481s on ready
compute. Codespaces Hono HTTP regression retained 2→3, then 3→4 across a full
stop/relaunch: resumed compute took 29.387s to health; already available compute
took 7.605s. Both paths used cached artifacts. All regression launches stopped,
health stayed 200, SQLite integrity passed, and the Codespaces port remained
private. These checks do not establish native cross-format migration. Evidence:
`stack-storage-deployment.json`, `stack-storage-hono-codespaces.json`.

## NestJS native acceptance

The ordinary developer form prepared `examples/stacks/nestjs` from public
revision `d6da2ed` in 101.382 seconds after normal quota availability. The prepared
container image is 83,083,824 bytes. No QA artifact was imported into production.

The first Cloud Shell launch resumed suspended compute and fetched its uncached
image: health took 47.775 seconds, the actual product appeared at 49.890 seconds,
and the first successful SQLite button write completed at 50.185 seconds. The
cached relaunch on running compute reached health in 7.615 seconds, restored the
saved value at 9.207 seconds and completed the next write at 9.491 seconds. The
real browser verified 0→1, reload1, full stop/relaunch1→2, reload2, with no
console warnings or errors. The first launch misses the 20-second target.

Codespaces authenticated HTTP checks resumed a stopped environment and took
64.204 seconds to health with an uncached image; the available, cached relaunch
took 9.082 seconds. SQLite writes and full-stop retention passed 0→1→2. Native
Codespaces browser interaction remains pending sign-in.

The final audit at 02:30:01 UTC found all four launches stopped, no active builds
or launches, health200 and product port22269 private. Coverage is now **55
isolated /32 Google browser /32 Codespaces HTTP**, with **23** fixtures pending
native acceptance. These results do not prove VM replacement durability or
universal cold launches within20 seconds. Evidence:
`stack-nestjs-{url,google,codespaces}.json`.

## Saved Codespace runtime compatibility

A saved application may change between the known `PODS launch` and
`PODS launch containers` runtime profiles while retaining the same Codespace.
Before a format change, PODS checks that the existing environment has Node.js
22 or newer, a Linux x64 local Docker daemon, and Docker Compose. It rejects
incompatible compute before private-preview registration or runner dispatch.
Unrelated repositories or runtime labels remain rejected; no replacement
Codespace is created to evade missing data or missing capabilities.

Both existing native runtime profiles passed the read-only probe. All134
automated tests pass locally and in isolated aswin QA, including positive
transitions in both directions, refused capabilities, and exact-environment
resume. This is not yet proof of native application data migration across
formats; smaller Express packaging remains experimental. Current source:
**5,920 physical lines**. Evidence: `stack-provider-format-adapter.json` and
`stack-codespaces-runtime-capabilities.json`; the earlier rejection probe is
historical evidence for provider source revision60b7960.


## AdonisJS native acceptance

The ordinary developer form prepared `examples/stacks/adonis` at public revision
`d6da2ed` in **92.087 seconds**, after normal quota availability. Its production
container image is **83,631,279 bytes**; no QA artifact was imported.

| Provider / state | Health | Actual product and persistence |
| --- | --- | --- |
| Cloud Shell RUNNING, image absent | 35.982s | Page 38.321s; SQLite write 38.620s; reload retained 1 |
| Cloud Shell RUNNING, cached full relaunch | 7.830s | Page 8.800s; saved value 8.914s; next write 9.196s; reload retained 2 |
| Codespaces Available, image absent | 41.977s | Authenticated HTTP product and SQLite 0→1 passed |
| Codespaces Available, cached full relaunch | 9.286s | Authenticated HTTP retained SQLite 1→2 |

The Cloud Shell browser exercised the real AdonisJS product button, reload and
full process stop/relaunch, with no console warnings or errors. Codespaces
browser interaction remains pending sign-in. Both first-image launches exceeded
20 seconds despite ready compute; neither is a cold-VM provisioning measurement.

A separate isolated transport probe verified empty chunked POSTs without a
Content-Type header and SQLite retention across a full restart. Its initial
wrong-title assertion and temporary-file upload error were probe-only corrections;
no production application change was needed. This probe does not replace native
acceptance. Evidence: `stack-adonis-chunked-probe.{json,mjs}` and
`stack-adonis-{url,google,codespaces}.json`.

The 02:49:06 UTC audit found all four launches stopped, no active builds or
launches, health 200 and Codespaces port 23608 private. Current coverage:
**55 isolated /33 Google browser /33 Codespaces HTTP**, with **22** remaining
native fixtures. Source and full-suite counts remain 5,920 lines and 134 checks.


## Prepared Node bundles and native data continuity

For pinned esbuild 0.25.12 diagnostics, a missing literal `require()` may remain
in the bundle only when the compiler identifies its existing error handler.
PODS preserves the application fallback without stubs or undeclared installs.
Missing required imports, native modules, `require.resolve` and dynamic imports
retain the previous failure/container fallback. Actual preparation reproduced
the existing Hono and Koa bundles byte for byte.

The normal developer URL form prepared Express at public revision `d6da2ed`
in **17.311 seconds**. The launch artifact is **338,173 bytes**, compared with
its previous **82,250,849-byte** image: **99.59% less download**. The application
source is unchanged; the repository folder retains the same data identity and
private preview port. This production artifact matches the isolated candidate
artifact hash. No QA artifact was imported or user data copied manually.

| Native scenario | Health | Product/data result |
| --- | --- | --- |
| Cloud Shell RUNNING, first bundle after existing container | 6.001s | Page 6.514s; restored 3; write 4 at 6.906s; reload 4 |
| Cloud Shell RUNNING, return to previous container after one failed compute-start attempt | 6.489s | Page 7.950s; restored 4; write 5 at 8.357s; reload 5 |
| Cloud Shell RUNNING, return to cached bundle | 5.162s | Page 6.561s; restored 5; write 6 at 6.969s; reload 6 |
| Codespaces Available, container→bundle | 15.548s | Authenticated HTTP restored 2; wrote/read 3 |
| Codespaces Available, bundle→container | 8.225s | Authenticated HTTP restored 3; wrote/read 4 |
| Codespaces Available, container→bundle again | 10.215s | Authenticated HTTP restored 4; wrote/read 5 |

Each successful launch was fully stopped before the next format. Codespaces
retained the exact saved environment throughout, including capability checks
when its container runtime label differed from the requested Node bundle.
Cloud Shell browser checks used the real product button and reload; no console
warnings or errors were observed. Codespaces native browser acceptance remains
pending sign-in.

One Google compute-start attempt timed out before provider readiness or artifact
delivery. It was confirmed terminal before one explicit retry; the saved value 4
survived. That failure is preserved and is not counted as a successful launch.
Immediately before migration, a read-only Cloud Shell check of the old container
needed 24.618s to display its saved value 3 with the image absent. Successful
new-bundle samples meet 20 seconds on ready compute; they do not prove all future
launches or cold provisioning meet that target.

The 03:06:23 UTC audit confirmed no active builds/launches, health 200, SQLite
integrity and private product port 24378. All six successful transition launches
stopped; the seventh attempt is the retained failed compute start. Coverage
remains 55 isolated /33 Google browser /33 Codespaces HTTP, with 22 native fixtures
pending. Data continuity here covers default single-service SQLite storage;
it does not infer schema migrations, arbitrary multi-service database migration,
power-loss recovery or provider VM replacement durability.

The local suite passed 138/138. Isolated QA initially passed 136/138 because its
temporary snapshot lacked the unchanged coverage JSON; after restoring it,
all three affected compatibility checks passed. The four new packaging checks
passed in both environments. Source totals 5,978 physical lines. Evidence:
`stack-optional-node-packaging.json`, `stack-express-bundle-url.json`,
`stack-express-native-transition-{baseline,google,codespaces}.json`, and the
reproducible isolated/native transition probes.


## Cloud Shell startup recovery

The provider sends the start request once. If its response is lost to a transient
transport failure, PODS reads the same environment until it confirms both RUNNING
state and this launch's unique SSH key, within the provisioning deadline. Reads
have bounded transient retries. Authorization, quota and explicit operation
failures still stop the launch. Response-body transport failures remain visible.

All 146 tests passed locally and in isolated Linux QA, including eight new
recovery cases. The updated provider's native Express browser regression retained
SQLite values 6→7→8 across full stops; pages appeared in 7.220s and 5.227s.
Codespaces retained values 5→6→7 across full stops with authenticated HTTP health in 11.554s and
10.698s. These launches did not encounter a timeout: recovery is proven by
injected failures, and the original native failure remains recorded. All test
previews stopped and the product port remained private. Source: 6,120 physical
lines. Evidence: `stack-google-start-recovery.json` and
`stack-google-recovery-codespaces-regression.json`.


## Native FastAPI + SQLite workflow

The normal developer form prepared FastAPI in **71.888 seconds**, producing a
54,898,173-byte prebuilt image from the public repository at `d6da2ed780ae`.
Cloud Shell was already RUNNING: the first image delivery reached health in
21.348 seconds and completed the real product's button write in 23.537 seconds.
After a full app stop, cached health took 6.720 seconds; the browser restored the
saved count in 7.675 seconds and completed a write in 7.959 seconds. Both reloads
retained the saved count, and SQLite values progressed 0→1→2.

Codespaces was Available on both launches. Authenticated HTTP product and SQLite
write/read/full-stop/relaunch checks passed: health took 27.278 seconds with the
image absent and 8.907 seconds cached. Its native browser remains unverified.
The first-image samples exceeded 20 seconds despite ready compute; these results
do not describe cold VM provisioning. All four previews stopped, port 27215
remained private, and the final server health and SQLite integrity audit passed.

Evidence: `stack-fastapi-{url,google,codespaces}.json`. A separate isolated
`stack-fastapi-chunked-probe.json` verifies empty chunked POST handling and SQLite
persistence through a full relaunch with the current runner. It is not counted
as native acceptance. Coverage is now 55 isolated / 34 Google browser / 34
Codespaces HTTP-protocol, with 21 native fixtures still pending.


## MariaDB engine and persistence validation

The native acceptance helper now follows the application's assigned product
port and performs a read-only SQL inspection of the MariaDB fixture. It verifies
that the database is healthy and private, uses the application's persistent
volume, reports a MariaDB server version, and contains the value saved through
the product. Fresh-process serialization and rejection cases are automated.

All **150 checks passed locally and in isolated aswin Linux QA**. An additional
real-artifact preflight confirmed **MariaDB 11.4.13** and counter **0→1→2** across
a full stop/relaunch, using the empty chunked POST sent by the browser proxy.
The disposable containers, volume and application storage were removed; shared
runtime caches were retained. This is isolated execution evidence. Native Google browser and Codespaces protocol acceptance subsequently passed
as recorded below. Coverage is **55 / 35 / 35**, with **20** native fixtures pending.

Current scoped source totals **6,207 physical lines**. Evidence:
`stack-mariadb-runtime-probe-tests.json` and
`stack-flask-mariadb-chunked-probe.{json,mjs}`. The native CLI opt-in is
`PODS_COUNTER_CHECK=1 PODS_MARIADB_RUNTIME_CHECK=1` and is restricted to the
explicit MariaDB fixture; its SQL queries never read credentials out of the
container.


## Native Flask + MariaDB workflow

The developer URL form prepared `examples/stacks/flask-mariadb` at source
`d6da2ed780ae` in **149.216 seconds**, producing **161,554,380 bytes** of reusable
application and database images. This was a normal production build after the
same account's quota opened, not an imported QA artifact.

| Native scenario | Server health | Actual product evidence |
| --- | ---: | --- |
| Cloud Shell RUNNING, images absent | 72.528s | Page 74.783s; saved record visible 74.794s; button write 75.087s |
| Cloud Shell RUNNING, cached full relaunch | 12.110s | Page 13.221s; saved record restored 13.336s; next write 13.628s |
| Codespaces Shutdown → resumed, images absent | 101.232s | Authenticated HTTP product, write/read and SQL record passed |
| Codespaces Available, cached full relaunch | 11.325s | Retained record, next write/read and SQL record passed |

Both providers preserved **0→1→2** across a full application stop/relaunch.
Cloud Shell reloads retained each saved value and captured no browser warnings
or errors. Codespaces additionally confirmed **MariaDB 11.4.13**, a healthy
private database, and the application's durable workspace volume through direct
read-only inspection. The product preview port 23877 remained private. All four
previews stopped; the final production audit found no active builds or launches,
HTTP200, SQLite integrity OK, and the unchanged server PID and runner hash.

Codespaces required **12.235s** to resume its existing environment; delivery and
startup after provider readiness took **88.997s**. Cloud Shell delivery and
startup took **69.507s**. First-image downloads alone took **45.605s** on Codespaces
and **44.123s** on Cloud Shell. The two providers’ first-image launches overlapped
and used the same PODS artifact origin, so these samples include concurrent
delivery load; they are not isolated single-download bandwidth benchmarks.
These first-image samples exceed the 20-second target, including the Google sample on already-running compute. Cached launches
met the target. Native Codespaces browser interaction and Cloud Shell VM
replacement durability remain separate, unverified gates.

Evidence: `stack-flask-mariadb-{url,google,codespaces}.json`. Coverage is now
**55 isolated / 35 Google browser / 35 Codespaces protocol**, with **20** fixtures
still awaiting native acceptance. Source remains **6,207** physical lines and
the most recent full suites remain **150/150** in both environments.


## MongoDB engine and persistence validation

The native acceptance helper now verifies the pinned MongoDB 7.0.43 build,
WiredTiger storage engine and product-saved document through read-only queries.
A shared boundary check verifies healthy private database services, the assigned
product port, and the correct persistent database mount. Existing MySQL and
MariaDB checks retain their behavior.

All **154 checks passed locally and in isolated aswin Linux QA**. A real MongoDB
artifact preflight verified counter **0→1→2** across a full stop/relaunch with
empty chunked POST requests. Its temporary containers, named volume and selected
application storage were removed. This is isolated evidence; native MongoDB
acceptance is still pending. Current source totals **6,293 physical lines**.

Evidence: `stack-mongodb-runtime-probe-tests.json` and
`stack-flask-mongodb7-chunked-probe.{json,mjs}`. The native CLI opt-in is
`PODS_COUNTER_CHECK=1 PODS_MONGODB_RUNTIME_CHECK=1`, restricted to the explicit
MongoDB fixture. Coverage remains **55 / 35 / 35** until native acceptance passes.

## Native Flask + MongoDB acceptance

The real developer form prepared `examples/stacks/flask-mongodb7` from public
revision `d6da2ed780ae` in **173.638s**, using the ordinary same-account build
quota. Its web and MongoDB images total **350,700,277 bytes** (334.5 MiB).

| Native path | Observed result |
| --- | --- |
| Cloud Shell, already running / images absent | Health 94.422s; product observed by 100.071s, successful click by 100.359s; wrote 0→1 and reload retained 1 |
| Cloud Shell, cached after full stop | Health 9.886s; product visible 11.343s, saved value visible 11.454s, successful click 11.744s; retained 1 then wrote 2 |
| Codespaces, resumed / images absent | Health 140.627s; authenticated product and MongoDB document 0→1 passed |
| Codespaces, cached after full stop | Health 12.013s; retained document 1, wrote 2, and read 2 |

The first Google browser observation includes a tool-call gap after navigation,
so it is an upper bound; backend health is recorded independently. Both Google
launches passed real button interactions and page reloads without browser
warnings or errors. Codespaces direct read-only inspection verified MongoDB
**7.0.43**, its expected git build, WiredTiger, the product-saved documents, a
healthy database without public ports, and the application's durable volume.
The product preview port **23283** remained private. All four previews stopped.

Google checks completed and stopped before Codespaces began; these provider
checks ran sequentially. Unrelated network traffic was not controlled. Initial
image downloads took **63.738s / 63.717s** on Google / Codespaces; Codespaces
provider startup took **19.719s**, and delivery/startup took **120.908s**. These
first-image paths exceed 20 seconds even with ready Google compute. Cached
launches met the target. Native Codespaces browser interaction and replacement
of the Cloud Shell VM remain unverified.

The final audit at **2026-10-04 04:15:58 UTC** found zero active builds or launches,
HTTP 200, SQLite integrity OK, and the unchanged supervised server and runner.
Evidence: `stack-flask-mongodb7-{url,google,codespaces,audit}.json`. Coverage is
**55 isolated / 36 Google browser / 36 Codespaces protocol**, with **19** native
fixtures pending. Source remains **6,293 physical lines**; the most recent full
suites remain **154/154** locally and in isolated aswin QA.

## Redis persistence inspection preflight

The native acceptance helper now checks Redis 7 engine identity, the counter key
saved through the product, enabled append-only persistence and its last write
status. It verifies that Redis writes inside its persistent application volume
and that the database has no host-published port. The inspection uses fixed
read-only commands and is restricted to the explicit Flask + Redis fixture.

All **158 tests passed locally and in isolated aswin Linux QA**. A real stored
Redis artifact passed an additional counter **0→1→2** check with empty chunked
POSTs, full application stop/relaunch, Redis **7.4.11**, private boundaries and
persistent storage. Its disposable containers, volume and selected storage
were removed. This is isolated evidence; native Flask + Redis acceptance is
still pending. It does not prove durability under a power loss or VM replacement.

The checks follow Redis's documented [INFO fields](https://redis.io/docs/latest/commands/info/)
and [persistence model](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/).
Evidence: `stack-redis-runtime-probe-tests.json` and
`stack-flask-redis-chunked-probe.{json,mjs}`. Opt-in:
`PODS_COUNTER_CHECK=1 PODS_REDIS_RUNTIME_CHECK=1`. Current source totals
**6,384 physical lines**; native coverage remains **55 / 36 / 36**.

## Native Flask + Redis acceptance

The actual developer form prepared `examples/stacks/flask-redis` at public
revision `d6da2ed780ae` in **118.038s**, after ordinary same-account quota became
available. Its web and database images total **68,490,982 bytes** (65.3 MiB).

| Native path | Observed result |
| --- | --- |
| Cloud Shell, running compute / both images absent | Health 24.321s; product visible 25.912s; saved value visible 26.184s; successful button interaction 26.482s |
| Cloud Shell, cached after full stop | Health 8.434s; product visible 9.861s; saved value visible 9.973s; successful interaction 10.280s |
| Codespaces, resumed / one image already cached | Health 51.877s; authenticated product write/read and direct Redis record verification passed |
| Codespaces, cached after full stop | Health 10.722s; retained 1, wrote 2, and verified the saved key |

Both providers passed counter **0→1→2** across full application stop/relaunch.
Google used the actual product button and page reload on both launches, with
no browser warnings or errors. Read-only Codespaces inspection confirmed
**Redis 7.4.11**, build `40ff01a501d8e4b6`, enabled append-only persistence with
successful writes, private healthy database containers, and durable application
storage. The product preview port **21397** remained private.

The provider tests ran sequentially. First-image downloads took **11.493s** on
Google and **9.059s** on Codespaces, with different cache states as shown above.
Codespaces provider startup took **12.554s**, then delivery/startup took **39.323s**.
Both first-launch samples exceed 20 seconds; cached launches met the target.
Native Codespaces browser interaction, power-loss durability and Cloud Shell VM
replacement remain outside this evidence.

All four previews stopped. The audit at **2026-10-04 04:34:09 UTC** found zero
active builds or launches, HTTP 200, SQLite integrity OK, and the unchanged
supervised server and runner. Evidence:
`stack-flask-redis-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 37 Google browser / 37 Codespaces protocol**, with **18** native
fixtures pending. Source remains **6,384 physical lines** and the most recent
full suites remain **158/158** locally and in isolated aswin QA.

## SQLite file and persistence inspection preflight

The native acceptance helper now opens the Flask + SQLite fixture's existing
database in read-only mode, checks its SQLite version and integrity, and reads
the counter row saved through the product. It verifies the single application
container, expected product port and durable application volume. No database
file is created by this inspection. Native opt-in is restricted to this fixture:
`PODS_COUNTER_CHECK=1 PODS_SQLITE_RUNTIME_CHECK=1`.

All **162 tests passed locally and in isolated aswin Linux QA**. The real stored
artifact passed counter **0→1→2**, empty chunked POSTs, a full stop/relaunch,
and direct SQLite **3.46.1** integrity and saved-row verification. Its disposable
containers, volume and selected storage were removed. The fixture needs only
Python source and requirements; PODS generates its container recipe and durable
volume. Native acceptance for this fixture remains pending.

Evidence: `stack-sqlite-runtime-probe-tests.json` and
`stack-flask-sqlite-chunked-probe.{json,mjs}`. Source totals **6,475 physical
lines**; native coverage remains **55 / 37 / 37**.


## SQLite native product acceptance

The real developer form built `examples/stacks/flask-sqlite` from the public
fixture repository at `d6da2ed780ae` in **104.353 seconds** after ordinary quota
availability. Source and requirements alone produced a reusable container
artifact with **51,763,713 image bytes** and a persistent application volume.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell already RUNNING, image absent | Server healthy in 18.612s; product visible in 20.220s; saved value read in 20.689s; button write in 20.983s |
| Cloud Shell cached relaunch | Server healthy in 6.274s; product visible in 7.758s; saved value restored in 7.870s; next write in 8.172s |
| Codespaces initially Shutdown, image absent | Healthy in 52.502s, including 37.542s delivery/startup; first launch exceeds 20s |
| Codespaces cached, initially Available | Healthy in 8.407s; authenticated HTTP counter and direct SQLite checks passed |

Cloud Shell browser buttons and reloads verified **0→1→2**, with the first saved
value surviving a full application stop/relaunch. There were no browser console
warnings or errors. Codespaces verified the same sequence through authenticated
HTTP and read-only inspection of the actual SQLite **3.46.1** file: integrity
`ok`, expected saved row, one isolated application container, and the durable
workspace volume. Its product port **27851** remains private; no database port
is published. Native Codespaces browser interaction still needs authorization.

Both Cloud Shell launches were stopped before Codespaces testing began. All four
launches ended stopped. The final audit returned HTTP 200, database integrity
`ok`, zero active builds/launches, and the unchanged service PID and runner SHA.
This verifies application restart persistence, not replacement of a provider VM.
The initial browser interaction exceeded 20s even though server health did not.

Evidence: `stack-flask-sqlite-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 38 Google browser / 38 Codespaces protocol**, with **17** native
fixtures pending. Source remains **6,475 physical lines**; the current full
suites passed **162/162** locally and in isolated aswin QA.


## Valkey identity and persistence inspection preflight

The native test helper now verifies Valkey's own server name and version, rather
than treating its Redis compatibility version as engine identity. The explicit
Flask + Valkey fixture check uses read-only commands for server identity,
append-only persistence status, the configured data directory and the counter
saved through the product. It also checks the private database port and durable
workspace volume. Enable it with `PODS_COUNTER_CHECK=1 PODS_VALKEY_RUNTIME_CHECK=1`.

All **166 tests passed locally and in isolated aswin Linux QA**. The real stored
Valkey artifact passed **0→1→2**, empty chunked POSTs and full stop/relaunch;
direct inspection confirmed **Valkey 8.1.10**, append-only logging enabled with
successful write status, and the expected persisted counter. Disposable test
containers, volume and selected storage were removed. This proves application
restart persistence, not power-loss durability or provider VM replacement.

Evidence: `stack-valkey-runtime-probe-tests.json` and
`stack-flask-valkey-chunked-probe.{json,mjs}`. Source totals **6,567 physical
lines**. Native Valkey acceptance is still pending; provider coverage remains
**55 isolated / 38 Google browser / 38 Codespaces protocol**.


## Valkey native product acceptance

The actual developer form prepared `examples/stacks/flask-valkey` from fixture
revision `d6da2ed780ae` in **127.295 seconds** after ordinary quota
availability. Artifact `df3a34a3842a21db5b89719c8e40c365626f996a3ac708e345bac14bb523398b` contains
**69,644,333 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 23.883s; product visible 25.373s; saved value read 25.389s; button write 25.676s |
| Cloud Shell cached relaunch | Server healthy 8.858s; product visible 10.401s; saved value restored 10.516s; next write 10.831s |
| Codespaces initially Shutdown | Server healthy 60.011s, delivery/startup 34.751s; 0 cached images |
| Codespaces cached relaunch | Server healthy 10.174s; authenticated HTTP write/read and direct Valkey inspection passed |

Cloud Shell product buttons and reloads verified **0→1→2**, retaining the first
saved counter across a complete application stop/relaunch. No browser console
warnings or errors were observed. Codespaces authenticated HTTP verified the same
sequence. Fixed read-only commands inspected actual **Valkey 8.1.10**,
build `fd3b186b1408478b`, append-only logging enabled and last write status `ok`,
and the saved counter. Inspection found no published Codespaces database port; the
Codespaces product port **24747** remains private.
The volume was bound to persistent workspace storage.

Both Cloud Shell runs finished and stopped before Codespaces testing started.
All four launches ended stopped. The audit returned HTTP 200, SQLite integrity
`ok`, zero active builds/launches and unchanged service PID/runner SHA. This tests
application restart persistence, not power-loss recovery or provider VM replacement.
Native Codespaces browser interaction remains pending. First launch timings
exceed 20s; cached timings are not a universal first-launch guarantee.

Evidence: `stack-flask-valkey-{url,google,codespaces,audit}.json`. Current coverage:
**55 isolated / 39 Google browser / 39 Codespaces protocol**, **16** native
fixtures pending. Source: **6,567 physical lines**; full suites **166/166** locally
and in isolated aswin Linux QA remain valid.


## Go compiled runtime inspection and transport preflight

Added a read-only acceptance probe for the Go net/http fixture. It inspects the
running container command and copied compiled binary, verifies Linux x64 ELF,
Go build metadata and module identity, and checks the product's saved file counter
and persistent storage. It does not require a shell or compiler in the scratch
runtime. Tests reject changed executables, modules, storage, ports and malformed
metadata, and verify cleanup on failure and standalone command serialization.

The real stored artifact passed an empty chunked POST and a full application
stop/relaunch: **0→1→2**, with actual **Go 1.24.13**, CGO disabled and module
`pods.example/counter`. Scoped test containers, volume and storage were removed.
This is file persistence evidence, not a database or provider VM replacement test.

Evidence: `stack-go-chunked-probe.{json,mjs}` and
`stack-go-runtime-probe-tests.json`. Full suites: **171/171** locally and in
isolated aswin Linux QA. Source: **6,679 physical lines**. Native coverage remains
**55 isolated / 39 Google browser / 39 Codespaces protocol** until native Go
acceptance completes.


## Go native product acceptance

The actual developer form prepared `examples/stacks/go` from fixture revision
`d6da2ed780ae` in **141.001 seconds** after ordinary quota availability. Artifact
`22abe2e07a65aa69563aca7635d2d8169ac376e7d0faa6610c6d210aabac7018` contains
**4,755,738 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 8.294s; product counter observed by 10.223s; button write 10.512s |
| Cloud Shell cached relaunch | Server healthy 6.292s; product visible 7.228s; saved value restored 7.241s; next write 7.559s |
| Codespaces initially Shutdown | Server healthy 32.594s, delivery/startup 17.705s; no cached image |
| Codespaces cached relaunch | Server healthy 8.040s; authenticated HTTP write/read and compiled Go inspection passed |

Cloud Shell browser buttons and reloads verified **0→1→2**, retaining the first
saved counter across a complete application stop/relaunch. No console warnings
or errors were observed. The first timing check initially matched the identically
named launcher heading. That observation is retained separately and excluded
from product visibility: the first successful counter observation at 10.223s is
an upper bound for product visibility. The second check matches the product h1.

Codespaces authenticated HTTP verified the same counter sequence. Read-only
inspection of copied files confirmed the actual compiled **Go 1.24.13** Linux x64
executable, CGO disabled, module `pods.example/counter` and saved counter. It
required no compiler or shell in the scratch runtime. The bind volume uses
persistent workspace storage and product port **21639** is private.
This fixture uses a file counter and is not evidence of database durability.

Both Google runs stopped before Codespaces testing began. All four launches
ended stopped. The final audit returned HTTP200, SQLite integrity `ok`, zero
active builds/launches and unchanged service PID/runner SHA. Native Codespaces
browser interaction and provider VM replacement remain unverified. The stopped
Codespace exceeded20s; the ready-compute results apply to this fixture only.

Evidence: `stack-go-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 40 Google browser / 40 Codespaces protocol**; **15** native
fixtures remain pending. The171/171 full suite and6,679 source-line count remain
valid because native acceptance added only evidence and documentation.


## Echo and Fiber compiled framework inspection

The Go inspection helper now has explicit Echo and Fiber fixture profiles. It
checks their compiled module, declared toolchain and framework dependency/version,
with tests for missing, substituted and replaced dependencies. All three profiles
serialize into a standalone read-only inspection command. Existing Go boundary,
malformed-binary and temporary-file cleanup checks remain covered.

Actual stored artifacts confirmed **Echo 5.4.0** and **Fiber 3.5.0**, both compiled
with **Go 1.26.8**, CGO disabled. Each passed the empty chunked POST used by the
preview path and **0→1→2** file persistence over complete application stops.
Scoped test containers, volumes and storage directories were removed; shared
runtime/cache remained. This is isolated artifact evidence, not native provider,
database or VM replacement acceptance.

Evidence: `stack-{echo,fiber}-chunked-probe.json`,
`stack-go-framework-chunked-probe.mjs`, and `stack-go-framework-runtime-tests.json`.
Full suites: **173/173** locally and isolated Linux QA. Source: **6,703 lines**.
Native coverage remains **55 isolated / 40 Google browser / 40 Codespaces
protocol** until the next native acceptance gate.


## Echo native product acceptance

The actual developer form prepared `examples/stacks/echo` from fixture revision
`d6da2ed780ae` in **163.464 seconds** after ordinary quota availability. Artifact
`dc5e8406d26e9c1aebb0161d973f96983ca054a37a7d0756e66de04363c37c8a` contains
**5,835,598 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 8.590s; product visible 10.545s; counter read 10.892s; button write 11.206s |
| Cloud Shell cached relaunch | Server healthy 5.989s; product visible 6.519s; saved value restored 6.527s; next write 6.821s |
| Codespaces initially Shutdown | Server healthy 29.707s; delivery/startup 15.005s; no cached image |
| Codespaces cached relaunch | Server healthy 8.303s; authenticated HTTP write/read and compiled framework inspection passed |

Cloud Shell browser buttons and reloads verified **0→1→2**, retaining the first
counter across a complete application stop/relaunch. No console warnings or
errors were observed. Visibility checks matched the product h1, not the similarly
named heading on the launcher page.

Codespaces authenticated HTTP verified the same counter sequence. Fixed read-only
inspection confirmed **Echo 5.4.0** (`github.com/labstack/echo/v5`), compiled with
**Go 1.26.8**, module `pods.example/echo`, Linux x64 ELF, CGO disabled, and the
saved file counter. Persistent workspace storage was verified; product port
**23473** remains private. This fixture uses a file rather than a database.

Both Google runs stopped before Codespaces tests began. All four launches ended
stopped. Final audit: HTTP200, SQLite integrity `ok`, no active build or launch,
unchanged service PID and runner SHA. The stopped Codespace exceeded20s; cached
and running-compute measurements are fixture-specific. Codespaces browser
interaction and provider VM replacement remain unverified.

Evidence: `stack-echo-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 41 Google browser / 41 Codespaces protocol**; **14** native
fixtures remain pending. Full suite173/173 and source6,703 lines remain valid;
this acceptance step changed only evidence and documentation.


## Rust and ASP.NET preview transport preflight

Pinned stored artifacts for **Actix, Axum, Rocket and ASP.NET Core** passed the
empty chunked POST used by the preview path. Each served its actual product
page and retained its file counter through complete application stops:
**0→1→2**. Read-only Docker inspection verified the product port, service network,
workspace-backed persistent volume and saved file value.

The checks used current runner sources in isolated aswin Linux QA. Artifact and
fixture-source checksums were verified; runner, container runtime, storage
transition and probe source hashes were recorded. All temporary test containers,
volumes and selected data directories were removed. Shared runtime/cache were
retained. These are file-persistence and transport checks, not database, new
browser or native-provider acceptance.

Evidence: `stack-counter-transport-preflight.json` and
`stack-counter-transport-probe.mjs`. Native coverage remains **55 isolated /
41 Google browser / 41 Codespaces protocol**. No implementation or existing test
source changed; **173/173** full-suite results and **6,703 source lines** remain
valid. Fiber native preparation awaits ordinary quota availability.


## Fiber native product acceptance

The actual developer form prepared `examples/stacks/fiber` from fixture revision
`d6da2ed780ae` in **207.644 seconds** after ordinary same-account quota
availability. Artifact `469391b875d8acec3bc3cddc69d9a91f543b988496a3983853cf8cb794fc0ebf` contains **7,801,893 image bytes**. No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 8.734s; product visible 10.617s; counter read 11.474s; button write 11.849s |
| Cloud Shell cached relaunch | Server healthy 6.362s; product visible 7.888s; saved value restored 8.002s; next write 8.291s |
| Codespaces initially Shutdown | Server healthy 41.463s; delivery/startup 19.557s; no cached image |
| Codespaces cached relaunch | Server healthy 7.745s; authenticated HTTP write/read and framework inspection passed |

Google browser buttons, reloads and full application stop/relaunch verified
**0→1→2** without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence, and fixed read-only
inspection confirmed **Fiber v3.5.0**, **go1.26.8**,
module `pods.example/fiber`, Linux x64 ELF and CGO disabled. The saved file value
matched each product write; its volume is backed by the persistent workspace.
Product port **21784** remains private. This fixture stores a file, not a database.

Google launches completed and stopped before Codespaces tests began. All four
launches ended stopped. Audit at 2026-10-04T06:11:48.644769+00:00 confirmed health200, SQLite
integrity ok, zero active builds/launches and unchanged service PID/runner SHA.
The stopped Codespace exceeded20s. Measurements are fixture-specific; native
Codespaces browser interaction and VM replacement durability remain unverified.

Evidence: `stack-fiber-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 42 Google browser / 42 Codespaces protocol**, with **13** native
fixtures pending. All four Go fixtures have passed these native paths. Full
suite **173/173** and source **6,703 lines** remain valid because this step changed
only evidence and documentation.


## Shared Rust and ASP.NET native storage inspection

The native Codespaces harness can now directly inspect saved counter files for
Actix, Axum, Rocket and ASP.NET. The opt-in probe checks the exact recipe command,
single web service, project network, assigned product port and persistent volume.
It copies only the fixed counter file; temporary copies are removed even when
inspection fails. It does not execute container tools or independently identify
the framework version.

Six focused tests cover expected commands, incorrect records, invalid inputs,
container/network/port/storage boundary failures, symlinks, oversized files and
copy cleanup. Serialization is tested in fresh processes for all four profiles.
The full suite passes **179/179** locally and in isolated aswin Linux QA.

All four pinned real framework artifacts passed this same helper with empty
chunked POST and **0→1→2** file counters across full application stops. Scoped
containers, volumes and temporary storage were removed. These checks prepare the
native acceptance path; native coverage remains **55/42/42**, with13 pending.
Evidence: `stack-file-counter-runtime-{preflight,tests}.json` and `-live.mjs`.
Physical source is now **6,814 lines**. No application runtime or provider behavior changed.


## Actix Web native product acceptance

The actual developer form prepared `examples/stacks/actix` from fixture
revision `d6da2ed780ae` in **393.585 seconds** after ordinary same-account
quota availability. Artifact `97dbfbd5dce84c99a65a68f658830ae8b6968ebc73ebd2e1369c7563917431ce` contains **33,417,771 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 14.015s; product visible 16.414s; counter read 16.429s; button write 16.725s |
| Cloud Shell cached relaunch | Server healthy 5.978s; product visible 6.428s; saved value restored 6.539s; next write 6.814s |
| Codespaces initially Shutdown | Server healthy 47.023s; delivery/startup 32.168s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.442s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **21699** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T06:39:38.804273+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-actix-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 43 Google browser / 43 Codespaces protocol**, with **12** native
fixtures pending. Full suite **179/179** and source **6,814 lines** remain valid;
this acceptance changed only evidence and documentation.


## Gradio and Streamlit protocol preflight

Pinned isolated artifacts passed real network interaction and full application
stop/relaunch. Gradio6.29.1 used named read/increment endpoints and SSE completion;
Streamlit1.65.0 used binary WebSocket widget messages, rerun completion and a fresh
WebSocket reconnection. Both wrote0→1→2; independent read-only SQLite3.46.1 queries
confirmed one saved row and quick_check=ok after each write. No direct SQL writes
or app-function imports substituted for the product interaction.

The Streamlit probe initially assumed absent Tornado and an incorrect Metric
protobuf field. Installed package metadata and descriptors identified websockets
17.1 and Metric.body. A failed temporary-file transfer also reran the old probe;
subsequent transfers used the file owner, set -e and matching SHA256 verification.
The evidence retains these failed probe attempts and scoped cleanup results.
All probe containers, named volumes and uniquely identified storage directories
were removed; shared runtime/image caches remain.

Evidence: stack-dashboard-protocol-preflight.json, with exact executed scripts
stack-dashboard-protocol-live.mjs and stack-streamlit-protocol-live.py. These are
QA prototypes, not native harness integration, new browser acceptance, or proof
of provider preview WebSocket forwarding. Native counts are unchanged by this
preflight. Harden reusable helpers, add meaningful negative tests and integrate
them into live-codespaces before Gradio/Streamlit native acceptance. Full179 and
source6814 remain valid because only evidence/documentation changed.


## Axum native product acceptance

The actual developer form prepared `examples/stacks/axum` from fixture
revision `d6da2ed780ae` in **271.288 seconds** after ordinary same-account
quota availability. Artifact `e9d2012dfcc0a13588a557f61e43a83670e5570ef9d34681a36f51ac8c15e2a5` contains **32,230,478 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 13.457s; product visible 14.683s; counter read 15.137s; button write 15.444s |
| Cloud Shell cached relaunch | Server healthy 6.313s; product visible 7.512s; saved value restored 7.625s; next write 8.007s |
| Codespaces initially Shutdown | Server healthy 38.168s; delivery/startup 23.123s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.285s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **24931** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T06:55:37.619880+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-axum-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 44 Google browser / 44 Codespaces protocol**, with **11** native
fixtures pending. Full suite **179/179** and source **6,814 lines** remain valid;
this acceptance changed only evidence and documentation.


## Shared dashboard native acceptance helper

- scripts/probe-dashboard.mjs and probe-streamlit.py implement real Gradio6.29.1
  named endpoint/SSE and Streamlit1.65.0 binary WebSocket widget interactions.
  The probe validates the single container/project network, assigned product
  port and persistent workspace volume before interaction, then checks the
  actual SQLite file read-only. Responses, process time and message sizes are
  bounded. Saved value must match before a new write and after reconnect/read.
- scripts/live-codespaces.mjs now supports PODS_DASHBOARD_FIXTURE=gradio or
  streamlit with PODS_EXPECT_INITIAL_COUNT=0. It restricts the source folder,
  enforces two Codespaces launches, rejects mixed fixture modes and records
  dashboardCheck. The second launch requires the first saved value. Browser
  preview forwarding/interaction remains a separate acceptance gate.
- Five focused tests cover invalid identities/boundaries/ports/volumes, stale
  values before writes, failed/malformed/duplicate SSE events, oversized replies,
  wrong Streamlit results and corrupt/inconsistent SQLite. A fresh subprocess
  tests self-contained serialization with the embedded Python protocol.
- Full184/184 passed locally and in isolated Linux. Initial Linux snapshots
  omitted public assets and then compatibility data; failed results/hashes are
  retained in stack-dashboard-helper-tests.json. Final snapshot matched every
  manifest file before execution. No local passing suite was unnecessarily rerun.
- Real pinned Gradio/Streamlit artifacts passed the exact serialized helper
  with0→1→2 across full application stops. All scoped containers/volumes/storage
  removed. Candidate/output/dashboard-candidate-ada4194 remains with dependencies
  linked to/opt/pods/node_modules. Evidence stack-dashboard-helper-{live.mjs,
  preflight.json,tests.json}. Source6994lines; native coverage unchanged55/44/44
  by this tooling. No product runtime/provider changes or service restart.


## Rocket native product acceptance

The actual developer form prepared `examples/stacks/rocket` from fixture
revision `d6da2ed780ae` in **373.628 seconds** after ordinary same-account
quota availability. Artifact `cd44c64f9825af4bd428ebd0adc280f8d7375fe95b7d46e60811d8356567ec80` contains **33,369,614 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 14.122s; product visible 15.271s; counter read 15.642s; button write 15.934s |
| Cloud Shell cached relaunch | Server healthy 6.683s; product visible 7.820s; saved value restored 7.934s; next write 8.210s |
| Codespaces initially Shutdown | Server healthy 42.472s; delivery/startup 30.224s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.303s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **29000** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T07:14:49.544099+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-rocket-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 45 Google browser / 45 Codespaces protocol**, with **10** native
fixtures pending. Full suite **184/184** and source **6,994 lines** remain valid;
this acceptance changed only evidence and documentation.


## PHP, Sinatra and Deno native inspection preflight

The shared opt-in file-counter inspector now recognizes the exact plain PHP,
Sinatra and compiled Deno fixture commands. Deno stores counter.txt; the other
file-backed representatives use count. PHP and Sinatra support documentation
now distinguishes their file persistence from the SQLite Laravel/Symfony/Rails
fixtures. No application runtime or provider changes were needed.

Pinned real artifacts passed empty chunked POST writes and read-back 0→1→2
across full application stops, plus direct saved-file, private network, assigned
port and persistent volume inspection. Scoped test containers, named volumes
and storage directories were removed; shared runtime/cache retained. This is
isolated QA evidence, not new native-provider or browser acceptance.

All seven fixed recipe commands/filenames passed direct and fresh-process
serialized unit cases. Full suite184/184 passed locally and in Linux QA after
all320 snapshot files matched the recorded manifest. Physical source6995lines.
Evidence: stack-file-profiles-{live.mjs,preflight.json,tests.json}.
Coverage remains55 isolated /45 Google browser /45 Codespaces protocol.


## Remaining SQLite framework transport preflight

Pinned real Ktor, Micronaut, Phoenix and Symfony artifacts accepted empty chunked
POST without a Content-Type header, read each saved value and retained0→1→2
across full application stops. Product h1, artifact/page-source hashes and the
transferred script hash matched. SQLite implementation sources also match,
except one additional trailing newline in Phoenix QA; every other byte matches.
Both raw hashes and normalized comparison are recorded. Initial exact-byte
audit stopped before cleanup; corrected interpretation preserved in evidence.
This transport check does not independently query the SQLite engine.
Disposable containers/volumes/storage were removed after all four passes.

Evidence: stack-sqlite-framework-transport-{live.mjs,preflight.json}.
No source/runtime/provider change; source6995/full184 remain valid. Native
coverage stays55/45/45. Ktor/Micronaut browser controls are #value and Add one;
Phoenix/Symfony use #count and Save +1. Use their actual DOM when testing native
product interactions; do not apply the Add one locator to those two fixtures.


## ASP.NET Core native product acceptance

The actual developer form prepared `examples/stacks/aspnet` from fixture
revision `d6da2ed780ae` in **135.216 seconds** after ordinary same-account
quota availability. Artifact `0b24bff6a3a7eec33ed8e883debcdc026c17772295fe84699b0905daad262edd` contains **89,962,194 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 26.710s; product visible 28.495s; counter read 29.012s; button write 29.308s |
| Cloud Shell cached relaunch | Server healthy 6.435s; product visible 7.781s; saved value restored 7.892s; next write 8.171s |
| Codespaces initially Shutdown | Server healthy 61.937s; delivery/startup 46.892s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.305s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **29758** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T07:36:33.391739+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-aspnet-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 46 Google browser / 46 Codespaces protocol**, with **9** native
fixtures pending. Full suite **184/184** and source **6,995 lines** remain valid;
this acceptance changed only evidence and documentation.


## Native timing evidence audit

Added reproducible evidence/stack-native-timing-report.py and generated
stack-native-timings.{json,md}. It selects only linked canonical first/repeat
pairs with explicit provider compute states, checks readiness timestamps and
unique launch identities, and admits browser timing only with a matching
start clock and sane readiness/interaction ordering. Missing data stays unknown.
All input hashes, source/result indices, raw cache fields and excluded pair
reasons are retained; private environment/preview values are not copied.

Initial report has86 classified observations from21 Google and22 Codespaces
fixture pairs;49 older/noncanonical pairs remain unclassified. These are
historical acceptance observations across revisions/fixtures, not a controlled
benchmark or provider ranking. All21 Google repeat server timings and19 usable
repeat browser timings are within20s, as are22 Codespaces repeat health timings.
Cold/first delivery often misses20s; native Codespaces browser is still pending.
No product/runtime change, source6995 and full184 remain valid. Regenerate
with python3 evidence/stack-native-timing-report.py after each native acceptance.
The temporary file-counter documentation helper now invokes it automatically.


## PHP native product acceptance

The actual developer form prepared `examples/stacks/php` from fixture
revision `d6da2ed780ae` in **248.459 seconds** after ordinary same-account
quota availability. Artifact `afdc81b489bd07093d81b01f676f17aac9fdc4159793d4e478e304e1e8dea17f` contains **222,191,011 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 62.295s; product visible 64.308s; counter read 65.309s; button write 65.598s |
| Cloud Shell cached relaunch | Server healthy 6.288s; product visible 7.541s; saved value restored 7.653s; next write 7.934s |
| Codespaces initially Shutdown | Server healthy 89.180s; delivery/startup 76.538s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.216s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **20228** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T07:58:20.270649+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-php-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 47 Google browser / 47 Codespaces protocol**, with **8** native
fixtures pending. Full suite **184/184** and source **6,995 lines** remain valid;
this acceptance changed only evidence and documentation.


## Sinatra native product acceptance

The actual developer form prepared `examples/stacks/sinatra` from fixture
revision `d6da2ed780ae` in **312.797 seconds** after ordinary same-account
quota availability. Artifact `effde18b31df036e0a4f359c6b0212fa4b719ca15dc8cb159ddb8ba52df8e693` contains **72,509,287 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 24.086s; product visible 25.589s; counter read 25.927s; button write 26.220s |
| Cloud Shell cached relaunch | Server healthy 6.355s; product visible 6.848s; saved value restored 6.963s; next write 7.345s |
| Codespaces initially Shutdown | Server healthy 53.926s; delivery/startup 38.570s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 9.048s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **26238** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T08:14:12.816897+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-sinatra-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 48 Google browser / 48 Codespaces protocol**, with **7** native
fixtures pending. Full suite **184/184** and source **6,995 lines** remain valid;
this acceptance changed only evidence and documentation.


## SQLite framework inspection helper checkpoint

- New `scripts/probe-sqlite-file-runtime.mjs` opt-in verification profiles for Ktor, Micronaut, Phoenix and Symfony. Validates exact prepared startup command, one web service, network, assigned8080port and durable workspace volume. Briefly pauses only the explicit fixture container, copies database/WAL, always attempts unpause, and queries the private copy read-only with Node SQLite. Cleans private snapshot on success/failure. Inspection version does not identify the application driver.
- `PODS_SQLITE_FILE_RUNTIME_CHECK=1` requires counter checks and exact supported fixture folder in `live-codespaces.mjs`; saved file inspection runs after the product write. No product/provider runtime changes or service restart.
- Five focused tests passed, including committed records present only in WAL, corrupt/stale/linked snapshots, boundary rejection, failure cleanup and a fresh-process serialized probe. Full189/189 passed locally and in isolated Linux after all322 snapshot file hashes matched. Initial incomplete Linux snapshot omitted the compatibility coverage JSON and failed2tests; correction and loghash recorded in `stack-sqlite-file-tests.json`.
- Real pinned Ktor/Micronaut/Phoenix/Symfony artifacts passed0→1→2, exact serialized helper, SQLite quick_check, copied saved row and product response after resume. Full stop/relaunch retained each counter. Phoenix copied main/WAL/SHM; the others copied the checkpointed database. Evidence `stack-sqlite-file-{live.mjs,preflight.json,tests.json,audit.json}`.
- All scoped test containers, named volumes and storage directories removed, retaining shared runtime/cache and unrelated QA work. Audit 2026-10-04T08:24:19.882384+00:00: health200/integrityok/zeroactive, unchangedPID1063107/runnerSHA. QA source candidate `/output/sqlite-file-candidate-a6a7f5d`.
- Product source count now7128 physical lines. Native acceptance stays55/48/48; all7 remaining native fixtures still pending. Deno draft/watcher37339 unchanged; ordinary slot08:29:35UTC.


## Deno native product acceptance

The actual developer form prepared `examples/stacks/deno` from fixture
revision `d6da2ed780ae` in **145.456 seconds** after ordinary same-account
quota availability. Artifact `26bac45acce90f173c53ae38a2599c4565aab830fde4096cf368c29ef2672473` contains **61,421,201 image bytes**.
No QA artifact was imported.

| Native scenario | Observed result |
| --- | --- |
| Cloud Shell RUNNING, first image delivery | Server healthy 20.835s; product visible 22.944s; counter read 22.957s; button write 23.245s |
| Cloud Shell cached relaunch | Server healthy 6.789s; product visible 7.835s; saved value restored 7.951s; next write 8.233s |
| Codespaces initially Shutdown | Server healthy 53.678s; delivery/startup 38.833s; image cache hits 0 |
| Codespaces cached relaunch | Server healthy 8.944s; authenticated HTTP write/read and saved-file inspection passed |

Google browser buttons, reloads and full application stops verified **0→1→2**
without console warnings or errors. Product visibility matched its h1.
Codespaces authenticated HTTP verified the same sequence. Direct inspection
checked the recipe command, single web service, project network, assigned product
port **23310** and persistent workspace volume. The copied file counter matched
each write. This check does not independently identify the framework version;
the pinned source and real server build identify the prepared fixture.

Both Google launches completed and stopped before Codespaces tests began. All
four launches ended stopped; the Codespaces product port remained private.
Audit at 2026-10-04T08:36:33.712331+00:00 confirmed health200, SQLite integrity ok, no active
builds/launches and unchanged service PID/runner SHA. These are file-persistence
and fixture-specific timing results. Native Codespaces browser interaction and
VM replacement durability remain unverified.

Evidence: `stack-deno-{url,google,codespaces,audit}.json`. Coverage is now
**55 isolated / 49 Google browser / 49 Codespaces protocol**, with **6** native
fixtures pending. Full suite **189/189** and source **7,128 lines** remain valid;
this acceptance changed only evidence and documentation.
