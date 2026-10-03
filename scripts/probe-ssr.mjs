// Serialized into an authorized Codespace. This checks our SSR fixtures over
// HTTP; hydration and interaction still require a separate real browser check.
export async function probeSsrProduct(base='http://127.0.0.1:8080',fixture='nuxt') {
  if(!['nuxt','next'].includes(fixture))throw new Error('Unknown SSR fixture');
  const heading=fixture==='next'?'Next\\.js counter':'Nuxt counter',prefix=fixture==='next'?'/_next/':'/_nuxt/';
  async function read(url) {
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('SSR fixture HTTP '+response.status);
    return response;
  }
  const root=new URL('/',base),response=await read(root),page=await response.text();
  const productRendered=new RegExp('<h1\\b[^>]*>'+heading+'<\\/h1>').test(page)&&/<p\b[^>]*\bid=["']value["'][^>]*>0<\/p>/.test(page);
  if(!response.headers.get('content-type')?.includes('text/html')||!productRendered)throw new Error('Expected server-rendered '+fixture+' counter was not found');
  const sources=[...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match=>new URL(match[1],root));
  if(!sources.length||sources.length>16)throw new Error('Expected '+fixture+' client entry scripts were not found');
  if(sources.some(url=>url.origin!==root.origin||!url.pathname.startsWith(prefix)||!url.pathname.endsWith('.js')))throw new Error('Unexpected '+fixture+' client script URL');
  const scripts=[];
  for(const url of sources) {
    const script=await read(url),contentType=script.headers.get('content-type')||'',body=await script.text();
    if(!/javascript|ecmascript/i.test(contentType)||!body.trim()||/^\s*</.test(body))throw new Error('SSR client entry did not return JavaScript');
    scripts.push({path:url.pathname,status:script.status,contentType,bytes:new TextEncoder().encode(body).length});
  }
  return {fixture,productRendered,initialCounter:0,scripts,passed:true,scope:'Authenticated HTTP server-rendered fixture and client entry assets; not browser hydration, interaction or database persistence'};
}
export {probeSsrProduct as probeNuxtSsr};
export function ssrProbeCommand(fixture='nuxt',base='http://127.0.0.1:8080') {
  return `console.log(JSON.stringify(await (${probeSsrProduct.toString()})(${JSON.stringify(base)},${JSON.stringify(fixture)})));`;
}
