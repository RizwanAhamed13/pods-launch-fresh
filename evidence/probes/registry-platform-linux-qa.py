import subprocess
lxc='/snap/lxd/current/bin/lxc'
guest='pods-fresh-matrix-01'
subprocess.run([lxc,'file','push','/tmp/pods-registry-platform-v3-candidate-7b27f28.tar.gz',guest+'/tmp/pods-registry-platform-v3-candidate-7b27f28.tar.gz'],check=True)
program='''import hashlib,json,tarfile,subprocess,sys
from pathlib import Path
p=Path('/output/registry-platform-v3-candidate-7b27f28');p.mkdir()
with tarfile.open('/tmp/pods-registry-platform-v3-candidate-7b27f28.tar.gz') as t:t.extractall(p,filter='data')
m=json.loads((p/'candidate-manifest.json').read_text())
assert all(hashlib.sha256((p/k).read_bytes()).hexdigest()==v for k,v in m.items())
(p/'node_modules').symlink_to('/opt/pods/node_modules',target_is_directory=True)
print(json.dumps({'snapshotFilesMatched':len(m)}),flush=True)
result=subprocess.run(['/opt/node/bin/node','--test','--test-timeout=60000','--test-reporter=tap',*[str(f.relative_to(p)) for f in sorted((p/'test').glob('*.test.mjs'))]],cwd=p)
sys.exit(result.returncode)
'''
subprocess.run([lxc,'exec',guest,'--disable-stdin','--user','1000','--group','1000','--env','PATH=/opt/node/bin:/usr/bin:/bin','--','python3','-c',program],check=True)
