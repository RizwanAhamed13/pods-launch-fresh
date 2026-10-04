import {downloadImageRanges} from '../../src/image-ranges.mjs';
import {mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export async function probe(url,image){
 const root=await mkdtemp(join(tmpdir(),'pods-cdn-diagnostic-')),observations=[];
 const out={startedAt:new Date().toISOString(),image,observations,applicationStarted:false,existingCachesChanged:false};
 const start=performance.now();
 try{
  await downloadImageRanges(url,image,join(root,'probe.gz'),async(address,options)=>{
   const begun=performance.now(),entry={requestedRange:options.headers.Range};observations.push(entry);
   try{const response=await fetch(address,options);Object.assign(entry,{status:response.status,headersMs:Math.round(performance.now()-begun),headers:Object.fromEntries(['date','age','content-range','content-length','x-cache','x-cache-hits'].map(k=>[k,response.headers.get(k)]))});return response;}
   catch(error){entry.fetchErrorName=error.name;throw error;}
  });
  out.verifiedBytes=(await stat(join(root,'probe.gz'))).size;out.integrityVerified=true;out.passed=true;
 }catch(error){out.passed=false;out.error=['Prepared image range transfer failed','Prepared image integrity check failed'].includes(error.message)?error.message:'Transfer failed; sensitive details withheld';}
 finally{out.elapsedMs=Math.round(performance.now()-start);await rm(root,{recursive:true,force:true});out.ownedTemporaryDirectoryRemoved=true;}
 return out;
}
