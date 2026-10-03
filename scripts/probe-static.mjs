// Serialized into authorized user compute. Browser execution is tested separately.
export async function probeStaticProduct(base='http://127.0.0.1:8080',fixture='react') {
  const frameworks={react:'React',angular:'Angular',vue:'Vue',svelte:'Svelte',preact:'Preact',solid:'Solid',lit:'Lit',alpine:'Alpine'};
  if(!Object.hasOwn(frameworks,fixture))throw new Error('Unknown static fixture');
  const root=new URL('/',base),heading=frameworks[fixture]+' counter';
  async function read(url,headers) {
    const response=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Static fixture HTTP '+response.status);
    return response;
  }
  const response=await read(root),page=await response.text();
  const mount=fixture==='angular'?/<stack-counter\b[^>]*>/i:/<div\b[^>]*\bid=["']app["'][^>]*>/i;
  if(!response.headers.get('content-type')?.includes('text/html')||!mount.test(page))throw new Error('Expected '+fixture+' product mount was not found');
  const tags=[...page.matchAll(/<script\b[^>]*>/gi)].map(m=>m[0]);
  const entries=tags.filter(tag=>/\btype=["']module["']/i.test(tag)).map(tag=>tag.match(/\bsrc=["']([^"']+)["']/i)?.[1]);
  if(!entries.length||entries.length>16||entries.some(path=>!path))throw new Error('Compiled module entries were not found');
  const baseHref=page.match(/<base\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
  const documentBase=url=>baseHref?new URL(baseHref,url):url;
  const urls=entries.map(path=>new URL(path,documentBase(root)));
  const assetPath=fixture==='angular'?/^\/(main|polyfills)(-[\w-]+)?\.js$/:/^\/assets\/[\w.-]+\.js$/;
  if(urls.some(url=>url.origin!==root.origin||!assetPath.test(url.pathname)))throw new Error('Unexpected compiled module URL');
  const scripts=[];let fixtureCode=false;
  for(const url of urls){
    const script=await read(url),contentType=script.headers.get('content-type')||'',body=await script.text();
    if(!/javascript|ecmascript/i.test(contentType)||!body.trim()||/^\s*</.test(body))throw new Error('Compiled entry did not return JavaScript');
    fixtureCode||=body.includes(heading)&&body.includes('Add one');
    scripts.push({path:url.pathname,status:script.status,contentType,bytes:new TextEncoder().encode(body).length});
  }
  if(!fixtureCode)throw new Error('Expected counter code missing from compiled entries');
  const routeUrl=new URL('/pods-spa-check/nested',root),route=await read(routeUrl,{Accept:'text/html'});
  if(!route.headers.get('content-type')?.includes('text/html')||await route.text()!==page)throw new Error('Expected application document missing on nested route');
  if(entries.some((path,i)=>new URL(path,documentBase(routeUrl)).href!==urls[i].href))throw new Error('Compiled assets resolve incorrectly on nested route');
  const missing=await fetch(new URL('/assets/pods-missing-check.js',root),{redirect:'error',signal:AbortSignal.timeout(10000)});
  await missing.arrayBuffer();
  if(missing.status!==404)throw new Error('Expected missing asset to return HTTP 404');
  return {fixture,productMount:true,fixtureCode,scripts,spaRoute:{path:routeUrl.pathname,status:route.status,documentMatches:true,entriesResolve:true},missingAssetStatus:missing.status,passed:true,scope:'Authenticated HTTP product shell, compiled entry assets and nested route document; not JavaScript execution, browser interaction or database persistence'};
}
export function staticProbeCommand(fixture='react',base='http://127.0.0.1:8080') {
  return `console.log(JSON.stringify(await (${probeStaticProduct.toString()})(${JSON.stringify(base)},${JSON.stringify(fixture)})));`;
}
