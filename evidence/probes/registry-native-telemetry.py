import json,sqlite3,time
from pathlib import Path
p=Path('/home/aswin/pods-launch-fresh/.data/pods.sqlite');db=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True)
records=[json.loads(v) for (v,) in db.execute("select value from records where kind='launch'")];db.close()
records=[x for x in records if x.get('appId')=='repo-46d8ac316f3e95857ce28b48-d6da2ed780ae-04f62fea5403' and x.get('createdAt',0)>=1791135300000]
result=[]
for x in sorted(records,key=lambda x:x['createdAt']):
 y={k:x[k] for k in ['appId','status','createdAt','providerReadyAt','readyAt','updatedAt','timings','storageMode'] if k in x}
 y['images']=[{k:i[k] for k in ['id','sha256','bytes','registry'] if k in i} for i in x.get('images',[])]
 if x.get('readyAt'):y['requestToHealthMs']=x['readyAt']-x['createdAt'];y['providerReadyToHealthMs']=x['readyAt']-x['providerReadyAt']
 result.append(y)
print(json.dumps({'recordedAt':time.time(),'launches':result},indent=2))
