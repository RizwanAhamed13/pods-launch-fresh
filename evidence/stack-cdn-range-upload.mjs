import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const repository='RizwanAhamed13/pods-launch-artifacts-fresh', release=402982733;
const sha='e14ef3717c2560df51b9ceb038a2363642ba436e307ac80e9c3c19dbb8ac8cca',bytes=125121394;
const path='/home/aswin/pods-launch-fresh/.data/images/'+sha+'.gz';
const token=process.env.PODS_IMAGE_RELEASE_TOKEN;
async function api(url,opts={}) {
 const r=await fetch(url,{...opts,redirect:'error',headers:{Accept:'application/vnd.github+json',...opts.headers,Authorization:'Bearer '+token},signal:AbortSignal.timeout(180000)});
 if(!r.ok)throw new Error('Image probe API request failed: '+r.status);
 return r.json();
}
if(!token)throw new Error('Configured token unavailable');
if(!(await api('https://api.github.com/repos/'+repository)).private)throw new Error('Private storage required');
if((await stat(path)).size!==bytes)throw new Error('Wrong image size');
const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);
if(hash.digest('hex')!==sha)throw new Error('Wrong image bytes');
const inventory=await api(`https://api.github.com/repos/${repository}/releases/${release}/assets?per_page=100`);
for(const method of ['four-ranges','serial']) {
 const name=`probe-20261004-range-a-${method}-${sha}.gz`;
 if(inventory.some(asset=>asset.name===name))throw new Error('Probe name already exists; inspect the same attempt instead of uploading again');
 const started=Date.now();
 const asset=await api(`https://uploads.github.com/repos/${repository}/releases/${release}/assets?name=${name}`,{method:'POST',headers:{'Content-Type':'application/gzip','Content-Length':String(bytes)},body:createReadStream(path),duplex:'half'});
 if(asset.name!==name||asset.size!==bytes||asset.digest!=='sha256:'+sha||asset.state!=='uploaded')throw new Error('Uploaded probe identity mismatch');
 console.log(JSON.stringify({method,id:asset.id,name,bytes,sha256:sha,digest:asset.digest,uploadMs:Date.now()-started,recordedAt:new Date().toISOString()}));
}
