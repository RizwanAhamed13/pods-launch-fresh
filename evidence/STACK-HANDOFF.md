# Broad stack checkpoint

Goal active and incomplete. Developer URL → isolated aswin build → reusable
artifact → authorized user compute → actual usable product. This turn added
Codespaces stage observations, passed225 local/Linux checks, deployed and measured
cold/warm native launches. A private-port-gated SSH overlap probe passed and is the
next implementation candidate; the production launch is still sequential.
Do not mark the goal complete or blocked: meaningful work remains possible.

## Current verified state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Public core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pinned d6da2ed780aec8ae0178fc181f1d24113c322e15.
- Coverage remains55 isolated build/artifact/browser,55 Google native browser,
  55 Codespaces HTTP/protocol. Codespaces native browser interaction is unverified.
  Seven database/service families are covered. Matrix records tested representatives,
  not every version or arbitrary application. Unknown secrets/schema/migrations
  still require developer inputs; desktop/mobile/GPU/non-web products are excluded.
- Full suite225/225 local and isolated Linux; stack-codespace-timings-tests.json verifies
  all330 snapshot input hashes. Current scoped source7,904physical lines:
  3,945product/tooling +2,862tests +933examples +164browser tools. Archived diagnostic
  reproducers in evidence/probes are outside that source-count scope.
- Runtime/control05d46e8af24f3a79c2ae0c4529d3af9666621fb6, PID1483932.
  Preview provider helper7a28920; providers.mjs05d46e8, builder2553fc8, storage77cf340.
  RunnerSHAbe6b31d3791059d5833b20f2b7bdac6c7f99d78e00d4fd0c1ab3c7f0d688cc64.
- Deployment stack-codespace-timings-deployment.json: health200, SQLiteok, idle,
  preserved57images/131artifacts, unchanged .env and unchanged runner. No restart for docs.
- Latest idle audit2026-10-04T12:46:37.276731+00:00: health200, SQLiteok,
  zero active builds/launches. All accepted launches stopped. No jobs running.

## Latest native gate

- src/image-ranges.mjs downloads images≥32MiB in four bounded verified ranges.
  Exact206/Content-Range/size/SHA checks, peer cancellation, private temporary file,
  existing authorized single origin fallback. Runner reports range attempts/downloads.
  No token/capability is sent to CDN; signed URLs are never saved.
- stack-cdn-range-experiment.json compares separate new private asset paths:
  four ranges5.504s vs serial15.326s including verification; one sequential test,
  not a guaranteed speedup. Temporary assets609748536/609749327 deleted and404verified.
- Ordinary developer browser build FQE7ixIiC2VbQAFOf6rb8jQK0WPArPVH:
 257.820s, source d6da2ed, new app repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-ed14d4bc3ecb.
  Image125122053bytes, SHA48ac2bcef4a719876140d74b81474917545c48a15ae316252f31b466246f6d3d.
  Private permanent asset609771636 in release402982733,
  https://github.com/RizwanAhamed13/pods-launch-artifacts-fresh.
  Preserve permanent assets609702555,609732872 and609771636.
- Before the new Google launch, prior cached version was opened without a write,
  verified count4 and fully stopped. This warmup is excluded from new-image timings.
- Google new image xAmUXDTb3HAOyGxIPampObKiRN-ARxYI: RUNNING, healthy20.755s,
  observed product22.006s, image transfer6.215s (CDN5.125s), load2.826s.
  Cached EdKSBQAixKGq_EC5QFqsxDXU1AUXtkDr: healthy10.058s, product11.465s.
  Browser button/reload/fullstop/relaunch retains4→5→6; no warning/error logs.
- Codespaces accepted new image BVjGLv0CgVFUP6VuTGwDT6t5mnuOXSLb:
  Available,healthy25.357s,transfer5.218s (CDN4.028s),load3.663s.
  Cached zOg1_5XrtsXik3gTNc_QZn2RJBG4io3x: healthy11.149s.
  Authenticated product HTTP and SQLite online backup passed4→5→6;
  integrityok, private product26630, no exposed DB port, no pause, fully stopped.
- Range gate ended at count6 both. Current counts after the preview fix:
  Google8, Codespaces10 after the latest Codespaces observations below. Never reset data or
  rerun an old expected value.
- stack-cdn-range-native.json validates source hashes, unique IDs, build/image
  identity, first-cache-miss/repeat-hit, successful ranges/no fallback, persistence
  and cleanup. allAttemptsPassed=false because of the earlier preview failure.
- New image was absent, but existing Docker layers/caches were retained. Do not
  call this an empty-machine benchmark. 20s product target remains unmet.
  Prior sequential CDN measurements remain in stack-image-delivery-native.json.

## Preview failure and completed fix

- First Codespaces attempt oYLPWeOxc0R9CqqW9yXr3Zqtl1q9O1-k failed after15.831s:
  'Could not start your compute. gh timed out'. Initial API stateAvailable.
  No runner timings, image download or database write. Harness stop confirmation
  also timed out because the launch was already failed; retain that failure.
