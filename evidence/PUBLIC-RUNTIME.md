# Public runtime and live Codespaces validation

Tested on 2026-10-02 UTC. The public runtime is [RizwanAhamed13/pods-launch-runtime-fresh](https://github.com/RizwanAhamed13/pods-launch-runtime-fresh), commit `0ffdea00f972e1479ee77e2f7ef3eccbb92c02ab`. It contains only its README and devcontainer definition. An unauthenticated GitHub API request confirmed public visibility. The aswin deployment uses this repository; the control-plane source remains private.

The runtime pins the official Node.js 24 Bookworm image to `sha256:ef380643327dafe138722179c1ac86477a4b1f643c3a2c83d3baa1b8ea226166` and adds the official SSH server feature. Registry manifests report 584.1 MiB of compressed AMD64 base layers versus 3,659.4 MiB for the previous universal image. These are base-layer sizes, not total network transfer or a controlled performance comparison. Initial provisioning installs the runtime SSH feature. The submitted application is already prepared and never rebuilt on user compute.

## Live result

`github-public-runtime.json` records the actual deployed API launch using the reusable MDN repository artifact from the earlier isolated server build (`8d76347af27ec9d68fa048e1f699072db4f6b27c8f7b6c58bd21dee4e2f5d93b`). CLI authorization was supplied through stdin. This test did not use browser OAuth.

| Measurement | Fresh Codespace | Repeat on same running Codespace |
| --- | ---: | ---: |
| Accepted launch to healthy callback | 96,693 ms | 5,452 ms |
| Provider ready to healthy callback | 6,694 ms | 5,020 ms |
| Runner to local HTTP health | 1,062 ms | 935 ms |
| Artifact cache hit | no | yes |

GitHub created `pods-launch-x59xprgvg76q246j` in CentralIndia. The CLI confirmed port 8080 was forwarded privately at the provider URL. The native browser URL redirected to GitHub sign-in; the sign-in flow subsequently reached two-factor authentication. The user must complete that authentication. No public exposure or authentication bypass was used. GitHub subsequently confirmed the test environment was `Shutdown` (`github-public-runtime-stopped.json`); it is retained for one day so the pending authenticated browser check can resume it. No test compute is left running.

The cold run exceeded the 20-second target. The warm request-to-health result is below it, but browser-visible product readiness and a meaningful native-preview interaction are still unverified. This supersedes the earlier private-runtime provisioning timeout as the latest Codespaces result.

## Regression checks

All 34 automated tests passed on aswin (`public-runtime-tests.txt`). Environment selection now prefers an already available PODS Codespace over a stopped or pending one. Tests cover reuse across GitHub's documented Starting, Provisioning, Created, Queued, Awaiting, Updating and Rebuilding states without creating duplicate compute. These changes were verified after the live measurements and do not turn those measurements into browser evidence.

The previous browser-flow commit passed [GitHub Actions](https://github.com/RizwanAhamed13/pods-launch-fresh/actions/runs/37054177786). Historical Actions billing rejection is no longer the latest CI state.

Remaining goal gates: register/configure real provider OAuth clients, submit a repository through the real authenticated developer UI, complete a separate user's native-preview journey through both providers, verify a product interaction, and measure launch-to-visible-product timing. The deployed URL is still a temporary tunnel.

Sources: [official Node image](https://github.com/devcontainers/images/tree/main/src/javascript-node), [GitHub CLI SSH requirement](https://cli.github.com/manual/gh_codespace_ssh), [Codespaces API schema](https://github.com/github/rest-api-description/blob/main/descriptions/api.github.com/api.github.com.json).
