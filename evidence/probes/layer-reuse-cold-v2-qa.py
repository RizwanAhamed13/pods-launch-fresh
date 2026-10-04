import subprocess
from pathlib import Path

source = Path('/home/aswin/pods-launch-fresh/.data/images/41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a.gz')
lxc = '/snap/lxd/current/bin/lxc'
guest = 'pods-fresh-matrix-01'
subprocess.run([lxc, 'file', 'push', '--mode', '0600', str(source), guest + '/output/layer-reuse-b75e0fb/full.gz'], check=True)

program = r'''import subprocess,json,time,hashlib
from pathlib import Path
p=Path('/output/layer-reuse-b75e0fb/cold-v2');p.mkdir();p.chmod(0o700)
receipt={'scope':'Isolated QA import capability with separate Docker and containerd roots, states and sockets; not native product timing','startedAt':time.time()}
daemons=[]
docker_sock='unix://'+str(p/'docker.sock');containerd_sock=str(p/'containerd.sock')
target='sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672'
def run(args,timeout=90):
 return subprocess.run(args,capture_output=True,text=True,timeout=timeout)
def docker(args):return run(['docker','--host',docker_sock,*args])
def ctr(args):return run(['ctr','--address',containerd_sock,'--namespace','pods-layer-probe',*args],10)
def main_inventory():
 result={}
 for key,args in [('images',['image','ls','--quiet','--no-trunc']),('containers',['ps','-a','--format','{{.ID}} {{.Status}}'])]:
  r=run(['docker',*args],10);assert r.returncode==0,'Existing QA Docker inventory unavailable'
  result[key]=sorted(r.stdout.strip().splitlines())
 return result
before=main_inventory()
try:
 for name,sha in [('thin.gz','fb501d1991763cc9cc4ce991463be5ee770940cd6526904207346249d7db5a23'),('full.gz','41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a')]:
  assert hashlib.sha256((p.parent/name).read_bytes()).hexdigest()==sha,'Input digest mismatch'
 config=p/'containerd.toml';config.write_text('version = 3\ndisabled_plugins = ["io.containerd.cri.v1.images", "io.containerd.cri.v1.runtime"]\n')
 with (p/'containerd.log').open('w') as log:
  c=subprocess.Popen(['containerd','--config',str(config),'--root',str(p/'containerd-root'),'--state',str(p/'containerd-state'),'--address',containerd_sock],stdout=log,stderr=subprocess.STDOUT);daemons.append(('containerd',c))
 deadline=time.monotonic()+20
 while time.monotonic()<deadline:
  assert c.poll() is None,'Private containerd exited'
  if ctr(['version']).returncode==0:break
  time.sleep(.3)
 else:raise RuntimeError('Private containerd readiness timeout')
 config=p/'daemon.json';config.write_text('{}')
 with (p/'docker.log').open('w') as log:
  d=subprocess.Popen(['dockerd','--config-file',str(config),'--data-root',str(p/'docker-data'),'--exec-root',str(p/'docker-exec'),'--pidfile',str(p/'docker.pid'),'--host',docker_sock,'--containerd',containerd_sock,'--containerd-namespace','pods-layer-probe','--containerd-plugins-namespace','pods-layer-probe-plugins','--bridge','none','--iptables=false','--ip6tables=false','--ip-forward=false','--ip-masq=false'],stdout=log,stderr=subprocess.STDOUT);daemons.append(('docker',d))
 deadline=time.monotonic()+25
 while time.monotonic()<deadline:
  assert d.poll() is None,'Private Docker exited'
  r=docker(['info','--format','{{json .}}'])
  if r.returncode==0:break
  time.sleep(.3)
 else:raise RuntimeError('Private Docker readiness timeout')
 info=json.loads(r.stdout);assert info['DockerRootDir']==str(p/'docker-data')
 receipt['engine']={k:info[k] for k in ['ServerVersion','Driver','DriverStatus']}
 receipt['isolation']={'explicitContainerdSocket':True,'separateContainerdRootAndState':True,'separateDockerRootAndState':True,'privateUnixSocketsOnly':True}
 r=docker(['image','ls','--quiet','--no-trunc']);assert r.returncode==0 and not r.stdout.strip(),'Private Docker images not empty'
 receipt['initialImageCount']=0
 r=ctr(['content','ls','--quiet']);assert r.returncode==0 and not r.stdout.strip(),'Private containerd blobs not empty'
 receipt['initialContentBlobCount']=0
 blobs=p/'containerd-root/io.containerd.content.v1.content/blobs'
 assert not blobs.exists() or not any(x.is_file() for x in blobs.rglob('*')),'Private physical content store not empty'
 receipt['initialPhysicalContentBlobCount']=0
 for phase,filename in [('missingBase','thin.gz'),('fullFallback','full.gz')]:
  start=time.monotonic();r=docker(['load','--input',str(p.parent/filename)])
  result={'exitCode':r.returncode,'elapsedMs':round((time.monotonic()-start)*1000),'output':(r.stdout+r.stderr)[-1800:]}
  check=docker(['image','inspect',target,'--format','{{.Id}}'])
  result['targetInspect']={'exitCode':check.returncode,'identityMatches':check.stdout.strip()==target}
  receipt[phase]=result
  if phase=='missingBase':assert r.returncode!=0,'Thin archive unexpectedly loaded without base blobs'
  else:assert r.returncode==0 and result['targetInspect']['identityMatches'],'Full fallback did not restore exact target'
 receipt['rootfs']=json.loads(docker(['image','inspect',target,'--format','{{json .RootFS.Layers}}']).stdout)
 code='import importlib.metadata as m; print(m.version("flask")); print(m.version("pymysql"))'
 r=docker(['run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','256m','--cpus','1','--pids-limit','64','--entrypoint','python',target,'-B','-c',code])
 receipt['fallbackRuntimeCheck']={'exitCode':r.returncode,'output':(r.stdout+r.stderr)[-500:]}
 assert r.returncode==0,'Fallback runtime dependency check failed'
 r=docker(['ps','-a','--quiet']);assert r.returncode==0 and not r.stdout.strip(),'Probe container left behind'
 receipt['probeContainersRemaining']=0;receipt['applicationStarted']=False;receipt['completed']=True
except Exception as error:
 receipt['diagnosticFailure']=str(error) or type(error).__name__
 raise
finally:
 receipt['cleanup']={}
 for name,daemon in reversed(daemons):
  if daemon.poll() is None:
   daemon.terminate()
   try:daemon.wait(timeout=20)
   except subprocess.TimeoutExpired:daemon.kill();daemon.wait();receipt['cleanup'][name+'ForcedStop']=True
  receipt['cleanup'][name+'Stopped']=daemon.poll() is not None
 try:
  after=main_inventory();receipt['existingQaImagesPreserved']=before['images']==after['images'];receipt['existingQaContainersPreserved']=before['containers']==after['containers']
 except Exception:receipt['existingQaInventoryCheckFailed']=True
 receipt['logs']={name:hashlib.sha256((p/name).read_bytes()).hexdigest() for name in ['docker.log','containerd.log'] if (p/name).exists()}
 receipt['finishedAt']=time.time();(p/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
'''
subprocess.run([lxc,'exec',guest,'--disable-stdin','--env','PATH=/opt/node/bin:/usr/sbin:/usr/bin:/sbin:/bin','--','python3','-c',program],check=True)
