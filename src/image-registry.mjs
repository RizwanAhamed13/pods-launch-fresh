import {createReadStream} from 'node:fs';
import {mkdir, lstat, readFile, readdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pipeline} from 'node:stream/promises';
import {command, digest, same} from './util.mjs';
import {migratePreparedImages} from './image-migration.mjs';
import {trustedImageUrl} from './artifact-url.mjs';

const sha = /^[a-f0-9]{64}$/, imageId = /^sha256:[a-f0-9]{64}$/;
const maxMetadata = 1024 ** 2;
const manifestTypes = new Set(['application/vnd.oci.image.manifest.v1+json','application/vnd.oci.image.index.v1+json','application/vnd.docker.distribution.manifest.v2+json','application/vnd.docker.distribution.manifest.list.v2+json']);
const failure = (status, message) => Object.assign(new Error(message), {status});

// All control-plane image writers share this lock. A crash leaves a visible lock
// for operator recovery; never guess that another writer is dead or delete its work.
export async function withImageStoreWrite(data, action) {
  await mkdir(data, {recursive:true,mode:0o700});
  const lock = join(data, 'image-store-write.lock');
  await mkdir(lock, {mode:0o700}).catch(() => {throw new Error('Prepared image store is busy; retry after the current writer finishes.');});
  try {return await action();} finally {await rm(lock, {recursive:true});}
}

export async function imageStoreBytes(data) {
  let bytes = 0, entries = 0;
  const walk = async path => {
    for (const name of await readdir(path).catch(error => {if(error.code==='ENOENT')return [];throw error;})) {
      if (++entries > 10000) throw new Error('Prepared image inventory exceeds its bound.');
      const file = join(path,name), info = await lstat(file);
      if(info.isDirectory()) await walk(file);
      else if(info.isFile()) bytes += info.size;
      else throw new Error('Prepared image inventory contains a non-regular entry.');
    }
  };
  await walk(join(data,'images')); await walk(join(data,'registry'));
  return bytes;
}

async function boundedJson(path) {
  const info=await lstat(path);
  if(!info.isFile() || info.size>maxMetadata)throw new Error('Registry metadata is not a bounded regular file.');
  return JSON.parse(await readFile(path,'utf8'));
}

export async function registryIndex(data, image) {
  if(!sha.test(image?.sha256 || '') || !imageId.test(image?.id || ''))return null;
  let value;
  try {value=await boundedJson(join(data,'registry','indexes',image.sha256+'.json'));}
  catch(error) {if(error.code==='ENOENT')return null;throw error;}
  if(value.version!==1 || value.archiveSha256!==image.sha256 || value.imageId!==image.id || value.archiveBytes!==image.bytes || !value.members || !value.manifests || Object.keys(value.members).length>128 || !manifestTypes.has(value.manifests[image.id]))throw new Error('Registry image identity mismatch.');
  for(const [id,bytes] of Object.entries(value.members))if(!imageId.test(id) || !Number.isSafeInteger(bytes) || bytes<1 || bytes>512*1024**2)throw new Error('Invalid registry blob identity.');
  for(const [id,type] of Object.entries(value.manifests))if(!Object.hasOwn(value.members,id) || !manifestTypes.has(type))throw new Error('Invalid registry manifest identity.');
  return value;
}

// Supplement existing immutable artifacts. No rebuild, changed launch link or
// credentials in the archive. Unsupported Docker archive formats fail closed.
export async function prepareRegistryForApp({data,appId,budget,delivery=null}) {
  if(!Number.isSafeInteger(budget)||budget<1)throw new Error('Invalid prepared image storage budget.');
  return withImageStoreWrite(data,async()=>{
    await migratePreparedImages({data,appId});
    const manifest=await boundedJson(join(data,'artifacts',appId+'.json'));
    const results=[];
    for(const image of manifest.images || []) {
      const output=await command('python3',['-I',fileURLToPath(new URL('../scripts/index-image.py',import.meta.url))],{
        input:JSON.stringify({data,image,budget}),env:{PATH:process.env.PATH},timeout:180000,
      });
      const result=JSON.parse(output),index=await registryIndex(data,image);
      if(!index)throw new Error('Registry index was not published.');
      if(delivery)await delivery.publish(Object.entries(index.members).map(([id,bytes])=>({sha256:id.slice(7),bytes})),{directory:join(data,'registry','blobs'),contentType:'application/octet-stream'});
      results.push({...result,delivery:delivery?'private-cdn':'origin'});
    }
    return {appId,images:results,storedBytes:await imageStoreBytes(data)};
  });
}

