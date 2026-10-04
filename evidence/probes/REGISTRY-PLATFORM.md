# Platform-limited OCI saves and Docker attestations

The first production preparation of the existing Flask + MariaDB application
published/reused Flask's ten blobs, then rejected the MariaDB archive. No launch
used the registry: the feature remained disabled. The shared storage writer lock
had already been deployed, and the original archives and application artifact
were preserved.

The MariaDB save contains its original eight-descriptor multi-platform index,
but only the Linux/amd64 image and that image's attestation bytes. Requiring every
platform therefore fails. Serving only the runtime branch also fails: Docker
29.1.3 requests its matching attestation manifest and receives a404. The first
real Docker failure receipt retains that request. Unit tests alone did not prove
this compatibility requirement.

The corrected indexer preserves the original root digest, selects one baseline
Linux/amd64 runtime, and includes its linked attestations as metadata. It checks
every required descriptor's size and digest, rejects external descriptors,
retains archive/graph/storage bounds, and commits metadata last. Other platform
descriptors remain in the original index but cannot authorize absent content.
Unknown/unknown attestation descriptors never become runnable candidates.
Both legacy image configs and OCI artifact empty configs are covered, including
subject matching when a subject is present. This follows Docker's documented
[attestation storage formats](https://docs.docker.com/build/metadata/attestations/attestation-storage/).

The archived Python probes were executed over SSH on aswin. They use the real
PODS registry inside `pods-fresh-matrix-01` and a private Docker/containerd pair
with separate root, state and socket paths. The private store must begin with
zero images and physical blobs. No ordinary Docker cache is deleted. The probe
checks a fresh pull, a cached repeat, the original image ID, exact runtime rootfs
layers, and `mariadbd --version` with network disabled and no application data.
It then stops only its owned processes and removes the temporary launch login.
Images, stores, source snapshots and diagnostic logs remain for inspection.

These are historical programs with exclusive paths. Do not rerun them in place
or clear their directories. A reproduction needs a new owned directory, the
recorded source snapshot, the original archive whose SHA is in the receipt, and
the old indexer obtained from the recorded base revision. QA receives no Google,
GitHub provider or release credentials. The production operator uses the
already configured private release without exposing credential values.

The initial attestation test fixture accidentally shared its mutable subject
object with the reference descriptor. Changing that subject changed the target
annotation too, so the test exercised an unrelated attestation instead. The
fixture now copies the subject before mutation; the earlier failed suite is
retained separately from the product's real Docker failure.

This gate covers image preparation and execution compatibility. It does not
establish native provider launch speed, a usable product page, database
persistence, additional framework coverage, or the20-second product target.
