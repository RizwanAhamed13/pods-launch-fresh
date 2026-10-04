# Broad stack checkpoint

Goal active and incomplete: repository URL → isolated aswin build → reusable
artifact → authorized user Cloud Shell/Codespaces → actual usable product.
Do not claim universal compatibility, native Codespaces browser acceptance or a
20-second cold-launch guarantee. Historical results remain in SUPPORT.md and evidence.

## Current source and acceptance

- Local: /Users/rizwanahamed/Documents/ChatGPT/podsv2.
- aswin: /home/aswin/pods-launch-fresh; SSH alias aswin.
- Private core: https://github.com/RizwanAhamed13/pods-launch-fresh.
- Public fixtures: https://github.com/RizwanAhamed13/pods-launch-runtime-fresh,
  current revisiond6da2ed780aec8ae0178fc181f1d24113c322e15.
  Native Fastify evidence below tested the original9eee994 revision.
- 55 isolated real build/artifact/browser fixture passes. 28 native Google browser
  and29 Codespaces authenticated HTTP/protocol passes. 27 still lack Google
  acceptance;26 also lack Codespaces protocol acceptance. Fastify passed only
  Codespaces protocol so far. Google-pending fixtures:
  actix, adonis, aspnet, axum, deno, echo, fastapi, fastify, fiber, flask-mariadb, flask-mongodb7, flask-redis, flask-sqlite, flask-valkey, go, gradio, hono, koa, ktor, micronaut, nestjs, phoenix, php, rocket, sinatra, streamlit, symfony.
- All eight static frontend and all six SSR fixtures pass both acceptance paths.
  Codespaces native browser interaction remains pending for every fixture.
- Latest tooling source18026bb:114 automated tests pass locally/aswin. Logs
  /tmp/pods-ssr-complete-tests-{local,aswin}.txt. Live runtime remains5e5b4a0.
  Source updates only native QA scripts/tests; no runtime restart was necessary.
- 5,622 physical source lines:3,033 product/tooling,1,492 tests,933 examples,
  164 browser tools. The extension filter now includes the four-line .astro file.

## Latest gate: Fastify native failure reproduced and fixture fixed

- Ordinary quota watcher52715 ended0 at01:01:16UTC(account2/global2/active0).
  Actual form submitted once01:01:20.421UTC; preparation29.529s, bundle272829bytes.
  Original fixture9eee994, control5e5b4a0, checkout7f73f6c.
- App repo-d3c62ee9058c74712132c10e-9eee994ba7f7-e189ea49d139;private port20867.
- Google initialRUNNING:health5796ms,delivery2918ms,page7043ms,read7054ms.
  Browser write FAILED:0 remained0 after clicks and reload. Do not claim7seconds
  to usable product. Only one Google launch; stopped after diagnosis.
- Bounded raw HTTP metadata capture on its same authorized environment confirmed
  POST/api/count with Transfer-Encoding:chunked and NO Content-Type; Fastify415
  FST_ERR_CTP_INVALID_MEDIA_TYPE. No cookies/tokens/accounts recorded. Temporary
  SSH key removed through existing provider finally cleanup. Diagnostic16129 ended0.
- Local gcloud is a DIFFERENT,SUSPENDED environment. Read-only identity comparison
  failed; no CLI SSH/start was attempted there. Do not use that CLI identity.
- Codespaces14206 ended0:pods-launch-7vrw57jpjjppcww57 (Node environment, NOT the
  older containers environment). FirstinitialShutdown health28162ms/delivery13185;
  cachedinitialAvailable health7722/delivery7159. SQLite0→1, fullstop retained1→2.
  Both stopped; native browser execution still pending.
- Final01:08:32UTC audit:active builds0/launches0,health200,port20867private.
  Evidence stack-fastify-{url,google,codespaces}.json; Googlepassedfalse,CStrue.
- Fixed examples/stacks/fastify/server.js sends JSON with body{} and Content-Type,
  reports failed writes and re-enables its button. Public fixture commitd6da2ed
  published from clean /tmp/pods-spring-runtime-20261004 (origin main).
