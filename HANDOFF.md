# Original PODS checkpoint (historical)

For current deployment, line count, tests and pending work, use
[evidence/STACK-HANDOFF.md](evidence/STACK-HANDOFF.md). The details below
record the original workflow milestone and are not current status.

The active goal remains developer repository URL → server preparation → reusable launch link → separate user's authorized compute → actual usable product page. `PRODUCT.md` contains the completion gates. This goal is not complete.

## Current implementation and evidence

- Public GitHub URL preparation runs in disposable, bounded LXD containers on aswin. Conventional Node/TypeScript, Vite/React and static HTML are detected without developer-authored PODS configuration. Worker output must be an HTML product; the manager independently validates and publishes an immutable artifact.
- `/develop` now submits the URL, shows progress/recovery, and produces a shareable exact-version link. `/launch/:appId` shows that specific application, preserves app/provider/action through authorization, and automatically navigates the same browser tab to the provider preview. Returning from the product does not reopen it automatically. Missing versions never fall back to a different app.
- GitHub numeric IDs and Google OpenID subjects bind preparation limits independently of mutable display names. Legacy connections without a stable identity must reconnect before preparing.
- 33 tests pass on aswin, including a new regression that waits for an already-provisioning PODS Codespace instead of creating a duplicate on retry. See `evidence/browser-flow-tests.txt`.
- Browser fixture checks exercised submission, authorization continuation, both provider adapters, an actual prepared counter interaction, persisted counter state after reload, stop, cancellation and failure recovery. Providers were **simulated**, and their compute ran on aswin. See `evidence/BROWSER-FLOW.md`; do not report this as real-provider E2E.
- A real MDN URL was previously prepared through the deployed API in 7,831 ms with no job container left behind. See `evidence/BUILD-API.md`.
- Latest real Codespaces attempt was accepted, replacing the earlier quota failure, but stayed in provisioning past the four-minute deadline. No app was delivered. Evidence: `evidence/github-current-recheck.json`. Stop was rejected while provisioning; the disposable test environment was then submitted for deletion. Confirm cleanup in `evidence/github-current-cleanup.json`.
- Earlier ready Cloud Shell request-to-health measurements were 4.725 and 4.218 seconds. They are not browser-visible readiness measurements. Initial cold provisioning alone took about 46 seconds.
- UI finish reviewer scored both requested fixes resolved and returned `disposition: ship` at that scope. Design documentation now reflects the built interface. The source detector ran in degraded regex-only mode, not a complete contrast audit.

## Next required gates

1. Register fresh GitHub and Google OAuth clients and configure the callback URLs. The GitHub registration tab is still at sign-in; a user sign-in request is pending. Current access-token fallback is explicitly a preview workaround, not the final onboarding experience.
2. Publish a minimal public Codespaces runtime repository so unrelated users can create their own environment. The configured runtime repo is still the private source repository. Investigate slow cold provisioning using a bounded live check; do not repeat creates while an environment is already starting.
3. Exercise a real repository submission through the browser, then an independent end-user browser authorization and native product preview for **both** providers. Google CLI and browser accounts previously differed; using the same account is required for that private preview.
4. Measure warm and cold accepted-launch-to-visible-product timing and a meaningful product interaction. Healthy callbacks and simulated provider measurements do not satisfy the 20-second target.
5. Replace temporary tunnel/process launch with stable DNS and supervised services for a durable rollout. Continue reporting framework limitations and evidence honestly.

## Location and runtime

Fresh source: `/home/aswin/pods-launch-fresh` on `aswin`.
Local mirror: `/Users/rizwanahamed/Documents/ChatGPT/podsv2`.
Repository: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
Preview: https://collection-conferences-ages-clearly.trycloudflare.com

Physical code count: **1,623 source lines + 624 test/browser-fixture lines = 2,247** across 34 files. Scope in `evidence/code-lines.json`; excludes JSON/lockfiles, documentation, dependencies and generated artifacts.

Node 24 and GitHub CLI: `/home/aswin/pods-tools/bin`. Control plane listens at `127.0.0.1:8787`; Cloudflared provides the temporary HTTPS endpoint. PID files: `~/pods-launch-server.pid`, `~/pods-launch-tunnel.pid`; matching `.log` files. `.env` is 0600 and ignored; `.data` contains encrypted credentials and artifacts and is ignored. Never print or commit either.

Restart only the PID recorded for the PODS control plane, then run `scripts/serve.sh` from the repository and record its new PID. A tunnel hostname change requires updating `PODS_ORIGIN` and OAuth callback registrations. These processes are not reboot-persistent services yet.

Builder infrastructure: stopped base `pods-fresh-builder-base`, bridge `podsbuildfresh`, ACL `pods-fresh-build-egress`, Btrfs pool `pods-fresh-build-quota`. Use `/snap/lxd/current/bin/lxc` directly; the snap wrapper fails over SSH. Builds are serialized behind a host kernel lock because LXD bridge ACLs do not isolate peers. `scripts/setup-builder.sh` reproduces the fresh builder. No previous PODS source was inspected or reused.

The temporary browser fixture and its application processes were stopped. It uses `.data/preparation-evidence/vite-artifact.gz`, binds loopback 19888 and has a 30-minute deadline. `scripts/live-codespaces.mjs` accepts an optional fourth CLI argument selecting the exact prepared app; `PODS_EVIDENCE_FILE` selects a separate results file to preserve earlier evidence. Live provider tokens enter via stdin and are disconnected after each test.
