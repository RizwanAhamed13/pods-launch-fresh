# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable
artifact → authorized user compute → actual usable product. This goal turn made
progress; it is not a blocked turn. No universal compatibility or20s claim.

## Current verified state

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core repo: https://github.com/RizwanAhamed13/pods-launch-fresh.
  Current GitHub API visibility is PUBLIC; do not rely on the older private label.
- New private artifact repository: https://github.com/RizwanAhamed13/pods-launch-artifacts-fresh.
  Draft delivery-probe-20261004/release402982733. Asset609702555 is the original
  experiment image; asset609732872 is the new ordinary developer build image.
  Private visibility and anonymous404 verified; signed URLs/tokens are never saved.
- Public fixture repo: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pinned d6da2ed780aec8ae0178fc181f1d24113c322e15.
- Coverage:55 isolated build/artifact/browser,55 Google native browser,
  55 Codespaces authenticated HTTP/protocol. No representative remains pending
  on these two native paths. Codespaces native browser checks remain unverified.
- Current full suite204/204 local and isolated Linux, including optional private
  image publication, authorized CDN delivery, integrity and fallback checks.
  Evidence stack-image-delivery-tests.json; snapshot326files fully verified.
  Source7540physical lines:3858product/tooling +2585tests +933examples +164browser.
- Latest accepted fixtures Streamlit and Symfony; stack-{streamlit,symfony}-{url,google,codespaces,audit}.json.
  Detailed timings and all earlier acceptance notes are in STACK-VERIFICATION-HISTORY.md.
- Evidence revision6f0f460 pushed and synced to aswin. Public /support DOM verified
  at2026-10-04T11:12:33.556Z:55 isolated,55 Google browser,55 Codespaces protocol;
  all55 applications shown, including passing Streamlit and Symfony rows.
  Publication receipt: stack-wide-support-published.json.
- Latest idle audit2026-10-04T11:44:56UTC: health200, SQLiteok, zero active builds/launches.
  Recorded in stack-image-delivery-native.json. All four new launches stopped.
  Earlier failed attempts remain terminal, not relabeled. Watcher31871 and native
  harness19718 finished successfully; neither is running.

## Fixes and retained failures

- Runtime2cad8f8 sets STREAMLIT_BROWSER_SERVER_ADDRESS to the exact provider preview
  hostname. Actual Streamlit1.65 handshake reproduces403 with rewrittenHost, then101
  for configured origin while unrelated origin remains403; CORS/XSRF enabled.
  Native Google retry renders and saves data. stack-streamlit-origin-{probe,tests,deployment}.json.
- Streamlit first build failed at5GiB image-store capacity. Operator capacity now8GiB;
  default5GiB, quotas and per-app bounds unchanged. No old image/artifact was deleted.
  stack-streamlit-storage-failure.json and stack-image-budget-* retain that work.
- Streamlit second ordinary-quota build l9Yj0TocaLN4eJfZyJBTo80py9PuCS04 succeeded
  in182.021s,182163684image bytes. First Google launch C1jD1h8nZjcnQkeYrRzk7gTqEaSKAtBM
  failed to render with18WebSocketerrors despite health200; saved no value.
  Failure and54.714s uncached delivery are in stack-streamlit-browser-failure.json.
  Successful Google retries were cached: visible10.009/8.191s, healthy7.274/6.347s.
  Google and Codespaces counters now2. Codespaces first/cached healthy90.361/8.900s.
- Symfony build H1m7K4froQMKGlra2eI7Lq_O9fcC435a succeeded in249.658s,
  225348539image bytes. Google first/cached visible58.118/7.549s,
  healthy56.123/6.743s; saved0→1→2 with reload/fullstop/relaunch.
- Symfony first Codespaces run Pkj_d40BgwUQpwjbkofrHHXZ9uV5Gs0- saved0→1 but the
  old SQLite inspection paused the service during production liveness checking.
  Server markedfailed; stop confirmation/repeat aborted. Scoped container was absent.
  stack-symfony-snapshot-failure.json preserves this failed attempt and66.765s
  uncached launch on Available compute (image download41.146s).
