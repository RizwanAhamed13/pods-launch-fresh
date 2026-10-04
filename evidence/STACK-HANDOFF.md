# Broad stack checkpoint

Further development stopped at the user's request. Commit/push current intended
source, tests, docs and evidence to main; no additional refactoring, optimization
or test gates. The original end-to-end goal is incomplete.

Latest completed work: production registry preparation and native Cloud Shell
Flask+MariaDB acceptance. Cached click-to-product17.425s, saved write17.708s;
counter4→5→6 survives reload and stop/relaunch. First authorization-resumed launch
request-to-health50.476s; initial compute/cache state not independently inspected,
so no controlled cold/image-absent or continuous first product timing claim.
Both launches used two registry pulls with zero fallbacks. All353 checks passed
locally/Linux before this documentation-only publication. Scope9912 physical lines.
Coverage remains55 representative apps/seven DB families, not universal support.

## Production/native checkpoint

- Source/runtimeab5a063c3dca9f8487fad94f1b522a0aff5b85a7 before final evidence
  commit. Registry enabled at17:34:57UTC, servicePID1649154, runnerSHA
  cfb3d769f330a9bd010132cfd50fe342167d930736d73df8ab644caa912b191e.
  No product code changed after that runtime. Live source may include the later
  evidence-only commit without a service restart.
- stack-registry-production.json: recovered partial Flask indexing, added MariaDB
  15blobs109926562bytes; total25raw blobs/35delivery mappings. Publication47.278s,
  repeat14.046s, zero added bytes on repeat, identical assets. Original59archives,
  135artifactfiles and unrelated mappings/records preserved. Only registry flag
  changed on enablement; other env values and file mode0600 preserved.
- stack-registry-native-google.json: actual automatically opened product, browser
  writes/reloads, private MariaDB SQL check saved5, healthy db with no host port,
  persistent home volume. Before repeat, computeRUNNING/both Docker images present,
  manifest cached/outer archives absent; inspected without changing cache.
- First request-to-health50.476s/provider-ready-to-health37.836s/images26.832s.
  Cached health16.381s/provider-ready13.893s/images5.927s; browser17.425s/write17.708s.
  imageRegistryMs is the sum of overlapping per-image pulls, not wall-clock time.
- Both previews stopped, saved value6 retained. Health/SQLite/listener audit at
 17:39:22UTC:zero active builds/launches, same PID and served runner. Final Google
  key audit17:40:25UTC:RUNNING,9existing keys. Temporary inspection keys removed.
  First key-audit invocation referenced an absent remote file; corrected stdin
  invocation passed, without provider mutation.
- Pending if the user later resumes: actually absent-image ready-compute timing,
  broader20-second target, native Codespaces browser2FA, stable hostname and
  separately authorized Cloud Shell VM-replacement persistence. Do not repeat
  existing permission questions or clear user caches/data to force a cache miss.

## Previous platform compatibility gate

- stack-registry-platform-tests.json and stack-registry-platform-qa.json bind
  source hashes,347-file candidate, exact programs and retained failure receipts.
  Final QA snapshot /output/registry-platform-v3-candidate-7b27f28 and engine
  store /output/registry-platform-v3-probe-7b27f28. Preserve both and prior stores.
- Original MariaDB archivef078.../index129284... retains8 platform/attestation
  descriptors but only amd64 and its attestation bytes. Old indexer required all
  platforms. First fix excluded attestations and Docker failed fetching4a86...404.
  Final closure15blobs109926562bytes includes the selected matching attestation.
  Original index remains byte identical; other architectures remain unauthorized.
- Synthetic tests include legacy/OCI artifact attestations, required byte and size
  checks, invalid subjects/platforms/references, nested indexes and ambiguity.
  A fixture alias error was corrected; both initial failed353-check runs retained.
- All3 owned QA processes stopped, no containers, temporary login removed,
  ordinary QA images preserved. No DB data or user cache touched.
