# Aswin deployment and remaining gates

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