- stack-cdn-range-preview-failure.json traces providers.launch →
  ensureCodespacePreview before bootstrap. Its initial read-only gh ports lookup
  has a15s per-command timeout inside a60s stage deadline.
  The same aswin read-only command subsequently succeeded in24.147s, returning
  only private8080. During diagnosis API states wereStarting thenAvailable.
  Do not claim why the provider transitioned; observations do not establish it.
- Fixed at7a28920: each preview command uses the remaining original60s budget;
  expired stages do not issue another command, and polling cannot outlive the
  deadline. No retries of auth/privacy mutations or public exposure added.
- stack-preview-budget-tests.json: all3 new cases failed old code and passed fix;
  full214local/Linux,328snapshot inputs verified. The first negative test harness
  left its mocked sleep unadvanced; that process was stopped and the bounded
  harness was rerun. Only the completed before/after runs are evidence.
  Slow24.147s lookup+private registration succeeds; combined lookup+privacy change
  cannot reset60s; expiration issues no extra lookup and closes its forwarder.
  Existing malformed/auth/forward/privacy failures retain their checks.
- stack-preview-budget-native.json: two post-deploy cached Codespaces launches
  KhKhOJE7w1kQMPpr5TK0VpSUAdzKO5eK and xsUfstfxINLkC8bxr2-ovPsrfcfmy5SF,
  bothAvailable, healthy11.259/11.736s. HTTP counter6→7→8, SQLite online backup
  integrityok, private26630, no DB hostports, no application pause, bothstopped.
  Same prepared artifact/image/data; no new build. Native slow24s delay was not
  forced or reproduced. Deterministic before/after tests prove that boundary;
  native runs cover normal integration. Codespaces native browser remains unverified.
- Investigate skill was read: /Users/rizwanahamed/.codex/skills/gstack-investigate/SKILL.md.
  Root-cause workflow completed with bounded fix and acceptance; freeze helper
  unavailable. No subagents authorized.
## Completed Google ready-compute optimization

- Source1d5282d: RUNNING compute uses addPublicKey; cold/unknown compute retains
  start with its unique key. Both require readback of that exact key before SSH.
  If successful key registration races SUSPENDED/PENDING state, start the same
  environment with no repeated key registration. Both operations share the original
  provisioning deadline. Lost responses reconcile state/key without duplicate
  mutations; auth/quota and explicit operation failures stop. Cleanup remains.
- The prior stack-google-key-registration-probe.json compared start and addPublicKey
  in start/add/add/start order: mean registration-through-SSH2.793s
  versus2.329s. Four samples only; not a full-launch guarantee.
- stack-google-ready-tests.json: all7 new ready-path cases failed the previous
  always-start implementation. Updated focused suite47/47 and full221/221 local
  and Linux pass;329snapshot hashes verified. The first focused run waited on an
  older mock lacking state/key fields and was explicitly stopped; the corrected
  bounded run is the passing evidence. No native suspension race was forced.
- stack-google-ready-deployment.json preserved57images/131artifacts and.env;
  runner SHA unchanged. PID1478794 is the verified production listener.
- stack-google-ready-native.json: lecSmZTJEQwH-z50qLoIlcNxMAl3h7i_ and
  Xn0h2-5upgX7J_lNVCiDtTw2gWYfLSeF both observedRUNNING, direct key registration
 1.257/1.337s, no start request, cached image. Healthy9.755/9.706s; product visible
 10.319/10.325s. Actual button/reload/fullstop/relaunch preserves6→7→8, no page
  warnings/errors, bothstopped. This gate does not establish first-image20s or
  native cold/race behavior. Existing9 provider public keys remained9; do not
  remove those unrelated keys. Exact attempt-key cleanup is covered by tests.
- Validator /tmp/pods-record-google-ready-native.py; raw /tmp/pods-google-ready-*.json.
  Probe/audit credentials stayed only in server memory. No account/token/private
  preview values are saved in public evidence.

## Completed Codespaces measurements and next implementation

- Source05d46e8 adds previewRequestedAt/previewReadyAt, bootstrapRequestedAt/
  bootstrapDeliveredAt/bootstrapAttempts and optional compatibility timestamps to
  compute observations. Execution order, private access, retries and deadlines are
  unchanged. Observation updates cannot cause an extra SSH retry after delivery.
- stack-codespace-timings-tests.json:4 new cases fail before observations;225/225
  local and isolated Linux pass,330snapshot input hashes verified. Tests cover
  independent phases, failed preview/no dispatch, retries, compatibility timing.
- stack-codespace-timings-deployment.json preserves57images/131artifacts and.env,
  unchanged runner; active PID1483932. No data/cache reset or new developer build.
- stack-codespace-timings-native.json: E0R7xMbsqdbODPeLe-ev-tTwV7BrUUGg starts
  Shutdown; healthy37.381s with12.636s before provider readiness,4.788s preview,
 9.213s bootstrap,10.729s after bootstrap,15ms between phases. Repeat
  7Is7MykCmre6JNu3IwS_SmMD1z-SvyKF startsAvailable; healthy12.171s with0.504s
  before readiness,1.726s preview,4.381s bootstrap,5.551s after,9ms gaps.
  Both have imageCacheHits1, no image transfer. HTTP8→9→10, direct SQLite online
  integrityok/private26630/noDBports/no pause, full stops. Google remains8.
