import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {renderCompatibility} from '../src/compatibility.mjs';
import {createApp} from '../src/server.mjs';

test('compatibility separates provider evidence and excludes failed representatives',()=>{
  const html=renderCompatibility({fixtures:[
    {fixture:'react',serverPassed:true,browserPassed:true,nativeProviderEvidence:['stack-react-google.json'],nativeAcceptance:{googleBrowser:true},account:'private-account'},
    {fixture:'angular',serverPassed:true,browserPassed:true,nativeProviderEvidence:['stack-angular-codespaces.json'],nativeAcceptance:{codespacesProtocol:true}},
    {fixture:'lit',serverPassed:true,browserPassed:true,nativeProviderEvidence:['stack-lit-google-failed.json','stack-lit-codespaces-failed.json']},
    {fixture:'failed-fixture',serverPassed:false,browserPassed:false,nativeProviderEvidence:[]},
  ]});
  assert.match(html,/3 representative apps tested/);assert.match(html,/1 passed native Google/);assert.match(html,/1 passed Codespaces/);
  assert.match(html,/React<small>Browser frontends<\/small><\/th><td>Passed<\/td><td>Passed<\/td><td>Pending/);
  assert.match(html,/Angular<small>Browser frontends<\/small><\/th><td>Passed<\/td><td>Pending<\/td><td>Passed/);
  assert.match(html,/Lit<small>Browser frontends<\/small><\/th><td>Passed<\/td><td>Pending<\/td><td>Pending/);
  assert.doesNotMatch(html,/private-account|failed-fixture|stack-react-google/);
  assert.match(html,/Codespaces browser sign-in and interaction remain pending/);
});
test('compatibility renders every currently passing representative and escapes labels',async()=>{
  const coverage=JSON.parse(await readFile(new URL('../evidence/stack-coverage.json',import.meta.url),'utf8'));
  const html=renderCompatibility(coverage),passing=coverage.fixtures.filter(r=>r.serverPassed&&r.browserPassed);
  assert.equal((html.match(/<th scope="row">/g)||[]).length,passing.length);
  for(const label of ['React','Angular','Next.js','Spring Boot','ASP.NET Core','MongoDB 7','PostgreSQL','Valkey','Python worker'])assert.ok(html.includes(label),label);
  const escaped=renderCompatibility({fixtures:[{fixture:'<script>alert("x")</script>',serverPassed:true,browserPassed:true,nativeProviderEvidence:[]}]});
  assert.doesNotMatch(escaped,/<script>alert/);assert.match(escaped,/&lt;script&gt;alert\(&quot;x&quot;\)/);
});
test('compatibility and its assets are public without creating a build or connection',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pods-compatibility-'));
  const app=await createApp({data:root,secret:'ca'.repeat(32),providers:{}});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${app.server.address().port}`;
  try{
    const response=await fetch(origin+'/support');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/html/);
    assert.match(await response.text(),/Application compatibility\./);
    assert.match(await(await fetch(origin+'/support.js')).text(),/stack-search/);
    assert.match(await(await fetch(origin+'/')).text(),/href="\/support">Stack compatibility/);
    assert.equal(app.store.list('build').length,0);assert.equal(app.store.list('connection').length,0);
  }finally{app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));await rm(root,{recursive:true,force:true});}
});
