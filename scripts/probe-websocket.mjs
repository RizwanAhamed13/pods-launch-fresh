// This function is also serialized into the authorized Codespace's Node process.
// Keep it self-contained. It exercises the Bun fixture, not arbitrary protocols.
export async function probeBunWebSocket(base='http://127.0.0.1:8080') {
  async function read(path){const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('WebSocket fixture HTTP '+response.status);return response;}
  const page=await(await read('/')).text(),before=(await(await read('/api/count')).json()).count;
  if(!Number.isInteger(before))throw new Error('Invalid persisted counter');
  const url=new URL('/ws',base);url.protocol=url.protocol==='https:'?'wss:':'ws:';
  async function connect(){
    const socket=new WebSocket(url);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>finish(new Error('WebSocket connection timed out')),10000);
      function finish(error){clearTimeout(timer);socket.onopen=null;socket.onerror=null;socket.onclose=null;if(error){socket.close();reject(error);}else resolve();}
      socket.onopen=()=>finish();socket.onerror=()=>finish(new Error('WebSocket connection failed'));socket.onclose=()=>finish(new Error('WebSocket closed before connecting'));
    });
    return socket;
  }
  async function exchange(socket,message){return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>finish(new Error('WebSocket reply timed out')),5000);
    function finish(error,value){clearTimeout(timer);socket.onmessage=null;socket.onerror=null;socket.onclose=null;error?reject(error):resolve(value);}
    socket.onmessage=event=>finish(null,String(event.data));socket.onerror=()=>finish(new Error('WebSocket exchange failed'));socket.onclose=()=>finish(new Error('WebSocket closed before replying'));
    socket.send(message);
  });}
  let socket;
  try{
    socket=await connect();const pong=await exchange(socket,'ping');
    const afterMessage=JSON.parse(await exchange(socket,'increment')).count;
    socket.close();socket=await connect();const reconnectPong=await exchange(socket,'ping');
    const afterRead=(await(await read('/api/count')).json()).count;
    return {productDocument:/<(html|title|h1)\b/i.test(page),before,pong,afterMessage,reconnectPong,afterRead,
      passed:/<(html|title|h1)\b/i.test(page)&&pong==='pong'&&afterMessage===before+1&&reconnectPong==='pong'&&afterRead===afterMessage};
  }finally{socket?.close();}
}
