// Isolated QA only: selects a previously prepared artifact and forwards its product.
import { createServer, request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { run } from '../src/runner.mjs';
import { uid } from '../src/util.mjs';
const results=JSON.parse(await readFile('/output/evidence/matrix.json','utf8')).filter(r=>r.status==='passed');
let running, active, selecting=false;
const callbacks=createServer(async(req,res)=>{
  const image=/^\/artifact\/images\/([a-f0-9]{64})$/.exec(req.url);
  if(image&&active.images?.some(i=>i.sha256===image[1]))return createReadStream('/output/'+active.stack+'/images/'+image[1]+'.gz').pipe(res);
  if(req.url==='/artifact')return createReadStream('/output/'+active.stack+'/artifact.gz').pipe(res);
  for await(const chunk of req){}res.end('{}');
});
await new Promise(r=>callbacks.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+callbacks.address().port;
const browserServer=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/_pods'){
    res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Prepared stack QA</title><h1>Prepared stack QA</h1>'+results.map(r=>`<p><a href="/_pods/select?stack=${r.stack}">${r.stack}</a></p>`).join(''));
  }
  if(url.pathname==='/_pods/select'){
    if(selecting){res.statusCode=409;return res.end('Selection in progress');}selecting=true;
    try{
      const result=results.find(r=>r.stack===url.searchParams.get('stack'));if(!result)throw new Error('Unknown stack');
      await running?.stop();active=result;
      running=await run({id:uid(),appId:result.stack,sha256:result.sha256,artifactUrl:origin+'/artifact',callbackUrl:origin+'/callback',token:'qa',port:8080,expiresAt:Date.now()+1800000},{root:'/output/'+result.stack+'/compute'});
      res.writeHead(302,{Location:'/'});res.end();
    }catch(e){res.statusCode=500;res.end(e.message);}finally{selecting=false;}return;
  }
  if(!running){res.writeHead(302,{Location:'/_pods'});return res.end();}
  const upstream=request({hostname:'127.0.0.1',port:8080,path:req.url,method:req.method,headers:req.headers},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});
  upstream.on('error',e=>{if(!res.headersSent)res.statusCode=502;res.end(e.message);});req.pipe(upstream);
});
browserServer.on('upgrade',(req,socket,head)=>{
  if(!running){socket.destroy();return;}
  const upstream=request({hostname:'127.0.0.1',port:8080,path:req.url,method:req.method,headers:req.headers});
  upstream.on('upgrade',(reply,peer,upstreamHead)=>{
    socket.write(`HTTP/1.1 ${reply.statusCode} ${reply.statusMessage}\r\n`+Object.entries(reply.headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');
    if(head.length)peer.write(head);if(upstreamHead.length)socket.write(upstreamHead);
    socket.on('error',()=>peer.destroy());peer.on('error',()=>socket.destroy());
    socket.pipe(peer).pipe(socket);
  });
  upstream.on('response',()=>socket.destroy());upstream.on('error',()=>socket.destroy());upstream.end();
});
browserServer.listen(8081,'0.0.0.0');
console.log('Browser stack QA listens on 8081');
