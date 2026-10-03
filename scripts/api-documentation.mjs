// Discover an application's existing API interface; never generate a substitute UI.
export async function discoverApiDocumentation(origin) {
  const read = async (path, type, limit) => {
    const response = await fetch(new URL(path, origin), {signal:AbortSignal.timeout(3000),redirect:'error'});
    if (response.status !== 200 || !response.headers.get('content-type')?.toLowerCase().startsWith(type)) {
      await response.body?.cancel(); throw new Error('API documentation unavailable');
    }
    const chunks=[]; let size=0;
    for await (const chunk of response.body) {
      size+=chunk.length; if(size>limit)throw new Error('API documentation exceeds discovery limit');
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  };
  try {
    const schema=JSON.parse(await read('/openapi.json','application/json',512*1024));
    if(!/^3\.\d+\.\d+$/.test(schema.openapi)||!schema.paths||typeof schema.paths!=='object'||Array.isArray(schema.paths)||!Object.keys(schema.paths).some(path=>path.startsWith('/')))return null;
    const document=await read('/docs','text/html',256*1024);
    if(!/SwaggerUIBundle/.test(document)||!(/url\s*:\s*['"]\/openapi\.json['"]/.test(document)))return null;
    return {path:'/docs',schemaPath:'/openapi.json',schemaVersion:schema.openapi,status:200,contentType:'text/html',title:/<title[^>]*>([^<]*)<\/title>/i.exec(document)?.[1]?.slice(0,150)||'API documentation'};
  } catch { return null; }
}
