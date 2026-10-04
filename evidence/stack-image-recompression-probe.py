"""Measure outer gzip changes on an existing image without changing its tar bytes.

Run on an isolated copy of a prepared image:
  python3 stack-image-recompression-probe.py IMAGE.gz EXPECTED_SHA EXPECTED_BYTES
Only temporary recompressed files are written; the input is never modified.
"""
import gzip
import hashlib
import json
import platform
import shutil
import sys
import tarfile
import tempfile
import time
import zlib
from datetime import datetime, timezone
from pathlib import Path


def stream_hash(stream):
    digest = hashlib.sha256()
    size = 0
    while chunk := stream.read(1024 * 1024):
        size += len(chunk)
        digest.update(chunk)
    return {"bytes": size, "sha256": digest.hexdigest()}


source = Path(sys.argv[1]).resolve(strict=True)
expected_sha, expected_size = sys.argv[2], int(sys.argv[3])
with source.open("rb") as stream:
    original = stream_hash(stream)
assert original == {"bytes": expected_size, "sha256": expected_sha}, original
with gzip.open(source, "rb") as stream:
    unpacked = stream_hash(stream)

with tarfile.open(source, "r:gz") as archive:
    manifest = json.load(archive.extractfile("manifest.json"))
    assert len(manifest) == 1, "Probe expects one prepared image"
    layers = []
    for name in manifest[0]["Layers"]:
        member = archive.getmember(name)
        with archive.extractfile(member) as stream:
            magic = stream.read(4).hex()
        layers.append({"path": name, "bytes": member.size, "magicHex": magic,
                       "alreadyGzip": magic.startswith("1f8b")})

results = []
with tempfile.TemporaryDirectory(prefix="pods-image-recompression-") as directory:
    for level in (1, 6, 9):
        candidate = Path(directory) / f"level-{level}.gz"
        started = time.monotonic()
        with gzip.open(source, "rb") as incoming, candidate.open("wb") as raw:
            with gzip.GzipFile(filename="", mode="wb", fileobj=raw,
                               compresslevel=level, mtime=0) as outgoing:
                shutil.copyfileobj(incoming, outgoing, length=1024 * 1024)
        elapsed = round((time.monotonic() - started) * 1000)
        with gzip.open(candidate, "rb") as stream:
            verified = stream_hash(stream)
        assert verified == unpacked, "Recompression changed the image tar bytes"
        with candidate.open("rb") as stream:
            compressed = stream_hash(stream)
        results.append({"level": level, **compressed, "recompressMs": elapsed,
                        "savedBytes": expected_size - compressed["bytes"],
                        "savedPercent": round(100 * (1 - compressed["bytes"] / expected_size), 4),
                        "decodedTarIdentical": True})
        candidate.unlink()

with source.open("rb") as stream:
    assert stream_hash(stream) == original, "Input image changed during the probe"
print(json.dumps({
    "recordedAt": datetime.now(timezone.utc).isoformat(),
    "probeSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    "python": platform.python_version(), "zlib": zlib.ZLIB_VERSION,
    "source": original, "decodedTar": unpacked, "layers": layers,
    "results": results, "sourceUnchanged": True,
    "temporaryFilesRemoved": not Path(directory).exists(),
    "scope": "Isolated recompression of the exact prepared image. Each candidate decodes to the identical original tar stream. This measures bytes and isolated preparation cost, not native launch speed or a Docker runtime change."
}, indent=2))
