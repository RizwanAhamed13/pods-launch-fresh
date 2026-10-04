// Invoked on authorized compute with a short-lived asset URL supplied privately.
export async function probeArtifactDownload(url, expectedSha256, expectedBytes) {
  const {createHash} = await import('node:crypto');
  const {createWriteStream, createReadStream} = await import('node:fs');
  const {mkdtemp, rm, stat} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const {join} = await import('node:path');
  const {Transform} = await import('node:stream');
  const {pipeline} = await import('node:stream/promises');
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'release-assets.githubusercontent.com' || target.username || target.password || target.port || target.hash) throw new Error('Unexpected artifact host');
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || !Number.isSafeInteger(expectedBytes) || expectedBytes < 1 || expectedBytes > 512 * 1024 * 1024) throw new Error('Invalid image identity');
  const directory = await mkdtemp(join(tmpdir(), 'pods-cdn-probe-'));
  let result;
  try {
    const started = performance.now(), recordedAt = new Date().toISOString();
    // Deliberately no GitHub token or PODS authorization header on the CDN request.
    const response = await fetch(target, {redirect:'error', signal:AbortSignal.timeout(60000)});
    const responseHeadersMs = Math.round(performance.now() - started);
    if (response.status !== 200 || Number(response.headers.get('content-length')) !== expectedBytes) throw new Error('Unexpected asset response or size');
    const path = join(directory, 'image.gz'), hash = createHash('sha256');
    let bytes = 0;
    await pipeline(response.body, new Transform({transform(chunk, _, done) {
      bytes += chunk.length;
      if (bytes > expectedBytes) return done(new Error('Asset exceeds declared size'));
      hash.update(chunk); done(null, chunk);
    }}), createWriteStream(path, {flags:'wx', mode:0o600}));
    const downloadMs = Math.round(performance.now() - started), sha256 = hash.digest('hex');
    if (bytes !== expectedBytes || sha256 !== expectedSha256) throw new Error('Asset integrity mismatch');
    const diskHash = createHash('sha256');
    for await (const chunk of createReadStream(path)) diskHash.update(chunk);
    if (diskHash.digest('hex') !== expectedSha256 || (await stat(path)).size !== expectedBytes) throw new Error('Saved asset integrity mismatch');
    result = {recordedAt, node:process.version, host:target.hostname, status:response.status,
      bytes, sha256, responseHeadersMs, downloadMs, effectiveMBps:Number((bytes / downloadMs / 1000).toFixed(3)),
      diskHashMatches:true, requestAuthorizationHeader:false, redirectsAllowed:false};
  } finally { await rm(directory, {recursive:true, force:true}); }
  result.temporaryFilesRemoved = await stat(directory).then(() => false, e => { if (e.code === 'ENOENT') return true; throw e; });
  return result;
}
