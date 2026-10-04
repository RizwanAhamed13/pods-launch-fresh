import hashlib,json,os,sqlite3,subprocess,time
from pathlib import Path
from datetime import datetime,timezone
root=Path('/home/aswin/pods-launch-fresh');data=root/'.data';app='repo-46d8ac316f3e95857ce28b48-d6da2ed780ae-04f62fea5403'
revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
proof=json.loads((root/'evidence/stack-registry-platform-tests.json').read_text())
assert all(t['pass']==353 and t['fail']==t['cancelled']==0 for t in proof['tests'].values())
for name,expected in proof['sourceHashes'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected
assert json.loads((root/'evidence/stack-registry-platform-qa.json').read_text())['completed']
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==revision
before=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True));assert before['pid']==1635758 and before['runnerSha256']=='cfb3d769f330a9bd010132cfd50fe342167d930736d73df8ab644caa912b191e'
node=os.readlink('/proc/'+str(before['pid'])+'/exe');manifest=json.loads((data/'artifacts'/(app+'.json')).read_text())
assert [x['sha256'] for x in manifest['images']]==['41d7ce5a4b47d63b122094aaa15594a9f559ebc63b6caa92bbecd01cdadde78a','f078164d28ddf31c6ea97c0356b9eba598645ee7b47f02329b1e304bbea85d4f']
def state():
 db=sqlite3.connect('file:'+str(data/'pods.sqlite')+'?mode=ro',uri=True);rows=db.execute('select kind,id,value from records order by kind,id').fetchall();db.close()
 return {'maps':{i:json.loads(v) for k,i,v in rows if k=='image-delivery'},'other':hashlib.sha256(json.dumps([x for x in rows if x[0]!='image-delivery']).encode()).hexdigest()}
def inventory():return {'artifacts':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (data/'artifacts').iterdir() if p.is_file()},'images':{p.name:(p.stat().st_size,p.stat().st_mtime_ns) for p in (data/'images').iterdir() if p.is_file()}}
initial=state();saved=inventory();envhash=hashlib.sha256((root/'.env').read_bytes()).hexdigest()
assert len(initial['maps'])==20
assert sorted(p.name for p in (data/'registry/indexes').iterdir())==[manifest['images'][0]['sha256']+'.json']
assert len(list((data/'registry/blobs').iterdir()))==10
assert sorted(p.name for p in (data/'registry').iterdir())==['blobs','indexes']
out={'startedAt':datetime.now(timezone.utc).isoformat(),'sourceRevision':revision,'appId':app,'originalImages':manifest['images'],'before':before,'initialMappings':len(initial['maps']),'runs':[]}
try:
 for mode in ['publish','repeat-publish']:
  started=time.monotonic();r=subprocess.run([node,'--env-file=.env','scripts/prepare-image-registry.mjs','--app',app,'--publish'],cwd=root,env=dict(os.environ,NODE_NO_WARNINGS='1'),capture_output=True,text=True,timeout=300)
  assert r.returncode==0,'Prepared image indexing/publication failed; completed blobs and mappings retained'
  result=json.loads(r.stdout);assert result['appId']==app and [x['blobs'] for x in result['images']]==[10,15] and result['storedBytes']<=8589934592
  members={};indexes=[]
  for image in manifest['images']:
   index=json.loads((data/'registry/indexes'/(image['sha256']+'.json')).read_text());assert index['archiveSha256']==image['sha256'] and index['imageId']==image['id']
   for h,n in index['members'].items():
    p=data/'registry/blobs'/(h.removeprefix('sha256:')+'.gz');assert p.stat().st_size==n and hashlib.sha256(p.read_bytes()).hexdigest()==h.removeprefix('sha256:');members[h.removeprefix('sha256:')]=n
   indexes.append({'archiveSha256':image['sha256'],'imageId':image['id'],'blobs':len(index['members']),'blobBytes':sum(index['members'].values())})
  current=state();maps={h:current['maps'][h] for h in members}
  assert all(maps[h]['bytes']==n and maps[h]['assetId']>0 for h,n in members.items())
  assert all(current['maps'].get(k)==v for k,v in initial['maps'].items()) and current['other']==initial['other']
  if mode=='publish':first=maps
  else:assert maps==first and all(x['addedBlobBytes']==0 for x in result['images'])
  out['runs'].append({'mode':mode,'elapsedMs':round((time.monotonic()-started)*1000),'result':result,'indexes':indexes,'mappings':[{k:m[k] for k in ['sha256','bytes','assetId']} for m in maps.values()]})
 assert inventory()==saved and hashlib.sha256((root/'.env').read_bytes()).hexdigest()==envhash
 final=state();assert len(final['maps'])==35
 after=json.loads(subprocess.check_output(['python3','/tmp/pods-storage-deploy-audit.py'],text=True));assert after['pid']==before['pid'] and after['runnerSha256']==before['runnerSha256']
 prior=json.loads((root/'evidence/probes/registry-cdn-publication-receipt.json').read_text())['publication']['mappings']
 assert all(first[m['sha256']]['assetId']==m['assetId'] for m in prior)
 out.update(passed=True,after=after,finalMappings=len(final['maps']),rawBlobMappings=len(first),priorFlaskAssetsReused=True,sameAssetsReusedOnRepeat=True,unrelatedMappingsPreserved=True,nonDeliveryRecordsUnchanged=True,artifactFilesUnchanged=True,imageInventoryUnchanged=True,environmentUnchanged=True,serverRestarted=False)
except Exception:
 out['passed']=False;out['failure']='Production index verification failed; inspect last completed phase before retrying';raise
finally:
 out['finishedAt']=datetime.now(timezone.utc).isoformat();print(json.dumps(out,indent=2))
