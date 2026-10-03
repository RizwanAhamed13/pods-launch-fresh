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
The current implementation passes 61 automated checks locally and on aswin. All 55 distinct stack fixtures have real server-build, reusable-artifact launch and meaningful browser-interaction evidence. The fixtures cover frontend, SSR, backend, database and worker combinations; they do not represent 55 different frameworks. Database fixtures have write/read/stop/relaunch checks. See `evidence/stack-coverage.json`, numbered stack matrix/browser evidence, and `SUPPORT.md` for the exact scope and retained failures.

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
pending. All four previews stopped. Source is 4667 physical lines under the scope
recorded in `evidence/code-lines.json`; this includes tests and example apps.
