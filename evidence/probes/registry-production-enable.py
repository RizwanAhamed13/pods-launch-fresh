import hashlib,json,os,re,subprocess,tempfile,time,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
root=Path('/home/aswin/pods-launch-fresh');data=root/'.data'
proof=json.loads((root/'evidence/stack-registry-platform-tests.json').read_text())
assert all(v['pass']==353 and v['fail']==v['cancelled']==0 for v in proof['tests'].values())
for name,expected in proof['sourceHashes'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected
recovery=json.loads(Path('/tmp/pods-registry-production-recovery-result.json').read_text());assert recovery['passed'] and recovery['sameAssetsReusedOnRepeat'] and recovery['rawBlobMappings']==25
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip()
revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
before=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True));assert before['pid']==1635758 and before['runnerSha256']=='cfb3d769f330a9bd010132cfd50fe342167d930736d73df8ab644caa912b191e'
def inventory():return {folder:sorted((str(p.relative_to(data/folder)),p.stat().st_size,p.stat().st_mtime_ns) for p in (data/folder).rglob('*') if p.is_file()) for folder in ('images','artifacts','registry')}
saved=inventory();original=(root/'.env').read_bytes();text=original.decode();key='PODS_IMAGE_REGISTRY_ENABLED'
lines=[l for l in text.splitlines() if l.startswith(key+'=')];assert not lines or lines==[key+'=0']
updated=re.sub(r'(?m)^'+key+r'=0$',key+'=1',text) if lines else text+('' if text.endswith('\n') else '\n')+key+'=1\n'
assert [l for l in updated.splitlines() if not l.startswith(key+'=')]==[l for l in text.splitlines() if not l.startswith(key+'=')]
def write_env(content):
 with tempfile.NamedTemporaryFile(dir=root,prefix='.env-registry-',delete=False) as f:f.write(content);name=f.name
 os.chmod(name,0o600);os.replace(name,root/'.env')
env=dict(os.environ,XDG_RUNTIME_DIR='/run/user/1000',DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/1000/bus')
def restart():subprocess.run(['systemctl','--user','restart','pods-launch-fresh.service'],env=env,check=True)
result={'startedAt':datetime.now(timezone.utc).isoformat(),'revision':revision,'before':before,'registryEnabled':False}
try:
 write_env(updated.encode());restart();after=None
 for attempt in range(15):
  try:after=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True,stderr=subprocess.DEVNULL));break
  except subprocess.CalledProcessError:time.sleep(1)
 assert after and after['pid']!=before['pid'] and after['runnerSha256']==before['runnerSha256']
 try:urllib.request.urlopen('http://127.0.0.1:8787/v2/',timeout=10);raise AssertionError('Expected authenticated registry challenge')
 except urllib.error.HTTPError as response:assert response.code==401 and response.headers.get('WWW-Authenticate','').startswith('Basic ')
 assert inventory()==saved and (root/'.env').stat().st_mode&0o777==0o600
 result.update(passed=True,registryEnabled=True,after=after,unauthenticatedRegistryStatus=401,otherEnvironmentValuesUnchanged=True,artifactImageRegistryInventoryUnchanged=True)
except Exception:
 write_env(original);restart();result.update(passed=False,rolledBack=True);raise
finally:
 result['finishedAt']=datetime.now(timezone.utc).isoformat();print(json.dumps(result,indent=2))