- Runtime7b27f28 deployed at17:16:05UTC, PID1635758, runnerSHA
  cfb3d769f330a9bd010132cfd50fe342167d930736d73df8ab644caa912b191e.
  At that checkpoint the registry flag remained disabled.59images and
  135artifactfiles/.env preserved by deployment. Audit17:30:05 health200/SQLiteok,
  zero active builds/launches and same runner/PID.
- First production index attempt failed after Flask success:10verified Flask
  blobs/index retained, delivery mappings10→20, MariaDB index absent. Existing
  Flask private assets reused. Original archives/artifacts preserved. Exact
  failed operator/receipt in probes/registry-production-initial*.
- Production recovery and native acceptance subsequently passed; see the current
  checkpoint above. Actually absent images remain a separate unproven timing gate.
- Pending native Codespaces browser2FA, stable hostname and separately authorized
  Cloud Shell VM-replacement persistence remain unchanged. Do not repeat requests.

## Previous private CDN gate

- stack-registry-cdn-qa.json and probes/REGISTRY-CDN.md bind all three exact
  programs/receipts. Source0791fe6; same verified candidate347 files. CLI help and
  env example comment corrected; prior328 suite not rerun because runtime unchanged.
- Original Flask archive41d7.../imageb665...:10 raw blobs57400283bytes published
  to the configured existing private release. Asset inventory11→21; previous11
  preserved. Publication23645ms, repeat5686ms, zero extra blobs and same mappings.
  Scratch data only: /tmp/pods-registry-cdn-0791fe6/data. No production index or
  mapping additions. Preserve all private assets and scratch evidence.
- Direct CDN pull: initially empty physical store,9redirects,26078ms image work,
  exact ID/eight rootfs layers and Flask3.1.1/PyMySQL1.1.2 execution passed.
- Final shared-base probe: /output/registry-cdn-shared-v3-0791fe6. Empty store
  first, then verified FastAPI base imported; Flask absent. Five response hashes
  matched11178157bytes; four shared blobs46220071bytes not requested. Registry8741ms,
  total images8742ms; no archive fallback; same identity/dependency checks passed.
  All five actual CDN GETs omitted Authorization/Cookie/Proxy-Authorization;
  upstream TLS verified. Not native/product timing or a controlled A/B comparison.
- Failed inspection modes retained: first45017ms registry/51375ms total;
  shared-v2 registry45021ms/50628ms total. Both forced original57046835-byte
  archive fallback; dependency assertion not reached. One bounded CDN address
  check timed out; slow diagnostic relay connection may explain the stalls.
  Only relay connect timeout changed45s→2s, read45s; product deadline stays45s.
- Eight owned QA engine processes, three QA aswin servers and all owned LXD
  loopback proxies stopped/removed. Launch credentials/private CA keys removed,
  global trust unchanged, ordinary QA images/devices preserved. Keep all stores.
- Production audit17:10:13UTC: same PID1589423/served runner hash, health200,
  SQLiteok, zero active builds/launches. Inventory17:10:33UTC:59images/6120802464bytes,
  135artifactfiles/10deliverymappings, no registry directory. No service restart.
- Next: deploy shared writer lock to all writers before production indexing, then
  controlled native Google registry product/DB acceptance with actually absent
  images on ready compute. No additional stack/provider coverage in this gate.

## Previous integrated registry gate

- stack-registry-launch-tests.json:328/328 local26.721s/Linux72.373s. Exact347-file
  candidate /output/registry-launch-candidate-adc78ff. First Linux invocation
  exited127 from SSH quoting before tests; corrected argv ran the unchanged snapshot.
- stack-registry-launch-qa.json and probes/registry-launch-qa.py: exact executed
  program, four distinct physical Docker/containerd stores in
  /output/registry-launch-probe-v2-adc78ff. Initial stores were empty. Cold fetched
  57,398,228 blob bytes, cached repeat zero. Partial-image case first imported the
  original thin diagnostic (load0/inspect ID visible/execution125), then forced
  full57,046,835-byte reload after denied registry and passed dependency execution.
  Corrupt manifest also recovered through exactly one full archive. Cancelled
  stalled blob did not fallback. All nine owned processes stopped; no containers,
  temporary credentials removed, normal QA images preserved. Keep stores/inputs.