- Updated scripts/probe-sqlite-file-runtime.mjs uses read-only SQLite online backup,
  never pauses/copies the running container. Old pause/liveness conflict reproduced
  in real isolated Ktor/Micronaut/Phoenix/Symfony; all four passed online snapshots,
  committed WAL reads, continuous liveness and full restart persistence.
  Native Symfony retries preserve data1→2→3, bothcached; healthy9.450/8.651s,
  both stopped. Preserve Google counter2 and Codespaces counter3; never reset them.
  Production runner/liveness unchanged by the probe fix; no service restart needed.

## Remaining goal work

- Native Codespaces browser authorization is pending the user's existing GitHub2FA
  question. Provider VM-replacement durability and stable production hostname also
  await existing questions. Do not repeat those questions or infer approval.
- First-launch speed is not solved. Prepared image downloads alone frequently
  exceed20s, including ready compute. See stack-native-timings and
  stack-image-delivery-analysis.{json,md,py}; cache hits are separate fields.
  Delivery analysis covers8 first observations across4fixtures,5.514–5.555MB/s;
  it does not isolate the slow network segment or compare providers fairly.
  Streamlit/Symfony successful retries reuse failed first attempts' images. Never
  relabel them uncached or erase failed measurements. The byte-reduction and delivery
  experiments below identify the next gate; do not repeat the completed compression probe.
- This turn completed that size gate: stack-image-recompression.json proves all
  six exact native Micronaut layers alreadygzip; outerlevel9 saves only0.1726%.
  Each candidate decodes to identical tarbytes. No production compression change.
- Private CDN experiment stack-artifact-cdn.json: exact125122726-byte native image,
  SHA07408dbaef08a310f195b938eee2a54f2e2daa7405d7298173759d7a9db2502c,
  uploaded once fromaswin29.576s. AvailableCodespaces download14.985s then0.792s,
  both hash/disk verified; no token sent toCDN. Each fresh temp archive removed.
  Sourcecopy removed fromQA; productionimage/artifacts and Docker caches unchanged.
  Signed URL deliberately not saved; API resolves302 on demand, anonymous404.
  Receipt includes upload, asset identity, input hashes and the two observations.
- Optional private artifact delivery is deployed at runtime54eb690 and204tests pass
  on both hosts. src/image-delivery.mjs publishes validated local bytes to a private
  release, checks remote digest and stores immutable asset IDs; no signed URLs.
  Upload/lookup failure keeps local delivery. Runner opts in to authorized307 and
  validates CDN destination and SHA; no capability/token forwarded. Corrupt or
  failed CDN transfer retries origin once. Old clients retain200local delivery.
- Deployment receipt stack-image-delivery-deployment.json: preserved55images and
  127artifacts; private credentials transferred through stdin, .env mode0600.
  First preflight found a missing remote audit helper and changed nothing; after
  copying the existing helper, idle deployment succeeded. Do not print .env.
- Native acceptance stack-image-delivery-native.json: real browser developer build
  p3n99Eg66l7iemFbb0UaYgTUfaXGlMLt, ordinary quota,247.080s, source d6da2ed.
  New app repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-618da4caadd4,125121394image bytes,
  imageSHAe14ef3717c2560df51b9ceb038a2363642ba436e307ac80e9c3c19dbb8ac8cca.
  Native images differ from prior Micronaut; no caches/data cleared. First launch
  on each provider reports imageCacheHits0,imageCdnDownloads1,fallback0,origin0.
  Google SUSPENDED: total45.924s,after-provider32.549s,image download16.400s,
  CDN15.265s,load6.402s. Cached RUNNING:total10.671s,visible12.004s.
  First Google visible56.620s is an upper observation bound: a gap after the first
  wait plus incorrect selector correction delayed observation/interaction. Product
  DOM exposed #value / Add one; use those exact controls for future Micronaut tests.
  Codespaces Shutdown:total64.944s,after-provider49.537s,image download17.602s,
  CDN16.427s,load5.192s. Cached Available:total11.686s. Both SQLite online
  inspections pass integrity with continuous liveness and private DB ports.
  Both providers retained old count2 across new version and wrote2→3→4, with full
  stop/relaunch. Preserve Micronaut counter4 on both. All four launches stopped.
