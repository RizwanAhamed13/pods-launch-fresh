# Provider onboarding handoff

Observed 2026-10-02T19:49:04.069158+00:00. This records operator setup, not a completed user OAuth journey.

## Google

A fresh Google Cloud project was created through the signed-in Cloud Console: **PODS Fresh Launch**, project ID `pods-launch-fresh-20261003`. The console confirmed creation completed and selected that project. Existing projects were not reused.

The [OAuth configuration form](https://console.cloud.google.com/auth/overview/create?project=pods-launch-fresh-20261003) is prepared with app name PODS Fresh Launch, the current account's support/contact address, and External/testing audience. It is waiting at the unchecked Google API Services User Data Policy agreement. No OAuth client or client secret has been generated. Browser-control rules require confirmation before accepting the agreement; a concrete approval request is pending.

The [Cloud Shell API page](https://console.cloud.google.com/apis/library/cloudshell.googleapis.com?project=pods-launch-fresh-20261003) loaded successfully after one retry. It shows Enable and the Google Cloud terms notice. Enablement has not been submitted. A combined approval request covers the prepared OAuth agreement and API enablement. Neither consent nor enablement should be inferred from project creation.

After approval: finish OAuth configuration, enable Cloud Shell API, add the intended test users, create a web client with callback `https://collection-conferences-ages-clearly.trycloudflare.com/auth/google/callback`, install its credentials securely in aswin's ignored `.env`, and restart the control plane. The current hostname is temporary; a changed origin also requires updating the registered callback. Provider access consent remains a separate user action.

## GitHub

The existing Google sign-in route reached GitHub two-factor authentication. The user must finish that step in the retained browser tab. The intended next page registers PODS's OAuth app with callback `https://collection-conferences-ages-clearly.trycloudflare.com/auth/github/callback`. No GitHub OAuth credentials have been registered or installed.

## Verification still required

Complete real provider authorization, real developer-UI repository submission, a separate user's native application preview and a meaningful product interaction for both providers. Record browser-visible readiness separately from existing request-to-health timings. The [public-runtime results](PUBLIC-RUNTIME.md) remain valid backend evidence. Source remains at the validated runtime implementation; this setup turn changes documentation only.
