# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Node.js control plane and portable launcher. Isolated builds on aswin produce Node bundles, static production assets, or prebuilt Linux containers and database services. JVM, Go, Rust, .NET and other runtime compilation happens during preparation, not on user compute.
## Users
Developers prepare an app once. Users try it on their own Google Cloud Shell or GitHub Codespaces compute.
## Product Purpose
Let a developer submit a Git repository URL once, then let a user experience the working application on their own compute. PODS fetches, detects, builds, verifies and stores the application on aswin. The user authorizes Google Cloud Shell or GitHub Codespaces and is taken directly to the usable product page.
## Operating Context
A fresh project on aswin, a new GitHub repository, no previous PODS source or project references.
## Capabilities and Constraints
Provider authorization is required. Conventional public GitHub applications can be detected without a PODS-specific manifest. Existing Dockerfile/Compose projects extend the supported recipes. The explicit framework, application-type and database matrix is in `SUPPORT.md`; it is not a claim of universal repository compatibility. Private repositories, missing external secrets, unsupported Compose options, desktop/mobile binaries and GPU workloads remain constraints.

Cold provisioning and uncached image transfer are measured separately from cached launch. User compute remains owned and billed by the user's provider. Persistent container data is stored under Cloud Shell's home or Codespaces' `/workspaces`; provider lifecycle durability requires separate evidence.
## Evidence on Hand
As of 2026-10-04, all 328 automated checks passed locally and in isolated Linux.
See [registry launch tests](evidence/stack-registry-launch-tests.json); earlier
failures remain recorded in their original evidence.
The matrix records 55 passing representative applications: isolated server build,
prepared-artifact launch and browser interaction, plus 55 native Cloud Shell
browser acceptances and 55 Codespaces HTTP/protocol acceptances. The historical
MongoDB fixture failure remains recorded; the supported MongoDB 7 fixture passed.
These counts describe representative applications, not universal version support.

Native Codespaces browser sign-in/interaction remains unverified. First-image
launches still exceed the 20-second product target in several measured cases;
cached and cold observations remain separate. A stable production hostname and
Cloud Shell VM-replacement durability also remain open. Database acceptance
covers the recorded write/read/stop/relaunch scenarios, not arbitrary migrations
or power-loss guarantees. Current source totals 9,764 scoped physical lines.

The disabled-by-default OCI registry foundation now indexes verified prepared
images and serves them through launch-scoped authorization, with bounded storage
and private blob publication support. Actual Docker pulls in separate QA stores
fetched57.4MB cold,11.2MB with a matching base, and zero blobs on repeat; exact
image identities and dependency execution passed. Automatic preparation and
runner selection are now implemented. The integrated runner passed actual
cold/cached pulls, forced full-archive repair of an incomplete image, corrupt
manifest fallback and transfer cancellation, with temporary credentials removed.
Native CDN/provider validation remains pending. Production continues running the
earlier full-archive pipeline. These are image-transfer checks, not application
or database acceptance. See [integrated Docker evidence](evidence/stack-registry-launch-qa.json).

The image preparation pipeline now holds at most two images in flight and loads
verified archives into Docker serially. Eight new tests cover overlap, bounded
prefetch, transfer cancellation, integrity and staging-file preservation. A small
isolated comparison with real prepared bytes and Docker loads averaged21.570s
before/16.043s after (25.6% less image-preparation time). It uses synthetic cache
misses against equally warmed Docker content and does not establish native launch
speed. See [pipeline evidence](evidence/stack-image-pipeline-comparison.json).
The validated pipeline is deployed. Native Google React + Express + PostgreSQL
passed cached launch, write, reload and full stop/relaunch, retaining3→4→5.
Continuous cached product/write timing was9.852s/10.148s. Both previews are stopped. See
[native acceptance](evidence/stack-image-pipeline-native.json).

A subsequent native Google Flask + MariaDB check verified both images absent
before launch, with existing data and caches preserved. CDN range delivery passed
for both images with no fallback; image preparation took16.450s. The actual
product appeared in30.229s and saved a database write in30.947s, still above20s.
Cached relaunch reached product/write in12.607s/13.005s. Values2→3→4 survived full
stop/relaunch and reloads; direct inspection confirmed MariaDB11.4.13, private DB
networking and persistent home storage. Both previews stopped. This is first-image
acceptance on running compute, not a cold machine or a universal speed guarantee.
See [first-image evidence](evidence/stack-pipeline-mariadb-native.json).