- Initial probe v1 failed because QA adapter added a duplicate --host; Docker
  rejected it. Corrected only QA adapter with an owned socket shim; product code
  unchanged. Failure receipt/hash retained. These are not native timing claims.
- src/image-pull.mjs derives destination from artifact origin and uses0700/0600
  private ephemeral Docker config. Always pulls selected images by exact digest;
  cached identity cannot bypass completeness. Pull failure/mismatched ID forces
  full verified archive load.45s bound; two image workers; shared cancellation;
  full loads serialized. Credentials removed only after CLI close.
- BuildManager optionally indexes/publishes after verified artifact publication;
  unsupported formats keep the ready full-archive path. Server selects only valid
  matching indexes when registry flag enabled. Artifact/link unchanged.
- Runner startup heartbeat now handles Stop during artifact/image delivery;
  process signals cancel startup as well. Docker command supports AbortSignal.
  Generic command timeout waits for child close before releasing writer locks.
  SIGKILL may leave bounded staging files; do not infer automatic crash recovery.
- The subsequent CDN gate above verifies publication/redirect credential behavior.
  Next is controlled rollout and native Google product/DB acceptance with
  genuinely absent images, separate cached/cold measurements. Do not index live
  storage until shared writer lock is deployed to all writers. No production
  registry files/assets/config changes or service restart in this gate.

## Current verified state

- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin
  /home/aswin/pods-launch-fresh. Core github.com/RizwanAhamed13/pods-launch-fresh.
  Fixture repo pods-launch-runtime-fresh, general pin
  d6da2ed780aec8ae0178fc181f1d24113c322e15; React combined app uses5f376f60ed9c.
- 55 representative apps passed isolated build/artifact/browser,55 native Google
  browser and55 Codespaces HTTP/protocol paths. Seven DB/service families.
  Native Codespaces browser sign-in/interaction remains unverified. See SUPPORT.md;
  not every framework version, arbitrary repository or non-web product is covered.
- Current tests: stack-registry-platform-tests.json,353/353 local and Linux.
  Previous foundation fixture failures remain in stack-registry-foundation-tests.json.
- Historical deployed tests stack-image-pipeline-tests.json:292/292 local26.503s/Linux64.895s.
  Final candidate /output/image-pipeline-final-candidate-55737b2,343 verified inputs.
  Four selected regressions fail unchanged55737b2 baseline. Initial focused failure
  identified stalled web-stream cancellation; Readable.fromWeb fixes direct and
  range bodies. Empty HTTP200 response now fails before staging-file creation.
- Scope9912 physical source lines =4668 product/tooling +4133 tests +933 examples
  +178 browser tools. Exact scope in code-lines.json; archived probes excluded.
- stack-image-pipeline-comparison.json: ABBA,3images226330909bytes, aggregate20MiB/s
  loopback HTTP, real Docker29.1.3 loads, equally warmed Docker content, synthetic
  image-cache misses. Candidate peak2requests/1load. Not CDN/native/product timing.
  Prepared archives and existing Docker cache preserved; owned trial folders removed.
- Previous runtimef87b2e0effd2fd68a1143f46bf174deba17a7492, serverPID1589423,
  runnerSHA999300822c203590074dc327387c01938409b49562b41052f2381d0edf8902f0.
  Deployment preserved59images/135artifactfiles/.env. Post-native audit16:02:35UTC:
  health200/SQLiteok/zero active. Baseline55737b2 retained in test/benchmark evidence.
- 59 distinct prepared archives;10 original full-archive delivery mappings plus
  25 raw-blob mappings after completed production indexing.49 archives unmapped.

## Previous OCI registry foundation

