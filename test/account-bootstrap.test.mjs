import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { createApp } from '../src/server.mjs';

test('real account bootstrap exposes only selectable compute providers on developer and launch pages',async t=>{
  const data=await mkdtemp(join(tmpdir(),'pods-account-bootstrap-'));
  const app=await createApp({data,secret:'a'.repeat(64)});
  t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));await app.closeResources();await rm(data,{recursive:true,force:true});});
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
  const origin='http://127.0.0.1:'+app.server.address().port;
  const response=await fetch(origin+'/api/me');assert.equal(response.status,200);
  const me=await response.json();
  assert.deepEqual(me.connections.map(c=>c.provider).sort(),['github','google']);
  for(const path of ['/develop','/launch/test-app']){
    const response=await fetch(origin+path);assert.equal(response.status,200);const html=await response.text();
    for(const {provider} of me.connections){
      assert.ok(html.includes(`id="${provider}-status"`),'Every connection needs its account status element');
      assert.ok(html.includes(`value="${provider}"`),'Every connection needs its provider choice');
    }
  }
});
