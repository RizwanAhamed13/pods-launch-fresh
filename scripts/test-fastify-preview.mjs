// Run in the isolated QA guest, with installed Fastify fixture dependencies.
// Reproduce the empty chunked POST observed at the Google preview boundary.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer, request } from 'node:http';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { prepare } from './prepare.mjs';
import { run } from '../src/runner.mjs';

const root = await mkdtemp('/output/fastify-preview-probe-');
const observations = [];
let server, app;
try {
  const manifest = await prepare(process.argv[2] || '/work/stacks/fastify', root);
  const bytes = await readFile(join(root, 'artifacts', manifest.sha256 + '.gz'));
  server = createServer(async (req, res) => {
    if (req.url === '/artifact') return res.end(bytes);
    for await (const chunk of req) { /* Consume runner callback. */ }
    res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`, base = 'http://127.0.0.1:18095';
  for (let round = 0; round < 2; round++) {
    app = await run({id:randomBytes(24).toString('base64url'), appId:'fastify-preview-probe',
      sha256:manifest.sha256, artifactUrl:origin+'/artifact', callbackUrl:origin+'/callback',
      token:'isolated-test', port:18095, expiresAt:Date.now()+60000}, {root:join(root,'compute')});
    const html = await fetch(base).then(r => r.text());
    assert.match(html, /<h1>fastify counter<\/h1>/);
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
    assert.ok(script, 'Actual product script must be present');
    const value = {textContent:''}, add = {}, error = {textContent:''}, requests = [];
    const pending = new Set(); let rejectWrite = false;
    const proxyFetch = (path, options = {}) => {
      if (rejectWrite && options.method === 'POST') return Promise.resolve({ok:false,status:503});
      const promise = new Promise((resolve, reject) => {
        const headers = {...options.headers};
        if (options.method === 'POST') headers['Transfer-Encoding'] = 'chunked';
        const req = request(new URL(path, base), {method:options.method || 'GET',headers}, res => {
          let body = ''; res.on('data', b => { body += b; });
          res.on('end', () => {
            requests.push({method:options.method || 'GET',status:res.statusCode,contentType:headers['Content-Type'] || null});
            resolve({ok:res.statusCode>=200 && res.statusCode<300,status:res.statusCode,json:async()=>JSON.parse(body)});
          });
        });
        req.on('error', reject); req.end(options.body);
      });
      pending.add(promise); promise.then(()=>pending.delete(promise),()=>pending.delete(promise));
      return promise;
    };
    await runInNewContext(script, {value,add,error,fetch:proxyFetch});
    assert.equal(Number(value.textContent), round, 'Saved database value must survive full relaunch');
    await add.onclick(); while (pending.size) await Promise.all([...pending]);
    const saved = await fetch(base+'/api/count').then(r=>r.json());
    observations.push({round,before:round,displayed:Number(value.textContent),saved:saved.count,requests});
    assert.equal(saved.count, round+1, 'Browser request through chunked preview transport must persist its write');
    assert.equal(Number(value.textContent), round+1);
    rejectWrite = true; await add.onclick();
    assert.match(error.textContent, /503/, 'Failed writes must produce a visible error');
    assert.equal(add.disabled, false);
    assert.equal((await fetch(base+'/api/count').then(r=>r.json())).count, round+1);
    await app.stop(); app = undefined;
  }
  console.log(JSON.stringify({recordedAt:new Date().toISOString(),scope:'Actual prepared Fastify backend plus its shipped client script under an emulated chunked Google preview transport; not native browser acceptance.',passed:true,observations},null,2));
} catch (failure) {
  console.log(JSON.stringify({recordedAt:new Date().toISOString(),passed:false,error:failure.message,observations},null,2));
  process.exitCode = 1;
} finally {
  await app?.stop();
  if (server) await new Promise(resolve=>server.close(resolve));
  await rm(root,{recursive:true,force:true});
}