- src/image-registry.mjs; scripts/index-image.py and prepare-image-registry.mjs;
  test/image-registry.test.mjs. Existing image-delivery publisher can publish raw
  registry blobs from the verified registry directory. BuildManager publication
  uses the shared writer lock and includes registry/staging bytes in its budget.
- Optional server PODS_IMAGE_REGISTRY_ENABLED flag defaults off. GET/HEAD /v2/
  uses launch Basic credentials. Repository paths encode the exact launch ID in
  lowercase hex and its original image archive SHA; only the index's reachable
  manifests/blobs are accessible. Private redirects recheck revocation; manifests
  are hash verified, HEAD is local, bounded blob ranges supported. No upload API.
- Python tarfile header subclass rejects extensions/links/sparse metadata before
  payload processing; only digest-named regular blobs are written. Input archive,
  all blob hashes and descriptor closure verify, index committed last. Existing
  artifacts unchanged. Budget and exclusive writer lock cover partial work; no
  automatic stale-lock removal. Production indexing must wait for this lock to
  be deployed to all build processes. No production indexing has occurred.
- stack-registry-pull-qa.json: candidate/output/registry-candidate-1e2dc51;
  probe/output/registry-probe-v3-1e2dc51. Exact final probe archived. Separate
  physical containerd roots were empty before use; warm case then imported the
  existing FastAPI archive. Real PODS server/launch auth served Flask imageb665...
  (archive41d7...). Indexing965ms;10blobs57400283bytes. No CDN in real Docker check.
- Cold:9blobGETs57398228bytes,pull7592ms. Shared base:5blobGETs11178157bytes,
  pull3614ms; all4commonblobGETs absent. Cached repeat:0blobGETs,pull1095ms.
  Exact image ID/eight rootfs IDs and Flask3.1.1/PyMySQL1.1.2 execution passed in
  both stores. No appserver/DB started; timings are not native or product latency.
- Initial probe and its first retry failed before pulls because the demoted QA
  Node process inherited/root (0700), causing esbuild spawnEACCES. The first retry
  mistakenly changed source-copy permissions; actual correction was explicit cwd.
  Failures retained. All5final daemons stopped, noownedprobeprocessesremain;
  originalQAimages preserved and temporaryDockerclientcredentials removed.
- This foundation gate is superseded by the integrated runner evidence above.

## Latest layer-reuse diagnostic

- stack-layer-reuse-diagnostic.json, stack-layer-archive-metadata.json and
  evidence/probes/LAYER-REUSE.md. No production/test/fixture code changes.
- Flask41d7ce5a... and FastAPI3f34e12c... share4 compressed blobs46220071bytes.
  Flask fullarchive57046835bytes; generatedthin11121120bytes,80.505% smaller.
  MariaDBf078164d... shares no compressed blobs with FastAPI.
- QA Docker29.1.3/containerd: Flask target initially absent, loaded existing
  FastAPI archive then thinFlask. Exact targetb665a14d.../8rootfs IDs and runtime
  Flask3.1.1/PyMySQL1.1.2 passed. No appserver or DB started. QA now caches both
  images; do not clear caches or rerun this as an absent-image case.
- First cold attempt connected systemcontainerd despite privateDockerdata-root;
  empty-image assertion stopped before import. Second attempt used a physically
  empty separatecontainerd and exposed loadexit0/inspectIDsuccess despite missing
  blobs. Third attempt in newcold-v3 verified executionexit125, fullarchivefallback
  loadsuccess and exactidentity/rootfs/dependency execution. Both private daemons
  stopped,0owneddaemonsleft,ordinaryQAhealthy/existingimages+containerspreserved.
- Paths: aswin/tmp/pods-layer-reuse-b75e0fb; QA/output/layer-reuse-b75e0fb with
  retainedcold/cold-v2/cold-v3. Reproducers are one-shot; choose fresh owned paths
  for new experiments, preserve current caches/data. No production/user imports.
