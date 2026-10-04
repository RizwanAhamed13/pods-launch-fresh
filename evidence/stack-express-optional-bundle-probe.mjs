import { build } from '/opt/pods/node_modules/esbuild/lib/main.js';
import { run, decodeArtifact } from '/opt/pods/src/runner.mjs';
import { createHash, randomBytes } from 'node:crypto';
import { builtinModules } from 'node:module';
import { createServer } from 'node:http';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const source='/work/stacks/express/server.js';
const result=await build({entryPoints:[source],bundle:true,write:false,platform:'node',format:'cjs',target:'node22',minify:true,metafile:true,logLevel:'silent',logOverride:{'ignored-dynamic-import':'warning'}});
const builtins=new Set(builtinModules.flatMap(x=>[x,`node:${x}`]));
const external=Object.values(result.metafile.outputs).flatMap(x=>x.imports).filter(x=>x.external&&!builtins.has(x.path));
const optional=external.every(imp=>imp.kind==='require-call'&&result.warnings.some(w=>w.id==='ignored-dynamic-import'&&w.text.startsWith(`Importing ${JSON.stringify(imp.path)} was allowed even though it could not be resolved`)));
if(!external.length||!optional)throw new Error('Probe did not find only compiler-confirmed optional require calls');
const payload=Buffer.from(JSON.stringify({format:1,entry:'app.cjs',healthPath:'/',files:[{path:'app.cjs',data:Buffer.from(result.outputFiles[0].contents).toString('base64')}]}));
const bytes=gzipSync(payload,{level:9}),sha256=createHash('sha256').update(bytes).digest('hex');
decodeArtifact(bytes,sha256);
const root=await mkdtemp('/output/express-optional-probe-');
const server=createServer(async(req,res)=>{if(req.url==='/artifact')return res.end(bytes);for await(const chunk of req){}res.end('{}');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const records=[];let app;
try{
 for(let i=0;i<2;i++){
  const started=performance.now();
  app=await run({id:randomBytes(24).toString('base64url'),appId:'express-optional-probe',dataKey:'express-optional-probe',sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'isolated-probe',port:18095,expiresAt:Date.now()+60000},{root});
  const healthMs=Math.round(performance.now()-started);
  const page=await fetch('http://127.0.0.1:18095/');const html=await page.text();
  if(!page.ok||!html.includes('<h1>express counter</h1>'))throw new Error('Wrong product');
  const before=await fetch('http://127.0.0.1:18095/api/count').then(r=>r.json());
  const after=await fetch('http://127.0.0.1:18095/api/count',{method:'POST'}).then(r=>r.json());
  const reread=await fetch('http://127.0.0.1:18095/api/count').then(r=>r.json());
  if(before.count!==i||after.count!==i+1||reread.count!==i+1)throw new Error('SQLite persistence failed');
  records.push({scenario:i?'same-format-full-relaunch':'first-bundle-launch',healthMs,before:before.count,after:after.count,reread:reread.count,timings:app.timings,passed:true});
  await app.stop();app=null;
 }
 console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Isolated experimental Express bundle only; production packager unchanged. No cross-format migration or native-provider/browser acceptance is established.',sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),node:process.version,external,compilerConfirmedOptional:optional,bundleBytes:result.outputFiles[0].contents.length,artifactBytes:bytes.length,sha256,records,passed:true},null,2));
}finally{await app?.stop();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
