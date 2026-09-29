# PODS — prepare once, run on your compute

A fresh implementation. A developer bundles a Node application on the PODS server. A user connects GitHub Codespaces or Google Cloud Shell. PODS starts the user's environment, delivers the same immutable artifact, and launches the app there without installing packages or compiling source.

The reference application is Field Notes: a real HTTP app whose notes are saved in the user's environment. The control plane never runs the preview application.

## Run the control plane

Requires Node.js 24, GitHub CLI (`gh`), OpenSSH client, and `curl` on the server. User environments need Node.js 22+, `curl`, `sha256sum` and SSH support. The included Codespaces definition uses the standard GitHub development image.

```sh
npm ci --ignore-scripts
npm run prepare:demo
cp .env.example .env
# Set PODS_SECRET, PODS_ORIGIN, PODS_RUNTIME_REPO and optional OAuth credentials.
node --env-file=.env src/server.mjs
```

Use a stable HTTPS URL for provider callbacks. `.env` and `.data` are deliberately ignored by Git. The deployed aswin preview uses a temporary Cloudflare tunnel; its hostname is not a durable production URL.

## Prepare an application

Create `pods.json` beside the app's source:

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

The builder uses esbuild to compile and bundle JavaScript/TypeScript into a production CommonJS entrypoint. It packages assets, compresses the payload, computes SHA-256, and publishes a manifest atomically in `.data/artifacts`. The UI discovers prepared manifests automatically. An existing launch retains its original artifact digest after a developer publishes a new version.

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

Stop application sends a stop request to the runner. It stops the app process group within a few seconds, preserving note data and the cached artifact. Preview processes also stop after 30 minutes even if the control plane disappears. The Codespace itself remains running until its provider idle timeout (15 minutes requested by PODS), or until the user stops it in GitHub. Cloud Shell has no API stop operation. Billing and quota remain the user's responsibility.

## Verification

```sh
npm test
npm run prepare:demo
# Explicitly consumes your Codespaces quota:
gh auth token | node scripts/live-codespaces.mjs https://your-pods-host
```

Tests exercise the real builder and application runner, cache reuse, persistence, failed health checks, artifact tampering and path rejection, removal of inherited credentials, encrypted token storage, browser ownership, CSRF, artifact capability authorization and duplicate launch prevention. Live provider results are stored separately under `evidence/` and must not be inferred from mocked tests.

## Operating limits

Single Node process and local SQLite on persistent disk. Server-side builds are CLI-only for trusted operators; no public arbitrary-code build endpoint exists. Browser sessions last 24 hours. Provider credentials are not refreshed automatically: reconnect on expiry. A restart fails in-flight provisioning explicitly; ready agents continue heartbeats. Only one active app per browser/provider is allowed. Use provider controls to stop an environment immediately. This is a working prototype, not a multi-tenant production service: public onboarding, abuse limits, durable DNS, distributed build isolation, monitoring, and a larger application compatibility matrix remain follow-up work.

Provider contracts: [Codespaces REST API](https://docs.github.com/en/rest/codespaces/codespaces), [GitHub CLI SSH](https://cli.github.com/manual/gh_codespace_ssh), [Cloud Shell start API](https://docs.cloud.google.com/shell/docs/reference/rest/v1/users.environments/start).
