import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeStaticProduct,staticProbeCommand} from '../scripts/probe-static.mjs';

const markup=(fixture='react',src=fixture==='angular'?'main.js':'/assets/index-abc.js')=>`<!doctype html><html>${fixture==='angular'?'<stack-counter></stack-counter>':'<div id="app"></div>'}<script src="${src}" type="module"></script></html>`;
async function serve(options,run){
  const requests=[],fixture=options.fixture||'react';
  const server=createServer((req,res)=>{
    requests.push(req.url);
    if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(options.page??markup(fixture));}
    else{res.statusCode=options.status??200;res.setHeader('Content-Type',options.type??'text/javascript');res.end(options.script??`console.log('${{react:'React',angular:'Angular',vue:'Vue'}[fixture]} counter','Add one');`);}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{return await run(`http://127.0.0.1:${server.address().port}`,requests);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('static probe checks React, Angular and Vue compiled entries',async()=>{
  for(const fixture of ['react','angular','vue'])await serve({fixture},async(base,requests)=>{
    const result=await probeStaticProduct(base,fixture);assert.equal(result.passed,true);assert.equal(result.fixtureCode,true);assert.equal(result.scripts.length,1);assert.equal(requests.length,2);
  });
  await serve({fixture:'angular',page:markup('angular','/main-ABC.js')},async base=>assert.equal((await probeStaticProduct(base,'angular')).passed,true));
});
test('static probe rejects empty shells, unrelated apps, and absent module entries',async()=>{
  for(const page of ['<html>healthy</html>',markup().replace('id="app"','id="wrong"'),markup().replace('type="module"','type="text/javascript"'),markup().replace(' src="/assets/index-abc.js"','')])
    await serve({page},base=>assert.rejects(probeStaticProduct(base)));
});
test('static probe rejects missing bundles, HTML fallbacks, and unrelated JavaScript',async()=>{
  for(const options of [{status:404},{type:'text/html'},{script:' <html>fallback</html>'},{script:' '},{script:'console.log("unrelated")'}])
    await serve(options,base=>assert.rejects(probeStaticProduct(base)));
});
test('static probe rejects external or uncompiled entries before fetching them',async()=>{
  for(const fixture of ['react','angular','vue'])for(const src of ['https://outside.invalid/main-ABC.js',fixture==='angular'?'/src/main.ts':'/main.js','/assets/entry.css'])
    await serve({fixture,page:markup(fixture,src)},async(base,requests)=>{await assert.rejects(probeStaticProduct(base,fixture));assert.deepEqual(requests,['/']);});
  await assert.rejects(probeStaticProduct('http://127.0.0.1:1','unknown'),/Unknown static fixture/);
});
test('native static probe command executes in a fresh Node process',async()=>{
  for(const fixture of ['react','angular','vue'])await serve({fixture},async(base,requests)=>{
    const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',staticProbeCommand(fixture,base)],{timeout:10000});
    const result=JSON.parse(stdout);assert.equal(result.fixture,fixture);assert.equal(result.passed,true);assert.equal(requests.length,2);
  });
});
test('Vue inspection rejects a React bundle even when their mount and asset paths match',async()=>{
  await serve({fixture:'vue',script:"console.log('React counter','Add one')"},base=>assert.rejects(probeStaticProduct(base,'vue'),/counter code missing/));
});
