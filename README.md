# PODS — prepare once, run on your compute

A fresh implementation. A developer bundles a Node application on the PODS server. A user connects GitHub Codespaces or Google Cloud Shell. PODS starts the user's environment, delivers the same immutable artifact, and launches the app there without installing packages or compiling source.

The reference application is Field Notes: a real HTTP app whose notes are saved in the user's environment. The control plane never runs the preview application.

## Run the control plane

Requires Node.js 24, GitHub CLI (`gh`), OpenSSH client, and `curl` on the server. User environments need Node.js 22+ (PATH or standard NVM installation), `curl`, `sha256sum` and SSH support. The included Codespaces definition uses the standard GitHub development image.

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

For the trusted operator CLI, install/build the app's dependencies and run `node scripts/prepare.mjs /path/to/app`. This now detects supported apps automatically. The isolated URL build worker described below handles dependency installation and build scripts itself; the browser submission UI is still being implemented.

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

### Isolated repository preparation (implementation in progress)

`scripts/setup-builder.sh` prepares a fresh unprivileged LXD base container on aswin. It installs the pinned Node distribution and this repository's builder tools. Build containers have no control-plane filesystem mounts or provider credentials; the template limits memory to 2 GiB, CPU to two cores, processes to 256 and the root filesystem to 4 GiB in a dedicated 12 GiB Btrfs pool. Its network permits public HTTP/HTTPS while rejecting private, link-local and Tailscale destinations. LXD's baseline DNS/DHCP services remain available. Only one job should run at a time on this bridge until per-job network isolation is added; bridge ACLs do not isolate peers on the same bridge. [LXD ACL behavior](https://canonical.com/lxd/docs/latest/howto/network_acls/).

`scripts/build-worker.mjs` accepts a public HTTPS GitHub repository URL and optional application folder. Inside a disposable clone of the base container, it fetches the source, records the commit, installs npm dependencies, runs the existing build script, packages the result and starts the artifact. Verification requires an actual HTML document at `/`; a healthy terminal program or JSON-only endpoint is rejected. It produces `artifact.gz` and `result.json` for the control plane to validate and publish. This stage does not yet expose repository submission publicly, and it is not proof of the complete provider browser journey.

Private repository authorization, other package managers and additional language/framework adapters remain pending. The full combined acceptance criteria are in `PRODUCT.md`.

Apps must listen on `PORT` (8080), bind `0.0.0.0`, return HTTP 2xx from the health path, and write persistent files to `PODS_APP_DATA`. Runtime dependencies must bundle; native modules, dynamic external imports, top-level await, external databases and arbitrary language runtimes are not supported in this first version. Working directory assets keep their relative paths. Artifacts are limited to 20 MiB compressed and 50 MiB unpacked.

## Connect providers

GitHub OAuth: register a web OAuth application with callback `PODS_ORIGIN/auth/github/callback`, then set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`. The app requests `codespace read:user`. The runtime repository must be accessible to the user; for a public service publish a minimal public runtime repository and set `PODS_RUNTIME_REPO` to it. This project's initial repository is private.

Google OAuth: create a web OAuth client in a Google Cloud project with the Cloud Shell API enabled, configure callback `PODS_ORIGIN/auth/google/callback`, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. It requests `openid email cloud-platform`; consent publishing or test-user setup is required by Google. No provider client secret is bundled into the browser or artifact.

Until OAuth is configured, the UI offers an explicit access-token connection. Tokens are encrypted with AES-256-GCM, bound to an HttpOnly browser session, and expire from use after one hour (or the shorter OAuth token lifetime). The access-token path is for a controlled preview, not a substitute for a completed public OAuth rollout.

PODS creates or reuses only a Codespace named `PODS launch` in the configured runtime repository. It uses the user's token to deliver the runner over authenticated SSH. Cloud Shell uses its start API with an ephemeral SSH key; the key is removed after delivery. The runner verifies both its downloaded source and the application artifact. Application subprocesses receive a minimal environment without provider tokens. Artifacts must be from trusted developers: running a third-party app grants it the effective privileges of the user account inside that environment; this is not a sandbox for malicious apps.

## Timing contract

The 20-second target is measured, not promised. The UI separates:

- **Total launch:** accepted launch request to healthy callback, including provider provisioning and SSH setup. Does not include human consent time or preview page rendering.
- **Delivery:** provider reports ready to healthy callback, including SSH bootstrap.
- **App startup:** runner starts to local HTTP health success, including artifact download.

Cold VM provisioning, provider consent, image pulls, network throughput and authentication on the forwarded app URL can exceed 20 seconds. Reuse an already running environment for the fast path. GitHub's forwarded URL remains private. PODS links to the provider's authenticated preview; it does not expose a public app proxy.

Stop application sends a stop request to the runner. It stops the app process group within a few seconds, preserving note data and the cached artifact. When the home volume is full, read-only or inaccessible, the runner uses a private directory under `/tmp` and explicitly reports temporary storage in both the launch UI and Field Notes. Such data does not survive an environment reset. No existing user files are deleted.

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

## Operating limits

Single Node process and local SQLite on persistent disk. Server-side builds are CLI-only for trusted operators; no public arbitrary-code build endpoint exists. Browser sessions last 24 hours. Provider credentials are not refreshed automatically: reconnect on expiry. A restart fails in-flight provisioning explicitly; ready agents continue heartbeats. Only one active app per browser/provider is allowed. Use provider controls to stop an environment immediately. This is a working prototype, not a multi-tenant production service: public onboarding, abuse limits, durable DNS, distributed build isolation, monitoring, and a larger application compatibility matrix remain follow-up work.

Provider contracts: [Codespaces REST API](https://docs.github.com/en/rest/codespaces/codespaces), [GitHub CLI SSH](https://cli.github.com/manual/gh_codespace_ssh), [Cloud Shell start API](https://docs.cloud.google.com/shell/docs/reference/rest/v1/users.environments/start).
