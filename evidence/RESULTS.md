# Fresh PODS validation

The latest [browser workflow results](BROWSER-FLOW.md) cover 33 passing automated tests, the developer URL form, preserved authorization intent, exact-version launch navigation and an interactive prepared product with simulated providers. Real provider browser consent and visible-product timing remain unverified. A new real Codespaces attempt is accepted by GitHub, but timed out while provisioning after four minutes, before SSH delivery or app startup; see `github-current-recheck.json`. The earlier quota rejection is historical, not the current failure.

The developer API stage has [separate results](BUILD-API.md): 28 passing automated tests and a real repository URL submission through the deployed API, prepared in 7,831 ms. The earlier [preparation results](PREPARATION.md) cover automatic detection and build isolation. The original provider measurements below remain historical evidence; the complete real-provider browser journey is still unverified.

## Original prototype measurements

Final sample artifact: `a052c22d49ebd70b9838c4a4022696aecbbacea84287d6be2334766cd84204a1`, 3,854 compressed bytes. Prepared on aswin. No previous PODS source was read or reused.

| Gate | Result |
| --- | --- |
| Automated tests on aswin | 11 passed, 0 failed |
| Local runner benchmark, 10 launches | p50 122 ms, p95 152 ms; no provider or SSH included |
| Live Cloud Shell, ready environment, fresh artifact | 4,725 ms request to healthy; 660 ms runner startup |
| Live Cloud Shell, ready environment, cached artifact | 4,218 ms request to healthy; 483 ms runner startup |
| Live app browser test | Saved note through UI; reloaded; persisted note verified |
| Home volume full | Confirmed 100% used; temporary storage fallback worked; warnings shown |
| Codespaces live launch | Blocked by account quota/budget; not verified |
| GitHub Actions | Job rejected before running due account billing/spending limit; aswin tests passed |
| Browser OAuth consent | Implementation unit tested; fresh OAuth clients not registered/configured |
| Native Cloud Shell browser preview | Initial Google JWT endpoint returned 500; browser account differs from CLI account; not verified |
| End-to-end cold launch under 20 seconds | Not achieved/proven. Initial suspended Cloud Shell provisioning alone took ~46 seconds before a bootstrap compatibility failure |

Timings start when the API accepts the launch, not when a human starts signing in. A healthy callback is not a browser first-paint measurement. The browser app test used an authenticated Google CLI SSH tunnel into the real Cloud Shell process; the application was never running on aswin during that test.

The initial failures are retained as evidence. The first NVM/PATH and full-home issues were repaired and re-tested. The final successful results correspond to the current app artifact and storage warning behavior. No Codespace or billing setting was modified to evade the quota block.
