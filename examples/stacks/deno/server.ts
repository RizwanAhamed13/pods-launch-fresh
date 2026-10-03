const directory=Deno.env.get('PODS_APP_DATA')||'/data';Deno.mkdirSync(directory,{recursive:true});
const file=directory+'/counter.txt';
function count(increment=false){let value=0;try{value=Number(Deno.readTextFileSync(file));}catch(e){if(!(e instanceof Deno.errors.NotFound))throw e;}if(increment){value++;Deno.writeTextFileSync(file,String(value));}return value;}
const html="<!doctype html><title>Deno persistent counter</title><h1>Deno persistent counter</h1><p id=\"value\">Loading</p><button id=\"add\">Add one</button><script>const v=document.querySelector('#value');async function load(method='GET'){v.textContent=(await(await fetch('/api/count',{method})).json()).count}document.querySelector('#add').onclick=()=>load('POST');load();</script>";
Deno.serve({hostname:'0.0.0.0',port:Number(Deno.env.get('PORT')||8080)},req=>new URL(req.url).pathname==='/api/count'?Response.json({count:count(req.method==='POST')}):new Response(html,{headers:{'Content-Type':'text/html'}}));
