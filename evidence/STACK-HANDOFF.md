# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable
artifact → authorized user compute → actual usable product. Latest gate fixed native
test evidence loss, passed 250 local/Linux checks and two cached Codespaces
launches with persistent SQLite. Production launch behavior is unchanged. The
earlier HTML status-poll failure and same-instance recovery remain recorded; the
original response cause is unknown. First-image 20-second product target remains unmet.
Do not mark the goal complete or blocked; meaningful work remains possible.

## Current verified state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Public core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pinned d6da2ed780aec8ae0178fc181f1d24113c322e15.
- Coverage: 55 isolated build/artifact/browser, 55 Google native browser,
  55 Codespaces HTTP/protocol; seven database/service families. Full matrix is in
  SUPPORT.md and stack-coverage.json. Codespaces native browser remains unverified.
  These are tested representatives, not every version or arbitrary application.
  Unknown secrets/schema/migrations require developer inputs; desktop/mobile/GPU/
  non-web products are excluded. Frontend localStorage is not backend DB durability.
- Full suite 250/250 local and isolated Linux; stack-live-evidence-tests.json verifies
  336 snapshot input hashes. Current scoped source 8,347 physical lines:
  4,030 product/tooling + 3,220 tests + 933 examples + 164 browser tools.
  Archived diagnostic reproducers in evidence/probes are outside that scope.
- Current source fff99254886c0beea3d5715168a605cc915888c4 (harness only).
  Running production revision 723edfafccdbef383a413c744d11dc2d24c0c61e, PID 1508835.
  Server e189ffd; preview helper 7a28920; providers/deferred-command b9be575;
  builder 2553fc8; storage 77cf340.
  Runner SHA be41ee8a471d684705100e8353a1d7cc34ea1e8d89b2575a6e155f1d50eef13d.
- stack-eight-ranges-deployment.json records health200/SQLiteok and preservation
  of 58 image files/133 artifacts and .env. A later ordinary build adds artifacts.
- Final audit 2026-10-04T13:44:23.215453+00:00: same PID/runner, source fff9925,
  health200, SQLiteok, zero active builds/launches. All test launches stopped.
  Docs-only sync does not require a restart.

## Latest implementation and native gate

- src/image-ranges.mjs: >=64MiB uses eight ranges; 32–64MiB retains four.
  Smaller images stay serial. Retains trusted signed-host restriction, exact206/
  Content-Range/size checks, 30s total deadline, private temporary file, peer
  cancellation, full SHA before publication/Docker load and authenticated origin
  fallback. No token/capability is sent to the CDN; signed URLs stay private.
- stack-image-range-parallelism.json: identical 125120183-byte image, four distinct
  new private asset paths, sequence4/8/8/4. Verified downloads4777/2616/3443/5905ms;
  means5341/3029.5ms. Small sequential sample, uncontrolled shared CDN/network,
  not a full-launch benchmark. Reproducers: evidence/probes/image-range-parallelism-*.
  Temporary assets609878758/609879399/609880064/609880647 deleted and404verified.
  Prior permanent asset609862985 unchanged. Preserve it and older permanent assets.
- Two new regressions failed the old four-range code (7pass/2fail); full242 local
  and Linux pass after fix. Checks exercise uneven reconstruction and cancellation
  of all seven peers on failure alongside original integrity/fallback coverage.
- Ordinary browser build L2AiK3hVAKYytXputQXo0R8rWt6bDhVs prepared in217.780s,
  same pinned Micronaut source, no manual terminal/config or quota bypass.
  App repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4;
  dataKey repo-2caafe8ea7f268fe237b7cab, product port26630.
  Image125123048bytes, IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent private asset609893443/release402982733 at
  https://github.com/RizwanAhamed13/pods-launch-artifacts-fresh; preserve it.
- Latest launch link:
  https://collection-conferences-ages-clearly.trycloudflare.com/launch/repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4
- Google warmup used previous cached app...eadd466d0702, no target prefetch/write,
  count10 retained and stopped. Harness initially matched the PODS card heading;
  subsequent real product observation has a gap, so no warmup visibility timing
  claim. This setup is excluded from target measurements.
