# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable artifact
→ authorized user compute → real usable product. Latest completed implementation:
250 ms browser polling during delivery/startup, controlled before/after browser
comparison, 270 local/Linux checks, no-restart deployment and two native Google
product/persistence checks.
First-image 20s and native Codespaces browser acceptance remain open.

## Current verified state

- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core https://github.com/RizwanAhamed13/pods-launch-fresh.
- Fixtures https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pin d6da2ed780aec8ae0178fc181f1d24113c322e15.
- 55 representative apps passed isolated build/artifact/browser,55 native Google
  browser and 55 Codespaces HTTP/protocol paths. Seven DB/service families. See
  SUPPORT.md and stack-coverage.json; not every version or arbitrary repository.
  Native Codespaces browser remains unverified. Unknown secrets/schema/migrations
  require developer inputs. Desktop/mobile/GPU/non-web products excluded.
- 270/270 full local/Linux checks; stack-browser-handoff-tests.json.
  337 snapshot input hashes verified in /output/browser-handoff-candidate-25faa8e.
  Scope: 8597 physical source lines = 4054 product/tooling + 3432 tests
  + 933 examples + 178 browser tools. Archived probes excluded.
- Deployed browser implementation d0c22e5893540fc23acc7113ebb252682ce5171e;
  server process unchanged at PID1542671. Preview helper4218621; browser d0c22e5; server e189ffd;
  providers/deferred-command b9be575; builder 2553fc8; storage 77cf340.
  Runner SHA be41ee8a471d684705100e8353a1d7cc34ea1e8d89b2575a6e155f1d50eef13d.
- Deployment preserved 59 image files, 135 artifacts and .env; health 200 / SQLite ok.
  Native final audit found zero active builds/launches and same PID/runner.
  Later docs-only sync needs no service restart.

## Latest completed gate

- public/app.js polls250ms during delivering/downloading/starting; builds,
  provisioning and stop1000ms, transient failures1/2/4s unchanged. Six new
  behavioral tests execute actual client: three startup phases open within500ms,
  no extra build/provisioning polling, failure backoff, stop cancellation.
  Before16/20 passed; after20/20. Full270 local29.228s / Linux58.808s.
- stack-browser-handoff-comparison.json: isolated real browser/client/server/runner
  and notes product, simulated provider/auth, explicit runtime delay1500ms. Two
  sequential runs per variant, baseline then candidate. Health→first completed
  readiness status response726/896ms versus138/169ms, mean811→153.5ms.
  Four→seven status reads. Automatic product navigation/save/reload/full stop and
  persistence on relaunch passed both. Not first-paint/native/full-launch speedup.
  Initial concurrent localhost cookie-collision attempts were invalid and retained;
  measurements used one active browser session at a time. All fixture processes
  exit0 and tabs closed; temporary roots removed by fixture cleanup.
- stack-browser-handoff-native.json: HTTPS client SHA
  9d17d3df52a587d8a8e3169daf9f68c3eaa002bf8d16482d5e64c548c29e4d2b,
  same production PID/runner/no restart, health200/SQLiteok/zero active jobs.
  qM8sRUCKYU8_tJfr5ZcnpzSD6ezNaQec: Google initially SUSPENDED, imageCacheHits0,
  healthy54875ms; imageDownload27421ms/load6578ms, one CDN range attempt and
  fallback to origin. Browser observation began after auth refresh/creation, so
  click-to-product time not measured. Saved SQLite14→15, reload/full stop passed.
  aZ1rUMGwg5HwPb18ZR8DS1Xae9x-3iUs: Google RUNNING, imageCacheHits1, healthy9333ms,
  continuous browser product9877ms / write10598ms, SQLite15→16 reload/full stop.
  No cache clearing/new build/imported artifact; native Codespaces not retested.
  Suspended-compute persistence observed, not destructive VM-replacement proof.
- Latest audit2026-10-04T14:45:58.195375Z: PID1542671, healthy, SQLiteok,
  zero active builds/launches; revisiond0c22e5. Subsequent docs sync needs no restart.

## Previous completed provider gate

- Only production change: ensureCodespacePreview default pollMs 1000→500.
  Existing-map reuse, private visibility gate, 60s shared deadline and forwarder
  termination unchanged. No new tests that merely assert the constant; existing
  behavioral suite passes on both platforms. Native comparison is performance proof.
- stack-codespace-preview-poll.json: six initially absent fixture ports, sequence
 1000/0/500/500/0/1000ms. Registration 4534/5307/3897/3930/5245/4362ms.
  Means 1000=4448ms,500=3913.5ms,0=5276ms. Zero wait required three lookups;
  others required two. Each independently confirmed private; all forwarders reaped.
  No product launch in probe, no cache clearing, provider Shutdown restored.
  Small sequential sample on one provider; not a universal or whole-launch speedup.
- Previous eager-forwarding experiment showed no useful benefit and remains rejected.
  Retained errors and comparison: stack-codespace-preview-latency.json. Do not repeat.
