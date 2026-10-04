# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable artifact
→ authorized user compute → real usable product. Latest completed gate: bounded,
resumable migration of an existing prepared image into private CDN delivery,
without rebuilding or changing its link. FastAPI met 20s with its image absent on
RUNNING Google compute; cached relaunch and SQLite persistence also passed.
54 of 59 prepared images remain unmapped. Broader first-image performance and
native Codespaces browser acceptance remain open.

## Current verified state

- Local /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin /home/aswin/pods-launch-fresh; SSH alias aswin.
- Core https://github.com/RizwanAhamed13/pods-launch-fresh.
- Fixtures https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  pin d6da2ed780aec8ae0178fc181f1d24113c322e15.
- 55 representative apps passed isolated build/artifact/browser, 55 native Google
  browser and 55 Codespaces HTTP/protocol paths. Seven DB/service families. See
  SUPPORT.md and stack-coverage.json; not every version or arbitrary repository.
  Native Codespaces browser remains unverified. Unknown secrets/schema/migrations
  require developer inputs. Desktop/mobile/GPU/non-web products excluded.
- 284/284 full checks locally (26.797s) and isolated aswin Linux (58.301s);
  stack-image-migration-tests.json. All 341 candidate input hashes independently
  verified in /output/image-migration-candidate-a6d8caa-final. A first final-suite
  staging upload failed before tests; retry used a new filename with identical
  bytes. No passing source checks were repeated without a change.
- Scope: 8875 physical source lines = 4160 product/tooling + 3604 tests
  + 933 examples + 178 browser tools. Archived diagnostic probes excluded.
- Migration implementation 1654372c0fb829bc7639e32034b30df12184c1df.
  Runtime implementation remains394abe666fca7c9ad209be7269825ea73c50a3a9;
  server PID1560797; served runner SHA
  5172cf839d6c5287b8688bc028859c254757a9c056e435f23c817701d26172d8.
  Operator CLI requires no runtime restart. Protected configuration and all
  immutable artifact/image inventories preserved.
- Post-native audit2026-10-04T15:24:18.902595+00:00: same PID/runner,
  health200, SQLiteok, zero active builds/launches. Evidence-only sync needs no restart.

## Latest completed migration gate

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
- Inventory now59 unique prepared images/5 mappings/54 unmapped images totaling
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

- Next bounded gate: use the verified operator command on one selected existing
  multi-service/database artifact, checking shared-image reuse and ordinary native
  product persistence. First inspect actual provider image state; do not remove
  cached images to manufacture a first-image claim. Preserve permanent assets.
- Migration implementation/idempotency/FastAPI native acceptance are complete.
  Do not rerun the full matrix or completed suites without source changes or a
  concrete failure. Use exact compute/cache state for further20s observations.
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
  Latest Micronaut values Google20/Codespaces21; Ktor Google4; FastAPI Google4.
  Never reset values.
- Prepared buildL2AiK3hVAKYytXputQXo0R8rWt6bDhVs, app
  repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4,
  dataKeyrepo-2caafe8ea7f268fe237b7cab, port26630.
  Image125123048bytes,
  IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent asset609893443/release402982733 in private
  RizwanAhamed13/pods-launch-artifacts-fresh; preserve all permanent assets.
