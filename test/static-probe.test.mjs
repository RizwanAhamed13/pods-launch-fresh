import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeStaticProduct,staticProbeCommand} from '../scripts/probe-static.mjs';

const frameworks={react:'React',angular:'Angular',vue:'Vue',svelte:'Svelte',preact:'Preact',solid:'Solid',lit:'Lit',alpine:'Alpine'};
const markup=(fixture='react',src=fixture==='angular'?'main.js':'/assets/index-abc.js')=>`<!doctype html><html>${fixture==='angular'?'<base href="/"><stack-counter></stack-counter>':'<div id="app"></div>'}<script src="${src}" type="module"></script></html>`;
async function serve(options,run){
  const requests=[],fixture=options.fixture||'react';
  const server=createServer((req,res)=>{
    requests.push(req.url);
    if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(options.page??markup(fixture));}
    else if(req.url==='/pods-spa-check/nested'){assert.match(req.headers.accept,/text\/html/);res.statusCode=options.routeStatus??200;res.setHeader('Content-Type',options.routeType??'text/html');res.end(options.routePage??options.page??markup(fixture));}
    else if(req.url==='/assets/pods-missing-check.js'){res.statusCode=options.missingStatus??404;res.setHeader('Content-Type','text/html');res.end('Not found');}
    else{res.statusCode=options.status??200;res.setHeader('Content-Type',options.type??'text/javascript');res.end(options.script??`console.log('${frameworks[fixture]} counter','Add one');`);}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{return await run(`http://127.0.0.1:${server.address().port}`,requests);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('static probe checks compiled entries for all eight frontend fixtures',async()=>{
  for(const fixture of Object.keys(frameworks))await serve({fixture},async(base,requests)=>{
    const result=await probeStaticProduct(base,fixture);assert.equal(result.passed,true);assert.equal(result.fixtureCode,true);assert.equal(result.scripts.length,1);assert.equal(result.spaRoute.documentMatches,true);assert.equal(result.spaRoute.entriesResolve,true);assert.equal(result.missingAssetStatus,404);assert.equal(requests.length,4);
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
  for(const fixture of Object.keys(frameworks))for(const src of ['https://outside.invalid/main-ABC.js',fixture==='angular'?'/src/main.ts':'/main.js','/assets/entry.css'])
    await serve({fixture,page:markup(fixture,src)},async(base,requests)=>{await assert.rejects(probeStaticProduct(base,fixture));assert.deepEqual(requests,['/']);});
  for(const fixture of ['unknown','constructor','__proto__'])await assert.rejects(probeStaticProduct('http://127.0.0.1:1',fixture),/Unknown static fixture/);
});
test('native static probe command executes in a fresh Node process',async()=>{
  for(const fixture of Object.keys(frameworks))await serve({fixture},async(base,requests)=>{
    const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',staticProbeCommand(fixture,base)],{timeout:10000});
    const result=JSON.parse(stdout);assert.equal(result.fixture,fixture);assert.equal(result.passed,true);assert.equal(requests.length,4);
  });
});
test('frontend inspection rejects another fixture bundle even with valid mount and asset paths',async()=>{
  for(const fixture of Object.keys(frameworks))await serve({fixture,script:`console.log('${fixture==='react'?'Vue':'React'} counter','Add one')`},base=>assert.rejects(probeStaticProduct(base,fixture),/counter code missing/));
});
test('static probe rejects unavailable or incorrect nested application documents',async()=>{
  for(const options of [{routeStatus:404},{routeType:'application/json'},{routePage:'<html>unrelated page</html>'}])
    await serve(options,base=>assert.rejects(probeStaticProduct(base)));
});
test('static probe rejects nested routes whose relative bundles resolve to another location',async()=>{
  await serve({page:markup('react','assets/index-abc.js')},base=>assert.rejects(probeStaticProduct(base),/nested route/));
  await serve({fixture:'angular',page:markup('angular').replace('<base href="/">','')},base=>assert.rejects(probeStaticProduct(base,'angular'),/nested route/));
});
test('static probe rejects a missing asset masked by a successful fallback',async()=>{
  await serve({missingStatus:200},base=>assert.rejects(probeStaticProduct(base),/missing asset/));
});