A subsequent isolated [layer-reuse diagnostic](evidence/stack-layer-reuse-diagnostic.json)
loaded the exact Flask image from 11.1 MB instead of 57.0 MB when four shared
compressed layers were already present. In a physically empty Docker/containerd
store, the same smaller archive misleadingly passed load/identity checks but
could not execute; importing the verified full archive repaired it. Both private
test daemons stopped and existing caches were preserved. Native inspection was
read-only. Layer delivery is not implemented, no product timing improvement is
established, and the deployed source, 292-check results and 9,012-line count remain
unchanged. Any implementation needs stronger completeness checks and a bounded
full-archive fallback.



The deployed browser client recovers transient status-read failures without
repeating creation or product writes. It now polls every 250 ms during delivery
and startup, retaining normal build/provisioning/stop cadence and failure backoff.
In a small controlled browser comparison, readiness detection averaged 153.5 ms
versus 811 ms; status reads increased from four to seven per launch. Native Google
product/reload/full-stop/relaunch acceptance passed: cached product visible in
9.877s, button write in 10.598s. A suspended-compute run with no cached image and
a CDN fallback took 54.875s to health; its click-to-product time was not measured.
Use [SUPPORT.md](SUPPORT.md), [fixture coverage](evidence/stack-coverage.json),
[tests](evidence/stack-image-pipeline-tests.json),
[controlled comparison](evidence/stack-browser-handoff-comparison.json),
[native browser evidence](evidence/stack-browser-handoff-native.json) and the
[current checkpoint](evidence/STACK-HANDOFF.md) for exact scope and limitations.

The latest backend change reduces the Codespaces preview polling interval to
500 ms while retaining private visibility and the shared deadline. A small
controlled-order comparison observed about 0.535s less registration time; two
native cached-image launches then passed product HTTP and SQLite persistence.
See [polling evidence](evidence/stack-codespace-preview-poll.json) and
[native integration](evidence/stack-codespace-preview-poll-native.json). These
observations do not establish first-image or universal 20-second acceptance.

Image delivery now retains a fixed failure category and optional HTTP status when
CDN transfer falls back to origin. It excludes upstream URLs, messages, headers
and bodies; transfer policy is unchanged. The historical fallback did not recur
in a diagnostic transfer: the existing 125 MB image verified in 5.532s on RUNNING
Cloud Shell with warm CDN paths. Its original cause remains unknown. After
deployment, two cached native Google launches displayed the product in 11.636s
and 10.050s; writes, reloads and full stops retained SQLite 16 → 17 → 18.
See [diagnostics](evidence/stack-cdn-fallback-diagnostic.json) and
[native integration](evidence/stack-cdn-fallback-native.json). These observations
do not establish first-image performance or a native fallback fix.

A subsequent [ready-compute first-image check](evidence/stack-ready-first-image.json)
showed Ktor's origin-only product in36.943s and an existing CDN-backed Micronaut
product in21.632s. Both had absent images and passed database writes/reloads/full
stops; their cached relaunches showed the product in7.585s and9.516s. Neither
first-image interaction met 20s. That inventory identified 55 of 59 prepared images
without CDN mappings.

Operators can now migrate an explicitly selected existing artifact to private
image delivery without rebuilding it or changing its launch link. Offline
preflight verifies all selected bytes; publication resumes through verified asset
reuse. [Live validation](evidence/stack-image-migration-operator.json) migrated the
existing 54.9 MB FastAPI image and reused the same asset on repeat, preserving
artifact files, database records, configuration and the running service.
[Native Google acceptance](evidence/stack-image-migration-native.json) then showed
its product in 17.309s and completed a SQLite write in 17.939s on RUNNING compute
with the image absent. Cached relaunch took 5.946s to product and 6.389s to write.
SQLite 2 → 3 → 4 survived reloads and full stops. That checkpoint brought delivery
mappings to five of 59 images. This case meets 20s; broader first-image acceptance
and native Codespaces browser acceptance remain open.

The [multi-service migration](evidence/stack-multiservice-migration-native.json)
then passed React + Express + PostgreSQL using its original prepared link. All
three images (226.3 MB) were published and reused on repeat without a rebuild.
The image-absent Google launch took 48.805s to health; its product was observed
within 52.609s, including a 6.514s observation gap. The cached product appeared in
9.938s and completed a write in 10.339s. PostgreSQL 1 → 2 → 3 survived reloads and
full stops. Runtime inspection confirmed unpublished API/database ports and
persistent home storage. Eight of 59 prepared images now have mappings; 51 remain
unmapped. The three-image first launch still misses 20s, with 37.624s spent in image
preparation. Source currently processes those images sequentially; overlapping
bounded downloads and Docker loading needs separate validation.

## Historical acceptance milestones
The observations below retain their original milestone context. Counts and pending
frameworks in these historical paragraphs are not current coverage; the evidence
summary above and SUPPORT.md are authoritative for current status.

