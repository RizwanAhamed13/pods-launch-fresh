# Product
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Delegated by the user. Node.js control plane and a dependency-free Node launcher; esbuild prepares Node applications on aswin.
## Users
Developers prepare an app once. Users try it on their own Google Cloud Shell or GitHub Codespaces compute.
## Product Purpose
Let a developer submit a Git repository URL once, then let a user experience the working application on their own compute. PODS fetches, detects, builds, verifies and stores the application on aswin. The user authorizes Google Cloud Shell or GitHub Codespaces and is taken directly to the usable product page.
## Operating Context
A fresh project on aswin, a new GitHub repository, no previous PODS source or project references.
## Capabilities and Constraints
Provider authorization is required. Cold provisioning is provider-controlled and measured separately from artifact startup. No paid user runtime is owned by PODS. Current preparation detects conventional Node/TypeScript servers, Vite/React frontends and static HTML sites; all use the Node launcher. Additional language/framework adapters and private repository authorization remain pending.
## Evidence on Hand
The original Node prototype passed 11 automated tests and launched its prepared demo into ready Google Cloud Shell in 4.725 and 4.218 seconds. A browser test through an authenticated SSH tunnel saved and reloaded a note. This does not establish the complete browser authorization and native-preview journey. Cold Cloud Shell provisioning took about 46 seconds in the initial attempt. The original Codespaces and GitHub Actions attempts were blocked by account quota/billing. The latest Codespaces attempt was accepted but timed out during provisioning after four minutes; no app ran in that environment. See evidence/RESULTS.md.

The automatic preparation stage passes 21 automated tests on aswin and has separately exercised an isolated public repository build, TypeScript preparation without pods.json, and npm installation plus a Vite production build. See evidence/PREPARATION.md for the stage's scope and remaining work.
The browser flow now passes 33 automated tests plus manual developer/launch/product checks with explicitly simulated providers. Real native provider browser journeys and visible-product timing remain unverified. See evidence/BROWSER-FLOW.md.
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