- Native read-only16:08:53UTC: Docker29.8.1/containerd; cachedFastAPI9846cdb8...
  and7rootfs IDs match. All9existingSSHkeys preserved,ownedkeysremoved. This proves
  no native thin-load compatibility or product timing. Local import durations are
  not a controlled comparison and not launch latency.
- Verified343 unchanged prior snapshot inputs;292 local/Linux checks remain valid.
  Audit16:16:52UTC:PID1589423/runnerSHAunchanged,health200/SQLiteok/zeroactive.
- Next gate: bounded authenticated missing-layer transport design and QA, with
  completeness validation that catches successful partial imports, advisory cache
  claims, full-archive fallback, integrity/abort/storage checks. Compare transfer
  and actual runtime before native delivery. Avoid unbounded variant generation;
  no20s speed claim until actual native product acceptance. Goal remains active.

## Latest native first-image gate

- stack-pipeline-mariadb-operator.json: original build1pmZzhTBO07D4txVxTeO_vbt9rtjdS6O,
  apprepo-46d8ac316f3e95857ce28b48-d6da2ed780ae-04f62fea5403, sourcepin d6da2ed780ae.
  Artifact04f62fea5403e11a5262471ed1fe76b0f279775263de7a047c1e3f550f445cf7 unchanged.
  Web57046835bytes/DB104507545bytes; archiveSHAs41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a
  andf078164d28ddf31c6ea97c0356b9eba598645ee7b47f02329b1e304bbea85d4f.
  Dry-run670ms/publish36289ms/repeat2716ms. Same assets610136464/610136765 reused.
  Mappings8→10, non-delivery records/builds/artifacts/config/runtime preserved.
- stack-pipeline-mariadb-native.json: prior read-only Cloud Shell proof established
  both image IDs and persistent/fallback archives absent, manifest cached. No
  application started or data/cache cleared during preflight.
- KtZLiMkikNECmu1FDGhT2yzey_DiW1E4: RUNNING, image/archive hits0, both CDN ranges
  passed/no fallback. images16450ms wall; summeddownload18205/load7534ms overlap.
  health29181/product30229/write30947ms, continuously measured. Counter2→3/reload3.
- ZkHEWCtSkpKCxVwchg99Xv581n76VlMD: RUNNING, imagehits2/no download;
  health11982/product12607/write13005ms, counter3→4/reload4. Both fully stopped.
- Direct native inspection after first write verifiedMariaDB11.4.13-MariaDB-ubu2404,
  record3, healthy privateDB, onlyproductport23877, namedvolume backed by persistent
  Cloud Shell home. Exact read-only payloads archived under evidence/probes/pipeline-mariadb-*.
  Both preflight and runtime inspection removed owned temporary keys and preserved
  all9 existing Google keys. Source9012/checks292 unchanged and hashes verified.
- Initial computeRUNNING; existing Docker layers/data/manifest retained, CDN warmth
  unknown. Not cold-machine evidence. Historical72.528s health used origin plus
  concurrent provider load, so no controlled native improvement percentage claimed.

## Latest deployed pipeline acceptance

- stack-image-pipeline-deployment.json and stack-image-pipeline-native.json.
- Google connection expired at its normal one-hour boundary. Reconnect through
  existing Google OAuth refreshed the same grant and automatically resumed launch.
  No manual credential entry or scope change; initial selector wait retained as
  token-expiry discovery, not a launcher regression. First click-to-product timing
  across reconnect was not measured.
- IpLp-1W5jd_YChSsJICIS3KxA8DFYXy7: RUNNING,3 cached images, health9702ms,
  PostgreSQL3→4/reload4/full stop. No image download/load.
- -KmEdKtt6NV9CLSRFCyuSDifhSUkAwat: RUNNING,3 cached images, health9206ms,
  continuous product9852ms/write10148ms, PostgreSQL4→5/reload5/full stop.
- New runtime is functionally verified on native Google with cached multi-service
  app; uncached native transfer overlap and20s first-image acceptance remain pending.
  No database boundary reinspection here; previous exact runtime evidence retained.

