# Provider onboarding handoff

Observed 2026-10-03T05:24:52.693112+00:00. This records operator setup, not a completed user OAuth journey.

## Google

Fresh project: **PODS Fresh Launch**, project ID `pods-launch-fresh-20261003`. Existing projects were not reused.

The Google OAuth configuration is created with app name PODS Fresh Launch and an External/testing audience. The console displayed “OAuth configuration created!”. The previous agreement step is complete.

The [Cloud Shell API details](https://console.cloud.google.com/apis/api/cloudshell.googleapis.com/overview?project=pods-launch-fresh-20261003) now explicitly show **Status: Enabled**. The signed-in operator account was saved as a test user; Audience shows one test user. Data Access saved the three scopes used by the server: `openid`, `https://www.googleapis.com/auth/userinfo.email` (the `email` authorization alias), and `https://www.googleapis.com/auth/cloud-platform`. Declaring these scopes does not itself authorize access to a user's account.

The operator created the web client and supplied its downloaded JSON. The file was validated as a Web client in the fresh project, with the single redirect URI `https://collection-conferences-ages-clearly.trycloudflare.com/auth/google/callback`. Its ID and secret were transferred over SSH directly into aswin's ignored `.env`, atomically written with mode `0600`. No credential value was printed or committed. The owned control-plane process was restarted; both local and public `/api/me` now report Google `oauthReady: true`.

The real Google browser authorization and native product launch now pass. The initial consent exceeded the ten-minute state window; reconnecting succeeded. The prepared MDN application opened on the same Google account's Cloud Shell, and its image-switch interaction passed. Repeat button-click-to-visible-product time was bounded at 13,049 ms. See [Google browser validation](GOOGLE-BROWSER.md) for measurements and limitations.

Expired authorization now recovers to a normal PODS page with the original product and Google selection. The temporary PODS hostname must continue matching the registered callback. The app remains External/testing; it is not a publicly verified Google OAuth application.

## GitHub

The existing Google sign-in route previously reached GitHub two-factor authentication. The user must complete that step before registering PODS's OAuth app with callback `https://collection-conferences-ages-clearly.trycloudflare.com/auth/github/callback`. The prior GitHub tab is no longer open. No GitHub OAuth credentials have been registered or installed.

## Verification still required

Complete real developer-UI repository submission, a second independent user journey, controlled cold-compute browser timing and the GitHub OAuth/native product journey. Google end-user OAuth, native page rendering and interaction now pass. The [public-runtime results](PUBLIC-RUNTIME.md) remain valid GitHub backend evidence.