- scripts/test-fastify-preview.mjs prepares the real Fastify source and executes
  its shipped client script against its real backend with emulated chunked POST.
  Before14367 exit1 reproduced415/value0; after45265 exit0 saved0→1 and restarted
  1→2. Simulated503 displayed error and enabled retry. This is isolated script/HTTP
  integration, not browser/native acceptance. Regression evidence before/after
  includes exact fixture revisions and source hashes. Compatibility3 tests pass.
- No full114-test rerun: product runtime and automated tests were unchanged.
  Existing114 full-suite baseline remains18026bb. New regression passed separately.

## Next bounded gate

- NEXT: rebuild fixed Fastify atd6da2ed through the normal developer form and
  retest actual Google browser writes, reload and full stop/relaunch. Existing
  Google data should still be0. Codespaces already saved2 on this stable dataKey;
  use PODS_EXPECT_INITIAL_COUNT=2, require2→3 then3→4 after a full restart.
  Preserve failed original evidence when recording the new revision (new files).
- Last quota snapshot01:08:35UTC:account3/global3/active0,next ordinary slot
  01:24:44.981UTC. No new build submitted; no live quota watcher currently.
- Express packaging diagnosis is now reproduced: esbuild0.25.12 emits one
  unresolved optional require of supports-color in debug/src/node.js. The current
  non-builtin external guard selects a full container. Promoting esbuild's
  ignored-dynamic-import diagnostic identifies the handled missing import;
  ordinary required missing imports still fail and require.resolve is distinct.
- Experimental isolated bundle:338,173bytes, versus the production82,250,849byte
  image. Real Express HTTP product and SQLite0→1, stop/relaunch1→2 passed at
  418ms/288ms local health. This is not a native/browser performance result and
  production preparation remains unchanged. Evidence stack-express-packaging-
  diagnosis.json and stack-express-optional-bundle-probe.json; probe44620 ended0.
- Do not switch packaging until format-transition storage is implemented/tested:
  bundles use <root>/data/<dataKey>, default containers use
  <root>/volumes/pods-<key-hash>/app-data/data. A format change would currently
  choose a different database. Container recipes also run with their image's
  default identity; handle file ownership without weakening directory checks.
- Completed watcher52715 and Express probe44620 ended0. No live probes/builds
  remain. Production limits3/account/hour and12/global/hour remain unchanged.
  Never bypass quota or import QA artifacts into production.
- /tmp/pods-next-native-quota-watch.py is a reusable bounded watcher. Anchor Svelte
  buildNLXLM6VYS1P01fMd4cFhdzEoXVCJy0Fp account privately; never print identity.
- /tmp/pods-capture-native.py runs on aswin with argument astro, react-router, express or fastify;
  readonly SQLite, whitelisted build/app/launch fields, compute and derived timings.
- scripts/live-codespaces.mjs: gh token via stdin; use the existing fixture's
  matching interaction probe and an explicit evidence file. Two launches required.
  SSR checks use PODS_SSR_CHECK/PODS_SSR_FIXTURE and reject wrong source folders.
  Do not combine interaction/persistence checks with SINGLE_LAUNCH.
- Stop/history observation corrected on the next turn: existing poll() already
  awaits history() after terminal state. A fresh read WITHOUT reloading showed
  every recent row stopped. The earlier screenshot caught the history request
  in flight; there is no evidenced persistent UI bug and no fix was made.
- Readonly production audit00:10UTC found no already-prepared production builds
  for any of the then29 pending fixtures. React Router has since passed; the other
  This is historical; original Fastify has now been prepared, but its fixed revision needs another ordinary build.
- Astro compression experiment completed: session36583 ended0. Levels6 and9
  reduced124,914,593bytes to124,901,410/124,901,306 respectively (0.011%). Both
  decoded to identical tarSHA427fe3c86896feeac0555e1bb57b573cee195b4800263e0d3e5c08674f44a882.
  Tar payload125,437,883 of125,448,998bytes is itself gzip-compressed layers.
  Keep level1; stronger outer compression cannot materially improve first-launch
  transfer. Evidence stack-astro-compression-trial.json. Temporary outputs removed.
  No source/runtime change or test rerun was warranted.

## Browser handoffs

First CUA call after compaction must be cua.rewriteDocumentation. Reuse bindings.
Mark pending workflow tabs each turn; no duplicate launch/build after read timeout.