- stack-codespace-preview-poll-native.json: existing prepared Micronaut+SQLite,
  image cache hit1 for both launches, no image download/load or new build.
  pgbUAEip0Kc5NtGvlInfwTPLBj8OooPJ: initially Shutdown, healthy 43431 ms,
  private preview 4194 ms, post-private bootstrap 10590 ms, runtimeReady 13581 ms.
  VGiq5qm8hYrkBcca0qoLeeIH6lhgKK_Z: initially Available, healthy 9663 ms,
  preview 2781 ms, post-private bootstrap 1643 ms, runtimeReady 4646 ms.
  HTTP product write/read and online SQLite integrity ok 19→20→21, full app stops,
  private 26630, no DB host ports, no pause. Both attempts passed, worker 58383 exit 0.
  No native browser acceptance, first-image timing or controlled whole-launch
  before/after comparison. Component differences do not identify their cause.
- Deployment and native evidence: stack-codespace-preview-poll-{deployment,native}.json.
  Provider restore to original Shutdown is confirmed in the native receipt.

## Next bounded gate and pending inputs

- Next bounded gate: diagnose the new native Google CDN→origin fallback from
  retained telemetry/code before reproducing it. Suspended compute lost image cache
  naturally; download27421ms caused much of the54875ms health time. Do not infer
  the fallback cause from timings alone. Preserve caches, data, privacy, integrity
  and deadlines; no quota bypass or QA artifact imports. Browser/provider polling
  tuning is finished; do not rerun it or the full stack matrix without a new reason.
- Existing Google first-image observation: healthy 19377 ms, real product 20667 ms;
  Codespaces first-image healthy 28725 ms. See stack-eight-ranges-native.json for
  exact state/cache scope and the retained interrupted Codespaces attempt.
  These are the unmet target observations, not guarantees or current regressions.
- Pending user inputs: GitHub native-browser 2FA, stable production hostname,
  destructive Cloud Shell VM-replacement durability test. Do not repeat questions
  or infer approval. Actual Codespaces browser work is still required for completion.
- Prior detailed checkpoint retained in git at 444737a:evidence/STACK-HANDOFF.md.
  Older exact receipts remain, including stack-browser-recovery-*,
  stack-live-evidence-*, stack-eight-ranges-*, stack-ssh-overlap-* and
  STACK-VERIFICATION-HISTORY.md. Do not erase failures or broaden their claims.

## Runtime, data and operational constraints

- Preserve cloudflared PID 2322522 and public origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- Image limit 8589934592 bytes; ordinary build quotas 3/account/hour, 12 global/hour.
  No bypass, account switching, imported QA artifacts or cache/data clearing.
- Credentials, .env/provider tokens/raw private receipts stay private. Never print
  tokens, account identities, computeKey, signed URLs or private preview URLs.
  SQLite reads mode=ro and whitelisted fields. Local gcloud identity is wrong;
  do not use. Preserve nine unrelated Google public keys.
- Codespace pods-launch-containers-69rw5vx4xp46c5qw5.
  Latest observed Micronaut saved values Google 16/Codespaces 21; never reset values.
- Prepared build L2AiK3hVAKYytXputQXo0R8rWt6bDhVs, app
  repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4,
  dataKey repo-2caafe8ea7f268fe237b7cab, port 26630.
  Launch origin+/launch/<app>. Image 125123048 bytes,
  IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent asset 609893443/release 402982733 at private
  RizwanAhamed13/pods-launch-artifacts-fresh; preserve it and older permanent assets.
- Node /home/aswin/pods-tools/node-v24.21.0-linux-x64/bin/node;
  gh /home/aswin/pods-tools/bin/gh v2.101.0. Push first, then gh auth token piped
  over ssh to temporary GH_TOKEN and credential helper above; git pull --ff-only.
- QAguest pods-fresh-matrix-01, /snap/lxd/current/bin/lxc, uid/gid 1000,
  Node/opt/node/bin/node and deps/opt/pods/node_modules. Always --disable-stdin for
  lxc exec over SSH. Preserve QA server PID 292107, ports 18090/8081/18890 and caches/data.
- Latest raw inputs /tmp/pods-browser-handoff-*. Validators
  /tmp/pods-record-browser-handoff.py and /tmp/pods-record-browser-handoff-native.py.
  Native receipt embeds whitelisted deployment/pre/post/cleanup audits. Local2197,
  Linux8175, push62870, sync37778, audit25802, native capture95689/audit63631 exited0.
  Baseline fixture68391 and candidate32863 exited0; invalid setup fixtures56844/94866
  also exited0. Do not rerun native receipt validator after a docs-only commit
  without preserving its implementationRevision (it asserts current HEAD).
- Previous raw inputs /tmp/pods-preview-poll-*. Validators
  /tmp/pods-record-preview-poll-{tests,native}.py; capture
  /tmp/pods-capture-native.py (micronaut); audit /tmp/pods-storage-deploy-audit.py.
  Raw Codespaces receipt contains private fields: never publish wholesale.
- Browser unchanged: stackQa6/tab1 stopped Micronaut; echoTab/tab2 stopped warmup;
  mongodbSupport/tab3 support. After compaction cua.rewriteDocumentation first;
  re-markHandoff. Helpers continueSqliteFramework/stopNativeCounter retained.
  Actual product h1'Micronaut + SQLite',#value, button'Add one'; Google count16. Browser helpers
  browserHandoffNativeFirst/Second preserve this gate's raw observation records.
- Local 90371, Linux 72864, probe 9923, deployment 3121 and native 58383 exited 0.
  Provider restoration worker 28967 exited 0 and confirmed Shutdown. No live
  jobs remain. No subagents authorized.
