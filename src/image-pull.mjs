import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';

// The destination comes only from the control plane's artifact origin. Never
// accept a registry URL or credentials from a developer's artifact.
export function registryTarget(image, config) {
  if (config.registryImages === undefined) return null;
  if (!Array.isArray(config.registryImages) || config.registryImages.length > 8 || config.registryImages.some(id => !/^[a-f0-9]{64}$/.test(id))) throw new Error('Invalid registry image selection');
  if (!config.registryImages.includes(image.sha256)) return null;
  const origin = new URL(config.artifactUrl);
  if ((origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['127.0.0.1','localhost'].includes(origin.hostname))) || origin.username || origin.password || !/^[A-Za-z0-9_-]{32}$/.test(config.id) || !/^[A-Za-z0-9_-]{32}$/.test(config.token)) throw new Error('Invalid registry launch authorization');
  return {host:origin.host, reference:`${origin.host}/pods/${Buffer.from(config.id).toString('hex')}/${image.sha256}@${image.id}`};
}

export async function pullRegistryImage(image, config, root, target, execute, signal) {
  signal.throwIfAborted();
  const directory = await mkdtemp(join(root, '.registry-auth-'));
  try {
    await writeFile(join(directory, 'config.json'), JSON.stringify({auths:{[target.host]:{auth:Buffer.from(`${config.id}:${config.token}`).toString('base64')}}}), {flag:'wx',mode:0o600});
    // The CLI reads only this launch's private config, never the user's login.
    await execute(['--config',directory,'pull','--platform','linux/amd64',target.reference], {timeout:45000,signal});
    signal.throwIfAborted();
    if (await execute(['image','inspect',image.id,'--format','{{.Id}}'], {signal}) !== image.id) throw new Error('Pulled image identity mismatch');
  } finally {await rm(directory, {recursive:true,force:true});}
}