## Latest completed multi-service gate

- stack-multiservice-migration-operator.json: original React + Express + PostgreSQL
  buildauCrc3RBfSqCcIZz_83YwGOLRLwc6fZL, app
  repo-12b64d343d1a4578791b29c6-5f376f60ed9c-2d9d982df706.
  Source pin5f376f60ed9cf16a0ef47a2a9b251b5846b3df0f; do not rewrite it to the
  later fixture pin. Original artifact and link preserved, no new build.
  Three images226330909bytes: web26010276/api83776525/db116544108.
  Dry-run1077ms, publish51817ms, repeat3549ms; permanent assets610087307,
  610087487,610087990 respectively. All3 assets reused. Mappings5→8, artifact
  files/build records/configuration/runtime PID unchanged. No restart or quota
  override. The DB archive also appears in another prepared app; its shared
  mapping now applies there, but that application was not relaunched in this gate.
- stack-multiservice-migration-native.json: both Google launches initially RUNNING,
  manifest cache hit, normal browser flow, no cache removal/artifact import.
  L8UbFQHUpbznrAlZbm3DnKRBBUt6nxRp: image/archive cache hits0; all3 CDN downloads
  succeeded, two range downloads, no fallback. images37624ms = download23523ms
  +load13955ms (plus checks), health48805ms. Product observed52609ms/write52899ms
  are upper-bound availability observations including a6514ms gap between bounded
  browser calls. Not continuous first-image product timing;20s clearly unmet.
  nQPJyVdoVlkU0L4HMiwMT2lrrUCJdRdr: image cache hits3, downloads0, health9433ms;
  continuous product9938ms/write10339ms. PostgreSQL1→2→3, reload and full stop
  passed on both. All previews stopped, original layers/manifest/data preserved.
- Live runtime inspection: exactly web/api/db running, API and DB healthy with
  no published ports. DB volume uses home-backed persistent storage. Only web is
  published on0.0.0.0:21747, matching runtimeCompose; do not claim loopback-only.
  Four diagnostic failures retained: first2 opaque, third established node absent
  from SSH PATH(exit127), fourth exposed a wrong loopback-only assertion in the
  inspector. Final check used the launcher's Node/NVM discovery and actual web
  port contract; production code unchanged. All temporary keys removed on every
  attempt, all9 pre-existing Google keys preserved.
- Fresh read-only inventory:59 unique prepared images,8 mappings,51 unmapped,
  5339086704bytes remaining. Images, not framework counts. Scope/source count
  unchanged;284/284 tested source hashes still match, so no full-suite rerun.

## Previous single-image migration gate

- src/image-migration.mjs and scripts/migrate-image-delivery.mjs accept one explicit
  app id. Default offline dry-run validates manifest identity, decoded artifact,
  declared image metadata and every local image hash before any remote publish.
  Non-regular/symlink inputs and conflicting archive identities are rejected.
  --publish requires the existing control-plane store, existing private delivery
  configuration and verified asset reuse. It publishes serially and can resume
  after partial failure. Fixed CLI errors exclude provider URLs/secrets. No builds,
  immutable rewrites, user steps, quota changes or cache clearing.
- stack-image-migration-operator.json: existing FastAPI build
  rUpOx4l-ZVEXuG72K8SUu_8fBYiRPcFT, app
  repo-46dbc56878c4f438c7ed70d3-d6da2ed780ae-309b54492909.
  Same artifact309b5449290922b771804b4f1e98a0cabc5d456c01ab098ed74653defbfcf03f.
  Image54898173bytes/archiveSHA
  3f34e12c187fe7d2bdd50bb5910b72381a3b5d4d7c83633fa680fedea91d2032.
  Dry-run336ms, publish12954ms, repeat1342ms; same permanent asset610078596.
  Mappings4→5; all non-delivery records, build count, image inventory, artifact
  file hashes, configuration and runtime PID preserved. No service restart.