Real developer repository submissions and native Cloud Shell product interactions pass for Flask + PostgreSQL, React + Express + PostgreSQL, Angular SSR + SQLite, Quarkus + SQLite, Laravel + SQLite, Blazor Server + SQLite, and the Go Gin persistent-file counter. Angular's cached launch displayed its usable product and saved record in 7.223 seconds; its uncached launch took 72.289 seconds to health. These observations do not establish a universal 20-second cold-launch guarantee. The optimized npm recipe excludes download caches while retaining installed dependencies. All eight affected fixtures were rebuilt and retested. Its new Angular artifact showed saved data in the native Cloud Shell product in 8.312 seconds cached and took 61.933 seconds uncached to health; the old artifact’s SQLite record survived the upgrade.

Live Codespaces API launches and authenticated HTTP interactions pass for Flask/PostgreSQL, React/Express/PostgreSQL, Quarkus/SQLite, Laravel/SQLite, Angular SSR/SQLite, Blazor/SQLite and Gin with persistent file storage. Laravel retained a saved record after a confirmed stop and fresh launch on both providers; its cached native Google product appeared in 8.187 seconds. A full Codespaces rebuild retained PostgreSQL data. An independent Chrome/PODS session completed Google authorization and automatically opened Quarkus, with a database write surviving reload; it used the same previously authorized Google identity. Native Codespaces browser sign-in, GitHub browser OAuth configuration, Cloud Shell VM replacement, and provider evidence for every remaining framework are still pending. Local QA evidence must not be described as native provider validation. Historic prototype results remain in their dated evidence files.

Blazor was built through the real developer form in 186.353 seconds. Its uncached Cloud Shell launch took 31.573 seconds to health; a cached launch displayed saved SQLite data in 7.844 seconds. A further cached launch completed a native button write within 14.714 seconds, an upper bound including a browser-tool gap. The server-rendered page can appear before the Blazor connection: one early click was ignored, then a connected click worked. This is retained in the evidence instead of treating HTML visibility as interactivity. Codespaces reached health in 57.435 seconds resumed/uncached and 7.068 seconds cached, with HTTP write/read/stop/relaunch persistence. PODS now displays encoded document titles as plain text correctly.

Go Gin adds a small compiled-runtime native result: a real developer preparation took 287.355 seconds and produced an 11.1 MiB image. On existing Cloud Shell compute, the first-image launch completed a browser write in 12.764 seconds; a cached launch retained the saved count and completed another write in 9.174 seconds. Both were continuous click-to-interaction measurements. This fixture persists a file, not a database, and does not measure new VM provisioning. Codespaces reached health in 10.828 seconds with the Gin image absent and 7.393 seconds cached; authenticated HTTP write/read/stop/relaunch persistence passed. Its first attempt safely rejected a port occupied by the previous Blazor preview, which was then stopped explicitly. The failed attempt and cached-manifest caveat are preserved in the evidence.

The Flask/Python worker with Redis now passes real URL preparation and native Cloud Shell job completion, reload and full stop/relaunch persistence. Preparation took 138.088 seconds. Cloud Shell reached health in 29.905 seconds with both images absent and 8.254 seconds cached; the cached browser showed the retained job in 11.233 seconds and completed a new job within 11.543 seconds continuously from launch. Codespaces authenticated HTTP completed and retained jobs over two launches (31.143 seconds uncached, 9.308 cached); its browser authorization remains unverified. These are completed-job checks, not exactly-once or in-flight crash recovery. The launcher now monitors every service: isolated real-container faults revoked readiness in about 2.6 seconds even with a working web page, while successful one-time migrations remained valid. See `evidence/stack-worker-redis-*.json` and `evidence/container-liveness.json`.

Bun adds real URL preparation and Codespaces WebSocket/SQLite persistence evidence: preparation 106.981 seconds, health 24.716 seconds with its image absent and 7.138 seconds cached. Ping/pong, message-based updates, reconnect, HTTP readback and full stop/relaunch passed. The first Cloud Shell Bun attempt failed safely because a newer worker from another browser session occupied port 8080. After that worker expired naturally, Bun passed native WebSocket updates and SQLite reload/full restart persistence. Health took 20.170 seconds with the image absent (manifest already cached), then 5.678 seconds fully cached. A cached native launch displayed the retained record in 9.125 seconds and completed a WebSocket write in 9.430 seconds. Both previews stopped cleanly; the initial failure remains recorded. The server now prevents concurrent launches from separate sessions sharing a provider account, without exposing another session’s launch controls or history.

