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
  Draft delivery-probe-20261004/release402982733, asset609702555 contains only the
  unchanged prepared Micronaut image. Private visibility and anonymous404 verified.
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
- Latest idle audit2026-10-04T11:22:59UTC: health200, SQLiteok, zero active builds/launches.
  Recorded in stack-artifact-cdn.json; running PID and runner hash unchanged.
  All accepted launches stopped. Earlier failed attempts remain terminal, not relabeled.
  No build/launch watcher or test harness is currently running.

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
- Optional private artifact delivery is implemented and204tests pass on both hosts.
  src/image-delivery.mjs publishes only validated local bytes to a private release,
  checks remote digest and stores immutable asset IDs; never persists signedURLs.
  Builds remain launchable if upload fails. Runner opts in to authorized307 and
  strictly validates the CDN destination; no capability/token forwarded. Integrity
  or transport failure retries local delivery once; bad bytes never reachDocker.
  Old clients retain200localdelivery. Production deployment/native test pending.
- Next concrete gate: deploy optional private artifact delivery into preparation
  and launch, authorize atPODS before obtaining a short-lived signed URL, never send
  server credentials tocompute, strictly validate destination and image integrity,
  retain aswin delivery on lookup/missingasset failure. GitHub documents both200
  streaming and302 responses, so handle those without assuming every asset redirects.
  Then use a new ordinary developer build for an uncached-image native launch;
  do not delete existing user image caches to manufacture a timing result.
  No production CDN integration or launch-speed claim exists yet. New clients/regions
  cannot be assumed to reproduce the second CDN timing. Current20s target remains open.
- Matrix is explicit tested representatives, not every version/application. Unknown
  secrets/schema/migrations remain developer inputs. Desktop/mobile/GPU/non-web
  programs are not claimed as browser products. Existing public-GitHub scope remains.

## Running service and constraints

- PID1390769, runtime/control2cad8f8, provider5dde1e5, builder2553fc8, storage77cf340.
  RunnerSHAa8140865a8d18aa4f36c6194bc011507508af34b9ad26cc40c78ccdafbe5925d.
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

- Browser1: stackQa6/tab1 Symfony prepareddeveloperform; echoTab/tab2 stoppedSymfony;
  mongodbSupport/tab3 supportmatrix. Re-markHandoff eachturn. Aftercompaction call
  cua.rewriteDocumentation first. streamlitNative and symfonyNative retainactualrecords.
- /tmp/pods-record-dashboard-native.py and /tmp/pods-record-sqlite-native.py now
  retain exact failedIDs separately and require four accepted launches plus preserved
  failure, with timestamp/app identity, privateport and saveddata checks.
  /tmp/pods-native-evidence-audit.py validates identities and evidence privacy.
- Machine-readable acceptance stack-coverage.json retains older failedflask-mongodb
  and passing replacementflask-mongodb7. Never count the failed row as a pass.
- QAguest pods-fresh-matrix-01 via /snap/lxd/current/bin/lxc; uid/gid1000,
  Node/opt/node/bin/node, dependencies/opt/pods/node_modules. Candidate
  /output/sqlite-online-candidate-2cad8f8;323inputhashes verified.
  All four new preflight containers/volumes/scoped storage and temporary snapshots cleaned.
  Keep unrelatedQAserverPID292107, app18090/proxy8081/host18890, shared caches andruntime.
- Full logs /tmp/pods-sqlite-online-full-local-final.txt and /tmp/pods-sqlite-online-full-qa.txt.
  Earlier full local snapshot-file expectation failed, then actual WAL/SHM metadata
  and bounded expectations were corrected. Both final suites193passed.
