import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {GitHubImageDelivery} from '/home/aswin/pods-launch-fresh/src/image-delivery.mjs';
const sha='8faad71cec12d7fc05acdf90ed38536da406e90b740430a9af3742b8fd21b5a7', image={sha256:sha,bytes:125123048};
const db=new DatabaseSync('/home/aswin/pods-launch-fresh/.data/pods.sqlite',{readOnly:true});
const mapping=db.prepare("SELECT value FROM records WHERE kind='image-delivery'").all().map(r=>JSON.parse(r.value)).find(r=>r.sha256===sha);db.close();
if(!mapping || mapping.assetId!==609893443 || mapping.bytes!==image.bytes)throw new Error('Verified image mapping missing');
const observations=[];
const safeHeaders=response=>Object.fromEntries(['date','age','cache-control','content-range','content-length','content-type','x-cache','x-cache-hits','retry-after'].map(k=>[k,response.headers.get(k)]));
const delivery=GitHubImageDelivery.fromEnv({data:'/home/aswin/pods-launch-fresh/.data',store:{get:(kind,key)=>kind==='image-delivery'&&key===sha?mapping:null}});
const nativeFetch=delivery.fetcher;
delivery.fetcher=async(url,options)=>{const at=performance.now();const r=await nativeFetch(url,options);observations.push({phase:new URL(url).pathname.includes('/releases/assets/')?'asset-redirect':'private-repository',status:r.status,elapsedMs:Math.round(performance.now()-at),headers:safeHeaders(r)});return r;};
const url=await delivery.resolve(image);
const out={recordedAt:new Date().toISOString(),host:'aswin',assetId:mapping.assetId,image,observations,redirectResolved:Boolean(url),applicationStarted:false,cacheCleared:false};
if(url){const parsed=new URL(url);out.redirect={host:parsed.hostname,pathSha256:createHash('sha256').update(parsed.pathname).digest('hex'),expiresAt:parsed.searchParams.get('se')};
 for(const range of ['bytes=0-0','bytes=1-1','bytes=0-15640380']){const at=performance.now();try{const r=await fetch(url,{headers:{Range:range},redirect:'error',signal:AbortSignal.timeout(10000)});const record={phase:'cdn-range-headers',requestedRange:range,status:r.status,elapsedMs:Math.round(performance.now()-at),headers:safeHeaders(r)};await r.body?.cancel();observations.push(record);}catch(e){observations.push({phase:'cdn-range-headers',requestedRange:range,errorName:e.name,elapsedMs:Math.round(performance.now()-at)});}}
}
console.log(JSON.stringify(out,null,2));