Rails + SQLite now passes real URL preparation and Codespaces HTTP/database
write/read/full stop/relaunch (104.115 seconds resumed with its image absent,
8.193 seconds cached). That native evidence uses the original image. The new
Ruby build/runtime split reduces isolated Rails and Sinatra image downloads by
62.8% and 66.5%; both rebuilt applications pass SQLite restart and real browser
write/reload checks. Rails also retained the earlier image's saved record.
The smaller Rails image then passed real URL preparation (390.875 seconds),
native Cloud Shell browser write/reload/full restart, and Codespaces HTTP/SQLite
persistence across the image upgrade. Cloud Shell completed a database write
in 34.230 seconds image-absent and 10.966 seconds cached; Codespaces health took
59.936 seconds resumed/image-absent and 9.112 seconds cached. Codespaces retained
the original image's count 2 before writing 3, then retained 3 and wrote 4 on relaunch.
All previews stopped. Sinatra native timing remains pending.

## Product Principles
Build once. Keep user compute user-owned. Show honest progress and timings. Never label a local test as provider validation.

An expired connection on submission now reconnects and resumes the selected preparation or launch automatically, with one recovery attempt to prevent authorization loops. Cancelled authorization preserves the developer's draft. Browser regression evidence covers both actions, cancellation, repeated expiration and repository validation; provider authorization and compute were simulated for this regression (`evidence/browser-reconnect.json`).

## Combined Goal — URL Preparation and Developer/User Journeys

The repository-URL workflow and the developer/user workflow are one product, not separate implementations.

1. A developer supplies a repository URL. PODS retrieves the selected source version on aswin, detects supported build and launch requirements, installs build dependencies, and prepares the application in an isolated build environment.
2. PODS starts and verifies the result before publishing a versioned, reusable artifact and a user-facing launch link. Supported applications do not require a developer-authored pods.json or devcontainer.json. Ambiguous applications and missing secrets receive an explicit, actionable explanation.
3. A user follows the application link, chooses their own Google Cloud Shell or GitHub Codespaces, and authorizes that provider. Developer repository access and end-user compute authorization are separate responsibilities.
4. PODS creates or reuses the user's environment, transfers the prepared artifact, starts it without a source build on user compute, and takes the browser to the actual application page.
5. The completion state is the usable product: its page renders and its main interaction succeeds on user compute. A terminal, log stream, placeholder preview, launcher page, or health response alone does not satisfy this goal.

## Completion Evidence Required

- An actual repository submission through the developer UI produces a verified artifact and a launch link without hand-written PODS configuration.
- An independent user session opens that link, authorizes a provider, and reaches the real application's page with no terminal commands or manual dependency installation.
- A meaningful application interaction is exercised in the browser, including persistence when the application provides it.
- Both provider integrations are exercised live; blocked or simulated results are explicitly unverified.
- A repeat user launch reuses the prepared artifact. Build time, provider startup, accepted-launch-to-health time, and browser-visible readiness are recorded separately.
- The 20-second application-experience target is measured after authorization, including browser readiness. Warm and cold environments are reported separately; earlier request-to-health measurements do not prove this target.
- Source, tests, deployment instructions and current evidence are pushed to the fresh GitHub repository and deployed on aswin.

## Expanded goal: frontend, backend and database compatibility

The user expanded the goal on 2026-10-03 to broad frontend/backend/application and
database support, with one representative application tested per advertised stack.
`SUPPORT.md` is the target matrix. Container recipes and an existing Dockerfile /
Compose route extend beyond the original Node-only launcher. Each framework needs
real build, meaningful interaction and provider evidence before the goal is complete.
Database acceptance includes persistence after stop/relaunch and explicit provider
storage durability. A JSON API is a valid product for an API application; a web
application still requires a usable rendered interface. Native/GPU/mobile programs
are outside the browser-compute delivery contract until a suitable interface and
runtime exist. Do not represent a generic container capability as proof that every
framework, arbitrary repository or external service works automatically.

## Additional historical milestones

These are chronological implementation records, not the current acceptance totals.

Nuxt now adds an eleventh native application family. Actual URL preparation took
241.125s. Cloud Shell health took 64.995s image-absent and 6.865s cached; the cached
native counter accepted a click in 7.936s continuously from launch. On the first
launch an early SSR-visible click was ignored before hydration; a later click
worked, and that failure is retained. Codespaces authenticated SSR and JavaScript
asset checks passed at 100.893s resumed/image-absent and 6.801s cached. Native
Codespaces browser interaction is still pending. Nuxt counter resets on reload
by design. Both provider pairs were stopped. A precise stale-session CSRF
rejection now preserves the intended action through one forced reconnection;
local browser regression verifies recovery without duplicate jobs or loops.

