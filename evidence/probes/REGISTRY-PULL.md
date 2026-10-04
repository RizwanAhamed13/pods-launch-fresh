# Authenticated registry pull check

[Receipt](../stack-registry-pull-qa.json) and
[implementation/test gate](../stack-registry-foundation-tests.json).
`registry-pull-qa.py` is the exact successful one-shot aswin/LXD probe. It refers
to the recorded candidate checkout, earlier verified archive copies, and new
owned QA directories. It does not run against production or user compute.

The candidate is a snapshot of source, tests, fixtures and locked dependencies.
Its corrected input manifest covers 345 files. The initial snapshot omitted
`evidence/stack-coverage.json`; this caused two Linux test failures. Copying the
exact fixture and rerunning compatibility checks resolved them without source
changes. The original failed full run is retained in the test evidence.

The probe creates a QA-only prepared manifest pointing to the original verified
Flask image, then calls the real indexer and PODS server. It creates an ephemeral
launch capability and a private Docker client config. Neither credential appears
in the receipt. Request records include method/path/status/byte count only.

Each Docker/containerd pair has separate data and state roots, namespaces and
Unix sockets. Both begin with zero images and zero physical blobs. The shared-base
case then imports the previously verified FastAPI archive. Both cases pull the
exact Flask digest through PODS using Docker, inspect its identity/rootfs, and
execute only a bounded, network-free Python dependency check. No product server,
database or public port is started. The registry listens on QA loopback only.

The probe stops every owned daemon, removes its Docker client credential file,
and checks the ordinary QA image inventory. Its source copies, private stores
and sanitized evidence remain for inspection. Never clear the existing QA or
provider caches to repeat it. Reproduction requires new owned output directories.

The initial two attempts exited before any Docker pull. The QA child was demoted
to uid1000 but inherited `/root` (0700), so esbuild could not spawn. The first
retry changed a source-copy permission and did not address the cause. The final
probe sets the child's working directory explicitly to its owned directory.

Actual Docker testing covered origin delivery only. CDN redirect authorization,
runner credentials/cancellation, recovery after a partial pull, native provider
compatibility and time to the usable application remain separate gates. The
registry is disabled by default and current runners still use full archives.
