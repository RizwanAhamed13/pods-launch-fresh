# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable artifact
→ authorized user compute → real usable product. Latest implementation gate:
bounded image preparation with two image slots, serialized verified Docker loads,
shared cancellation, owned partial-file cleanup and preservation of first failure.
292/292 checks pass locally and in isolated Linux. Controlled image preparation
averaged21.570s before/16.043s after (25.6% reduction). Protected deployment and native cached Google product acceptance passed.
No new universal or native first-image latency claim.

## Current verified state

- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2; aswin
  /home/aswin/pods-launch-fresh. Core github.com/RizwanAhamed13/pods-launch-fresh.
  Fixture repo pods-launch-runtime-fresh, general pin
  d6da2ed780aec8ae0178fc181f1d24113c322e15; React combined app uses5f376f60ed9c.
- 55 representative apps passed isolated build/artifact/browser,55 native Google
  browser and55 Codespaces HTTP/protocol paths. Seven DB/service families.
  Native Codespaces browser sign-in/interaction remains unverified. See SUPPORT.md;
  not every framework version, arbitrary repository or non-web product is covered.
- Tests stack-image-pipeline-tests.json:292/292 local26.503s/Linux64.895s.
  Final candidate /output/image-pipeline-final-candidate-55737b2,343 verified inputs.
  Four selected regressions fail unchanged55737b2 baseline. Initial focused failure
  identified stalled web-stream cancellation; Readable.fromWeb fixes direct and
  range bodies. Empty HTTP200 response now fails before staging-file creation.
- Scope9012 physical source lines =4183 product/tooling +3718 tests +933 examples
  +178 browser tools. Exact scope in code-lines.json; archived probes excluded.
- stack-image-pipeline-comparison.json: ABBA,3images226330909bytes, aggregate20MiB/s
  loopback HTTP, real Docker29.1.3 loads, equally warmed Docker content, synthetic
  image-cache misses. Candidate peak2requests/1load. Not CDN/native/product timing.
  Prepared archives and existing Docker cache preserved; owned trial folders removed.
- Deployed runtimef87b2e0effd2fd68a1143f46bf174deba17a7492, serverPID1589423,
  runnerSHA999300822c203590074dc327387c01938409b49562b41052f2381d0edf8902f0.
  Deployment preserved59images/135artifactfiles/.env. Post-native audit15:55:15UTC:
  health200/SQLiteok/zero active. Baseline55737b2 retained in test/benchmark evidence.
- 59 distinct prepared images,8 mappings,51 unmapped totaling5339086704bytes.

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

- Next: select an existing multi-image app whose images are actually absent for
  ordinary native first-image acceptance of the deployed pipeline; do not clear
  caches. Flask + MariaDB/MySQL is a candidate, subject to live cache-state proof.
  Broader CDN migration is still51 images, one explicit app selection per gate.
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
  React/Express/PostgreSQL Google3.
  Never reset values.
- Prepared buildL2AiK3hVAKYytXputQXo0R8rWt6bDhVs, app
  repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4,
  dataKeyrepo-2caafe8ea7f268fe237b7cab, port26630.
  Image125123048bytes,
  IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent asset609893443/release402982733 in private
  RizwanAhamed13/pods-launch-artifacts-fresh; preserve all permanent assets.