// Minimal read-only OCI pull surface. Repository names bind the capability's
// launch ID and original archive digest; a known blob digest grants no access.
export async function serveImageRegistry(req,res,{data,store,delivery=null}) {
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith('/v2/'))return false;
  const reply=(status,code,message)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({errors:[{code,message}]}));};
  res.setHeader('Docker-Distribution-API-Version','registry/2.0');
  res.setHeader('Cache-Control','no-store');
  try {
    if(!['GET','HEAD'].includes(req.method))throw failure(405,'Registry is read-only.');
    const encoded=/^Basic ([A-Za-z0-9+/]+={0,2})$/.exec(req.headers.authorization || '')?.[1];
    const credentials=encoded && encoded.length<=512 ? Buffer.from(encoded,'base64').toString('utf8') : '';
    const [id,token,...extra]=credentials.split(':');
    const authorized=()=>{
      const launch=/^[A-Za-z0-9_-]{32}$/.test(id||'') && store.get('launch',id);
      return launch && !extra.length && same(digest(token||''),launch.tokenHash) && launch.expiresAt>Date.now() && !launch.stopRequested && !['stopped','failed'].includes(launch.status) ? launch : null;
    };
    const launch=authorized();
    if(!launch){res.setHeader('WWW-Authenticate','Basic realm="PODS launch"');throw failure(401,'Launch authorization expired or invalid.');}
    if(path==='/v2/'){res.writeHead(200,{'Content-Type':'application/json','Content-Length':'2'});res.end(req.method==='HEAD'?undefined:'{}');return true;}
    const route=/^\/v2\/pods\/([a-f0-9]{64})\/([a-f0-9]{64})\/(manifests|blobs)\/(sha256:[a-f0-9]{64})$/.exec(path);
    if(!route || route[1]!==Buffer.from(id).toString('hex'))throw failure(404,'Prepared image unavailable.');
    const image=launch.images?.find(image=>image.sha256===route[2]);
    const index=image && await registryIndex(data,image);
    const blobId=route[4],bytes=index?.members[blobId],type=route[3]==='manifests'?index?.manifests[blobId]:'application/octet-stream';
    if(!bytes || !type)throw failure(404,'Prepared image content unavailable.');
    const file=join(data,'registry','blobs',blobId.slice(7)+'.gz'),info=await lstat(file);
    if(!info.isFile() || info.size!==bytes)throw failure(404,'Prepared image content unavailable.');
    res.setHeader('Docker-Content-Digest',blobId);res.setHeader('Content-Type',type);
    if(route[3]==='manifests') {
      if(bytes>maxMetadata)throw failure(404,'Registry manifest exceeds its bound.');
      const body=await readFile(file);
      if(digest(body)!==blobId.slice(7))throw failure(404,'Registry manifest integrity mismatch.');
      if(!authorized())throw failure(401,'Launch ended.');
      res.setHeader('Content-Length',bytes);res.writeHead(200);res.end(req.method==='HEAD'?undefined:body);return true;
    }
    let start=0,end=bytes-1,status=200;
    if(req.headers.range) {
      const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      start=Number(range?.[1]);end=range?.[2]?Number(range[2]):bytes-1;
      if(!range || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start<0 || start>=bytes || end<start || end>=bytes){res.setHeader('Content-Range',`bytes */${bytes}`);throw failure(416,'Invalid blob range.');}
      status=206;
    }
    if(req.method==='GET' && delivery) {
      const location=await delivery.resolve({sha256:blobId.slice(7),bytes}).catch(()=>null);
      if(!authorized())throw failure(401,'Launch ended.');
      if(trustedImageUrl(location)){res.writeHead(307,{Location:location});res.end();return true;}
    }
    if(!authorized())throw failure(401,'Launch ended.');
    res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
    if(status===206)res.setHeader('Content-Range',`bytes ${start}-${end}/${bytes}`);
    res.writeHead(status);
    if(req.method==='HEAD')res.end();else await pipeline(createReadStream(file,{start,end}),res);
  } catch(error) {
    if(error.status===401 && !res.headersSent)res.setHeader('WWW-Authenticate','Basic realm="PODS launch"');
    if(res.headersSent)res.destroy();else reply(error.status || 404,error.status===401?'UNAUTHORIZED':error.status===405?'UNSUPPORTED':error.status===416?'RANGE_INVALID':'BLOB_UNKNOWN',error.status?error.message:'Prepared image content unavailable.');
  }
  return true;
}
