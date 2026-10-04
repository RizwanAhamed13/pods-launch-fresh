import { createReadStream } from 'node:fs';
import { lstat, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { decodeArtifact } from './runner.mjs';

async function regularFile(path, limit) {
  const info = await lstat(path);
  if (!info.isFile() || info.size > limit) throw new Error('Prepared migration input is not a bounded regular file.');
  return info.size;
}

// Only already-published bytes may be promoted. Preflight every image before any
// remote write; a retry reuses assets verified by GitHubImageDelivery.publish.
export async function migratePreparedImages({data, appId, delivery, publish = false, onProgress = () => {}}) {
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(appId || '')) throw new Error('Invalid prepared application id.');
  const metadata = join(data, 'artifacts', appId + '.json');
  await regularFile(metadata, 1024 ** 2);
  const manifest = JSON.parse(await readFile(metadata, 'utf8'));
  if (manifest.id !== appId || !/^[a-f0-9]{64}$/.test(manifest.sha256 || '')) throw new Error('Prepared application identity mismatch.');
  const archive = join(data, 'artifacts', manifest.sha256 + '.gz');
  const size = await regularFile(archive, 20 * 1024 ** 2);
  if (size !== manifest.bytes) throw new Error('Prepared artifact size mismatch.');
  const artifact = decodeArtifact(await readFile(archive), manifest.sha256);
  const images = artifact.format === 2 ? artifact.containers.images : [];
  const declared = manifest.images || [];
  if (!Array.isArray(declared) || declared.length !== images.length || images.some(image =>
    !declared.some(item => item?.id === image.id && item.sha256 === image.sha256 && item.bytes === image.bytes))) {
    throw new Error('Prepared image metadata mismatch.');
  }
  const unique = [...new Map(images.map(image => [image.sha256, image])).values()];
  if (unique.length !== images.length) throw new Error('Prepared image identities share conflicting archive references.');
  for (const image of unique) {
    const path = join(data, 'images', image.sha256 + '.gz');
    if (await regularFile(path, 512 * 1024 ** 2) !== image.bytes) throw new Error('Prepared image size mismatch.');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    if (hash.digest('hex') !== image.sha256) throw new Error('Prepared image integrity check failed.');
  }
  const result = {appId, artifactSha256:manifest.sha256, mode:publish ? 'publish' : 'dry-run',
    imageCount:unique.length, imageBytes:unique.reduce((sum, image) => sum + image.bytes, 0), verifiedMappings:0};
  if (publish && unique.length) {
    if (!delivery) throw new Error('Private image delivery is not configured.');
    for (const image of unique) {
      await delivery.publish([image]);
      result.verifiedMappings++;
      onProgress({...result, imageSha256:image.sha256});
    }
  }
  return result;
}
