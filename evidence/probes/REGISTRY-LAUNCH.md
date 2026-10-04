# Integrated registry launch check

`registry-launch-qa.py` is the readable form of the exact successful program
executed via `ssh aswin python3 - < /tmp/pods-registry-launch-probe-v2.py`.
The executed program bytes match; both wrapper hashes are recorded in
`../stack-registry-launch-qa.json`. The source candidate's347 hashes are bound
by the snapshot manifest hash in `../stack-registry-launch-tests.json`.

The probe calls the actual candidate `prepareRuntimeImages` and Docker helper.
An owned executable shim replaces only the fixed Docker socket for this test;
no product endpoint override was introduced. Each mode starts private Docker and
containerd with separate physical data roots and checks zero initial images/blobs.
The ordinary QA daemon and its images are preserved. Modes are cold/cached pull,
partial-image repair after registry denial, corrupt-manifest fallback, and stop
during a stalled blob. All successful image preparations then execute a bounded,
networkless Flask/PyMySQL dependency check. No product or DB acceptance is claimed.

Prerequisites are the retained verified Flask full/thin archives under
`/output/layer-reuse-b75e0fb`, the exact source candidate under
`/output/registry-launch-candidate-adc78ff`, and QA Node/Docker/containerd.
The receipt records the original full image and archive identities. The thin
archive hash is checked before the deliberately incomplete import.

The retained probe directory is `/output/registry-launch-probe-v2-adc78ff`.
Do not rerun into or clear this directory. A new run needs a new exclusively
created directory and corresponding shim allowlist, with its own recorded hashes.
Each process is stopped in `finally`; only owned temporary credentials are removed.
Stores and image inputs remain for inspection. The failed v1 adapter attempt is
also retained: duplicate `--host` was rejected before a pull or load.

These loopback observations validate recovery/cancellation behavior. They do not
prove CDN redirect behavior, native launch latency, cold compute, or user-visible
application/database correctness.