Django + SQLite adds a twelfth native application family. Actual URL preparation
completed in 109.340s and delivered a 56.0 MiB image. Cloud Shell reached health
in 21.853s with its image absent and 6.461s cached; actual browser writes completed
in 23.974s and 8.067s respectively, measured continuously from launch. Record 1
survived full application restart before write 2, and both writes survived reload.
Codespaces HTTP/SQLite checks independently passed 0→1/restart 1→2 at 25.116s
image-absent and 6.903s cached. All previews stopped. These results do not establish
fresh-VM speed or native Codespaces browser authorization.

Image delivery now reports installed-image/archive checks, verified transfer and
Docker loading separately. The deployed runner passes cached native Cloud Shell
Django interaction and Codespaces HTTP/SQLite restart checks while preserving
saved records. This is diagnostic instrumentation, not an image optimization;
the subsequent API launch identifies transfer as the dominant image phase. Evidence:
`evidence/image-phases.json`.

JSON-only products now have explicit representative evidence. The FastAPI API
fixture serves JSON and stores its counter in SQLite. Preparation discovers its
existing OpenAPI/Swagger interface, so one-click navigation can open `/docs`
instead of leaving the in-app browser on an unrendered JSON navigation. Local
schema validation and fixed provider-relative paths preserve the provider host.
Other API documentation layouts remain unverified; APIs without an interface
retain their JSON root.

FastAPI API + SQLite is the thirteenth fixture with native-provider evidence.
The real developer form prepared it in 84.909s. Cloud Shell automatically opened
its Swagger UI in 19.995s with the image absent and 8.119s cached. Its first cold
write completed at 26.383s; the cached retained-value read completed at 14.489s.
SQLite writes survived browser reload and full application restart. Codespaces
HTTP/API/documentation checks passed at 156.195s with a new environment and
9.734s cached, retaining SQLite across restart. Its native browser test remains
pending. All four previews stopped. At that checkpoint, source was 4723 physical lines under the scope
recorded in `evidence/code-lines.json`; this includes tests and example apps.

Next.js adds the fourteenth fixture with native-provider evidence. Real URL
preparation took 117.854s. Cloud Shell's cached launch completed a browser click
in 8.421s. First-image health took 88.177s and the first SSR-visible click did not
increment; a later click worked. Codespaces reached health in 111.017s before a
harness command syntax failure. The corrected command passed SSR and seven client
asset checks on cached relaunches at 7.181s and 6.660s. All five previews stopped;
initial failures remain in evidence. This counter resets on reload by design.

Nuxt's conventional standalone packaging now removes build-only dependencies from
its launch image. The representative artifact is 39.05% smaller and passes the
real repository preparation and native provider checks. Cloud Shell product
visibility measured 24.793s with an absent image and 6.454s cached; the cached
counter accepted a click by 6.738s. Codespaces health measured 43.350s first and
7.252s cached, with actual SSR/client assets checked. First-image launches still
miss the 20-second target. Native Codespaces browser authorization/interaction
and the remaining native fixture checks remain pending. See the Nuxt standalone
section of SUPPORT.md for exact evidence and scope.

Flask + MySQL is the sixteenth fixture with native-provider evidence. Developer
URL preparation took191.104s. Cloud Shell restored its saved database record by
11.458s and accepted a new write by11.742s on cached relaunch. Codespaces HTTP
write/read/restart checks passed, with its cached health at10.393s. Its actual
runtime exposed only product port8080 and retained the same durable MySQL volume.
First-image health took103.340s on Google and146.425s on Codespaces, both over20s.
All four test launches stopped. The remaining native checks and Codespaces browser
authorization are tracked in SUPPORT.md.


Spring Boot + SQLite is the seventeenth fixture with native provider evidence.
Its previous counter used a plain file; the corrected fixture now uses a verified
SQLite database. Normal repository preparation took 196.106s. Cloud Shell cached
product visibility took 16.055s, retained data was visible by 16.704s, and a new
write succeeded by 17.020s. Codespaces HTTP write/read/restart passed at 13.212s
cached. First-image health took 46.554s/77.906s on Google/Codespaces, exceeding 20s.
All four previews stopped with saved data retained. Native browser testing for
Codespaces and the remaining native fixtures are still pending. At that checkpoint, source was
5053 physical lines, including tests and examples; counting scope is recorded in
`evidence/code-lines.json`.


Standalone React adds the eighteenth fixture with native provider evidence.
Repository preparation took 33.711s and produced a 103,755-byte compiled frontend.
On existing Cloud Shell compute, actual React interactions succeeded in 6.203s
with the artifact absent and 6.104s cached. Browser localStorage survived reload
and full application relaunch. Codespaces provisioning made its first launch
131.308s; cached health took 5.304s, with the product mount and compiled entry
checked over authenticated HTTP. Native Codespaces browser interaction remains
pending. All four previews stopped. That checkpoint covered 55 isolated fixtures and 18
native fixtures, with 37 native fixtures remaining and 80 automated checks passing.


