# Aswin deployment and remaining gates

## Active combined goal

Developer submits a repository URL → PODS builds and verifies a reusable artifact on aswin → a separate user authorizes their own provider → PODS launches the artifact and opens the actual working product page. `PRODUCT.md` contains the acceptance criteria. The new Codex goal was created with this full objective and remains unfinished.

The preparation layer now detects conventional Node/TypeScript, Vite/React and static applications without `pods.json`. An isolated LXD worker accepts public GitHub repository URLs, installs/builds npm projects, packages assets, and requires a served HTML product document before producing its result. The browser submission API/UI is not connected to it yet. Current preparation tests are in `evidence/preparation-tests.txt`; initial DNS startup failure and the repaired live repository build are retained separately.

Next implementation gate: add a bounded, single-job build manager that clones `pods-fresh-builder-base`, executes the worker as UID/GID 1000, stops the container before importing its bounded output, independently validates the artifact, publishes it atomically, and always removes the disposable container. Connect that manager to session-owned build API/UI, give developers versioned launch links, preserve the selected app through OAuth, and navigate users automatically to the provider's real product preview when ready. Do not expose arbitrary repository builds before the manager enforces ownership, concurrency, deadlines, output validation and cleanup.

Build infrastructure is entirely new: `pods-fresh-builder-base`, bridge `podsbuildfresh`, ACL `pods-fresh-build-egress`, and Btrfs pool `pods-fresh-build-quota`. Use `/snap/lxd/current/bin/lxc` directly because the snap launcher failed to create its transient systemd scope over SSH. `scripts/setup-builder.sh` reproduces this builder. The base stays stopped between updates. Serialize build jobs: LXD bridge ACLs filter host/network traffic but do not isolate peers sharing the bridge. No prior PODS source was inspected or reused.

Fresh source: `/home/aswin/pods-launch-fresh` on host `aswin`.

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
