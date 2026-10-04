# Broad stack checkpoint

Goal active and incomplete: developer URL → isolated aswin build → reusable artifact
→ authorized user compute → real usable product. Latest completed gate: four native
Google browser launches separating absent-image origin/CDN paths from cached
relaunches, and a read-only delivery inventory. First-image20s remains unmet;
55 of59 prepared images have no CDN mapping. Native Codespaces browser acceptance
also remains open. Production source is unchanged in this gate.

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
- 272/272 full checks locally (27.789s) and isolated aswin Linux (57.709s);
  stack-cdn-fallback-tests.json. All338 snapshot input hashes verified at
  /output/cdn-fallback-candidate-f1412a4. Baseline with new targeted assertions:
  14/21 pass; seven failures distinguish missing failure diagnostics.
- Scope: 8669 physical source lines = 4080 product/tooling + 3478 tests
  + 933 examples + 178 browser tools. Archived diagnostic probes excluded.
- Deployed implementation394abe666fca7c9ad209be7269825ea73c50a3a9.
  Server PID1560797; runner SHA
  5172cf839d6c5287b8688bc028859c254757a9c056e435f23c817701d26172d8.
  Protected restart preserved59 image files,135 artifacts and.env. Source hashes,
  new served runner, listener, health200 and SQLiteok verified.
- Final native audit2026-10-04T15:10:46.703285+00:00: same PID/runner,
  health200, SQLiteok, zero active builds/launches. Evidence-only sync needs no restart.

## Latest completed first-image gate

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
  README documents legacy images remaining on origin until re-preparation.
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

- Next implementation gate: provide a bounded, resumable operator migration for
  existing production-prepared images into the configured private delivery store,
  without source rebuild, artifact mutation, cache clearing or quota changes.
  Reuse GitHubImageDelivery.publish identity/privacy checks and asset reuse. Start
  with explicit app selection; validate idempotency, integrity, failure recovery
  and unchanged immutable links. This closes the demonstrated legacy-delivery gap.
  Do not silently upload the full5.620GB inventory before a bounded validation.
- Then measure an ordinary image-absent product launch using a migrated artifact
  and exact compute/cache state. Do not substitute a cached launch or direct
  transfer probe for full product acceptance. No need to reproduce the old fallback
  again unless it actually occurs. Current CDN first-image product21632ms is unmet.
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
  Latest Micronaut values Google20/Codespaces21; Ktor Google4. Never reset values.
- Prepared buildL2AiK3hVAKYytXputQXo0R8rWt6bDhVs, app
  repo-2caafe8ea7f268fe237b7cab-d6da2ed780ae-5a4e0078fab4,
  dataKeyrepo-2caafe8ea7f268fe237b7cab, port26630.
  Image125123048bytes,
  IDsha256:93833ac2bd1aba9e02930473fcf3ec224408db1bcb52fe955fac0d8a54821e9b,
  archiveSHA8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7.
  Permanent asset609893443/release402982733 in private
  RizwanAhamed13/pods-launch-artifacts-fresh; preserve all permanent assets.
