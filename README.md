# PODS — prepare once, run on your compute

A fresh implementation. A developer submits a public GitHub repository URL. PODS detects conventional web applications, builds them in an isolated server container, and publishes a reusable artifact. Lightweight frontend/Node artifacts and prebuilt Linux container applications use the same launch flow. The current evidence and target framework list are tracked separately in [SUPPORT.md](SUPPORT.md). A user connects GitHub Codespaces or Google Cloud Shell. PODS delivers the immutable artifact and starts the app on the user's compute without installing packages or compiling source there. The browser form at `/develop` prepares a repository and produces a shareable, versioned launch link. The launch page preserves that version through authorization and automatically opens the product when ready.

The reference application is Field Notes: a real HTTP app whose notes are saved in the user's environment. The control plane never runs the preview application.

## Run the control plane

Requires Node.js 24, GitHub CLI (`gh`), OpenSSH client, and `curl` on the server. User environments need Node.js 22+ (PATH or standard NVM installation), `curl`, `sha256sum` and SSH support. The public [runtime repository](https://github.com/RizwanAhamed13/pods-launch-runtime-fresh) uses the official Node.js 24 Bookworm image pinned by digest and the SSH server feature required by GitHub CLI. The included configuration mirrors it. Initial Codespaces setup may install the runtime SSH feature; it never builds the submitted application.

```sh
npm ci --ignore-scripts
npm run prepare:demo
cp .env.example .env
# Set PODS_SECRET, PODS_ORIGIN, PODS_RUNTIME_REPO and optional OAuth credentials.
node --env-file=.env src/server.mjs
```

Use a stable HTTPS URL for provider callbacks. `.env` and `.data` are deliberately ignored by Git. The deployed aswin preview uses a temporary Cloudflare tunnel; its hostname is not a durable production URL.

## Prepare an application

PODS can detect a conventional Node/TypeScript server, a Vite/React frontend, or a static HTML site without a PODS configuration file. It reads an existing `package.json` start script or conventional server entrypoint, and collects conventional asset directories. Vite and React builds must produce their usual `dist` or `build` output. Unsupported or ambiguous projects fail with a specific explanation.

For the trusted operator CLI, install/build the app's dependencies and run `node scripts/prepare.mjs /path/to/app`. This now detects supported apps automatically. The isolated URL build worker described below handles dependency installation and build scripts itself; the browser form at `/develop` submits the repository and displays preparation progress and its versioned launch link.

An optional `pods.json` beside the app's source can override automatic detection:

```json
{
  "id": "my-app",
  "name": "My application",
  "description": "What someone can try",
  "entry": "src/server.ts",
  "assets": ["public"],
  "healthPath": "/health"
}
```

Install the app's build dependencies on the trusted build server, then:

```sh
node scripts/prepare.mjs /path/to/app
```

The builder uses esbuild to compile and bundle JavaScript/TypeScript into a production CommonJS entrypoint. Static sites receive a dependency-free web server with correct asset content types and client-side route fallback. The builder packages assets, compresses the payload, computes SHA-256, and publishes a manifest atomically in `.data/artifacts`. Hidden configuration files are excluded. The UI discovers prepared manifests automatically. An existing launch retains its original artifact digest after a developer publishes a new version.

### Isolated repository preparation

`scripts/setup-builder.sh` prepares a fresh unprivileged LXD base container on aswin. It installs the pinned Node distribution and this repository's builder tools. Build containers have no control-plane filesystem mounts or provider credentials; the template limits memory to 2 GiB, CPU to two cores, processes to 256 and the root filesystem to 4 GiB in a dedicated 12 GiB Btrfs pool. Its network permits public HTTP/HTTPS while rejecting private, link-local and Tailscale destinations. LXD's baseline DNS/DHCP services remain available. The manager serializes jobs and holds a host kernel lock across processes because bridge ACLs do not isolate peers on the same bridge. [LXD ACL behavior](https://canonical.com/lxd/docs/latest/howto/network_acls/).

`scripts/build-worker.mjs` accepts a public HTTPS GitHub repository URL and optional application folder. Inside a disposable clone of the base container, it fetches the source, records the commit, installs npm dependencies, runs the existing build script, packages the result and starts the artifact. Verification requires an actual HTML document or a valid JSON API at `/`; terminal output and generic plain-text responses are rejected. Browser rendering and interaction remain separate acceptance checks. It produces `artifact.gz` and `result.json`. The manager stops the container, reads only these bounded regular files through LXD, independently validates integrity and reconstructs public metadata, removes the container, then publishes the artifact and manifest atomically. A cleanup failure disables further jobs. This checks the product document, not all browser behavior or whether third-party code is trustworthy.

After provisioning the builder, set `PODS_BUILDS_ENABLED=1` and restart the control plane. `GET /api/me` supplies the browser CSRF value. With a connected GitHub or Google account, submit `POST /api/builds` with `{ "url": "https://github.com/owner/repository", "folder": "", "provider": "github" }`, the session cookie and `X-Pods-CSRF` header. Poll the returned ID at `GET /api/builds/:id`; only its browser session can read it. Successful results contain the artifact metadata and a versioned `/launch/:appId` URL which a separate user can consume. `/api/launches` accepts that exact `appId`. OAuth return paths preserve the selected version. The browser selects that exact version, preserves the action through authorization, and navigates the same tab to the provider preview when the application is healthy. Returning from the product does not trigger a redirect loop.

The queue permits four pending/running jobs, one active job per connected account, three submissions per account per hour, and twelve total submissions per hour. Limits survive browser-session changes. Each worker has a ten-minute execution deadline; setup and cleanup have separate bounded deadlines. Publication stops at 100 versions or 256 MiB already stored. An initialization pass removes only disposable `pods-fresh-job-*` containers; interrupted jobs become failed and can be submitted again. These are controlled-preview bounds, not a complete public abuse-prevention system.

Private repository authorization remains pending. Container recipes support additional package managers and language families; individual framework/provider validation is tracked in SUPPORT.md. The full combined acceptance criteria are in `PRODUCT.md`.

Apps must listen on `PORT` (8080), bind `0.0.0.0`, return HTTP 2xx from the health path, and write persistent files to `PODS_APP_DATA`. Lightweight Node runtime dependencies must bundle. Apps needing native modules, server framework runtimes or database services use the container path below. Working directory assets keep their relative paths. Artifacts are limited to 20 MiB compressed and 50 MiB unpacked.

## Connect providers

GitHub OAuth: register a web OAuth application with callback `PODS_ORIGIN/auth/github/callback`, then set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. The app requests `codespace read:user`. Stable numeric GitHub IDs and Google OpenID subjects identify accounts independently of display names. Set `PODS_RUNTIME_REPO=RizwanAhamed13/pods-launch-runtime-fresh` for the published public runtime, or use your own public equivalent. The control-plane repository stays private; users need access only to the runtime repository. The aswin deployment now uses this public runtime.

Google OAuth: create a web OAuth client in a Google Cloud project with the Cloud Shell API enabled, configure callback `PODS_ORIGIN/auth/google/callback`, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. It requests `openid email cloud-platform`; consent publishing or test-user setup is required by Google. No provider client secret is bundled into the browser or artifact.

Direct Google tokens must allow both Cloud Shell and OpenID user-info access. Until OAuth is configured, the UI offers an explicit access-token connection. Tokens are encrypted with AES-256-GCM, bound to an HttpOnly browser session, and expire from use after one hour (or the shorter OAuth token lifetime). The access-token path is for a controlled preview, not a substitute for a completed public OAuth rollout.

PODS creates or reuses only a Codespace named `PODS launch` in the configured runtime repository, preferring an already available environment over a stopped or provisioning one. It uses the user's token to deliver the runner over authenticated SSH. Cloud Shell uses its start API with an ephemeral SSH key; the key is removed after delivery. The runner verifies both its downloaded source and the application artifact. Application subprocesses receive a minimal environment without provider tokens. Artifacts must be from trusted developers: running a third-party app grants it the effective privileges of the user account inside that environment; this is not a sandbox for malicious apps.

## Timing contract

The 20-second target is measured, not promised. The UI separates:

- **Total launch:** accepted launch request to healthy callback, including provider provisioning and SSH setup. Does not include human consent time or preview page rendering.
- **Delivery:** provider reports ready to healthy callback, including SSH bootstrap.
- **App startup:** runner starts to local HTTP health success, including artifact download.

Cold VM provisioning, provider consent, image pulls, network throughput and authentication on the forwarded app URL can exceed 20 seconds. Reuse an already running environment for the fast path. GitHub's forwarded URL remains private. PODS links to the provider's authenticated preview; it does not expose a public app proxy.

Stop application sends a stop request to the runner. It stops the app process group within a few seconds, preserving note data and the cached artifact. Node previews can fall back to a private directory under `/tmp` when persistent storage is unavailable and explicitly report temporary storage. Container/database applications fail instead of silently opening an empty temporary database. No existing user files are deleted.

Preview processes also stop after 30 minutes even if the control plane disappears. The Codespace itself remains running until its provider idle timeout (15 minutes requested by PODS), or until the user stops it in GitHub. Cloud Shell has no API stop operation. Billing and quota remain the user's responsibility.

## Verification

```sh
npm test
npm run prepare:demo
# Explicitly consumes your Codespaces quota:
gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
# Cloud Shell, using an already authorized Google CLI account:
gcloud auth print-access-token | node scripts/live-codespaces.mjs https://your-pods-host google
```

Tests exercise the real builder and application runner, cache reuse, persistence, failed health checks, artifact tampering and path rejection, removal of inherited credentials, encrypted token storage, browser ownership, CSRF, artifact capability authorization and duplicate launch prevention. Live provider results are stored separately under `evidence/` and must not be inferred from mocked tests.

`test/builds.test.mjs` adds queue serialization, account limits, output validation, cleanup failures and API ownership checks. On aswin, `gh auth token | node scripts/check-build-api.mjs` tests a real public-repository submission against the running server, verifies the public launch page, and removes its temporary provider connection. Results are in `evidence/BUILD-API.md`. `evidence/BROWSER-FLOW.md` records the tested browser form, authorization continuation, exact-version navigation, product interaction and error recovery using explicitly simulated providers; these checks do not certify a real provider browser launch.

## Operating limits

Single Node process and local SQLite on persistent disk. Repository builds require a connected account, CSRF authorization and the isolated builder. Browser sessions last 24 hours. Provider credentials are not refreshed automatically: reconnect on expiry. A restart fails in-flight provisioning explicitly; ready agents continue heartbeats. Only one active app per browser/provider is allowed; selecting a different app while one is active returns an explicit conflict. Use provider controls to stop an environment immediately. This is a working prototype, not a completed public service: registered browser OAuth clients, real provider browser validation, durable DNS, stronger abuse controls, monitoring and a larger application compatibility matrix remain follow-up work.

Provider contracts: [Codespaces REST API](https://docs.github.com/en/rest/codespaces/codespaces), [GitHub CLI SSH](https://cli.github.com/manual/gh_codespace_ssh), [Cloud Shell start API](https://docs.cloud.google.com/shell/docs/reference/rest/v1/users.environments/start).

## Container application path (compatibility expansion in progress)

Run `scripts/setup-builder-v2.sh` on aswin after the original builder setup, then
set `PODS_BUILDER_BASE=pods-fresh-builder-v2`. This creates a separate 20 GiB Btrfs
pool and an unprivileged LXD base with two CPUs, 4 GiB memory, 512 processes and a
12 GiB root quota. Docker runs **inside that disposable LXD boundary**; the host
Docker socket is never mounted. The worker can control only the nested engine.
The network restrictions and serialized build admission remain in place.

Existing Dockerfiles and a supported subset of Compose are detected before other
recipes. Conventional Python, Go, Rust, Maven/Spring Boot, Gradle/Spring Boot,
.NET, PHP, Ruby and Node server projects have automatic recipes. This does not
certify every framework or project in those language families. Ambiguous entry
points, external secrets and unsupported Compose options fail explicitly.

Each service is built/pulled once on the server, pinned by its image ID, exported
as a checksummed compressed image, and stored separately from the small launch
descriptor. The user's runner streams authorized image downloads, checks size
and SHA-256, loads them into the **local** Docker engine, then starts the prepared
services with `--no-build --pull never`. It never runs source Compose or a source
build on user compute. The Codespaces runtime includes Docker-in-Docker; container
apps use a distinct PODS Codespace so older Node-only environments are not reused.

Compose accepts explicit environment values/defaults, argument-array commands,
service dependencies/healthchecks and declared named volumes. Host mounts,
privileged containers, host networking, external volumes, secret files and
unresolved environment values are rejected. Only the selected web service's port
is forwarded; database ports remain private. Database migrations belong to the
app's startup contract (the Django recipe runs its normal migrations).

Named volumes are scoped to the source repository and application folder. Their
files now live in managed directories under Cloud Shell's persistent home or
Codespaces' `/workspaces/.pods-launch`. Docker volume metadata can be recreated
without replacing those files. Legacy volumes are copied while the application
is stopped, preserving database uid/gid; the original is retained. Source Compose
host mounts are still rejected. Existing Node application data is also migrated
to the persistent Codespaces workspace without overwriting newer records.

Real PostgreSQL migration and volume metadata recreation have passed in the
isolated QA environment. **A full native provider VM/rebuild test is still
pending**; see `evidence/stack-storage-live.json`. App processes stop after the
launch lifetime; volumes and image cache are retained.

Limits: eight services, 512 MiB compressed per image, 1 GiB total image downloads,
5 GiB stored images, 768 MiB memory/one CPU/256 processes per running service.
The original small-artifact limits remain unchanged. Image transfer and loading
can exceed 20 seconds on an uncached environment; cached and uncached results
must be reported separately. The framework matrix is being tested, not declared
universally supported.

The frontend detector now understands Angular's nested browser build output.
React, Vue, Svelte, Solid, Preact, Lit and Alpine fixtures use their real framework
packages and production Vite builds. See `examples/stacks` and the reproducible
isolated test driver `scripts/test-stack-matrix.mjs`.
