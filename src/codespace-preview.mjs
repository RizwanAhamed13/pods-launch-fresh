import { spawn } from 'node:child_process';
import { command, sleep } from './util.mjs';

export async function ensureCodespacePreview({name,port,env,exec=command,spawnProcess=spawn,pollMs=1000,timeoutMs=60000}) {
  const deadline=Date.now()+timeoutMs;
  const options=()=>{
    const timeout=deadline-Date.now();
    if(timeout<=0)throw new Error('Codespaces preview registration timed out.');
    // A recovering tunnel can take longer than 15s. Every command shares the
    // stage deadline, so a slow lookup cannot reset the registration budget.
    return {env,timeout};
  };
  const lookup=async()=>{
    const ports=JSON.parse(await exec('gh',['codespace','ports','-c',name,'--json','sourcePort,visibility'],options()));
    if(!Array.isArray(ports))throw new Error('Codespaces did not return its preview ports.');
    return ports.find(entry=>entry.sourcePort===port);
  };
  let forward,closed,forwardError;
  try {
    let mapping=await lookup();
    if(!mapping){
      // gh registers a private remote tunnel port. Its loopback listener is temporary;
      // the remote mapping remains after the CLI exits. Never bind a public listener.
      forward=spawnProcess('gh',['codespace','ports','forward',`${port}:0`,'-c',name],{env,stdio:'ignore'});
      closed=new Promise(resolve=>{forward.once('error',error=>{forwardError=error;resolve();});forward.once('exit',(code,signal)=>{forwardError=new Error(`Codespaces forwarding ended before registration (${code??signal}).`);resolve();});});
      while(!mapping){
        if(forwardError)throw forwardError;
        if(Date.now()>=deadline)throw new Error('Codespaces preview registration timed out.');
        await sleep(Math.min(pollMs,deadline-Date.now()));mapping=await lookup();
      }
    }
    if(mapping.visibility!=='private')await exec('gh',['codespace','ports','visibility',`${port}:private`,'-c',name],options());
  }finally{
    if(forward){forward.kill('SIGTERM');const timer=setTimeout(()=>forward.kill('SIGKILL'),2000);await closed;clearTimeout(timer);}
  }
}