- stack-image-migration-native.json: ordinary native Google browser launches using
  the unchanged app link, both RUNNING and manifest cache hit.
  5QmfGaCkS34a2h9Ny69v1jDS3_jz5EQO: image/archive cache hits0, CDN download1,
  four-range success/no fallback, download4338ms (CDN3189), Docker load4026ms,
  health15539ms, continuous product17309ms/write17939ms. SQLite2→3.
  LQok1VrGMwWqhbRQm2MHZl54PeHCbGHL: image cache hit1, download0,
  health5461ms/product5946ms/write6389ms. SQLite3→4.
  Both reload/full stop passed; all launches stopped. Existing Docker layers,
  manifest cache and data preserved, CDN cache warmth unknown. Not cold compute
  or universal20s evidence. Codespaces not retested in this gate.
- Inventory at that checkpoint:59 unique prepared images/5 mappings/54 unmapped images totaling
  5565417613bytes. Image counts, not framework counts. Only FastAPI was migrated;
  don't silently publish the rest in one operation.

## Previous first-image gate

- stack-ready-first-image.json records four ordinary Google browser launches with
  exact server phases and continuous click-to-product/write timing. All initially
  RUNNING, manifest cache hit, no cache clearing/build/import/restart. Both first
  launches had imageCacheHits0/imageArchiveCacheHits0; both relaunches hit the image.
- Ktor DCzRIxHPugRmWLoZf_h00FN6rWJAHcsA: origin25271ms, imageLoad3309ms,
  health36275ms/product36943ms/write37799ms. No CDN mapping/attempt/fallback.
  ZIeRwHoNk3KaD6PkkOm9qOsuiQAfbAKv cached: health7029/product7585/write8473ms.
  SQLite2→3→4 retained across reloads/full stops.
- Micronaut MIF3CdKPAp8VPNQ_pMDjw-7-sxyGcbtz: imageDownload7682ms (CDN6558ms),
  imageLoad2894ms, health20875/product21632/write22556ms. Successful eight-range
  download, no fallback. Cached uyciy2OZycLJ-nXUkG4sdM3PywuY76rL:
  health9056/product9516/write10375ms. SQLite18→19→20 retained across full stops.
  Used existing buildUgVTF4smV7Ve6LSORWKFB-hcO4HoO-5D, app suffixeadd466d0702,
  permanent asset609862985; same source pin/data identity as latest Micronaut.
  It is now cached too. Not a cold-CDN or empty-machine benchmark.
- Read-only inventory:59 unique images referenced by ready builds,4 delivery
  mappings,55 unmapped images/5620315786bytes. These are images, not55 frameworks.
  This is the historical inventory before the new FastAPI migration.
- No speculative startup overlap: persistentVolumes may need loaded service
  images for migration helper containers. No native CDN failure reproduced.

## Previous diagnostics gate

- imageCdnLastFailure records only a fixed reason (http, range-metadata, size,
  integrity, timeout, storage, transfer) and optional valid HTTP100..599 status.
  Preserve first range failure before peer cancellation can hide it; serial
  timeout/storage errors classified too. Server drops arbitrary fields/statuses.
  Never stores upstream messages, URLs, headers, bodies or credentials. Existing
  range parallelism,30s deadline, hash/size checks, Docker identity and single
  origin fallback unchanged. This is observability, not a latency fix.
- stack-cdn-fallback-diagnostic.json: historical launchqM8sRUCKYU8_tJfr5ZcnpzSD6ezNaQec
  resumed SUSPENDED compute, no cached image; CDN failed3515ms then origin transfer,
  download27421ms and health54875ms. Original cause remains unknown.
  Current redirect/headers passed. Exact baseline eight-range code subsequently
  verified125123048bytes on RUNNING Cloud Shell in5532ms. Same asset/warm CDN HIT;
  not a cold transfer or full application launch. No Docker load/appdata write.
  Owned temp files/key removed, all nine pre-existing keys preserved.
  First diagnostic exited1 without valid receipt; retained as invalid, cause unknown.
