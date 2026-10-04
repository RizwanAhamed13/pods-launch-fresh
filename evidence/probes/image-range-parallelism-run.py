"""Compare four/eight ranges in ABBA order using four new private asset paths."""
import hashlib
import json
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

repository = 'RizwanAhamed13/pods-launch-artifacts-fresh'
workspace = 'pods-launch-containers-69rw5vx4xp46c5qw5'
ledger = Path('/tmp/pods-range-parallelism-upload.jsonl')
output = Path('/tmp/pods-range-parallelism-native.json')
assert not output.exists(), 'Inspect the existing attempt instead of repeating downloads'
assets = [json.loads(line) for line in ledger.read_text().splitlines()]
assert len(assets) == 4 and [a['rangeCount'] for a in assets] == [4, 8, 8, 4]
assert [a['sample'] for a in assets] == [1, 2, 3, 4]
assert len({a['id'] for a in assets}) == 4
assert len({(a['sha256'], a['bytes']) for a in assets}) == 1
assert all(a['name'].startswith('probe-20261004-range-count-') for a in assets)
assert json.loads(subprocess.check_output(['gh', 'api', 'repos/'+repository]))['private'] is True

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

opener = urllib.request.build_opener(NoRedirect)
token = subprocess.check_output(['gh', 'auth', 'token'], text=True).strip()
targets = []
for a in assets:
    endpoint = f"https://api.github.com/repos/{repository}/releases/assets/{a['id']}"
    current = json.loads(subprocess.check_output(['gh', 'api', endpoint]))
    assert (current['name'], current['size'], current['digest'], current['state']) == (a['name'], a['bytes'], 'sha256:'+a['sha256'], 'uploaded')
    request = urllib.request.Request(endpoint, headers={'Accept': 'application/octet-stream', 'Authorization': 'Bearer '+token, 'X-GitHub-Api-Version': '2022-11-28'})
    try:
        response = opener.open(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        assert response.status == 302
        location = response.headers['Location']
    parsed = urllib.parse.urlparse(location)
    assert parsed.scheme == 'https' and parsed.hostname == 'release-assets.githubusercontent.com'
    assert not parsed.username and not parsed.password and not parsed.port and not parsed.fragment
    a['signedPathSha256'] = hashlib.sha256(parsed.path.encode()).hexdigest()
    targets.append({'sample': a['sample'], 'rangeCount': a['rangeCount'], 'assetId': a['id'], 'url': location, 'sha256': a['sha256'], 'bytes': a['bytes']})
assert len({a['signedPathSha256'] for a in assets}) == 4
source_path = Path('evidence/probes/image-range-parallelism-download.mjs')
source = source_path.read_text()
code = source.replace('export async function', 'async function')
code += '\nconst targets='+json.dumps(targets)+''';
for (const t of targets) {
  try {
    const result = await probeRangeDownload(t.url, t.sha256, t.bytes, t.rangeCount);
    console.log(JSON.stringify({...result, sample:t.sample, assetId:t.assetId}));
  } catch {
    console.log(JSON.stringify({sample:t.sample, assetId:t.assetId, failed:true, error:'Bounded transfer or integrity check failed; signed URL withheld'}));
    process.exitCode = 1;
    break;
  }
}
'''
state = json.loads(subprocess.check_output(['gh', 'api', '/user/codespaces/'+workspace]))['state']
assert state == 'Available', state
out = {
    'startedAt': datetime.now(timezone.utc).isoformat(),
    'repository': repository, 'repositoryPrivate': True, 'provider': 'codespaces',
    'initialComputeState': state, 'assets': assets, 'observations': [],
    'sourceHashes': {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [source_path, Path(__file__), Path('evidence/probes/image-range-parallelism-upload.mjs')]},
    'scope': 'Four first observed downloads of identical bytes from distinct newly uploaded paths, with four/eight/eight/four ranges in sequence. Each download uses a new temporary file, verifies size and SHA-256, then removes it. Existing images, application data and caches are untouched. Shared CDN/backend cache and network variation remain uncontrolled. No Docker load, full launch or Google measurement is included.',
    'status': 'running', 'cleanupPending': True,
}
output.write_text(json.dumps(out, indent=2)+'\n')
try:
    run = subprocess.run(['gh', 'codespace', 'ssh', '-c', workspace, '--', 'node --input-type=module'], input=code, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
except subprocess.TimeoutExpired:
    out['status'] = 'observation-timeout'
    output.write_text(json.dumps(out, indent=2)+'\n')
    raise SystemExit('Observation expired; inspect the same remote process before any retry or cleanup.')
out['observations'] = [json.loads(line) for line in run.stdout.splitlines() if line.startswith('{')]
out['recordedAt'] = datetime.now(timezone.utc).isoformat()
out['status'] = 'passed' if run.returncode == 0 and len(out['observations']) == 4 else 'failed'
out['exitCode'] = run.returncode
output.write_text(json.dumps(out, indent=2)+'\n')
assert out['status'] == 'passed', 'Probe failed; sanitized receipt retained, do not erase or silently repeat it'
for observation, asset in zip(out['observations'], assets):
    assert observation['assetId'] == asset['id'] and observation['rangeCount'] == asset['rangeCount']
    assert observation['sha256'] == asset['sha256'] and observation['bytes'] == asset['bytes']
    assert observation['diskHashMatches'] and observation['temporaryFilesRemoved']
    assert not observation['requestAuthorizationHeader'] and not observation['redirectsAllowed']
print(json.dumps({'status': out['status'], 'samples': [{k: o[k] for k in ['sample', 'rangeCount', 'bodyCompleteMs', 'verifiedMs']} for o in out['observations']]}))
