"""Remove only this completed experiment's four verified disposable assets."""
import hashlib
import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

path = Path('/tmp/pods-range-parallelism-native.json')
out = json.loads(path.read_text())
assert out['status'] in ('passed', 'failed') and out['cleanupPending']
assert out['repository'] == 'RizwanAhamed13/pods-launch-artifacts-fresh'
assets = out['assets']
assert len(assets) == len({a['id'] for a in assets}) == 4
assert [a['sample'] for a in assets] == [1, 2, 3, 4]
assert [a['rangeCount'] for a in assets] == [4, 8, 8, 4]
token = subprocess.check_output(['gh', 'auth', 'token'], text=True).strip()
headers = {'Authorization': 'Bearer '+token, 'Accept': 'application/vnd.github+json'}
removed = []
for asset in assets:
    assert asset['name'] == f"probe-20261004-range-count-{asset['sample']}-{asset['rangeCount']}-{asset['sha256']}.gz"
    endpoint = f"https://api.github.com/repos/{out['repository']}/releases/assets/{asset['id']}"
    with urllib.request.urlopen(urllib.request.Request(endpoint, headers=headers), timeout=30) as response:
        current = json.load(response)
    assert (current['name'], current['size'], current['digest']) == (asset['name'], asset['bytes'], 'sha256:'+asset['sha256'])
    with urllib.request.urlopen(urllib.request.Request(endpoint, method='DELETE', headers=headers), timeout=30) as response:
        assert response.status == 204
    try:
        urllib.request.urlopen(urllib.request.Request(endpoint, headers=headers), timeout=30)
    except urllib.error.HTTPError as error:
        assert error.code == 404
    else:
        raise AssertionError('Temporary asset still exists')
    removed.append(asset['id'])
    out['cleanupProgress'] = removed.copy()
    path.write_text(json.dumps(out, indent=2)+'\n')
out['cleanupPending'] = False
out['cleanup'] = {'recordedAt': datetime.now(timezone.utc).isoformat(), 'deletedProbeAssetIds': removed, 'authorizedReadAfterDeleteStatus': 404, 'productionAssetsChanged': False, 'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
out.pop('cleanupProgress', None)
path.write_text(json.dumps(out, indent=2)+'\n')
print(json.dumps(out['cleanup']))
