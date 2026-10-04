import hashlib,json,subprocess,urllib.request,urllib.error,urllib.parse
from pathlib import Path
from datetime import datetime,timezone
repo='RizwanAhamed13/pods-launch-artifacts-fresh'; asset=609702555
expected='07408dbaef08a310f195b938eee2a54f2e2daa7405d7298173759d7a9db2502c'; size=125122726
workspace='pods-launch-containers-69rw5vx4xp46c5qw5'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect)
def request(url,headers):
 try:return opener.open(urllib.request.Request(url,headers=headers),timeout=30)
 except urllib.error.HTTPError as e:return e
meta=json.loads(subprocess.check_output(['gh','api','repos/'+repo]))
assert meta['private'] is True
asset_url=f'https://api.github.com/repos/{repo}/releases/assets/{asset}'
with request(asset_url,{'Accept':'application/octet-stream'}) as response:
 anonymous_status=response.status
assert anonymous_status==404, f'Unauthenticated asset response was {anonymous_status}'
token=subprocess.check_output(['gh','auth','token'],text=True).strip()
with request(asset_url,{'Accept':'application/octet-stream','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'}) as response:
 status=response.status; location=response.headers.get('Location')
assert status==302 and location, 'Asset API did not return a direct signed download'
parsed=urllib.parse.urlparse(location)
assert parsed.scheme=='https' and parsed.hostname=='release-assets.githubusercontent.com'
source=Path('evidence/stack-artifact-cdn-probe.mjs').read_text()
code=source.replace('export async function','async function')+'\nconst results=[]; for(let i=0;i<2;i++) results.push(await probeArtifactDownload('+json.dumps(location)+','+json.dumps(expected)+','+str(size)+')); console.log(JSON.stringify(results));\n'
state=json.loads(subprocess.check_output(['gh','api','/user/codespaces/'+workspace]))['state']
assert state=='Available',state
started=datetime.now(timezone.utc).isoformat()
r=subprocess.run(['gh','codespace','ssh','-c',workspace,'--','node --input-type=module'],input=code,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=180)
if r.returncode:
 print(json.dumps({'exitCode':r.returncode,'startedAt':started,'error':'Codespace probe failed; raw transport output withheld to protect the signed URL.'}))
 raise SystemExit(1) # Do not publish raw transport diagnostics, which may contain the signed URL.
observations=json.loads(r.stdout)
result={'startedAt':started,'recordedAt':datetime.now(timezone.utc).isoformat(),'repository':repo,'repositoryPrivate':meta['private'],'assetId':asset,'assetApiStatus':status,'anonymousAssetApiStatus':anonymous_status,'signedUrlHost':parsed.hostname,'signedUrlExpiresAt':urllib.parse.parse_qs(parsed.query).get('se',[None])[0],'provider':'codespaces','initialComputeState':state,'probeSha256':hashlib.sha256(source.encode()).hexdigest(),'observations':observations,'scope':'Two sequential byte-verified private CDN downloads on already available user compute. Each used a fresh temporary file and removed it. No Docker load, application launch or browser timing is included. Historical aswin measurements are a separate, uncontrolled comparison.'}
Path('/tmp/pods-artifact-cdn-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
