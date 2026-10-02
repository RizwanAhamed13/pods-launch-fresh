# Automatic preparation stage — 2026-10-02 UTC

The combined developer-URL and end-user product goal remains active and unfinished. This stage validates preparation on aswin, not the full provider/browser journey.

| Check | Result |
| --- | --- |
| Automated tests on aswin | 21 passed, 0 failed; `preparation-tests.txt` |
| Public GitHub URL → isolated clone → artifact → served HTML | Passed using `https://github.com/mdn/beginner-html-site-scripted` at commit `570260b392cc15a0b2ecd579071b0fc6384bbe98`; `isolated-quota-static.json` |
| TypeScript notes app with no pods.json or package.json | Automatically detected, compiled, packaged, started and served Field Notes HTML; `isolated-node.json` |
| Vite 8.3.2 frontend, no PODS configuration | npm dependencies installed, existing build script executed, compiled assets packaged, real counter document served; `isolated-vite.json` |
| Healthy JSON-only server | Rejected because it did not serve a product page; `isolated-api-rejection.txt` |
| Independent artifact validation on the host | All three artifacts decoded with matching SHA-256 and size; `preparation-artifacts.json` |
| Build isolation configuration and one live network probe | Unprivileged container, isolated UID map, no host mounts, no control-plane secrets or Docker socket, 2 CPUs, 2 GiB memory, 256 processes, 4 GiB root disk; a listening private-host HTTP service was unreachable; `build-isolation.json` |

The initial fresh-container clone failed because DNS was not ready. `isolated-static-initial-failure.txt` preserves that failure. A bounded DNS readiness check and regression test were added; a new container completed the repository build successfully.

Prepared artifacts are retained only under ignored `.data/preparation-evidence` on aswin. They have not been published through a developer submission endpoint. The base container is `pods-fresh-builder-base`, backed by a dedicated 12 GiB Btrfs pool. Disposable verification containers are removed after evidence collection.

The worker runs submitted install/build scripts only inside an isolated container, never directly in the control-plane process. LXD bridge ACLs do not isolate two peers on the same bridge; the upcoming build manager must serialize jobs or add per-job network isolation. The recorded resource limits are configuration checks, not a full resource-exhaustion or container-escape audit.

Remaining gates: bounded build manager and publication, developer submission UI, separate user launch links, selection preserved through OAuth, automatic navigation to the native application preview, live provider authorization and meaningful browser interactions, private repository authorization and more runtime adapters. No new 20-second browser-readiness claim is established by this stage.
