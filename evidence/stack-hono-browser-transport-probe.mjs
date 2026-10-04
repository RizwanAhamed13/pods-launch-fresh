import { prepare } from '/opt/pods/scripts/prepare.mjs';
import { run } from '/opt/pods/src/runner.mjs';
import { createServer, request } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
const root=await mkdtemp('/output/hono-browser-transport-');
const manifest=await prepare('/work/stacks/hono',root);
if(manifest.images?.length)throw new Error('This probe expects a Node bundle, not container images');
const archive=await readFile(join(root,'artifacts',manifest.sha256+'.gz'));
let app,closing=false;
const observations=[];
const launch=()=>run({id:randomBytes(24).toString('base64url'),appId:'hono-browser-transport',sha256:manifest.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'qa',port:18095,expiresAt:Date.now()+900000},{root:join(root,'compute')});
const callbacks=createServer(async(req,res)=>{
 if(req.url==='/artifact')return res.end(archive);
 if(req.url==='/restart'&&req.method==='POST'){await app.stop();app=await launch();res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({restarted:true}));}
 if(req.url==='/stop'&&req.method==='POST'){res.end('{}');setImmediate(shutdown);return;}
 for await(const chunk of req){}res.end('{}');
});
await new Promise(r=>callbacks.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${callbacks.address().port}`;
app=await launch();
const proxy=createServer((req,res)=>{
 const headers={...req.headers};
 if(req.method==='POST'){delete headers['content-length'];headers['transfer-encoding']='chunked';}
 const upstream=request({hostname:'127.0.0.1',port:18095,path:req.url,method:req.method,headers},reply=>{
  if(req.url==='/api/count')observations.push({method:req.method,contentType:headers['content-type']||null,transferEncoding:headers['transfer-encoding']||null,status:reply.statusCode});
  res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);
 });
 upstream.on('error',()=>{res.statusCode=502;res.end('QA upstream unavailable');});req.pipe(upstream);
});
await new Promise(r=>proxy.listen(18096,'0.0.0.0',r));
console.log(JSON.stringify({ready:true,proxyPort:18096,controlPort:callbacks.address().port,artifactSha256:manifest.sha256,artifactBytes:archive.length,sourceSha256:createHash('sha256').update(await readFile('/work/stacks/hono/server.mjs')).digest('hex')}));
const timer=setTimeout(shutdown,900000);
async function shutdown(){
 if(closing)return;closing=true;clearTimeout(timer);await app?.stop();
 await Promise.all([new Promise(r=>proxy.close(r)),new Promise(r=>callbacks.close(r))]);
 await rm(root,{recursive:true,force:true});
 console.log(JSON.stringify({stopped:true,observations}));
}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
