# Browser workflow verification

Checked 2026-10-02 on aswin through the Codex in-app browser. The public deployment supplies the developer-interface captures. The controlled browser fixture exercises real PODS session, OAuth state/return-path, build queue/publication, launch orchestration and runner code with **simulated authorization and compute providers**. Repository example/counter and Browser fixture account are synthetic. The fixture serves a real previously prepared Vite counter artifact from aswin. It is not a real Codespaces or Cloud Shell environment.

| Browser check | Observed result |
| --- | --- |
| Repository form → authorization → preparation | Saved URL resumed after callback; ready version and copyable launch link displayed |
| Exact launch link | Correct prepared counter name, commit and artifact size; no first-catalog fallback |
| Google adapter continuation | Authorization return automatically started artifact and navigated the same tab to the actual counter page |
| GitHub adapter launch | Already connected account started artifact and navigated the same tab to the actual counter page |
| Product interaction | Counter changed from 0 to 1; reloading retained 1 |
| Back from product | Launch page remained open with ready status; no automatic redirect loop |
| Stop | Both application processes reached stopped; controls recovered |
| Canceled Google authorization | Exact application retained; provider-specific recovery message; choosing GitHub cleared stale alert |
| Unsupported application | Actionable failed preparation; retry control; failure survived reload |
| Missing version | Explicit unavailable message; no launch controls for a different app |
| Responsive interface | Desktop 1440px, mobile 390px, actual developer 1114px and launch 1280px; no horizontal overflow at checked mobile width |
| Browser diagnostics | No console errors or warnings at the end of the flow |
| Finish review | Two requested fixes scored resolved; disposition ship at UI scope |

Capture files are native JPEGs under browser/. The browser full-page capture mode produced scale/padding errors; screenshots use normal viewport capture, with separate mobile top and lower views. No image pixels were edited. The product screenshot shows the prepared application, not the PODS launcher.

33 automated tests passed on aswin after the browser checks and the provisioning-retry regression fix; browser-flow-tests.txt records the output. These include exact-version selection, bounded OAuth continuation, provider-preview URL validation stable provider account IDs, and reuse of an already-provisioning Codespace. GitHub numeric ID and Google OpenID subject now bind build limits independently of display names.

The fixture requires the Vite artifact produced by the isolated preparation check at .data/preparation-evidence/vite-artifact.gz and its manifest evidence/isolated-vite.json. Run scripts/browser-fixture.mjs on aswin with port 19888 forwarded to the local browser. Its state is temporary and it shuts down after 30 minutes. Its authorization pages explicitly identify themselves as simulations.

Still unverified: real browser consent using registered fresh OAuth clients; independent developer/end-user browser sessions through both real providers; native provider preview authorization; warm/cold launch-to-visible-product timing. The fixture's subsecond launch numbers measure a local simulated provider path and are not evidence for the 20-second target.
