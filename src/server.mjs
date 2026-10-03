import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream } from 'node:fs';
import { build as bundle } from 'esbuild';
import { pipeline } from 'node:stream/promises';
import { Store } from './store.mjs';
import { uid, digest, same } from './util.mjs';
import { providers as makeProviders } from './providers.mjs';
import { BuildManager } from './builds.mjs';
import { LxdBuilder } from './lxd-builder.mjs';
const base = resolve(fileURLToPath(new URL('..', import.meta.url)));
const statuses = new Set(['downloading','starting','ready','failed','stopped','heartbeat']);
const returnPage = value => typeof value === 'string' && /^(?:\/|\/develop|\/launch\/[a-z0-9-]+)$/.test(value);
function fail(status, message) { return Object.assign(new Error(message), {status}); }
async function body(req) { let b=''; for await(const p of req) { b+=p; if(b.length>16384)throw fail(413,'Request too large'); } try{return JSON.parse(b||'{}');}catch{throw fail(400,'Invalid JSON');} }
export async function createApp(options={}) {
  const data = resolve(options.data || process.env.PODS_DATA || '.data');
  const origin = options.origin || process.env.PODS_ORIGIN || 'http://127.0.0.1:8787';
  const repo = options.repo || process.env.PODS_RUNTIME_REPO || 'RizwanAhamed13/pods-launch-fresh';
  const secure = origin.startsWith('https://');
  const store = new Store(data, options.secret || process.env.PODS_SECRET);
  const runner = (await bundle({entryPoints:[join(base,'src/runner.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false})).outputFiles[0].contents;
  const providers = options.providers || makeProviders({repo,origin,runnerSha:digest(runner)});
  const jobs = new Map();
  const buildsEnabled = options.buildAdapter || process.env.PODS_BUILDS_ENABLED === '1';
  const builds = buildsEnabled ? new BuildManager({ store, data, origin, adapter: options.buildAdapter || new LxdBuilder() }) : null;
  if (builds) await builds.initialize();
  // A restart cannot safely resume SSH dispatch; ready agents reconnect through heartbeat.
  for (const s of store.list('launch')) if (!['ready','failed','stopped'].includes(s.status)) store.put('launch',s.id,{...s,status:'failed',error:'Server restarted during launch. Please retry.'});
  const oauth = options.oauth || {
    github:{id:process.env.GITHUB_CLIENT_ID,secret:process.env.GITHUB_CLIENT_SECRET,authorize:'https://github.com/login/oauth/authorize',exchange:'https://github.com/login/oauth/access_token',scope:'codespace read:user'},
    google:{id:process.env.GOOGLE_CLIENT_ID,secret:process.env.GOOGLE_CLIENT_SECRET,authorize:'https://accounts.google.com/o/oauth2/v2/auth',exchange:'https://oauth2.googleapis.com/token',scope:'openid email https://www.googleapis.com/auth/cloud-platform'}
  };
  async function apps() {
    const folder=join(data,'artifacts');await mkdir(folder,{recursive:true});
    return Promise.all((await readdir(folder)).filter(x=>/^[a-z0-9-]+\.json$/.test(x)).map(async x=>JSON.parse(await readFile(join(folder,x),'utf8'))));
  }
  function cookie(req,res) {
    const candidate = /(?:^|;\s*)pods=([A-Za-z0-9_-]{32})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
    let user = candidate && store.get('user',candidate);
    if (!user || user.expiresAt<Date.now()) { const id=uid();user={id,csrf:uid(),expiresAt:Date.now()+86400000};store.put('user',id,user);res.setHeader('Set-Cookie',`pods=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure?'; Secure':''}`); }
    return user;
  }
  function publicLaunch(s) {
    const {tokenHash,owner,...safe}=s;
    if(s.providerReadyAt&&s.readyAt)safe.deliveryMs=s.readyAt-s.providerReadyAt;
    if(s.readyAt)safe.totalMs=s.readyAt-s.createdAt;
    return safe;
  }
  function connect(user,provider,token,identity,expiresIn=3600) {
    store.put('connection',`${user.id}:${provider}`,{id:`${user.id}:${provider}`,provider,name:identity.name,identityId:identity.id||identity.name,token:store.seal(token),expiresAt:Date.now()+Math.min(Number(expiresIn)||3600,3600)*1000});
  }
  function connection(user,provider) {
    const c=store.get('connection',`${user.id}:${provider}`);if(!c||c.expiresAt<Date.now())throw fail(401,'Connect your compute account to continue.');return c;
  }
  function own(user,id) {const s=store.get('launch',id);if(!s||s.owner!==user.id)throw fail(404,'Launch not found');return s;}
  function update(id,patch) {
    const current=store.get('launch',id);
    if(!current||['stopped','failed'].includes(current.status))return;
    store.put('launch',id,{...current,...patch,updatedAt:Date.now()});
  }
  const server=createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost'), path=url.pathname;
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const json=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
    const redirect=location=>{res.writeHead(302,{Location:location});res.end();};
    try {
      if(path==='/health')return json(200,{ok:true});
      if(path==='/runner.mjs'&&req.method==='GET'){res.setHeader('Content-Type','text/javascript');return res.end(runner);}
      const agent=/^\/api\/agent\/([A-Za-z0-9_-]{32})(?:\/(artifact)(?:\/images\/([a-f0-9]{64}))?)?$/.exec(path);
      if(agent) {
        const s=store.get('launch',agent[1]), token=req.headers.authorization?.replace(/^Bearer /,'');
        if(!s||!same(digest(token||''),s.tokenHash)||s.expiresAt<Date.now())throw fail(401,'Launch authorization expired or invalid');
        if(agent[3] && req.method==='GET') {
          const image=s.images?.find(i=>i.sha256===agent[3]);
          if(!image || ['failed','stopped'].includes(s.status))throw fail(404,'Prepared image unavailable');
          res.writeHead(200,{'Content-Type':'application/gzip','Content-Length':image.bytes});
          await pipeline(createReadStream(join(data,'images',image.sha256+'.gz')),res);return;
        }
        if(agent[2]&&req.method==='GET'){if(['stopped','failed'].includes(s.status))throw fail(410,'Launch ended');res.setHeader('Content-Type','application/gzip');return res.end(await readFile(join(data,'artifacts',s.sha256+'.gz')));}
        if(!agent[2]&&req.method==='POST'){
          const event=await body(req);if(!statuses.has(event.status))throw fail(400,'Unknown agent state');
          if(['stopped','failed'].includes(s.status))return json(200,{action:'stop'});
          const patch={lastSeenAt:Date.now()};
          if(['persistent','ephemeral'].includes(event.storageMode))patch.storageMode=event.storageMode;
          if(event.status!=='heartbeat')patch.status=event.status;
          if(event.status==='ready') { if(!s.providerReadyAt)throw fail(409,'Provider is not ready');patch.readyAt=s.readyAt||Date.now(); }
          if(event.status==='failed')patch.error=String(event.error||'Application failed').slice(-500);
          if(event.timings) {patch.timings={};for(const k of ['downloadMs','imagesMs','imageCacheHits','runtimeReadyMs','runtimeRetries'])if(Number.isFinite(event.timings[k])&&event.timings[k]>=0&&event.timings[k]<600000)patch.timings[k]=event.timings[k];patch.timings.cacheHit=event.timings.cacheHit===true;}
          // Preview URL is set from provider metadata, never accepted from the runner.
          update(s.id,patch);return json(200,{action:s.stopRequested?'stop':'continue'});
        }
        throw fail(405,'Method not allowed');
      }
      const user=cookie(req,res);
      if(!['GET','HEAD'].includes(req.method)) {
        if(req.headers.origin&&req.headers.origin!==origin)throw fail(403,'Request origin rejected');
        if(!same(req.headers['x-pods-csrf'],user.csrf))throw fail(403,'Refresh the page and try again.');
      }
      if(path==='/api/me'&&req.method==='GET')return json(200,{csrf:user.csrf,buildsEnabled:Boolean(builds&&!builds.closed&&!builds.fault),connections:Object.keys(providers).map(p=>{const c=store.get('connection',`${user.id}:${p}`);return {provider:p,connected:Boolean(c&&c.expiresAt>Date.now()),name:c?.name,oauthReady:Boolean(oauth[p]?.id&&oauth[p]?.secret)};}),apps:await apps()});
      if(path==='/api/builds'&&req.method==='GET')return json(200,builds?.list(user.id)||[]);
      if(path==='/api/builds'&&req.method==='POST') {
        if(!builds)throw fail(503,'Repository preparation is not available on this deployment.');
        const input=await body(req);
        const c=connection(user,['github','google'].includes(input.provider)?input.provider:'github');
        if(!c.identityId)throw fail(401,'Reconnect your account before preparing an application.');
        return json(202,builds.submit(user.id,c.provider+':'+c.identityId,input));
      }
      const build=/^\/api\/builds\/([A-Za-z0-9_-]{32})$/.exec(path);
      if(build&&req.method==='GET')return json(200,builds?builds.own(user.id,build[1]):null);
      const auth=/^\/auth\/(github|google)(\/callback)?$/.exec(path);
      if(auth&&req.method==='GET') {
        const p=auth[1],o=oauth[p];if(!o.id||!o.secret)throw fail(503,`${p} OAuth is not configured. Use the access-token connection in this preview or configure the OAuth app.`);
        if(!auth[2]) {
          const returnTo=url.searchParams.get('returnTo')||'/';
          if(!returnPage(returnTo))throw fail(400,'Invalid return page.');
          // Keep only navigation context after the short-lived authorization state is swept.
          store.put('user',user.id,{...user,oauthReturnTo:{...user.oauthReturnTo,[p]:returnTo}});
          const state=uid(), verifier=uid()+uid();store.put('oauth',state,{id:state,owner:user.id,provider:p,verifier,returnTo,expiresAt:Date.now()+600000});
          const target=new URL(o.authorize);target.search=new URLSearchParams({client_id:o.id,redirect_uri:`${origin}/auth/${p}/callback`,scope:o.scope,state,response_type:'code',code_challenge:Buffer.from(digest(verifier),'hex').toString('base64url'),code_challenge_method:'S256'}).toString();return redirect(target.href);
        }
        const state=store.get('oauth',url.searchParams.get('state')||'');
        const owned=state?.owner===user.id&&state.provider===p;
        const returnTo=owned?state.returnTo:user.oauthReturnTo?.[p];
        const recover=message=>redirect((returnPage(returnTo)?returnTo:'/')+'?'+new URLSearchParams({error:message,provider:p}));
        if(!owned||state.expiresAt<Date.now())return recover('Authorization expired. Connect again.');
        store.delete('oauth',url.searchParams.get('state'));
        if(url.searchParams.has('error'))return recover('Authorization was not completed.');
        const response=await (options.oauthFetch || fetch)(o.exchange,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:o.id,client_secret:o.secret,code:url.searchParams.get('code')||'',redirect_uri:`${origin}/auth/${p}/callback`,grant_type:'authorization_code',code_verifier:state.verifier}),signal:AbortSignal.timeout(20000)});
        const tokens=await response.json();if(!response.ok||!tokens.access_token)throw fail(401,'Authorization failed. Please reconnect.');
        const identity=await providers[p].validate(tokens.access_token);connect(user,p,tokens.access_token,identity,tokens.expires_in);return redirect((state.returnTo||'/')+'?connected='+p);
      }
      const conn=/^\/api\/connections\/(github|google)$/.exec(path);
      if(conn&&req.method==='POST') {const b=await body(req);if(typeof b.token!=='string'||b.token.length<20||b.token.length>4096)throw fail(400,'Enter a valid access token');const identity=await providers[conn[1]].validate(b.token);connect(user,conn[1],b.token,identity);return json(200,{connected:true,name:identity.name});}
      if(conn&&req.method==='DELETE') {store.delete('connection',`${user.id}:${conn[1]}`);return json(200,{connected:false});}
      if(path==='/api/launches'&&req.method==='GET')return json(200,store.list('launch').filter(s=>s.owner===user.id).map(publicLaunch).sort((a,b)=>b.createdAt-a.createdAt).slice(0,20));
      if(path==='/api/launches'&&req.method==='POST') {
        const b=await body(req);if(!['github','google'].includes(b.provider))throw fail(400,'Choose a compute provider');
        const app=(await apps()).find(a=>a.id===b.appId);if(!app)throw fail(404,'Prepared application not found');
        const c=connection(user,b.provider);
        const active=store.list('launch').find(s=>s.owner===user.id&&s.provider===b.provider&&!['failed','stopped'].includes(s.status)&&s.expiresAt>Date.now());
        if(active) {if(active.appId!==app.id)throw fail(409,'An application is already running on this provider. Stop it before starting another.');return json(200,publicLaunch(active));}
        const id=uid(),token=uid(),createdAt=Date.now();
        const s={id,owner:user.id,appId:app.id,appName:app.name,provider:b.provider,sha256:app.sha256,images:app.images || [],status:'connecting',createdAt,updatedAt:createdAt,expiresAt:createdAt+30*60*1000,tokenHash:digest(token)};
        store.put('launch',id,s);
        const config={id,provider:b.provider,appId:app.id,dataKey:app.dataKey || app.id,containerRuntime:app.runtime==='docker-linux-amd64',sha256:app.sha256,artifactUrl:`${origin}/api/agent/${id}/artifact`,callbackUrl:`${origin}/api/agent/${id}`,token,port:8080,expiresAt:s.expiresAt};
        const job=providers[b.provider].launch(store.open(c.token),config,patch=>update(id,patch)).then(result=>update(id,result)).catch(e=>{console.error('launch',id,e.message);update(id,{status:'failed',error:'Could not start your compute. '+String(e.message).slice(0,220)});}).finally(()=>jobs.delete(id));
        jobs.set(id,job);return json(202,publicLaunch(s));
      }
      const launch=/^\/api\/launches\/([A-Za-z0-9_-]{32})(\/stop)?$/.exec(path);
      if(launch&&req.method==='GET'&&!launch[2])return json(200,publicLaunch(own(user,launch[1])));
      if(launch&&req.method==='POST'&&launch[2]) {const s=own(user,launch[1]);if(!['failed','stopped'].includes(s.status))update(s.id,{stopRequested:true});return json(200,{stopping:true});}
      const allowed={'/':'index.html','/develop':'index.html','/app.js':'app.js','/flow.js':'flow.js','/style.css':'style.css'};
      if(/^\/launch\/[a-z0-9-]+$/.test(path))allowed[path]='index.html';
      if(allowed[path]&&req.method==='GET'){res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html; charset=utf-8');return res.end(await readFile(join(base,'public',allowed[path])));}
      throw fail(404,'Not found');
    } catch(e) { if(!res.headersSent)json(e.status||500,{error:e.status?e.message:'The request could not be completed. Check server configuration and retry.'});else res.end(); }
  });
  const sweep=setInterval(()=>{
    for(const s of store.list('launch')) {
      if(['stopped','failed'].includes(s.status))continue;
      if(s.expiresAt<Date.now())update(s.id,{status:'stopped',error:'Preview time ended. Launch again.'});
      else if(s.status==='ready'&&s.lastSeenAt<Date.now()-30000)update(s.id,{status:'failed',error:'Connection to your compute was lost. Launch again.'});
      else if(s.status!=='ready'&&s.createdAt<Date.now()-360000)update(s.id,{status:'failed',error:'Startup timed out. Retry the launch.'});
    }
    for(const c of store.list('user'))if(c.expiresAt<Date.now())store.delete('user',c.id);
    for(const c of store.list('connection'))if(c.expiresAt<Date.now())store.delete('connection',c.id);
    for(const c of store.list('oauth'))if(c.expiresAt<Date.now())store.delete('oauth',c.id);
  },5000);sweep.unref();
  let closing;
  function closeResources() { return closing ||= (async()=>{clearInterval(sweep);await builds?.close();store.close();})(); }
  server.on('close',()=>{closeResources().catch(e=>console.error('shutdown',e.message));});
  return {server,store,jobs,builds,closeResources};
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const {server,closeResources}=await createApp();server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('PODS control plane listening on '+(process.env.PODS_ORIGIN||'http://127.0.0.1:8787')));
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.close();closeResources().then(()=>process.exit(0),()=>process.exit(1));});
}