- Google first Usr5Xd-rqz4pcdLnTaizs6PRADXXc7W3: RUNNING, healthy19377ms,
  product20667ms, download5923ms (CDN4748), load2797ms; image/archive cache0.
  Cached edmpNcPVTpy6dgc3fWW2_hRZpG4vucBJ: healthy9188ms/product10223ms,
  image hit1, no download. Browser button/reload/fullstop/relaunch10→11→12 passed.
- Codespaces first Nel36ZIuJKEzj9bk3DgcwRfa-A0Tgg2S: Available,
  healthy28725ms, preview11808ms, post-private bootstrap3098ms,
  download4545ms (CDN3475), load3209ms; image/archive cache0.
  Original harness worker77810 failed parsing HTML during GET status after creating
  the launch. Its empty results receipt does not mean no launch occurred. Original
  HTTP status/body were not retained; root cause remains unknown.
- The same instance was recovered without relaunch: product HTTP14→15→15,
  SQLite online backup integrityok, saved15, private26630/no DB hostports/no pause.
  It was stopped through its original test session's normal authenticated endpoint;
  owner/CSRF values stayed in process on aswin, no stored row edits.
  Temporary SSH timeouts during diagnosis later cleared. Their relationship to the
  HTML response is unproven. Local Tailscale stayed Running; DERP pong succeeded.
- Two uninterrupted cached launches, worker77868 terminal0:
  4sG6J4eX7QqWukKTwl8d_Exk_MVzO6o4 healthy9277ms;
  oOcbTwGq3KO57KACOEozR4lImksOWEa- healthy8512ms.
  Both Available, image hit1/no download, HTTP and SQLite15→16→17 passed,
  full stops confirmed, same private ports/volume/no pause.
- stack-eight-ranges-native.json verifies image/source identity, all five IDs,
  first miss/repeat hits, successful ranges/no fallback, persistence, source hashes,
  deployment and final idle audit. functionalAcceptancePassed=true but
  allAttemptsPassed=false; Codespaces first-product acceptance was recovered later.
  Existing Docker layers/caches were retained; not an empty-machine benchmark.
  Native Codespaces browser and first-image20s remain unproven/unmet respectively.

## Completed native test-harness fix

- The evidenced gap was: scripts/live-codespaces.mjs only
  appends a launch result after ready/failed/stopped. A non-JSON status response
  before that point loses its durable launch ID, error and stop confirmation.
  Fixed at fff9925: persist an attempt before POST and its launch identity before
  GET polling; persist each observed state. Error/cleanup metadata belongs to the
  current attempt, with HTTP status and normalized content type but no response body.
  Ambiguous launch POST is never repeated; ambiguous stop POST is reconciled with
  GET without repeating the mutation. This is harness-only, no production restart.
- stack-live-evidence-tests.json: seven cases failed old code and its success case
  passed. All eight new cases and full250 local/Linux pass after the fix. Real CLI
  subprocesses use a loopback HTTP server. Tests cover HTTP503 HTML, HTTP200 HTML,
  malformed JSON, unsuccessful cleanup, interrupted repeat, ambiguous launch/stop,
  and two successful launches. No provider failure was injected. Initial account/
  bootstrap failures and process/filesystem crashes are outside this gate's scope.
- stack-live-evidence-native.json: two cached launches on the same prepared image:
  5sUJ3jPK-BbC4YlY48KPzrS2ITXq-IXo healthy10829ms;
  kwCbwbQsUUibOK3Kd5czs6bW90_ZLGJ6 healthy9249ms.
  Authenticated product HTTP and online SQLite integrity17→18→19 passed through
  full stops, private26630/no DBports/no pause. Both recorded stop accepted/stopped,
  no test or cleanup errors. Worker69991 terminal0. Native browser remains unverified.
  See receipt for initial compute states and final idle audit; cached timings do not
  add first-image evidence or establish a speedup. Google count remains12.

## Next bounded gate