Application previews now receive stable, separate provider addresses. The real
React/Angular browser test proved their unchanged localStorage keys no longer mix
on the same Cloud Shell environment. Existing Spring Boot SQLite records also
survived the address change and a full app restart. Old browser-only state remains
at the former shared address; it is not copied between products.

Standalone Angular adds native fixture19. Normal URL preparation took97.208s;
Cloud Shell meaningful interaction took6.066s with the artifact absent and5.420s
cached. Codespaces authenticated HTTP passed at10.828s/6.807s after one upstream
failure. Native Codespaces browser interaction is still pending. That checkpoint covered
55 isolated fixtures,19 native fixtures and36 awaiting native acceptance. All87
automated checks passed on both machines; source totaled5,214 physical lines. The
Spring Boot Codespace later recovered and passed its new-port database retest:
SQLite 4→5, then 5→6 after full stop/relaunch. Its existing data and environment
binding were preserved. Universal
stack support and a cold-launch20-second guarantee are not established.


Standalone Vue is native fixture 20. Ordinary URL preparation took 33.055s.
Its actual Cloud Shell product retained browser state through reload and full
stop/relaunch; the continuous cached interaction took 7.367s. Codespaces checks
passed at 10.840s first and 7.572s cached, validating the product shell and compiled
entry over authenticated HTTP. All four launches stopped. Native Codespaces
browser interaction remains pending.

Codespaces status reads now recover from bounded transient failures. An uncertain
resume response is reconciled against the same saved environment; create/resume
mutations are never automatically repeated. Authorization and quota errors remain
immediate. All 93 automated checks pass locally and on aswin. Current coverage:
55 isolated fixtures,20 native fixtures,35 awaiting native acceptance; 5,274
physical source lines under the documented scope. The broad goal remains active.


The aswin control plane now runs as an enabled user service and recovered from a
controlled idle-process failure in 3.257s without changing prepared-build records
or reserved product addresses. Existing-session Google interaction and both
Codespaces smoke launches passed after recovery. The tunnel/hostname and full
host reboot remain outside this recovery evidence. Static compiled-asset checks
now cover all eight frontend fixtures, preparing the remaining native tests.
Coverage remains 55 isolated / 20 native / 35 pending; 93 checks pass on both
machines and the scoped source count is 5,276 lines.


Standalone Svelte adds native fixture 21. Normal server preparation took36.962s
under the supervised service. Actual Cloud Shell interaction took6.225s with the
artifact absent and5.785s cached, retaining browser state through a full app
restart. Codespaces served verified compiled assets in143.111s on new compute
and6.469s cached; native browser execution remains pending. Current coverage is
55 isolated /21 native /34 pending, with5,297 scoped physical source lines.
Codespaces shutdown transitions now retain and resume the same environment once;
three new regressions failed before the fix and all96 checks pass locally and on
aswin.

A controlled native Codespaces stop/relaunch passed on the fix, retaining the
same environment and cached artifact:130.003s with compute restart, then6.818s
cached. The initial provider state was not captured by the adapter; deterministic
regressions establish the shutdown transition, while this live test establishes
resume and compiled-product serving on the deployed revision.


Standalone Preact adds native fixture22 through ordinary URL preparation, with
no code or fixture changes. Google interaction took7.293s with the artifact absent
and5.809s cached, retaining localStorage through reload and full app restart.
Codespaces compiled-product checks passed at10.446s/6.814s on existing compute;
native browser execution is still pending. All four launches stopped, with the
provider port private. Current coverage:55 isolated /22 native /33 pending.
The runtime remains6cfadb6 with96 validated tests and5,297 scoped source lines.


Editing the developer's repository URL or folder now clears the old prepared
result, while preserving earlier versions in history. Cancelled authorization
restores the new draft without presenting a stale launch link. Browser checks
covered edits and reconnect continuation; the folder-change fix also passed on
production. Revision2cbfc93 has96 passing checks locally/aswin and5,307 source lines.


Standalone Solid adds native fixture 23. Ordinary URL preparation took 59.956s;
the Cloud Shell product responded to a click in 7.057s on first delivery and
5.469s after a full app restart, retaining its localStorage counter. Codespaces
served verified compiled assets in 27.546s with environment preparation and
7.458s cached; its browser interaction remains pending. All four launches stopped
and port 24730 remained private. Current coverage is 55 isolated / 23 native /
32 pending, with 5,307 scoped source lines and 96 passing automated checks.


Frontend acceptance now includes direct nested URL entry, correctly resolved
compiled bundles and honest missing-file responses. All eight prepared frontend
fixtures passed in isolated compute, and Solid passed an actual native Cloud Shell
nested-page interaction and reload. All99 automated checks pass locally/aswin at
bc1e2c7. Source totals5,328 lines; native fixture counts are unchanged.


