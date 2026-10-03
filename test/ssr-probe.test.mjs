import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {probeSsrProduct,probeNuxtSsr,ssrProbeCommand} from '../scripts/probe-ssr.mjs';

const markup=(fixture='next',src=fixture==='next'?'/_next/static/chunks/page.js':'/_nuxt/entry.js')=>`<html><h1>${fixture==='next'?'Next.js':'Nuxt'} counter</h1><p id="value">0</p><script src="${src}"></script></html>`;
async function serve(options,run){
  const requests=[];
  const server=createServer((req,res)=>{
    requests.push(req.url);
    if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(options.page??markup());}
    else{res.statusCode=options.status??200;res.setHeader('Content-Type',options.type??'text/javascript');res.end(options.script??'console.log("fixture client")');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{return await run(`http://127.0.0.1:${server.address().port}`,requests);}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

test('SSR probe checks rendered Next and Nuxt plus their real client entry requests',async()=>{
  for(const fixture of ['next','nuxt'])await serve({page:markup(fixture)},async(base,requests)=>{
    const result=await probeSsrProduct(base,fixture);
    assert.equal(result.passed,true);assert.equal(result.fixture,fixture);assert.equal(result.scripts.length,1);assert.equal(requests.length,2);
  });
  await serve({page:markup('nuxt')},async base=>assert.equal((await probeNuxtSsr(base)).fixture,'nuxt'));
});
test('SSR probe rejects a healthy unrelated page or missing client entry',async()=>{
  for(const page of ['<html><h1>Healthy</h1></html>',markup().replace('Next.js','NextXjs'),markup().replace(/<script.*?<\/script>/,'')])
    await serve({page},base=>assert.rejects(probeSsrProduct(base,'next')));
});
test('SSR probe rejects missing assets and HTML pretending to be JavaScript',async()=>{
  for(const options of [{status:404},{type:'text/html'},{script:' <html>fallback</html>'},{script:' '}])
    await serve(options,base=>assert.rejects(probeSsrProduct(base,'next')));
});
test('SSR probe refuses external and wrong-framework assets before any asset request',async()=>{
  for(const src of ['https://outside.invalid/entry.js','/_nuxt/entry.js','/_next/entry.css'])
    await serve({page:markup('next',src)},async(base,requests)=>{await assert.rejects(probeSsrProduct(base,'next'));assert.deepEqual(requests,['/']);});
});
test('SSR probe rejects unknown fixture before network access',async()=>{
  await assert.rejects(probeSsrProduct('http://127.0.0.1:1','unknown'),/Unknown SSR fixture/);
});
test('native SSR command executes in a fresh Node process for both frameworks',async()=>{
  for(const fixture of ['next','nuxt'])await serve({page:markup(fixture)},async(base,requests)=>{
    const {stdout}=await promisify(execFile)(process.execPath,['--input-type=module','-e',ssrProbeCommand(fixture,base)],{timeout:10000});
    const result=JSON.parse(stdout);assert.equal(result.fixture,fixture);assert.equal(result.passed,true);assert.equal(result.scripts.length,1);assert.equal(requests.length,2);
  });
});