- stack-cdn-fallback-deployment.json and stack-cdn-fallback-native.json:
  existing Micronaut+SQLite artifact, no build/import/cache clearing. Both Google
  native browser launches started RUNNING with imageCacheHits1, no download/fallback.
  NdecKTLSPbZCmOPQ2_MggqC4x0a9LDuC: health10079ms, product11636ms, write12370ms,
  saved16→17, reload/full stop passed.
  Vvau9brLqUn6b16WbVDqGSI87NCuU9N3: health9669ms, product10050ms, write10859ms,
  saved17→18, reload/full stop passed. Continuous launch-action timing.
  No native fallback occurred; controlled regressions establish diagnostic behavior.
  Codespaces not retested in this gate.

## Next bounded gate and pending inputs

- Next: controlled deployment and native Google product/database acceptance.
  Private CDN publication, redirect credentials and registry integration/recovery
  are verified in isolated Docker. Deploy the shared storage lock to all writers
  before indexing production. Do not repeat cached
  Flask+MariaDB as if its images were absent. Preserve artifacts/cache/data; no
  public image exposure or static provider credentials on user compute.
- Broader CDN migration remains49 images/5.178GB; do not mass-upload them as a
  substitute for improving the measured first-image path.
- Code graph refreshed for current checkout as pods-launch-current (fast index).
  Earlier pods-launch-fresh graph is stale.
- Operator migration/idempotency and native FastAPI/full-stack persistence gates
  are complete. Do not rerun the55-app matrix or completed292 checks absent source
  changes or a new failure. Do not mass-upload the remaining5.339GB as a substitute
  for improving measured launch behavior.
- Existing unmet observations: Google first-image health19377ms, product20667ms;
  Codespaces first-image health28725ms (stack-eight-ranges-native.json). The later
  suspended/uncached Google fallback took54875ms. No universal20s guarantee.
- Browser polling250ms during startup is deployed and validated; provisioning/
  build/stop1000ms and failurebackoff unchanged. Codespaces preview poll500ms is
  deployed with private visibility gate. Both tuning gates are finished; do not
  repeat them or the full stack matrix without a concrete new reason.
- Pending user inputs: GitHub native-browser2FA, stable production hostname,
  destructive Cloud Shell VM-replacement durability test. Do not repeat questions
  or infer approval. Native Codespaces browser work is required for completion.
- Prior detailed checkpoint: f1412a4:evidence/STACK-HANDOFF.md. Retain previous
  failures and exact scopes in stack-browser-handoff-*, stack-codespace-preview-*,
  stack-eight-ranges-* and STACK-VERIFICATION-HISTORY.md.

## Runtime, data and operational constraints

- Preserve cloudflared PID2322522 and public origin
  https://collection-conferences-ages-clearly.trycloudflare.com.
- Image limit8589934592bytes; ordinary build quotas3/account/hour,12global/hour.
  No bypass, account switching, imported QA artifacts or cache/data clearing.
- Credentials,.env/provider tokens/raw private receipts stay private. Never print
  tokens, account identities, computeKey, signed URLs or private preview URLs.
  SQLite reads mode=ro and whitelisted fields. Local gcloud identity is wrong;
  do not use. Preserve nine unrelated Google public keys.
- Codespace pods-launch-containers-69rw5vx4xp46c5qw5 last observed Shutdown at
  2026-10-04T14:29:20.206Z. Check fresh state before using it.
  Latest Micronaut values Google20/Codespaces21; Ktor Google4; FastAPI Google4;
  React/Express/PostgreSQL Google5; Flask/MariaDB Google4.
  Never reset values.
- Prepared buildL2AiK3hVAKYytXputQXo0R8rWt6bDhVs, app
  repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4,
  dataKeyrepo-2caafe8ea7f268fe237b7cab, port26630.
  Image125123048bytes,
  IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent asset609893443/release402982733 in private
  RizwanAhamed13/pods-launch-artifacts-fresh; preserve all permanent assets.
