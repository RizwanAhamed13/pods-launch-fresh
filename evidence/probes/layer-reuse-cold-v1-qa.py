import subprocess
program=r'''import subprocess,json,time,os,signal,hashlib
from pathlib import Path
p=Path('/output/layer-reuse-b75e0fb/cold');p.mkdir();p.chmod(0o700);config=p/'daemon.json';config.write_text(json.dumps({'features':{'containerd-snapshotter':True}}));sock='unix://'+str(p/'docker.sock');log=p/'daemon.log';receipt={'scope':'Fresh private Docker content store; no existing Docker or user cache cleared','startedAt':time.time()};daemon=None
try:
 with log.open('w') as output:
  daemon=subprocess.Popen(['dockerd','--config-file',str(config),'--data-root',str(p/'data'),'--exec-root',str(p/'exec'),'--pidfile',str(p/'docker.pid'),'--host',sock,'--bridge','none','--iptables=false','--ip6tables=false','--ip-forward=false','--ip-masq=false'],stdout=output,stderr=subprocess.STDOUT)
 deadline=time.monotonic()+25
 while time.monotonic()<deadline:
  if daemon.poll() is not None:raise RuntimeError('Private daemon exited before readiness')
  r=subprocess.run(['docker','--host',sock,'info','--format','{{json .}}'],capture_output=True,text=True,timeout=3)
  if r.returncode==0:break
  time.sleep(.5)
 else:raise RuntimeError('Private daemon readiness timeout')
 info=json.loads(r.stdout);assert info['DockerRootDir']==str(p/'data');receipt['engine']={k:info[k] for k in ['ServerVersion','Driver','DriverStatus']}
 def docker(args):return subprocess.run(['docker','--host',sock,*args],capture_output=True,text=True,timeout=60)
 before=docker(['image','ls','--quiet','--no-trunc']);assert not before.stdout.strip();receipt['initialImageCount']=0
 start=time.monotonic();r=docker(['load','--input','/output/layer-reuse-b75e0fb/thin.gz']);receipt['load']={'exitCode':r.returncode,'elapsedMs':round((time.monotonic()-start)*1000),'output':(r.stdout+r.stderr)[-1800:]}
 target='sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672';check=docker(['image','inspect',target,'--format','{{.Id}}']);receipt['targetInspect']={'exitCode':check.returncode,'identityMatches':check.stdout.strip()==target};receipt['missingBaseRejected']=r.returncode!=0
except Exception as error:receipt['diagnosticFailure']=str(error);raise
finally:
 if daemon is not None and daemon.poll() is None:
  daemon.terminate()
  try:daemon.wait(timeout=20)
  except subprocess.TimeoutExpired:daemon.kill();daemon.wait();receipt['forcedDaemonStop']=True
 receipt['privateDaemonStopped']=daemon is not None and daemon.poll() is not None;receipt['daemonLogSha256']=hashlib.sha256(log.read_bytes()).hexdigest() if log.exists() else None;receipt['finishedAt']=time.time();(p/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))
'''
subprocess.run(['/snap/lxd/current/bin/lxc','exec','pods-fresh-matrix-01','--disable-stdin','--env','PATH=/opt/node/bin:/usr/bin:/bin','--','python3','-c',program],check=True)
