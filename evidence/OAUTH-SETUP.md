# Provider onboarding handoff

Observed 2026-10-03T05:24:52.693112+00:00. This records operator setup, not a completed user OAuth journey.

## Google

Fresh project: **PODS Fresh Launch**, project ID `pods-launch-fresh-20261003`. Existing projects were not reused.

The Google OAuth configuration is created with app name PODS Fresh Launch and an External/testing audience. The console displayed “OAuth configuration created!”. The previous agreement step is complete.

The [Cloud Shell API details](https://console.cloud.google.com/apis/api/cloudshell.googleapis.com/overview?project=pods-launch-fresh-20261003) now explicitly show **Status: Enabled**. The signed-in operator account was saved as a test user; Audience shows one test user. Data Access saved the three scopes used by the server: `openid`, `https://www.googleapis.com/auth/userinfo.email` (the `email` authorization alias), and `https://www.googleapis.com/auth/cloud-platform`. Declaring these scopes does not itself authorize access to a user's account.

The operator created the web client and supplied its downloaded JSON. The file was validated as a Web client in the fresh project, with the single redirect URI `https://collection-conferences-ages-clearly.trycloudflare.com/auth/google/callback`. Its ID and secret were transferred over SSH directly into aswin's ignored `.env`, atomically written with mode `0600`. No credential value was printed or committed. The owned control-plane process was restarted; both local and public `/api/me` now report Google `oauthReady: true`.

The real browser flow started from the exact prepared MDN application launch page, selected Google Cloud Shell and the configured test account, passed the Google testing notice and completed the email sign-in step. It is now at Google's final permission screen with an unchecked Google Cloud access checkbox. Google describes that permission as access to see, edit, configure and delete Google Cloud data. A concrete user approval request is pending; browser-control policy requires action-time confirmation before this new account access is granted. No launch or native application preview is claimed from reaching consent.

After consent: verify OAuth callback, automatic launch, native product rendering and a meaningful interaction. Record request-to-health and browser-visible readiness separately. The temporary PODS hostname must continue matching the registered callback; changing the origin requires updating the client. The app remains External/testing.

## GitHub

The existing Google sign-in route previously reached GitHub two-factor authentication. The user must complete that step before registering PODS's OAuth app with callback `https://collection-conferences-ages-clearly.trycloudflare.com/auth/github/callback`. The prior GitHub tab is no longer open. No GitHub OAuth credentials have been registered or installed.

## Verification still required

Complete real provider authorization, real developer-UI repository submission, a separate user's native application preview and a meaningful product interaction for both providers. Record browser-visible readiness separately from existing request-to-health timings. The [public-runtime results](PUBLIC-RUNTIME.md) remain valid backend evidence. No new browser launch or performance result was produced by this operator-setup step; implementation remains unchanged.