- The runner runtimeReadyMs is a nested/separate interval; do not add it to server
  stage durations again. Codespaces native browser interaction remains unverified.
- stack-bootstrap-overlap-probes.json archives two4-sample ABBA comparisons,
  with exact reproducers in evidence/probes/bootstrap-{transfer,overlap}.mjs.
  Source scripts target the configured aswin and authorized named Codespace,
  accept the GitHub token only via stdin, and never start the application/runner.
  Each verifies the same46494-byte runner SHA and uses a fresh private temp folder
  with EXIT cleanup. Existing databases, caches and unrelated files are untouched.
- Runner delivery via inline base64 averaged3.746s versus4.117s using curl;
  the two download samples differed substantially, so do not prioritize that change.
- Starting gh SSH with stdin open/empty alongside read-only private-port lookup,
  then releasing the harmless probe only after private confirmation, measured
 3.788/3.871s combined versus serial6.897/5.492s. All ports private, bytes withheld
  until confirmed, identical SHA, no runner executed. Small sample, not a full-launch
  guarantee. Existing production path remains sequential.
- NEXT: implement overlapping transport establishment with a strict release gate.
  Never send bootstrap/config bytes or start the runner before private verification.
  Preserve3 SSH attempts and their failure handling; cancel/reap the waiting child
  on preview errors, deadline, shutdown or early SSH failure. Preserve separate
  preview and post-release delivery budgets; do not let slow preview exhaust the
  whole delivery budget or add unbounded waits. Test these failure boundaries,
  then full suites, deploy and real product/database acceptance. Afterwards run an
  ordinary new developer build to measure first-image delivery on ready compute.
- Validator /tmp/pods-record-codespace-timings-native.py; inputs
  /tmp/pods-codespace-timings-*.json. Both command probe workers completed normally.
- Existing questions about GitHub browser2FA, stable hostname and destructive
  provider VM-replacement testing remain pending. Do not repeat or infer approval.

## Operational constraints and evidence

- Preserve cloudflaredPID2322522 and origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- PODS_IMAGE_STORAGE_BYTES8589934592; quotas3/account/hour,12global/hour.
  No bypass/account switching/QA artifact import or cache/data clearing.
- .env/private delivery/provider credentials stay private; never print tokens,
  account identities, computeKey, signed URLs or private Google preview URLs.
  SQLite reads mode=ro with whitelisted fields. Local gcloud identity is wrong;
  do not use it. Deployer verifies actualPID/cwd/listener and unchanged environment.
- Push first, then sync with gh auth token piped to ssh aswin and temporary GH_TOKEN,
  helper /home/aswin/pods-tools/bin/gh auth git-credential, git pull --ff-only.
- Codespace pods-launch-containers-69rw5vx4xp46c5qw5. All native saved data retained.
  Streamlit counters2both, Symfony Google2/Codespaces3, Micronaut Google8/Codespaces10.
- Preserve older failures: Streamlit initial storage limit/build and403 origin,
  Symfony pause/liveness conflict. See STACK-VERIFICATION-HISTORY.md and individual
  receipts. SQLite inspections now use online backup, never pause the app.
- QAguest pods-fresh-matrix-01, /snap/lxd/current/bin/lxc, uid/gid1000,
  Node/opt/node/bin/node, deps/opt/pods/node_modules. Current verified candidate
  /output/codespace-timings-candidate-dc0b25b. Always --disable-stdin for lxc exec overSSH;
  earlier setup without it consumed script input and was not counted as a test.
  Keep QAserverPID292107, ports18090/8081/18890, shared caches and runtime.
- Full test logs /tmp/pods-codespace-timings-full-local.txt and /tmp/pods-codespace-timings-full-qa.txt.
  Latest validator /tmp/pods-record-preview-budget-native.py; inputs
  /tmp/pods-preview-budget-*.json. Prior validator /tmp/pods-record-range-native.py. Preserve failure input pods-range-codespaces-failed-raw.json.
- Browser1: stackQa6/tab1 stopped newMicronaut, echoTab/tab2 stopped warmup,
  mongodbSupport/tab3 supportmatrix. Re-markHandoff each turn, after compaction
  cua.rewriteDocumentation first. micronautRangeGoogle stores two browser records,
  micronautRangeWarmup stores setup, micronautRangeLaunchUrl is current link.
  Micronaut controls: h1 'Micronaut + SQLite', #value, button 'Add one'.
- Browser handles retain continueSqliteFramework and stopNativeCounter helpers.
  googleReadyAcceptance contains both latest native Google records; current saved count8.
  Worker sessions20376(Linux),17528(native),10429(deploy) are terminal.
  The first hanging negative-test session30407 was stopped explicitly. No jobs running.
