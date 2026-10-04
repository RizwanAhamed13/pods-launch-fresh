# Layer reuse diagnostic

Evidence: [stack-layer-reuse-diagnostic.json](../stack-layer-reuse-diagnostic.json).
These are archived one-shot probes, not production delivery code. They refer to
the recorded aswin archive hashes, QA guest and unique output directories. Existing
images, caches, database data and prepared artifacts must remain intact. Repeating
a run requires new owned output directories and an isolated store; do not clear
the current QA cache to recreate a miss.

The metadata input is [stack-layer-archive-metadata.json](../stack-layer-archive-metadata.json).
It records TAR members, the legacy Docker manifest, and only OS, architecture and
rootfs from image configs. Config digests are not the containerd image identities.
The full prepared archives remain private. The diagnostic archive contains the
original metadata and unique blobs, with four exact common compressed blobs
omitted. Its SHA identifies this generated instance; gzip headers may differ when
recreated, so record and verify the new digest rather than assuming identical bytes.

- `layer-reuse-qa.py` runs on aswin. It verifies both original archive digests,
  generates the smaller Flask archive and imports it into QA after FastAPI.
  Its first assertion requires the Flask image to be absent. That image is now
  cached, so the historical positive probe must not be rerun against that store.
- `layer-reuse-cold-v1-qa.py` is the retained failed isolation attempt. Docker
  connected to the system containerd; the empty-image guard stopped before import.
- `layer-reuse-cold-v2-qa.py` uses separate Docker and containerd roots, states and
  sockets. It proved the store empty, then exposed an invalid assumption that
  missing layers make `docker load` return nonzero. It stopped before fallback.
- `layer-reuse-cold-v3-qa.py` repeats in a new physically empty store. It records
  the misleading successful load/identity, failed execution with `--pull never`,
  full archive import, exact rootfs and successful dependency execution. Both
  private daemons stop in `finally`; the owned diagnostic directories are retained.
- `layer-reuse-native-inspect.mjs` is the exact read-only Cloud Shell payload.
  It inspects engine metadata and the existing FastAPI identity/rootfs. The
  authorized SSH wrapper removed its temporary key and preserved all nine existing
  keys. This probe neither imports an image nor starts an application.

The QA container checks override the entrypoint to import Python packages, with
no network, read-only root filesystem and bounded resources. They do not exercise
the product page or MariaDB. The full fallback restored the original image without
deleting the incomplete import. These observations apply to the tested QA engine;
native Docker compatibility and end-to-end performance need separate acceptance.

Before implementing delivery, compare a bounded transport for missing blobs with
the current verified full-archive path. Avoid generating an unbounded set of
cache-specific archives. Cache claims must be advisory: a matching diff ID need
not prove the exact compressed blob exists. Validate complete, runnable content
before counting an image as cached, retain a bounded full-archive fallback, and
test failure, retry, cancellation, integrity and storage accounting. Preserve
authorization and private delivery; never expose provider or release credentials.
