import { spawn } from 'node:child_process';
const active=new Set();
process.once('exit',()=>{for(const kill of active)kill();});

// Open the transport without sending application bytes. Each command owns its
// process group so cancellation also closes gh's SSH/tunnel descendants.
export function deferredCommand(file,args,{env,holdTimeout=65000,timeout=60000,spawnProcess=spawn}={}) {
  const child=spawnProcess(file,args,{env,stdio:['pipe','pipe','pipe'],detached:true});
  let sent=false,closed=false,failure,output='',timer;
  const {promise:result,resolve,reject}=Promise.withResolvers();
  result.catch(()=>{}); // An early SSH failure may precede the privacy decision.
  const kill=()=>{
    if(closed||!child.pid)return;
    try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}
  };
  const stop=error=>{failure??=error;clearTimeout(timer);child.stdin.destroy();kill();};
  active.add(kill);
  child.stdout.on('data',bytes=>{output=(output+bytes).slice(-65536);});
  child.stderr.on('data',()=>{}); // Never include remote output or credentials in errors.
  child.stdin.on('error',error=>stop(error));
  child.once('error',error=>stop(error));
  child.once('exit',(code,signal)=>{
    if(!sent)stop(new Error('SSH ended before private preview confirmation.'));
    else if(code!==0)stop(new Error(`SSH delivery ended (${code??signal}).`));
  });
  child.once('close',(code,signal)=>{
    closed=true;clearTimeout(timer);active.delete(kill);
    if(failure)reject(failure);
    else if(!sent)reject(new Error('SSH ended before private preview confirmation.'));
    else if(code!==0)reject(new Error(`SSH delivery ended (${code??signal}).`));
    else resolve(output);
  });
  timer=setTimeout(()=>stop(new Error('SSH private-preview wait timed out.')),holdTimeout);
  return {
    result,
    send(input) {
      if(closed||failure)return result;
      if(sent)return Promise.reject(new Error('SSH bootstrap was already sent.'));
      sent=true;clearTimeout(timer);
      timer=setTimeout(()=>stop(new Error('SSH delivery timed out.')),timeout);
      child.stdin.end(input);
      return result;
    },
    async cancel() {
      if(!closed)stop(new Error('SSH delivery cancelled.'));
      await result.catch(()=>{}); // Wait for close: do not leave an unreaped child.
    }
  };
}