- Next performance gate: quantify remaining runner/bootstrap overhead and native
  image loading/startup using these phase timings before selecting an optimization.
  First native CDN runs resumed suspended/shutdown compute; a ready-compute new-image
  observation remains unproven. Never delete caches to manufacture one, or relabel
  cached runs as first launches.20s remains unmet; new regions/CDN clients vary.
  Native Codespaces browser/VM-replacement/stable-hostname questions still pending.
- Matrix is explicit tested representatives, not every version/application. Unknown
  secrets/schema/migrations remain developer inputs. Desktop/mobile/GPU/non-web
  programs are not claimed as browser products. Existing public-GitHub scope remains.

## Running service and constraints

- PID1444744, runtime/control54eb690, provider5dde1e5, builder2553fc8, storage77cf340.
  RunnerSHA57d9dd95d47d9a597ba763460c568a270fc4d722a72b073e8b080254c143e54c.
  Preserve cloudflaredPID2322522 and origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- PODS_IMAGE_STORAGE_BYTES=8589934592. Quotas3/account/hour,12global/hour; no bypass,
  account switching to evade limits or isolated QA artifact import into production.
- Before any runtime deploy, run /tmp/pods-storage-deploy-audit.py overSSH and verify
  idle actualPID/cwd/8787listener, SQLite quick_check and health. Do not restart for docs/probes.
- Existing .env/provider credentials stay private. Never print tokens, account
  identities, computeKey or private Google preview URLs. SQLite reads mode=ro, whitelist fields.
  Local gcloud identity is suspended/wrong; do not use it.
- Sync only after confirmedpush: gh auth token piped into ssh aswin, GH_TOKEN fromstdin,
  helper /home/aswin/pods-tools/bin/gh auth git-credential, git pull --ff-only.
- Codespace pods-launch-containers-69rw5vx4xp46c5qw5, privateStreamlit23312/Symfony20841.
  Preserve all native data. QA cleanup affects only explicit isolated test dataKeys.

## Evidence and browser handles

- Browser1: stackQa6/tab1 stopped new Micronaut; echoTab/tab2 stoppedSymfony;
  mongodbSupport/tab3 supportmatrix. Re-markHandoff eachturn. Aftercompaction call
  cua.rewriteDocumentation first. micronautCdnGoogle contains both current browser
  records; micronautCdnLaunchUrl is the new launch link. Older streamlitNative and
  symfonyNative records remain. /tmp/pods-record-cdn-native.py validates this receipt.
- /tmp/pods-record-dashboard-native.py and /tmp/pods-record-sqlite-native.py now
  retain exact failedIDs separately and require four accepted launches plus preserved
  failure, with timestamp/app identity, privateport and saveddata checks.
  /tmp/pods-native-evidence-audit.py validates identities and evidence privacy.
- Machine-readable acceptance stack-coverage.json retains older failedflask-mongodb
  and passing replacementflask-mongodb7. Never count the failed row as a pass.
- QAguest pods-fresh-matrix-01 via /snap/lxd/current/bin/lxc; uid/gid1000,
  Node/opt/node/bin/node, dependencies/opt/pods/node_modules. Candidate
  /output/image-cdn-candidate-13b5fc8;326inputhashes verified.
  All four new preflight containers/volumes/scoped storage and temporary snapshots cleaned.
  Keep unrelatedQAserverPID292107, app18090/proxy8081/host18890, shared caches andruntime.
- Current full logs /tmp/pods-cdn-full-local.txt and /tmp/pods-cdn-full-qa.txt,
  both204passed. Runtime source hashes rechecked against passing suite during
  native receipt audit. This gate changed only docs/evidence after deployment.
