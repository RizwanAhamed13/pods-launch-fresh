import subprocess

program=r'''import subprocess,json,time,os,hashlib,shutil,base64
from pathlib import Path
p=Path('/output/registry-probe-v3-1e2dc51');p.mkdir();p.chmod(0o700);os.chown(p,1000,1000)
shutil.copyfile('/output/layer-reuse-b75e0fb/full.gz',p/'input.gz');os.chown(p/'input.gz',1000,1000);(p/'input.gz').chmod(0o600)
receipt={'scope':'Actual Docker pulls through the candidate PODS read-only authenticated registry in isolated QA; no native provider or product timing','startedAt':time.time(),'runs':[]};server=None;daemons=[]
node=r"""import {createApp} from '/output/registry-candidate-1e2dc51/src/server.mjs';
import {prepareRegistryForApp} from '/output/registry-candidate-1e2dc51/src/image-registry.mjs';
import {digest} from '/output/registry-candidate-1e2dc51/src/util.mjs';
import {randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const root='/output/registry-probe-v3-1e2dc51',data=root+'/data';
const image={id:'sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672',sha256:'41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a',bytes:57046835};
await mkdir(data+'/images',{recursive:true,mode:0o700});await mkdir(data+'/artifacts',{mode:0o700});
await copyFile(root+'/input.gz',data+'/images/'+image.sha256+'.gz');
const artifact=gzipSync(JSON.stringify({format:2,runtime:'docker',healthPath:'/',containers:{web:'web',port:8080,images:[image],services:{web:{image:image.id}}}}));
await writeFile(data+'/artifacts/'+digest(artifact)+'.gz',artifact,{mode:0o600});
await writeFile(data+'/artifacts/registry-qa.json',JSON.stringify({id:'registry-qa',sha256:digest(artifact),bytes:artifact.length,images:[image]}),{mode:0o600});
const at=performance.now(),indexing=await prepareRegistryForApp({data,appId:'registry-qa',budget:512*1024**2});indexing.elapsedMs=Math.round(performance.now()-at);
const app=await createApp({data,secret:randomBytes(32).toString('hex'),providers:{},registryEnabled:true,imageDelivery:null});
const id='A'.repeat(32),token=randomBytes(24).toString('base64url');
app.store.put('launch',id,{id,status:'starting',expiresAt:Date.now()+600000,tokenHash:digest(token),images:[image]});
const requests=[];
app.server.on('request',(req,res)=>{const phase=readFileSync(root+'/phase','utf8');res.on('finish',()=>requests.push({phase,method:req.method,path:req.url,status:res.statusCode,bytes:req.method==='HEAD'?0:Number(res.getHeader('content-length')||0)}));});
await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
const host='127.0.0.1:'+app.server.address().port,repository=host+'/pods/'+Buffer.from(id).toString('hex')+'/'+image.sha256;
await mkdir(root+'/client',{mode:0o700});
await writeFile(root+'/client/config.json',JSON.stringify({auths:{[host]:{auth:Buffer.from(id+':'+token).toString('base64')}}}),{mode:0o600,flag:'wx'});
await writeFile(root+'/ready.json',JSON.stringify({host,repository,target:image.id,indexing}),{mode:0o600,flag:'wx'});
process.on('SIGTERM',async()=>{await new Promise(resolve=>app.server.close(resolve));await app.closeResources();await writeFile(root+'/requests.json',JSON.stringify(requests,null,2));process.exit(0);});
"""
(p/'server.mjs').write_text(node);os.chown(p/'server.mjs',1000,1000);(p/'phase').write_text('initial');os.chown(p/'phase',1000,1000)
def run(args,timeout=120):return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
def main_images():
 r=run(['docker','image','ls','--quiet','--no-trunc']);assert r.returncode==0;return sorted(r.stdout.splitlines())
before=main_images()
def stop_process(name,process):
 if process.poll() is None:
  process.terminate()
  try:process.wait(timeout=20)
  except subprocess.TimeoutExpired:process.kill();process.wait();receipt.setdefault('forcedStops',[]).append(name)
 receipt.setdefault('stopped',{})[name]=process.poll() is not None
def demote():os.setgid(1000);os.setuid(1000)
try:
 with (p/'server.log').open('w') as log:server=subprocess.Popen(['/opt/node/bin/node',str(p/'server.mjs')],stdout=log,stderr=subprocess.STDOUT,preexec_fn=demote,cwd=p,env={'PATH':'/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin','HOME':'/home/ubuntu'})
 deadline=time.monotonic()+45
 while not (p/'ready.json').exists():
  assert server.poll() is None,'Registry candidate exited before readiness'
  assert time.monotonic()<deadline,'Registry candidate readiness timeout'
  time.sleep(.25)
 ready=json.loads((p/'ready.json').read_text());receipt['indexing']=ready['indexing'];receipt['target']=ready['target']
 for mode in ['cold','shared-base']:
  d=p/mode;d.mkdir();cs=str(d/'containerd.sock');ds='unix://'+str(d/'docker.sock')
  (d/'containerd.toml').write_text('version = 3\ndisabled_plugins = ["io.containerd.cri.v1.images", "io.containerd.cri.v1.runtime"]\n')
  with (d/'containerd.log').open('w') as log:c=subprocess.Popen(['containerd','--config',str(d/'containerd.toml'),'--root',str(d/'containerd-root'),'--state',str(d/'containerd-state'),'--address',cs],stdout=log,stderr=subprocess.STDOUT);daemons.append((mode+'-containerd',c))
  def ctr(args):return run(['ctr','--address',cs,'--namespace','pods-registry-probe',*args],10)
  deadline=time.monotonic()+20
  while ctr(['version']).returncode:
   assert c.poll() is None and time.monotonic()<deadline,'Private containerd readiness failed';time.sleep(.3)
  (d/'docker.json').write_text('{}')
  with (d/'docker.log').open('w') as log:engine=subprocess.Popen(['dockerd','--config-file',str(d/'docker.json'),'--data-root',str(d/'docker-data'),'--exec-root',str(d/'docker-exec'),'--pidfile',str(d/'docker.pid'),'--host',ds,'--containerd',cs,'--containerd-namespace','pods-registry-probe','--containerd-plugins-namespace','pods-registry-probe-plugins','--bridge','none','--iptables=false','--ip6tables=false','--ip-forward=false','--ip-masq=false'],stdout=log,stderr=subprocess.STDOUT);daemons.append((mode+'-docker',engine))
  def docker(args):return run(['docker','--host',ds,'--config',str(p/'client'),*args])
  deadline=time.monotonic()+25
  while True:
   assert engine.poll() is None and time.monotonic()<deadline,'Private Docker readiness failed'
   r=docker(['info','--format','{{json .}}'])
   if r.returncode==0:break
   time.sleep(.3)
  info=json.loads(r.stdout);assert info['DockerRootDir']==str(d/'docker-data')
  assert not docker(['image','ls','--quiet']).stdout.strip();assert not ctr(['content','ls','--quiet']).stdout.strip()
  blob_root=d/'containerd-root/io.containerd.content.v1.content/blobs';assert not blob_root.exists() or not any(x.is_file() for x in blob_root.rglob('*'))
  result={'mode':mode,'engine':{k:info[k] for k in ['ServerVersion','Driver','DriverStatus']},'initialImages':0,'initialPhysicalBlobs':0,'pulls':[]};receipt['runs'].append(result)
  if mode=='shared-base':
   base=Path('/output/layer-reuse-b75e0fb/base.gz');assert hashlib.sha256(base.read_bytes()).hexdigest()=='3f34e12c187fe7d2bdd50bb5910b72381a3b5d4d7c83633fa680fedea91d2032'
   r=docker(['load','--input',str(base)]);assert r.returncode==0
   assert docker(['image','inspect',ready['target']]).returncode!=0
   result['baseImported']=True;result['targetAbsentBeforePull']=True
  for attempt in range(2 if mode=='cold' else 1):
   phase=mode+('-cached' if attempt else '');(p/'phase').write_text(phase)
   start=time.monotonic();r=docker(['pull','--platform','linux/amd64',ready['repository']+'@'+ready['target']])
   pull={'phase':phase,'elapsedMs':round((time.monotonic()-start)*1000),'exitCode':r.returncode};result['pulls'].append(pull)
   assert r.returncode==0,'Authenticated Docker pull failed: '+(r.stdout+r.stderr)[-1600:]
   identity=docker(['image','inspect',ready['target'],'--format','{{.Id}}']);pull['identityMatches']=identity.stdout.strip()==ready['target'];assert pull['identityMatches']
  result['rootfs']=json.loads(docker(['image','inspect',ready['target'],'--format','{{json .RootFS.Layers}}']).stdout)
  code='import importlib.metadata as m; print(m.version("flask")); print(m.version("pymysql"))'
  r=docker(['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','256m','--cpus','1','--pids-limit','64','--entrypoint','python',ready['target'],'-B','-c',code]);result['runtimeCheck']={'exitCode':r.returncode,'output':r.stdout[-500:]};assert r.returncode==0
  assert not docker(['ps','--all','--quiet']).stdout.strip();result['remainingContainers']=0
  stop_process(mode+'-docker',engine);stop_process(mode+'-containerd',c)
 receipt['completed']=True
except Exception as error:receipt['failure']=str(error) or type(error).__name__;raise
finally:
 for name,process in reversed(daemons):stop_process(name,process)
 if server is not None:stop_process('registry-server',server)
 if (p/'requests.json').exists():receipt['requests']=json.loads((p/'requests.json').read_text())
 receipt['existingQaImagesPreserved']=before==main_images()
 if (p/'client/config.json').exists():(p/'client/config.json').unlink()
 receipt['temporaryClientCredentialsRemoved']=not (p/'client/config.json').exists();receipt['finishedAt']=time.time()
 (p/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
'''
subprocess.run(['/snap/lxd/current/bin/lxc','exec','pods-fresh-matrix-01','--disable-stdin','--env','PATH=/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin','--','python3','-c',program],check=True)
