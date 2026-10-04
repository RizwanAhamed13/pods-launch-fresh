"""Index a verified OCI Docker-save archive. Called under the PODS image write lock.

Only digest-named regular blobs are written; archive paths are never extracted.
The index is committed last, and the original archive is never changed.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tarfile
import tempfile

DIGEST = re.compile(r"sha256:[a-f0-9]{64}\Z")
MANIFESTS = {"application/vnd.oci.image.manifest.v1+json", "application/vnd.docker.distribution.manifest.v2+json"}
INDEXES = {"application/vnd.oci.image.index.v1+json", "application/vnd.docker.distribution.manifest.list.v2+json"}
LIMIT = 512 * 1024 ** 2
JSON_LIMIT = 1024 ** 2


def require(condition, message):
    if not condition:
        raise ValueError(message)


class BoundedTarInfo(tarfile.TarInfo):
    @classmethod
    def frombuf(cls, buf, encoding, errors):
        entry = super().frombuf(buf, encoding, errors)
        # Reject extension headers before tarfile reads their potentially huge
        # payloads. Only the plain regular files/directories emitted by OCI saves
        # are accepted; no PAX, GNU long names, links or sparse expansion.
        require(entry.type in {tarfile.REGTYPE, tarfile.AREGTYPE, tarfile.DIRTYPE}, "Unsupported TAR entry type")
        require(0 <= entry.size <= LIMIT, "TAR entry exceeds bound")
        return entry


def file_hash(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 ** 2), b""):
            h.update(chunk)
    return h.hexdigest()


def inventory_bytes(data):
    count, total = 0, 0
    for directory in [data / "images", data / "registry"]:
        if not directory.exists():
            continue
        for root, dirs, files in os.walk(directory, followlinks=False):
            for name in dirs + files:
                count += 1
                require(count <= 10000, "Image inventory bound exceeded")
                mode = (Path(root) / name).lstat().st_mode
                require(stat.S_ISDIR(mode) or stat.S_ISREG(mode), "Non-regular image inventory")
            total += sum((Path(root) / name).stat().st_size for name in files)
    return total


def index_image(request):
    data, image, budget = Path(request["data"]), request["image"], request["budget"]
    require(type(budget) is int and budget > 0, "Invalid image budget")
    require(DIGEST.fullmatch(image.get("id", "")) and re.fullmatch(r"[a-f0-9]{64}", image.get("sha256", "")), "Invalid image identity")
    archive = data / "images" / (image["sha256"] + ".gz")
    info = archive.lstat()
    require(stat.S_ISREG(info.st_mode) and type(image["bytes"]) is int and 0 < info.st_size == image["bytes"] <= LIMIT, "Invalid image archive")
    require(file_hash(archive) == image["sha256"], "Image archive digest mismatch")
    registry = data / "registry"
    blobs, indexes = registry / "blobs", registry / "indexes"
    for directory in [registry, blobs, indexes]:
        directory.mkdir(mode=0o700, exist_ok=True)
        require(not directory.is_symlink(), "Registry directory must not be a symlink")
    used = inventory_bytes(data)
    require(used < budget, "Prepared image storage is full")
    stage = Path(tempfile.mkdtemp(prefix=".index-", dir=registry))
    members, seen = {}, set()
    staged_bytes = expanded_bytes = 0
    try:
        with tarfile.open(archive, "r|gz", tarinfo=BoundedTarInfo) as source:
            for member in source:
                require(len(seen) < 256 and member.name not in seen, "Duplicate or excessive TAR entries")
                seen.add(member.name)
                if member.isdir():
                    require(member.name.rstrip("/") in {"blobs", "blobs/sha256"} and member.size == 0, "Unsupported TAR directory")
                    continue
                require(member.isfile() and not member.pax_headers, "Unsupported TAR entry type")
                match = re.fullmatch(r"blobs/sha256/([a-f0-9]{64})", member.name)
                require(match or member.name in {"manifest.json", "index.json", "oci-layout", "repositories"}, "Unsupported Docker archive layout")
                require(0 < member.size <= (LIMIT if match else JSON_LIMIT), "TAR entry exceeds bound")
                expanded_bytes += member.size
                require(expanded_bytes <= 2 * LIMIT, "Expanded archive exceeds bound")
                stream = source.extractfile(member)
                if not match:
                    # Small Docker compatibility metadata is not served by the registry.
                    require(len(stream.read(JSON_LIMIT + 1)) == member.size, "Truncated TAR metadata")
                    continue
                sha = match[1]
                destination = blobs / (sha + ".gz")
                existing = destination.exists() or destination.is_symlink()
                if existing:
                    info = destination.lstat()
                    require(stat.S_ISREG(info.st_mode) and info.st_size == member.size and file_hash(destination) == sha, "Existing registry blob changed")
                else:
                    require(used + staged_bytes + member.size + JSON_LIMIT <= budget, "Prepared image storage is full")
                output = None if existing else (stage / (sha + ".gz")).open("xb")
                if output:
                    os.chmod(output.name, 0o600)
                h, count = hashlib.sha256(), 0
                try:
                    for chunk in iter(lambda: stream.read(1024 ** 2), b""):
                        h.update(chunk)
                        count += len(chunk)
                        require(count <= member.size, "Oversized TAR blob")
                        if output:
                            output.write(chunk)
                finally:
                    if output:
                        output.close()
                require(count == member.size and h.hexdigest() == sha, "Registry blob digest mismatch")
                members["sha256:" + sha] = member.size
                staged_bytes += 0 if existing else member.size
        manifests, reachable = {}, set()

        def descriptor(value):
            require(isinstance(value, dict) and DIGEST.fullmatch(value.get("digest", "")) and type(value.get("size")) is int and not value.get("urls"), "Invalid or external OCI descriptor")
            require(value["digest"] in members and value["size"] == members[value["digest"]], "OCI descriptor bytes missing")
            reachable.add(value["digest"])
            return value["digest"]

        def visit(id, expected=None, depth=0):
            require(depth <= 3 and id not in manifests and id in members and members[id] <= JSON_LIMIT, "Invalid OCI manifest graph")
            file = stage / (id[7:] + ".gz")
            value = json.loads((file if file.exists() else blobs / file.name).read_bytes())
            media = value.get("mediaType")
            require(value.get("schemaVersion") == 2 and media in MANIFESTS | INDEXES and (expected is None or media == expected), "Unsupported OCI manifest")
            manifests[id] = media
            reachable.add(id)
            if media in INDEXES:
                children = value.get("manifests")
                require(isinstance(children, list) and 0 < len(children) <= 16, "Invalid OCI index")
                for child in children:
                    child_id = descriptor(child)
                    visit(child_id, child.get("mediaType"), depth + 1)
            else:
                descriptor(value.get("config"))
                layers = value.get("layers")
                require(isinstance(layers, list) and len(layers) <= 128, "Invalid OCI layers")
                for layer in layers:
                    descriptor(layer)

        visit(image["id"])
        require(len(reachable) <= 128, "OCI content count exceeds bound")
        value = {"version": 1, "archiveSha256": image["sha256"], "archiveBytes": image["bytes"], "imageId": image["id"], "members": {id: members[id] for id in sorted(reachable)}, "manifests": manifests}
        encoded = json.dumps(value, separators=(",", ":")).encode()
        require(len(encoded) <= JSON_LIMIT, "OCI index exceeds bound")
        added = 0
        for id in sorted(reachable):
            file = stage / (id[7:] + ".gz")
            if file.exists():
                os.link(file, blobs / file.name)
                file.unlink()
                added += members[id]
        pending = stage / "index.json"
        pending.write_bytes(encoded)
        pending.chmod(0o600)
        os.replace(pending, indexes / (image["sha256"] + ".json"))
        return {"archiveSha256": image["sha256"], "imageId": image["id"], "blobs": len(reachable), "blobBytes": sum(value["members"].values()), "addedBlobBytes": added}
    finally:
        shutil.rmtree(stage)


if __name__ == "__main__":
    try:
        print(json.dumps(index_image(json.load(sys.stdin))))
    except Exception as error:
        # Archive contents never become executable code or error text.
        print("Prepared OCI indexing failed: " + (str(error) if isinstance(error, ValueError) else type(error).__name__), file=sys.stderr)
        sys.exit(1)
