# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable artifact
→ authorized user compute → real usable product. Latest completed implementation:
500 ms Codespaces preview polling, measured on native ports, 264 local/Linux checks,
protected deployment and two real cached-image product/persistence checks.
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
- 264/264 full local/Linux checks; new stack-codespace-preview-poll-tests.json.
  337 snapshot input hashes verified in /output/preview-poll-candidate-444737a.
  Scope unchanged: 8546 physical source lines = 4054 product/tooling + 3385 tests
  + 933 examples + 174 browser tools. Archived probes excluded.
- Running implementation 42186219240c419032a94f4766e3270d00179ed8, PID1542671.
  Preview helper now 4218621; browser client 29dc9e4; server e189ffd;
  providers/deferred-command b9be575; builder 2553fc8; storage 77cf340.
  Runner SHA be41ee8a471d684705100e8353a1d7cc34ea1e8d89b2575a6e155f1d50eef13d.
- Deployment preserved 59 image files, 135 artifacts and .env; health 200 / SQLite ok.
  Native final audit found zero active builds/launches and same PID/runner.
  Later docs-only sync needs no service restart.

## Latest completed gate

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

- Continue toward first-image/ready-compute 20s using measured bottlenecks; preserve
  privacy/integrity/deadlines, saved data and existing caches. Do not rerun full
  stack matrix without relevant changes. Poll tuning is finished; no need to repeat.
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
  Latest observed Micronaut saved values Google 14/Codespaces 21; never reset values.
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
- Current raw inputs /tmp/pods-preview-poll-*. Validators
  /tmp/pods-record-preview-poll-{tests,native}.py; capture
  /tmp/pods-capture-native.py (micronaut); audit /tmp/pods-storage-deploy-audit.py.
  Raw Codespaces receipt contains private fields: never publish wholesale.
- Browser unchanged: stackQa6/tab1 stopped Micronaut; echoTab/tab2 stopped warmup;
  mongodbSupport/tab3 support. After compaction cua.rewriteDocumentation first;
  re-markHandoff. Helpers continueSqliteFramework/stopNativeCounter retained.
  Actual product h1'Micronaut + SQLite',#value, button'Add one'; Google count 14.
- Local 90371, Linux 72864, probe 9923, deployment 3121 and native 58383 exited 0.
  Provider restoration worker 28967 exited 0 and confirmed Shutdown. No live
  jobs remain. No subagents authorized.
