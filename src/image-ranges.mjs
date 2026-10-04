import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, rm, stat } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { trustedImageUrl } from './artifact-url.mjs';

// Four bounded requests share a deadline. Docker only receives the complete,
// verified archive after every range and the final whole-file hash have passed.
export async function downloadImageRanges(url, image, path, fetcher = fetch) {
  if (!trustedImageUrl(url) || !/^[a-f0-9]{64}$/.test(image.sha256) || !Number.isSafeInteger(image.bytes) || image.bytes < 1 || image.bytes > 512 * 1024 ** 2) throw new Error('Invalid image range request');
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
  const width = Math.ceil(image.bytes / 4), ranges = [];
  for (let start = 0; start < image.bytes; start += width) ranges.push({start, end:Math.min(start + width, image.bytes) - 1});
  let file, created = false, verified = false;
  try {
    file = await open(path, 'wx', 0o600); created = true;
    const outcomes = await Promise.allSettled(ranges.map(async ({start, end}) => {
      try {
        const response = await fetcher(url, {headers:{Range:`bytes=${start}-${end}`}, redirect:'error', signal});
        if (response.status !== 206 || response.headers.get('content-range') !== `bytes ${start}-${end}/${image.bytes}` || Number(response.headers.get('content-length')) !== end - start + 1) {
          await response.body?.cancel().catch(() => {}); throw new Error('Prepared image range response mismatch');
        }
        let bytes = 0;
        await pipeline(response.body, new Writable({write(chunk, _, done) {
          if (bytes + chunk.length > end - start + 1) return done(new Error('Prepared image range exceeds declared size'));
          const position = start + bytes; bytes += chunk.length;
          (async () => {
            for (let offset = 0; offset < chunk.length;) {
              const {bytesWritten} = await file.write(chunk, offset, chunk.length - offset, position + offset);
              if (!bytesWritten) throw new Error('Prepared image write made no progress');
              offset += bytesWritten;
            }
          })().then(() => done(), done);
        }}), {signal});
        if (bytes !== end - start + 1) throw new Error('Prepared image range truncated');
      } catch (error) { controller.abort(); throw error; }
    }));
    if (outcomes.some(result => result.status !== 'fulfilled')) throw new Error('Prepared image range transfer failed');
    await file.close(); file = null;
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    if (hash.digest('hex') !== image.sha256 || (await stat(path)).size !== image.bytes) throw new Error('Prepared image integrity check failed');
    verified = true;
  } finally {
    controller.abort();
    try { await file?.close(); } finally { if (created && !verified) await rm(path, {force:true}); }
  }
}
