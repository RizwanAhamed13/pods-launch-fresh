# Broad stack checkpoint

Goal active. Do not mark complete: remaining native framework/provider evidence,
GitHub browser OAuth/sign-in and Cloud Shell VM replacement remain unverified.

## Code and coverage

- Core: https://github.com/RizwanAhamed13/pods-launch-fresh (private).
- Fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh (public), 00df7c0.
- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin /home/aswin/pods-launch-fresh.
- Latest product fix 46a907c is pushed/deployed. Runner bytes unchanged:
  75cfd87f58a02353b48a080ee480b9b5ac246e2e189474f57e318fa11fdc0a0f.
- 54 distinct genuine framework/application/database fixtures pass isolated
  preparation, artifact launch and meaningful browser interaction. Not 54 frameworks.
  SUPPORT.md and stack-coverage.json enumerate coverage and retained failures.
- 56 automated checks pass locally and on aswin (compute-account-lock-tests*.txt).
- 4471 physical source lines: 2563 product/tooling, 883 tests, 868 examples,
  157 browser tools. code-lines.json defines exclusions.
- Native Google browser families: Flask/PostgreSQL, React/Express/PostgreSQL,
  Angular SSR/SQLite, Quarkus/SQLite, Laravel/SQLite, Blazor/SQLite, Gin/file,
  Flask/Python worker/Redis. Eight families; Bun is still pending.
- Codespaces authenticated SSH HTTP/protocol evidence covers those eight plus
  Bun WebSocket/SQLite. Nine families; native browser authorization remains separate.
- Full Codespaces rebuild retained PostgreSQL data; Cloud Shell VM replacement
  remains unproven. Cold images can exceed20s; cached samples are not a guarantee.

## Latest completed gate: Bun Codespaces and account conflict prevention

- Normal build-window observer96624 finished. Developer tab13 submitted Bun once.
- Build MvtaB8aiHp80w0RPixBtZt8uFU-KbsA4, preparation106.981s, 62.4MiB image.
- App repo-f8398873a1ed16dd986aa442-00df7c09ea97-84fa7d76242e.
- Codespaces HguiqYZ1zMiQ0lwFWwUF5sA9xiPsRJZ-: health24.716s, image absent.
  G4NquD1LMiPh-QYBc1wX2z_wmYrNMx5w: health7.138s, cached.
  Real ping/pong, message update0→1, reconnect, HTTP readback; full stop/relaunch
  retained1 then increment2. Both confirmed stopped. stack-bun-codespaces.json.
- Existing WebSocket probe QA and negative healthy-Gin control remain valid;
  PODS_WEBSOCKET_CHECK=1 is exclusive with counter/worker flags, requires two
  launches. Harness confirms stop on success and failure.
- Google Bun CKlLEhjY6a8zrjhuUZ-Ov9rDt9CzcTii failed: port8080 occupied.
  Prior worker NnAO3SfXlvZx_PL8G9cQMJUe9tkieXmi DID stop correctly.
  New worker gW5Ob4iItkBOdF9Cwdf5qGTq6CEVBu_v started from a DIFFERENT browser
  session at17:19:05UTC on the same Cloud Shell preview. Its heartbeat is live;
  reloading the native preview showed Background worker + Redis / HELLO PODS.
  Do not call this a stop/cleanup failure. Failed attempt is retained.
- Reproduced server bug: concurrency guard checked browser owner only, so two
  sessions for one compute account both dispatched. New private provider+identity
  key rejects the second with409 without leaking/handing over launch controls.
  Locks survive disconnect and server restart; active legacy records migrate
  when connection identity remains available. Unrecoverable legacy identity still
  relies on runner port guard. Different accounts/providers remain independent.
- Two regression tests plus full56-check suite pass. Live IAB tab12 correctly
  shows another-session conflict BEFORE dispatch; DB confirms no new Bun record,
  worker remains ready, and account lock migrated. compute-account-lock-live.json.
- User was asked whether this newer worker preview may be stopped to finish Bun.
  No reply yet; do not interrupt it. Saved jobs would remain. This is separate
  from the already-pending Cloud Shell VM Restart confirmation.

