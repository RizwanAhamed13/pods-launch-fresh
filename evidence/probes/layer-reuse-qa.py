import hashlib,json,subprocess,tarfile,time
from pathlib import Path
root=Path('/home/aswin/pods-launch-fresh/.data/images');stage=Path('/tmp/pods-layer-reuse-b75e0fb');stage.mkdir()
source='41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a';base='3f34e12c187fe7d2bdd50bb5910b72381a3b5d4d7c83633fa680fedea91d2032'
metadata=json.loads(Path('/tmp/pods-layer-diagnostic-archive-metadata.json').read_text());a,b=metadata[:2];shared=set(a['manifest'][0]['Layers'])&set(b['manifest'][0]['Layers']);assert len(shared)==4
for sha in [source,base]:assert hashlib.sha256((root/(sha+'.gz')).read_bytes()).hexdigest()==sha
skipped=0;kept=0
with tarfile.open(root/(source+'.gz'),'r|gz') as incoming,tarfile.open(stage/'thin.gz','w|gz',compresslevel=1) as outgoing:
 for entry in incoming:
  if entry.name in shared:skipped+=entry.size;continue
  outgoing.addfile(entry,incoming.extractfile(entry) if entry.isfile() else None);kept+=entry.size if entry.isfile() else 0
assert skipped==46220071
receipt={'sourceArchiveSha256':source,'sourceArchiveBytes':(root/(source+'.gz')).stat().st_size,'baseArchiveSha256':base,'thinArchiveSha256':hashlib.sha256((stage/'thin.gz').read_bytes()).hexdigest(),'thinArchiveBytes':(stage/'thin.gz').stat().st_size,'omittedCompressedLayerBytes':skipped,'omittedMembers':sorted(shared),'retainedMemberBytes':kept}
(stage/'receipt.json').write_text(json.dumps(receipt,indent=2))
lxc='/snap/lxd/current/bin/lxc';guest='pods-fresh-matrix-01';target='/output/layer-reuse-b75e0fb'
def execute(args):return subprocess.run([lxc,'exec',guest,'--disable-stdin','--user','1000','--group','1000','--env','PATH=/opt/node/bin:/usr/bin:/bin','--',*args],check=True)
execute(['mkdir',target])
for local,name in [(stage/'thin.gz','thin.gz'),(stage/'receipt.json','receipt.json'),(root/(base+'.gz'),'base.gz')]:subprocess.run([lxc,'file','push','--uid','1000','--gid','1000','--mode','0600',str(local),guest+target+'/'+name],check=True)
program='''import hashlib,json,subprocess,time
from pathlib import Path
p=Path('/output/layer-reuse-b75e0fb');r=json.loads((p/'receipt.json').read_text());target='sha256:b665a14dc0b04f33af0d1cc12992b0535c9652e47e2a13b0b0282b1412b23672';base='sha256:9846cdb84ce20ba80a2d4c4baf5bab0fe4a382646c8280ac8055742c76ad262f'
def docker(args,timeout=120):return subprocess.run(['docker',*args],capture_output=True,text=True,timeout=timeout)
def present(image):return docker(['image','inspect',image,'--format','{{.Id}}']).stdout.strip()==image
assert not present(target),'Selected target already present; comparison not valid'
assert hashlib.sha256((p/'thin.gz').read_bytes()).hexdigest()==r['thinArchiveSha256']
assert hashlib.sha256((p/'base.gz').read_bytes()).hexdigest()==r['baseArchiveSha256']
r['targetInitiallyAbsent']=True;r['baseInitiallyPresent']=present(base);t=time.monotonic();x=docker(['load','--input',str(p/'base.gz')]);assert x.returncode==0 and present(base),'Base import failed';r['baseLoadMs']=round((time.monotonic()-t)*1000);assert not present(target)
t=time.monotonic();x=docker(['load','--input',str(p/'thin.gz')]);r['thinLoad']={'exitCode':x.returncode,'elapsedMs':round((time.monotonic()-t)*1000),'targetPresent':present(target),'output':(x.stdout+x.stderr)[-1200:]}
if x.returncode==0 and r['thinLoad']['targetPresent']:
 r['rootfs']=json.loads(docker(['image','inspect',target,'--format','{{json .RootFS.Layers}}']).stdout)
 code='import importlib.metadata as m; print(m.version("flask")); print(m.version("pymysql"))'
 x=docker(['run','--rm','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','256m','--cpus','1','--pids-limit','64','--entrypoint','python',target,'-B','-c',code],30)
 r['runtimeCheck']={'exitCode':x.returncode,'output':(x.stdout+x.stderr)[-500:]}
r['checkedAt']=time.time();r['existingCachePreserved']=True;r['applicationStarted']=False;r['comparisonScope']='Isolated image import capability, not native provider or product timing';(p/'result.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
'''
execute(['python3','-c',program])
