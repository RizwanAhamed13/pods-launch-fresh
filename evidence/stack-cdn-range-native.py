"""Consume the exact probe-upload ledger; signed URLs travel only through SSH stdin."""
import hashlib, json, subprocess, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

repository='RizwanAhamed13/pods-launch-artifacts-fresh'
workspace='pods-launch-containers-69rw5vx4xp46c5qw5'
assets=[json.loads(line) for line in Path('/tmp/pods-range-upload.jsonl').read_text().splitlines()]
assert len(assets)==2 and [a['method'] for a in assets]==['four-ranges','serial']
assert len({a['id'] for a in assets})==2
assert all(a['name'].startswith('probe-20261004-range-a-') for a in assets)
meta=json.loads(subprocess.check_output(['gh','api','repos/'+repository]))
assert meta['private'] is True
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
token=subprocess.check_output(['gh','auth','token'],text=True).strip()
targets=[]
for a in assets:
 asset=json.loads(subprocess.check_output(['gh','api',f"repos/{repository}/releases/assets/{a['id']}"]))
 assert (asset['name'],asset['size'],asset['digest'],asset['state'])==(a['name'],a['bytes'],'sha256:'+a['sha256'],'uploaded')
 request=urllib.request.Request(f"https://api.github.com/repos/{repository}/releases/assets/{a['id']}",headers={'Accept':'application/octet-stream','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'})
 try:response=opener.open(request,timeout=30)
 except urllib.error.HTTPError as error:response=error
 with response:
  assert response.status==302
  location=response.headers['Location']
 parsed=urllib.parse.urlparse(location)
 assert parsed.scheme=='https' and parsed.hostname=='release-assets.githubusercontent.com' and not parsed.username and not parsed.fragment
 a['signedPathSha256']=hashlib.sha256(parsed.path.encode()).hexdigest()
 a['signedUrlExpiresAt']=urllib.parse.parse_qs(parsed.query).get('se',[None])[0]
 targets.append({'method':a['method'],'assetId':a['id'],'url':location,'sha256':a['sha256'],'bytes':a['bytes']})
assert len({a['signedPathSha256'] for a in assets})==2
sources={name:Path('evidence/'+name).read_text() for name in ['stack-artifact-cdn-probe.mjs','stack-cdn-range-probe.mjs']}
code='\n'.join(value.replace('export async function','async function') for value in sources.values())
code+='\nconst targets='+json.dumps(targets)+''';
const observations=[];
for(let repeat=0;repeat<2;repeat++)for(const t of targets){
 const start=performance.now();
 const result=await (t.method==='four-ranges'?probeRangeDownload:probeArtifactDownload)(t.url,t.sha256,t.bytes);
 observations.push({...result,assetId:t.assetId,method:t.method,repeat,probeTotalMs:Math.round(performance.now()-start)});
}
console.log(JSON.stringify(observations));
'''
state=json.loads(subprocess.check_output(['gh','api','/user/codespaces/'+workspace]))['state']
assert state=='Available',state
started=datetime.now(timezone.utc).isoformat()
try:
 run=subprocess.run(['gh','codespace','ssh','-c',workspace,'--','node --input-type=module'],input=code,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=300)
except subprocess.TimeoutExpired:
 print(json.dumps({'startedAt':started,'error':'Probe observation timeout. Do not repeat before checking the same remote operation.'}))
 raise SystemExit(1)
if run.returncode:
 print(json.dumps({'startedAt':started,'exitCode':run.returncode,'error':'Native transfer probe failed; raw transport output withheld to protect signed URLs.'}))
 raise SystemExit(1)
observations=json.loads(run.stdout)
assert len(observations)==4 and all(o['diskHashMatches'] and o['temporaryFilesRemoved'] for o in observations)
out={'startedAt':started,'recordedAt':datetime.now(timezone.utc).isoformat(),'repository':repository,'repositoryPrivate':True,'provider':'codespaces','initialComputeState':state,'assets':assets,'sourceHashes':{name:hashlib.sha256(value.encode()).hexdigest() for name,value in sources.items()},'observations':observations,'scope':'First observed downloads from two newly uploaded asset paths, then one repeat each on the same available Codespace. Exact same image bytes; distinct paths verified by hash. Four ranges and serial are sequential, in that order. Origin/CDN caches and network traffic are not controlled. No Docker load or full product launch is measured. No existing app data or image caches are changed.','documentation':'https://learn.microsoft.com/en-us/rest/api/storageservices/get-blob','cleanupPending':True}
Path('/tmp/pods-range-native.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