## Previous runtime fix retained

004c64b monitors all Compose services before ready and on heartbeats. Worker/DB
failure revokes ready even while webHTTP200; successful explicitly depended-on
migration jobs may exit0. Failure callback precedes graceful cleanup.
Real isolated fault evidence container-liveness.json: worker reported2.576s,
DB unhealthy2.564s, cleanup6.867s/17.933s, saved job retained. Initial failure
preserved. No need to rebuild54 fixtures for control-plane-only account locking.
Worker native browser and Codespaces completed-job persistence evidence remains
in stack-worker-redis-{url,google,codespaces}.json. Not exactly-once/in-flight recovery.

## Next gates and pending user actions

1. Finish native Cloud Shell Bun after the newer worker stops or stop is authorized.
   Preserve the failed attempt; manifest is now cached but Bun image is still absent.
   Browser acceptance: actual Add one button enables on WebSocket open; increment,
   reload, confirmed stop/full relaunch retains count, then increment again.
   Measure continuously from launch to real interaction, NOT identical launcher heading.
2. GitHub IAB tab10 is at /sessions/two-factor/sms/confirm. No SMS sent or code
   entered. User step already requested; do not repeat or expose the private preview.
3. GitHub web OAuth remains unconfigured, Google configured. Token/API success
   does not satisfy the Codespaces browser authorization gate.
4. Cloud Shell tab14 has pending Restart confirmation: home remains, processes
   terminate and VM changes. No approval; do not final-click Restart or reset home.
   Background Authorize Cloud Shell modal also remains untouched.
5. Continue remaining native families, retaining preparation/uncached/cached/
   browser timings separately. Next normal developer quota slots after this Bun
   submission were17:32:26,17:57:36,18:18:13UTC if the account has no other builds.
   Check actual account window before submission. Never switch identities, import
   QA artifacts, or bypass the build quota. No active observer remains.

## Runtime and live state

Origin https://collection-conferences-ages-clearly.trycloudflare.com.
Control plane localhost8787, PID723437, persistent exec session90587.
PID file /home/aswin/pods-launch-server.pid now matches; the previous file was
stale259870 while actual listener was708830. Replacement validated exact process
cwd/cmdline and listener before stopping708830. Use scripts/serve.sh.
Ordinary SSH needs /home/aswin/pods-tools/bin on PATH. Never print .env/tokens.

Google active worker gW5Ob4iItkBOdF9Cwdf5qGTq6CEVBu_v expires17:49:05.739UTC.
It belongs to another session; active worker still ready after control-plane restart.
Codespace pods-launch-containers-69rw5vx4xp46c5qw5 has no PODS app running after
confirmed Bun stops. Saved Bun2, Gin4, Blazor2, Angular2, PostgreSQL3; worker jobs retained.
No build/QA/probe job active. Server session90587 intentionally stays running.

CUA bindings: stackQa6 (IAB2 tab13 completed Bun preparation);
accountWorker (IAB2 tab12 Bun launch with live409 conflict),
workerReadOnly (IAB2 tab9 native worker showed HELLO PODS on reload),
independentUser (Chrome1 tab2083874416 failed Bun launch; its old Google token
expired, UI may still display connected until refreshed), nativeGithubKeep
(IAB2 tab10 2FA), cloudLifecycle (IAB2 tab14 pending restart).
bunLaunchUrl/workerLaunchUrl hold exact links. Re-mark needed tabs per turn.
After compaction call cua.rewriteDocumentation. Wait timeouts never cancel launches.

SQLite .data/pods.sqlite must be read-only with whitelisted fields; no owner,
account, token, session or connection dumps. LXD /snap/lxd/current/bin/lxc;
QA pods-fresh-matrix-01, /opt/pods source, /work/stacks fixtures, /output results,
Node/opt/node/bin/node, uid/gid1000, PODS_ISOLATED_BUILD=1. Root50GiB/pool60GiB;
no host Docker. Source graph project Users-rizwanahamed-Documents-ChatGPT-podsv2;
graph-first discovery, targeted fallback when scripts/examples are absent.