PODS now has a public, filterable compatibility page at `/support`, available
without access to the private repository. Separate columns distinguish isolated
browser tests, native Cloud Shell browser tests and Codespaces HTTP/protocol
checks. Native pass labels require explicit acceptance flags; failed test records
cannot create a pass. The page states the remaining browser, performance and
application-type limits. Revision e5033d1 passed102tests locally/aswin and public
browser checks. Source totals5,423lines; coverage remains55isolated/23native.


Standalone Lit adds native fixture 24. Ordinary URL preparation took 47.476s.
The actual Cloud Shell product appeared in 7.398s on first delivery and 5.441s
cached, with successful interactions in 7.886s/5.735s. Counter state survived
reload, full application restart and nested URL entry. Codespaces passed compiled
asset and route checks at 28.477s/8.116s; browser execution remains pending. All
four launches stopped and port 26163 remained private. Current coverage is
55 isolated / 24 native Google browser / 24 Codespaces HTTP-protocol / 31 pending.
The public compatibility page reflects the explicit acceptance flags.


Launch records now preserve the provider state observed before startup and the
creation, resume or start request timestamp. This separates observed ready or
stopped compute from artifact cache state without guessing from elapsed time.
Historical launches without these fields remain unclassified. Nine new provider
scenarios failed before the change; all 111 automated checks pass locally/aswin
at `5e5b4a0`. Source totals 5,487 physical lines.


Alpine adds native fixture 25 and completes Cloud Shell browser acceptance for
all eight frontend fixtures: React, Angular, Vue, Svelte, Preact, Solid, Lit and
Alpine. URL preparation took 35.172 seconds. On observed RUNNING Cloud Shell
compute, the product appeared in 6.805 seconds on first delivery and 5.225 seconds
cached; clicks completed in 7.111 and 5.515 seconds. State survived reload, full
app restart and direct nested URL entry. Codespaces reported Available on both
launches and passed compiled-product checks at 10.609 and 6.612 seconds. All four
previews stopped and port 20343 remained private. Current coverage is 55 isolated,
25 native Google browser, 25 Codespaces protocol and 30 pending native fixtures.
Codespaces browser execution remains pending.

Astro now passes actual URL preparation, native Cloud Shell browser interaction
and Codespaces SSR checks. Preparation took 188.748 seconds. Cloud Shell began
RUNNING for both launches: first-image interaction took 45.645 seconds, while
cached interaction took 7.787 seconds with the saved counter retained. Codespaces
resumed from Shutdown with the image absent in 82.430 seconds to health; cached
Available compute reached health in 9.256 seconds. Its two HTTP checks verified
fresh server rendering and inline script delivery, not native browser execution.
All four launches stopped; the application port remained private. This increases
native fixture acceptance to 26, with 29 remaining; Codespaces browser authorization
and cold 20-second performance remain unproven.

React Router completes native acceptance for all six listed SSR fixtures, alongside
the eight static frontend fixtures. Normal URL preparation took 133.577 seconds.
The actual Cloud Shell page hydrated and retained its counter through reload and
full application restart: first-image interaction 32.930 seconds, cached 9.167 seconds.
Codespaces resumed from observed Shutdown in 63.435 seconds to health, then reached
health in 8.714 seconds cached on Available compute; rendered product and root/client
module checks passed twice. All four launches stopped with the product port private.
Coverage is now 55 isolated /27 Google browser /27 Codespaces protocol /28 awaiting
native acceptance. Browser localStorage is distinct from database durability;
Codespaces browser sign-in and the remaining completion gates are still pending.

Standalone Express adds native SQLite persistence evidence. Normal URL preparation
took 57.777 seconds. The Cloud Shell product completed its first database write
in 26.585 seconds; cached relaunch restored the saved count in 6.381 seconds and
completed another write in 6.677 seconds. Reload and full application restart
retained the data. Codespaces resumed from Shutdown in 52.999 seconds to health
and reached health in 9.201 seconds cached on Available compute; HTTP write/read
and full restart persistence passed. All four previews stopped and the product
port remained private. Current coverage is 55 isolated /28 Google browser /
28 Codespaces protocol /27 awaiting native acceptance. Codespaces browser
interaction, VM replacement durability and universal cold performance remain pending.

Automatic runner storage handoff now preserves the default single-service `/data`
store when an application changes between a container and a Node bundle. A real
isolated legacy-container → bundle → container → bundle check retained successive
SQLite values 1→2→3→4. Interrupted-copy recovery and conflicting-data rejection
are covered by automated tests. Native format-transition acceptance and Codespaces
runtime-label adaptation remain pending; the smaller Express packaging remains
experimental. The storage-handoff milestone contained 5,867 physical source lines under the recorded scope.

