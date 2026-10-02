# Aswin deployment and remaining gates

## Active combined goal

Developer submits a repository URL → PODS builds and verifies a reusable artifact on aswin → a separate user authorizes their own provider → PODS launches the artifact and opens the actual working product page. `PRODUCT.md` contains the acceptance criteria. The new Codex goal was created with this full objective and remains unfinished.

The preparation layer detects conventional Node/TypeScript, Vite/React and static applications without `pods.json`. The connected developer API is deployed and enabled on aswin: `POST /api/builds` accepts public GitHub URLs, creates session-owned jobs, runs the worker in disposable LXD containers, validates bounded output after stopping the container, cleans up, then publishes an immutable version and launch URL. It requires a connected provider account, CSRF, bounded queue and account/global limits. The manager serializes builds and holds a host kernel lock. Current tests: 28 passing (`evidence/build-manager-tests.txt`). A real MDN repository submission took 7,831 ms and left no job container; see `evidence/build-api-live.json` and `evidence/BUILD-API.md`. This is preparation timing, not user launch timing.

Next implementation gate: connect the browser developer URL form and progress display to this API; show/copy the prepared launch link; select the exact app from `/launch/:appId`; preserve app/provider/action across OAuth; automatically navigate the user's browser to the provider's actual product URL when ready. Backend OAuth now accepts a validated `returnTo` path and returns there, and `/launch/:appId` serves the frontend. The existing frontend still renders Field Notes artwork for every app, does not parse the URL, and does not navigate automatically. Fix that before claiming the launch link selects the right product in the browser. The shared catalogue now contains the original Field Notes and the real MDN build, so the old first-app/last-radio mismatch is immediately visible.

The new source modules are `src/builds.mjs` (queue/publication) and `src/lxd-builder.mjs` (isolation lifecycle and bounded file import). Rebuild requests currently clone/build again; end-user launches reuse the published artifact. True pre-build commit caching is still optional future work. `scripts/check-build-api.mjs` uses a GitHub token on stdin and removes its test connection in `finally`; it does not provision user compute. The control plane was restarted with `PODS_BUILDS_ENABLED=1`; `.env` remains 0600 and ignored. No temporary test credential remains connected. The builder base remains stopped.

Build infrastructure is entirely new: `pods-fresh-builder-base`, bridge `podsbuildfresh`, ACL `pods-fresh-build-egress`, and Btrfs pool `pods-fresh-build-quota`. Use `/snap/lxd/current/bin/lxc` directly because the snap launcher failed to create its transient systemd scope over SSH. `scripts/setup-builder.sh` reproduces this builder. The base stays stopped between updates. Serialize build jobs: LXD bridge ACLs filter host/network traffic but do not isolate peers sharing the bridge. No prior PODS source was inspected or reused.

Fresh source: `/home/aswin/pods-launch-fresh` on host `aswin`.

Current physical code count: 1,313 source lines across 23 files, plus 493 test/fixture lines across 8 files (1,806 total). Counts include JS/TS, HTML/CSS and shell; exclude JSON/lockfiles, documentation, dependencies and generated artifacts. This is a line count, not a completeness measure.

Repository: https://github.com/RizwanAhamed13/pods-launch-fresh (private).

Preview control plane: https://collection-conferences-ages-clearly.trycloudflare.com

Node 24 and GitHub CLI are installed under `/home/aswin/pods-tools/bin`. The control plane binds `127.0.0.1:8787`. Cloudflared provides the temporary HTTPS endpoint. Processes were started with nohup, not installed as reboot-persistent system services. PID files are `~/pods-launch-server.pid` and `~/pods-launch-tunnel.pid`; logs are the corresponding `.log` files. Secrets are in `.env` with mode 0600; data and encrypted credentials are in ignored `.data`. Never commit either.

Restart from aswin:

```sh
cd ~/pods-launch-fresh
# Stop only the PID in ~/pods-launch-server.pid, then:
nohup ./scripts/serve.sh > "$HOME/pods-launch-server.log" 2>&1 < /dev/null &
echo $! > "$HOME/pods-launch-server.pid"
```

If the quick tunnel is restarted and the hostname changes, update PODS_ORIGIN and any configured OAuth callback URLs before restarting the server. A stable domain and supervised services are required for a durable deployment.

The live test left the last Cloud Shell preview app running with a 30-minute deadline. This expires independently even if PODS is unavailable. The test provider token was removed from the control-plane connection store. The runner only holds its limited launch capability, not a Google access token. Cloud Shell has no stop API; its normal idle lifecycle remains in place.

Remaining gates:

1. Register fresh OAuth clients and configure their redirect URLs for browser authorization. The current access-token flow works and was used for the live test.
2. Sign the browser into the Google account used by the CLI before validating the native private Cloud Shell preview. The current browser has a different account. The real application UI was verified through authenticated SSH.
3. Restore GitHub Codespaces/Actions quota or account billing before their live checks can run. No financial settings were changed.
4. Publish a minimal public runtime repository, or grant intended users access to the private runtime repository, before testing other users' Codespaces onboarding.
5. Measure cold and warm startup over more networks and apps. The current sample meets the 20-second request-to-health target on ready Cloud Shell; the initial cold provider startup did not.

See `evidence/RESULTS.md` for exact results and limits. This is a tested prototype, not a completed public production rollout.
