import { providers as realProviders } from '../src/providers.mjs';

// Orchestration tests keep their command mock; transport lifecycle has separate
// real-child tests. Commands become observable only when the privacy gate opens.
export function providers(options) {
  return realProviders({openSsh:(file,args,config)=>{
    const {promise:result,resolve,reject}=Promise.withResolvers();let sent=false;
    result.catch(()=>{});
    return {result,send(input){sent=true;Promise.resolve().then(()=>options.exec(file,args,{...config,input})).then(resolve,reject);return result;},
      async cancel(){if(!sent)reject(new Error('Cancelled'));await result.catch(()=>{});}};
  },...options});
}