- Production browser polling is now inspected: public/app.js poll() catches any
  error, stops scheduling polls and requires the user to click Check progress.
  Its api() unconditionally parses JSON, so a transient HTML response could force
  that extra step. This is a code-derived hypothesis, not a reproduced native browser
  failure. Reproduce with the real client and controlled responses, then implement
  bounded read-only recovery that preserves the same build/launch ID and automatic
  product navigation. Never retry creation/write mutations or conceal auth failures.
  Verify normal success, temporary errors, persistent failure limits, and stale
  responses after navigation/operation changes. Keep production edits scoped.
- Continue measured work on first-image/preview costs after evidence reliability.
  Preserve private preview gating, signed delivery, integrity, caches and saved data.
- Pending questions remain GitHub native-browser2FA, stable production hostname,
  and destructive provider VM-replacement testing. Do not repeat or infer approval.
- Historical fixes/probes/failures remain in individual receipts and
  STACK-VERIFICATION-HISTORY.md. Previous detailed checkpoint is preserved in git at
  723edfafccdbef383a413c744d11dc2d24c0c61e:evidence/STACK-HANDOFF.md.
  Google ready-key optimization, gated SSH overlap and provider-choice regression
  are documented in stack-google-ready-*, stack-ssh-overlap-*,
  stack-provider-bootstrap-* and stack-fresh-image-native.json.

## Operational constraints and recovery inputs

- Preserve cloudflaredPID2322522 and origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- PODS_IMAGE_STORAGE_BYTES8589934592; quotas3/account/hour,12global/hour.
  No bypass/account switching/QA artifact import or cache/data clearing.
- .env, private delivery/provider credentials and raw receipts stay private. Never
  print tokens, account identities, computeKey, signed URLs or private preview URLs.
  SQLite reads mode=ro with whitelisted fields. Local gcloud identity is wrong;
  do not use it. Nine unrelated Google provider public keys must remain untouched.
- Push first, then gh auth token piped to ssh aswin and temporary GH_TOKEN using
  helper /home/aswin/pods-tools/bin/gh auth git-credential, git pull --ff-only.
  Node /home/aswin/pods-tools/node-v24.21.0-linux-x64/bin/node.
- Codespace pods-launch-containers-69rw5vx4xp46c5qw5.
  Current saved Micronaut counts Google12/Codespaces19. Never reset or rerun an old
  expected value. Streamlit2both; Symfony Google2/Codespaces3.
- QAguest pods-fresh-matrix-01; /snap/lxd/current/bin/lxc, uid/gid1000,
  Node/opt/node/bin/node, deps/opt/pods/node_modules. Latest verified candidate
  /output/live-evidence-candidate-ca6753a. Always --disable-stdin for lxc exec overSSH.
  Preserve QAserverPID292107, ports18090/8081/18890, shared caches/data/runtime.
- Latest test logs /tmp/pods-live-evidence-{before,full-local,full-qa}.txt.
  Snapshot336 hashes, manifest/archive and native receipt inputs in
  /tmp/pods-live-evidence-*. Validators /tmp/pods-record-live-evidence-{tests,native}.py.
  Older eight-range inputs remain in /tmp/pods-eight-ranges-*.
  Native validator /tmp/pods-record-eight-ranges-native.py, capture/audit/browser/build/
  recovered-product/recovered-stop inputs /tmp/pods-eight-ranges-*.json.
  Raw Codespaces receipts/logs include private fields: never publish wholesale.
- Browser: stackQa6/tab1 stopped newMicronaut; echoTab/tab2 stopped warmup;
  mongodbSupport/tab3 support. After compaction cua.rewriteDocumentation first,
  re-markHandoff each turn. eightRangeGoogleFirst/eightRangeGoogleCached,
  eightRangeDeveloperFlow/eightRangeWarmup/eightRangeLaunchUrl store latest records.
  Helpers continueSqliteFramework and stopNativeCounter retained. Use h1
  'Micronaut + SQLite' (not PODS h2), #value and button 'Add one'. Current count12.
- All native/build/probe/test/deploy workers are terminal. Latest native69991,
  capture22441 and audit82680 exited0. No jobs running; no waiting exec cells.
  No subagents authorized. Next changes should use a bounded investigation.