- stackQa6: IAB2tab13, completed ORIGINAL Fastify preparation. Ready region includes
  period:Your application is ready to share. → Try this version link. To build
  corrected public revision, use Prepare another version ONCE after quota opens.
- accountWorker:IAB2tab12,stoppedoriginalFastifylauncher,GoogleSQLitevalue0.
  fastifyLaunchUrl,fastifyPreparationSubmittedAt,fastifyBrowserChecks[0](passedfalse),
  fastifyBrowserLogs=[] remain. Old Express/React Router/Astro bindings remain.
- measureFastifyCounter(tab,record,openLabel,expectedBefore) waits exacth1fastify
  counter and expected saved count;recordscontinuousvisible/state/interactiontime.
  It allows50seconds;timeout does not authorize another launch. Googlefixedfirst
  expected0 then1 after fullstop. Use newrecordarray to preserve originalfailure.
- stopPreparedProduct(tab,url) confirmsstop. History can briefly lag whileits
  existingasync request finishes; no evidencedhistorybug.
- supportQa:IAB2tab29,public support deliverable. Needs fresh verification after
  this gate's push:55isolated/28Google/29Codespaces;FastifyGooglePending,CS passed.
- nativeGithubKeep: IAB2tab10, pending GitHub two-factor authentication; fresh
  read00:40UTC still2FA. User action already requested. No SMS/code sent.
- cloudLifecycle: IAB2tab14, Cloud Shell Restart confirmation pending. No approval
  to replace VM. Do not click Restart or accept background Authorize prompt.
- Redact Connected-account text and private Cloud Shell hostnames from snapshots.
  Never print tokens, accounts, sessions or computeKeys.

## Operations and evidence rules

- Origin https://collection-conferences-ages-clearly.trycloudflare.com.
- systemd user pods-launch-fresh.service,MainPID946172,runtime5e5b4a0. Node/gh:
  /home/aswin/pods-tools/bin. Health/health on127.0.0.1:8787 (not/api/health).
  XDG_RUNTIME_DIR=/run/user/1000; DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus.
- Before any runtime restart: prove idle, confirm unit PID/cwd/cmdline/listener.
  No restart required for evidence/docs. Never use retired manual PID marker or
  touch unrelated pods-j03 services. Last controlled restart23:36:28UTC.
- Cloudflared manualPID2322522, same hostname. Fixedhostname answer and durable
  DNS/tunnel supervision remain pending; do not change callback hostname.
- RunnerSHA9ef8029d995e07421e5297aaa1b644fb145a54c838e0b2d2f6f38f0e356cfc3b.
- Prod DB URIfile:/home/aswin/pods-launch-fresh/.data/pods.sqlite?mode=ro.
  records(kind,id,value JSON), singular build/launch. Use whitelisted fields only.
  Provider initial state must be observed, never inferred/backfilled from duration.
- Public/support renders evidence/stack-coverage.json each request. Acceptance
  requires nativeAcceptance.googleBrowser/codespacesProtocol booleans after evidence.
  Filenames alone never confer a pass. No raw private evidence is served publicly.
- QA LXDpods-fresh-matrix-01 via/snap/lxd/current/bin/lxc,not snap wrapper.
  Source/opt/pods,fixtures/work/stacks,output/output,node/opt/node/bin/node,uid1000.
  Existing QAserverPID292107/session86855,app18090/proxy8081/tunnel18890; one-shot
  SIGTERM handler consumed. Don't blindly signal. New Fastify and Express probes used18095 and
  stopped it. QA Fastify source is now corrected atd6da2ed; local regression helper
  is/opt/pods/scripts/test-fastify-preview.mjs. LXC file push could not overwrite existing root-owned/tmp paths;
  unique reviewed helper paths worked without changing permissions.
- Graph projectUsers-rizwanahamed-Documents-ChatGPT-podsv2,indexed through5e5b4a0.
  public/scripts/examples/deploy excluded; targeted fallback is appropriate.
- npm test = node --test test/*.test.mjs. set -e before validation/commit.
  No passing-check reruns absent changes/concerns. User requests no subagents.
- All native Codespaces browser interactions remain unverified. Cloud Shell VM
  replacement persistence, durable hosting and cold20-second target are pending.
  Arbitrary dependencies/secrets/migrations and native/mobile/GPU interfaces are
  outside the currently tested contracts. Goal remains active, not complete.
