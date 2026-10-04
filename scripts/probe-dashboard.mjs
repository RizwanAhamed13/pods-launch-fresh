// Explicit fixture acceptance tooling; never invokes user-supplied code outside its container.
import {readFileSync} from 'node:fs';
const streamlitProtocol=readFileSync(new URL('./probe-streamlit.py',import.meta.url),'utf8');
export async function probeDashboard(dataKey,{port,expectedCount,fixture},execute,request=fetch) {
  if(!['gradio','streamlit'].includes(fixture))throw new Error('Unsupported dashboard fixture');
  if(!/^[a-z0-9][a-z0-9-]{0,159}$/.test(dataKey||''))throw new Error('Invalid application data identity');
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid product port');
  if(!Number.isSafeInteger(expectedCount)||expectedCount<0||expectedCount===Number.MAX_SAFE_INTEGER)throw new Error('Expected dashboard counter is required');
  const {createHash}=await import('node:crypto');
  const project='pods-'+createHash('sha256').update(dataKey).digest('hex').slice(0,24);
  if(!execute){
    const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const run=promisify(execFile);
    execute=async args=>(await run('docker',['--host','unix:///var/run/docker.sock',...args],{timeout:35000,maxBuffer:65536})).stdout.trim();
  }
  const id=(await execute(['ps','--all','--quiet','--filter',`label=com.docker.compose.project=${project}`])).trim();
  if(!/^[a-f0-9]{12,64}$/.test(id))throw new Error('Expected exactly one dashboard web container');
  const format='{"service":{{json (index .Config.Labels "com.docker.compose.service")}},"networkMode":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}},"running":{{json .State.Running}}}';
  const web=JSON.parse(await execute(['inspect','--format',format,id]));
  if(web.service!=='web'||!web.running||web.networkMode!==project+'_default')throw new Error('Unexpected dashboard application boundary');
  const ports=Object.entries(web.ports||{}).filter(([,bindings])=>bindings?.length);
  if(ports.length!==1||ports[0][0]!=='8080/tcp'||ports[0][1].some(p=>p.HostPort!==String(port)))throw new Error('Unexpected dashboard product port');
  const volume=project+'_app-data-disk-v1',mount=web.mounts?.find(m=>m.Destination==='/data');
  if(!mount||mount.Type!=='volume'||!mount.RW||mount.Name!==volume)throw new Error('Dashboard database is outside its persistent application volume');
  const storage=JSON.parse(await execute(['volume','inspect','--format','{"driver":{{json .Driver}},"options":{{json .Options}}}',volume]));
  if(storage.driver!=='local'||storage.options?.type!=='none'||storage.options?.o!=='bind'||storage.options?.device!==`/workspaces/.pods-launch/volumes/${project}/app-data/data`)throw new Error('Dashboard storage is outside its durable Codespaces directory');
  const base=`http://127.0.0.1:${port}`,signal=AbortSignal.timeout(30000);
  async function read(path,options={}){
    const response=await request(base+path,{...options,signal,redirect:'error'});
    if(response.status!==200)throw new Error('Dashboard HTTP '+response.status);
    const reader=response.body.getReader(),chunks=[];let bytes=0;
    try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1048576)throw new Error('Dashboard response exceeded limit');chunks.push(value);}}finally{await reader.cancel();}
    const text=Buffer.concat(chunks).toString('utf8');return {text,type:response.headers.get('content-type')||''};
  }
  const page=await read('/');if(!/text\/html/i.test(page.type)||!/<(html|title|h1)\b/i.test(page.text))throw new Error('Dashboard product document missing');
  let result;
  if(fixture==='gradio'){
    const config=JSON.parse((await read('/config')).text);
    if(config.version!=='6.29.1'||config.api_prefix!=='/gradio_api'||!['read','increment'].every(name=>config.dependencies?.filter(x=>x.api_name===name&&x.api_visibility==='public'&&Array.isArray(x.inputs)&&x.inputs.length===0).length===1))throw new Error('Unexpected Gradio fixture interface');
    async function call(name){
      const {event_id}=JSON.parse((await read('/gradio_api/call/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[]})})).text);
      if(typeof event_id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(event_id))throw new Error('Invalid Gradio event identity');
      const response=await read('/gradio_api/call/'+name+'/'+event_id);
      if(!/^text\/event-stream\b/i.test(response.type))throw new Error('Gradio completion was not an event stream');
      const events=response.text.replaceAll('\r\n','\n');
      if(/^event: error$/m.test(events))throw new Error('Gradio returned an error event');
      const matches=[...events.matchAll(/^event: complete\ndata: ([^\n]+)$/gm)];
      if(matches.length!==1)throw new Error('Expected one Gradio completion event');
      const values=JSON.parse(matches[0][1]);if(!Array.isArray(values)||values.length!==1||!Number.isSafeInteger(values[0]))throw new Error('Invalid Gradio counter response');
      return values[0];
    }
    const before=await call('read');if(before!==expectedCount)throw new Error('Saved dashboard counter did not match before writing');
    const afterWrite=await call('increment'),afterRead=await call('read');
    result={version:config.version,protocol:'Gradio named endpoint and SSE completion',before,afterWrite,afterRead};
  }else{
    result=JSON.parse(await execute(['exec',id,'python','-c',streamlitProtocol,String(expectedCount)]));
    if(result.version!=='1.65.0'||result.heading!=='Streamlit + SQLite'||result.passed!==true)throw new Error('Unexpected Streamlit fixture interface');
    result.afterRead=result.afterReconnect;
  }
  if(result.before!==expectedCount||result.afterWrite!==expectedCount+1||result.afterRead!==result.afterWrite)throw new Error('Dashboard protocol write/read did not match');
  const query='import json,sqlite3; c=sqlite3.connect("file:/data/counter.sqlite?mode=ro",uri=True); row=c.execute("SELECT value FROM counter WHERE id=1").fetchone(); print(json.dumps({"version":sqlite3.sqlite_version,"integrity":c.execute("PRAGMA quick_check").fetchone()[0],"rowCount":c.execute("SELECT COUNT(*) FROM counter").fetchone()[0],"savedCount":row[0] if row else None})); c.close()';
  const database=JSON.parse(await execute(['exec',id,'python','-c',query]));
  if(!/^3\.\d+\.\d+$/.test(database.version)||database.integrity!=='ok'||database.rowCount!==1||database.savedCount!==result.afterRead)throw new Error('Dashboard SQLite record or integrity did not match');
  return {...result,passed:true,fixture,project,productDocument:true,database:{engine:'SQLite',...database},volume,durableWorkspaceVolume:true,productHostPorts:[port],databaseHostPorts:[],scope:'Real dashboard protocol interaction on user compute and read-only SQLite inspection. Browser/provider preview forwarding and VM replacement are separate checks.'};
}
export function dashboardProbeCommand(dataKey,options){
  return `const streamlitProtocol=${JSON.stringify(streamlitProtocol)};console.log(JSON.stringify(await (${probeDashboard.toString()})(${JSON.stringify(dataKey)},${JSON.stringify(options)})));`;
}
