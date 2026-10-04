// Isolated transfer experiment. Does not load images, start apps or alter caches.
export async function probeRangeDownload(url, expectedSha256, expectedBytes) {
  const {createHash} = await import('node:crypto');
  const {createReadStream} = await import('node:fs');
  const {mkdtemp, open, rm, stat} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const {join} = await import('node:path');
  const {Writable} = await import('node:stream');
  const {pipeline} = await import('node:stream/promises');
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'release-assets.githubusercontent.com' || target.username || target.password || target.port || target.hash) throw new Error('Unexpected artifact host');
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || !Number.isSafeInteger(expectedBytes) || expectedBytes < 4 || expectedBytes > 512 * 1024 ** 2) throw new Error('Invalid image identity');
  const directory = await mkdtemp(join(tmpdir(), 'pods-range-probe-'));
  const path = join(directory, 'image.gz'), controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]);
  let file, result;
  try {
    const started = performance.now(), recordedAt = new Date().toISOString();
    file = await open(path, 'wx', 0o600);
    const width = Math.ceil(expectedBytes / 4);
    const ranges = Array.from({length:4}, (_, i) => ({start:i * width, end:Math.min((i + 1) * width, expectedBytes) - 1}));
    const outcomes = await Promise.allSettled(ranges.map(async ({start, end}) => {
      try {
        const response = await fetch(target, {headers:{Range:`bytes=${start}-${end}`}, redirect:'error', signal});
        const responseHeadersMs = Math.round(performance.now() - started);
        if (response.status !== 206 || response.headers.get('content-range') !== `bytes ${start}-${end}/${expectedBytes}` || Number(response.headers.get('content-length')) !== end - start + 1) {
          await response.body?.cancel(); throw new Error('Range response mismatch');
        }
        let bytes = 0;
        await pipeline(response.body, new Writable({write(chunk, _, done) {
          if (bytes + chunk.length > end - start + 1) return done(new Error('Range exceeds declared size'));
          const position = start + bytes; bytes += chunk.length;
          (async () => {
            for (let offset = 0; offset < chunk.length;) {
              const {bytesWritten} = await file.write(chunk, offset, chunk.length - offset, position + offset);
              if (!bytesWritten) throw new Error('Range write made no progress');
              offset += bytesWritten;
            }
          })().then(() => done(), done);
        }}));
        if (bytes !== end - start + 1) throw new Error('Range truncated');
        return {start, end, bytes, responseHeadersMs, completedMs:Math.round(performance.now() - started), status:response.status};
      } catch (error) { controller.abort(); throw error; }
    }));
    if (outcomes.some(value => value.status !== 'fulfilled')) throw new Error('Parallel range transfer failed');
    await file.close(); file = null;
    const bodyCompleteMs = Math.round(performance.now() - started), hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    const sha256 = hash.digest('hex');
    if (sha256 !== expectedSha256 || (await stat(path)).size !== expectedBytes) throw new Error('Reassembled image integrity mismatch');
    result = {recordedAt, node:process.version, method:'four-ranges', bytes:expectedBytes, sha256,
      bodyCompleteMs, verifiedMs:Math.round(performance.now() - started), ranges:outcomes.map(value => value.value),
      diskHashMatches:true, requestAuthorizationHeader:false, redirectsAllowed:false};
  } finally { controller.abort(); await file?.close(); await rm(directory, {recursive:true, force:true}); }
  result.temporaryFilesRemoved = await stat(directory).then(() => false, e => { if (e.code === 'ENOENT') return true; throw e; });
  return result;
}
