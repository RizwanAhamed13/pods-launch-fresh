"""Delete only this experiment's two explicitly identified disposable assets."""
import hashlib, json, subprocess, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

out=json.loads(Path('/tmp/pods-range-native.json').read_text())
assert {a['id'] for a in out['assets']}=={609748536,609749327}
assert out['repository']=='RizwanAhamed13/pods-launch-artifacts-fresh'
token=subprocess.check_output(['gh','auth','token'],text=True).strip()
removed=[]
for asset in out['assets']:
 url=f"https://api.github.com/repos/{out['repository']}/releases/assets/{asset['id']}"
 headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'}
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=30) as response:current=json.load(response)
 assert current['name']==asset['name'] and current['name'].startswith('probe-20261004-range-a-')
 assert current['digest']=='sha256:'+asset['sha256'] and current['size']==asset['bytes']
 with urllib.request.urlopen(urllib.request.Request(url,method='DELETE',headers=headers),timeout=30) as response:assert response.status==204
 try:urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=30)
 except urllib.error.HTTPError as error:assert error.code==404
 else:raise AssertionError('Probe asset still present')
 removed.append(asset['id'])
out['cleanupPending']=False
out['cleanup']={'recordedAt':datetime.now(timezone.utc).isoformat(),'deletedProbeAssetIds':removed,'authorizedReadAfterDeleteStatus':404,'productionAssetsChanged':False,'sourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
out['decision']='Implement four validated concurrent ranges for CDN images at least 32 MiB, retaining whole-file SHA-256 verification before Docker load and authorized origin fallback on any range failure. This single sequential comparison motivates native acceptance; it is not a latency guarantee.'
Path('evidence/stack-cdn-range-experiment.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'deletedProbeAssetIds':removed,'receipt':'evidence/stack-cdn-range-experiment.json'}))
