# Provider onboarding handoff

Observed 2026-10-03T04:30:30.248476+00:00. This records operator setup, not a completed user OAuth journey.

## Google

Fresh project: **PODS Fresh Launch**, project ID `pods-launch-fresh-20261003`. Existing projects were not reused.

The Google OAuth configuration is created with app name PODS Fresh Launch and an External/testing audience. The console displayed “OAuth configuration created!”. The previous agreement step is complete.

The [Cloud Shell API details](https://console.cloud.google.com/apis/api/cloudshell.googleapis.com/overview?project=pods-launch-fresh-20261003) now explicitly show **Status: Enabled**. The signed-in operator account was saved as a test user; Audience shows one test user. Data Access saved the three scopes used by the server: `openid`, `https://www.googleapis.com/auth/userinfo.email` (the `email` authorization alias), and `https://www.googleapis.com/auth/cloud-platform`. Declaring these scopes does not itself authorize access to a user's account.

The [web client form](https://console.cloud.google.com/auth/clients/create?project=pods-launch-fresh-20261003) is prepared as **PODS Fresh Launch Web**, Web application, with the single redirect URI `https://collection-conferences-ages-clearly.trycloudflare.com/auth/google/callback` and no JavaScript origins. No client or secret has been generated. A concrete approval request is pending for client creation and storing its secret only in aswin's protected, ignored `.env`; browser-control policy requires action-time confirmation for the persistent credential.

After approval: create the prepared client, install its credentials securely, restart the control plane, and complete real Google consent and native product-page validation. The current hostname is temporary; a changed origin also requires updating the registered callback. Provider access consent remains a separate user action. The server still reports Google `oauthReady: false` until credentials are installed.

## GitHub

The existing Google sign-in route previously reached GitHub two-factor authentication. The user must complete that step before registering PODS's OAuth app with callback `https://collection-conferences-ages-clearly.trycloudflare.com/auth/github/callback`. The prior GitHub tab is no longer open. No GitHub OAuth credentials have been registered or installed.

## Verification still required

Complete real provider authorization, real developer-UI repository submission, a separate user's native application preview and a meaningful product interaction for both providers. Record browser-visible readiness separately from existing request-to-health timings. The [public-runtime results](PUBLIC-RUNTIME.md) remain valid backend evidence. No new browser launch or performance result was produced by this operator-setup step; implementation remains unchanged.
