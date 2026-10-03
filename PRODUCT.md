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
The current implementation passes 52 automated checks locally and on aswin. All 54 distinct stack fixtures have real server-build, reusable-artifact launch and meaningful browser-interaction evidence. The fixtures cover frontend, SSR, backend, database and worker combinations; they do not represent 54 different frameworks. Database fixtures have write/read/stop/relaunch checks. See `evidence/stack-coverage.json`, numbered stack matrix/browser evidence, and `SUPPORT.md` for the exact scope and retained failures.

Real developer repository submissions and native Cloud Shell product interactions pass for Flask + PostgreSQL, React + Express + PostgreSQL, Angular SSR + SQLite, and Quarkus + SQLite. Angular's cached launch displayed its usable product and saved record in 7.223 seconds; its uncached launch took 72.289 seconds to health. These observations do not establish a universal 20-second cold-launch guarantee.

Live Codespaces API launches and authenticated HTTP interactions pass for Flask/PostgreSQL and React/Express/PostgreSQL. A full Codespaces rebuild retained PostgreSQL data. An independent Chrome/PODS session completed Google authorization and automatically opened Quarkus, with a database write surviving reload; it used the same previously authorized Google identity. Native Codespaces browser sign-in, GitHub browser OAuth configuration, Cloud Shell VM replacement, and provider evidence for every remaining framework are still pending. Local QA evidence must not be described as native provider validation. Historic prototype results remain in their dated evidence files.
## Product Principles
Build once. Keep user compute user-owned. Show honest progress and timings. Never label a local test as provider validation.

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