The provider now allows either known PODS runtime label for an application's
saved Codespace, after verifying its Node, Linux x64 Docker and Compose
capabilities. It retains the same environment and refuses incompatible compute
before dispatching an app. Both existing runtime profiles passed the read-only
native probe; full native format-transition acceptance remains pending. Current
code count is 5,920 physical lines; 134 automated checks pass locally and in
isolated aswin QA.


AdonisJS adds native SQLite persistence acceptance. Ordinary URL preparation took
92.087 seconds. On running Cloud Shell with the image absent, the actual product
appeared in 38.321 seconds and a successful write completed in 38.620 seconds.
The cached full relaunch restored the saved value in 8.914 seconds and completed
the next write in 9.196 seconds. Codespaces was already Available on both runs:
HTTP health took 41.977 seconds with the image absent and 9.286 seconds cached;
SQLite write/read/full restart persistence passed. All four previews stopped,
with the Codespaces product port private. Coverage is 55 isolated /33 Google
browser /33 Codespaces HTTP, with 22 awaiting native acceptance. Native Codespaces
browser interaction and universal 20-second first-image launches remain unproven.


Handled optional Node dependencies now stay in a prepared bundle with their
original application fallback. The real developer form prepared Express in
17.311 seconds as a 338,173-byte download, 99.59% smaller than its previous
82,250,849-byte container image. Native Cloud Shell restored the existing SQLite
record and completed a write in 6.906 seconds on the first bundle launch.
Container→bundle→container→bundle transitions retained values 3→4→5→6 through
real product interactions and reloads. Codespaces retained 2→3→4→5 in the same
saved environment, with authenticated HTTP health at 15.548s, 8.225s and 10.215s.
One Google compute-start timeout occurred before artifact delivery; a single
retry succeeded, and the failure is retained. These are ready-compute samples,
not a universal latency guarantee. All test previews stopped; private ports
and database integrity passed. Native Codespaces browser interaction, arbitrary
schema/multi-service migrations and VM replacement durability remain unproven.
At the optional-bundling milestone, source totaled 5,978 physical lines; all 138 test cases passed locally and in
isolated QA, with the missing QA coverage fixture restored before its affected
compatibility rerun.


Cloud Shell startup now reconciles a lost start response against the same running
environment and its unique SSH key, without sending another start request. The
146-test suite passes locally and in isolated QA. Native Express regression kept
SQLite data across full stops on both providers; the Google product appeared in
7.220s and 5.227s. Timeout recovery itself is covered by injected failures, with
the original native failure preserved. Source at that milestone totaled 6,120 physical lines.


FastAPI + SQLite adds native fixture 34. Normal URL preparation took 71.888s.
The Google product preserved SQLite values 0→1→2 through reload and full app stop/relaunch;
first-image interaction took 23.537s, cached saved-data restoration in 7.675s and
interaction in 7.959s. Codespaces product HTTP/write/read/persistence passed at
27.278s uncached and 8.907s cached. Both providers started with ready compute,
so the uncached samples show the remaining image-transfer cost. All four previews
stopped and the product port remained private. Current coverage 55/34/34 leaves
21 native fixtures, plus Codespaces native browser acceptance and the other
explicit completion gates, pending.


MariaDB's acceptance tooling now verifies the actual engine and saved SQL record,
private database ports, durable volume, and the assigned product port. A real
isolated MariaDB 11.4.13 artifact preserved 0→1→2 across a full stop/relaunch.
All 150 automated checks pass locally and in isolated Linux QA. Current source
is 6,207 physical lines. Native MariaDB acceptance subsequently passed as recorded below.


Flask + MariaDB adds native fixture 35. The actual repository form built the
reusable web/database images in 149.216s. Cloud Shell preserved database values
0→1→2 through button writes, reloads and full stops. The first-image write took
75.087s; cached saved-data restoration took 13.336s and the next write 13.628s.
Codespaces resumed stopped compute and reached health in 101.232s, then 11.325s
on cached relaunch. Product HTTP, persistence and direct MariaDB 11.4.13 record
inspection passed. Both services and their saved data ran on user compute. The
database had no host port and the product preview stayed private. All four
previews stopped. Coverage is 55/35/35 with 20 native fixtures remaining;
first-image latency and the previously documented browser, VM replacement and
hosting gates remain open.


MongoDB acceptance tooling now inspects the actual database build, WiredTiger
engine and saved document, together with private ports and persistent storage.
A real isolated MongoDB 7.0.43 artifact retained 0→1→2 across full stops. The
154-test suite passes locally and in isolated Linux QA. Source totals 6,293
physical lines; native coverage remains 55/35/35 pending the MongoDB launches.
