# Private CDN publication and Docker redirects

The three Python programs and their unmodified JSON receipts are the exact
executed probes. Their SHA-256 hashes and assertions are bound by
`../stack-registry-cdn-qa.json`. Product source was
`0791fe68c4ed973bab1c11f3df5e2bec158291d6`; the QA client used the verified
347-file candidate `/output/registry-launch-candidate-adc78ff` recorded in
`../stack-registry-launch-tests.json`.

| Program | Result |
| --- | --- |
| `registry-cdn-publication.py` | Published ten real blobs; repeat reused them. Direct empty-store pull passed in26.078s. The subsequent inspected pull timed out and fell back, so the overall probe exited1. |
| `registry-cdn-shared-v2.py` | Reused published blobs, imported the verified FastAPI base into a fresh store, then encountered the inspection relay timeout. Full-archive fallback completed; probe exited1. |
| `registry-cdn-shared-v3.py` | Shortened only the diagnostic upstream connect timeout. Shared-base pull passed in8.742s image preparation, fetching five blobs totaling11,178,157bytes; probe exited0. |

Each executed supervisor was supplied over SSH to Python on aswin. The historical
commands were equivalent to:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 aswin python3 - < registry-cdn-publication.py
ssh -o BatchMode=yes -o ConnectTimeout=10 aswin python3 - < registry-cdn-shared-v2.py
ssh -o BatchMode=yes -o ConnectTimeout=10 aswin python3 - < registry-cdn-shared-v3.py
```

These are retained programs, not idempotent rerun commands. Their exclusive
directories already exist and must not be cleared. A future reproduction needs
new owned paths/device names and a pinned source checkout, with corresponding
hashes recorded. The source revision assertion intentionally prevents running
against an unrelated checkout. No release assets should be deleted to recreate
the initial eleven-asset inventory.

Prerequisites: the authorized aswin host and `pods-fresh-matrix-01` QA guest,
existing private release configuration in aswin's `.env`, the original verified
Flask archive, and the retained FastAPI base archive at
`/output/layer-reuse-b75e0fb/base.gz`. Production provider/user records are never
attached to the QA server. Builds are disabled in the QA child process. The
first program indexes under `/tmp/pods-registry-cdn-0791fe6/data` with an explicit
256MiB QA budget and publishes through the real `GitHubImageDelivery` class.
Both shared-base retries reuse that verified index and its ten mappings.

The PODS QA server binds aswin loopback. An owned LXD proxy with `bind=instance`
connects QA loopback to aswin loopback; the device is removed afterward. This
direction is documented by [LXD's proxy reference](https://github.com/canonical/lxd/blob/main/doc/reference/devices_proxy.md).
Each case uses a physically separate Docker and containerd root/state/socket,
initially containing zero images and content blobs. The actual integrated
`prepareRuntimeImages` and Docker helper run through an owned socket-selection
shim. The ordinary QA Docker daemon and its images are retained.

For header inspection, only those private daemons receive a temporary CA through
`SSL_CERT_FILE` and a loopback CONNECT relay. Global CA trust is unchanged. The
relay checks that Authorization, Cookie and Proxy-Authorization are absent,
records only their presence booleans, and forwards allowed request headers to the
real GitHub release CDN using verified upstream TLS. Signed URLs and credential
values are not recorded. Release/provider tokens remain on aswin; QA receives
only a short-lived launch capability in a0600 file.

The first relay allowed45seconds per upstream connection attempt. A bounded
public HEAD diagnostic found one IPv4 address timed out after2seconds; three
others answered. This suggests an instrumentation stall but does not establish
a CDN-wide failure. Version3 uses a2-second connection timeout followed by
45-second socket reads. PODS' pull deadline remains45seconds. All five successful
response sizes and hashes match the nonshared blobs; none matches a shared layer.

The passing direct and shared-base cases verify the image identity, eight rootfs
layers, and networkless Flask3.1.1/PyMySQL1.1.2 execution. Failed inspection cases
completed full-archive fallback, but stopped at the probe's no-fallback assertion
before dependency execution. They remain failed cases in the evidence.

All three aswin QA servers, eight owned QA engine processes and owned proxy devices
were stopped/removed; temporary launch credentials and private CA keys were
removed. Inputs, indexed blobs, private release assets and diagnostic stores remain.
The supervisors use bounded observation windows; if a future worker exceeds one,
explicitly inspect and stop only that owned worker before declaring cleanup.

These measurements cover image delivery only. The registry remains disabled in
production, with no production index or blob mappings. This gate adds no framework
coverage and does not test native compute, an application page, a database or the
20-second click-to-product target. Shared/cold cache conditions and TLS
instrumentation differ; CDN cache warmth was not measured.
