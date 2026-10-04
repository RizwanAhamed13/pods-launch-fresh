import hashlib,json,os,subprocess,sys,time,urllib.request
from pathlib import Path
from datetime import datetime,timezone
root=Path('/home/aswin/pods-launch-fresh');revision='7b27f2859dc28e25b19871ce8bc890c5d2c997ac'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==revision
assert not subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip()
proof=json.loads((root/'evidence/stack-registry-launch-tests.json').read_text())
assert all(r['pass']==328 and r['fail']==r['cancelled']==0 for r in proof['tests'].values())
for name,expected in proof['sourceHashes'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected,name
cdn=json.loads((root/'evidence/stack-registry-cdn-qa.json').read_text())
assert cdn['passingPulls']['inspectedSharedBase']['allThreeCredentialHeadersAbsent'] and cdn['passingPulls']['directEmptyStore']['fallbacks']==0
before=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True))
assert before['pid']==1589423 and before['runnerSha256']=='999300822c203590074dc327387c01938409b49562b41052f2381d0edf8902f0'
assert not (root/'.data/registry').exists()
node=os.readlink(f"/proc/{before['pid']}/exe")
program="import{build}from'esbuild';import{createHash}from'node:crypto';const r=await build({entryPoints:['src/runner.mjs'],bundle:true,platform:'node',format:'esm',target:'node22',write:false});console.log(createHash('sha256').update(r.outputFiles[0].contents).digest('hex'));"
expected_runner=subprocess.check_output([node,'--input-type=module','-e',program],cwd=root,text=True).strip()
def inventory():return {folder:sorted((p.name,p.stat().st_size,p.stat().st_mtime_ns) for p in (root/'.data'/folder).iterdir() if p.is_file()) for folder in ('images','artifacts')}
def writers():
 found=[]
 for p in Path('/proc').iterdir():
  if not p.name.isdigit():continue
  try:
   if (p/'cwd').resolve()!=root:continue
   args=(p/'cmdline').read_bytes().split(b'\0')
   if any(x in args for x in [b'src/server.mjs',b'scripts/prepare-image-registry.mjs',b'scripts/migrate-prepared-images.mjs']):found.append(int(p.name))
  except (OSError,PermissionError):pass
 return sorted(found)
assert writers()==[before['pid']],writers()
saved=inventory();environment_hash=hashlib.sha256((root/'.env').read_bytes()).hexdigest()
flags=[l.partition('=')[2].strip().strip('"\x27') for l in (root/'.env').read_text().splitlines() if l.startswith('PODS_IMAGE_REGISTRY_ENABLED=')]
assert not flags or flags==['0']
env=dict(os.environ,XDG_RUNTIME_DIR='/run/user/1000',DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/1000/bus')
subprocess.run(['systemctl','--user','restart','pods-launch-fresh.service'],env=env,check=True)
after=None
for attempt in range(15):
 try:
  after=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True,stderr=subprocess.DEVNULL));break
 except subprocess.CalledProcessError:time.sleep(1)
assert after and after['pid']!=before['pid'] and after['runnerSha256']==expected_runner
assert writers()==[after['pid']],writers()
assert inventory()==saved and hashlib.sha256((root/'.env').read_bytes()).hexdigest()==environment_hash
assert not (root/'.data/registry').exists()
print(json.dumps({'recordedAt':datetime.now(timezone.utc).isoformat(),'revision':revision,'before':before,'after':after,'imageFilesPreserved':len(saved['images']),'artifactFilesPreserved':len(saved['artifacts']),'inventoryUnchanged':True,'environmentUnchanged':True,'expectedRunnerSha256':expected_runner,'registryEnabled':False,'onlyControlPlaneWriterPid':after['pid'],'testEvidence':'stack-registry-launch-tests.json','cdnEvidence':'stack-registry-cdn-qa.json'},indent=2))
