import assert from 'node:assert/strict';
import {prepare} from '/output/optional-candidate-aa02036/scripts/prepare.mjs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=await mkdtemp('/output/optional-unchanged-'),results=[];
try{
 for(const name of ['hono','koa']){
  const original=await readFile('/output/'+name+'/artifact.gz');
  const expected=createHash('sha256').update(original).digest('hex');
  const manifest=await prepare('/work/stacks/'+name,root+'/'+name);
  assert.equal(manifest.applicationType,'node');assert.equal(manifest.sha256,expected);
  results.push({fixture:name,bytes:manifest.bytes,sha256:manifest.sha256,unchanged:true});
 }
}finally{await rm(root,{recursive:true,force:true});}
console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Actual candidate prepare() preserves the existing Hono and Koa bundle bytes using the same installed fixture dependencies.',results,temporaryRootRemoved:true},null,2));
