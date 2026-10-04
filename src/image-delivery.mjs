import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { trustedImageUrl } from './artifact-url.mjs';

const sha = /^[a-f0-9]{64}$/;
const validImage = image => sha.test(image?.sha256 || '') && Number.isSafeInteger(image.bytes) && image.bytes > 0 && image.bytes <= 512 * 1024 ** 2;
const cancel = response => response.body?.cancel().catch(() => {});

export class GitHubImageDelivery {
  #token;
  constructor({repository, releaseId, token, data, store, fetcher = fetch}) {
    if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repository || '') || !Number.isSafeInteger(releaseId) || releaseId < 1 || !token || /[\r\n]/.test(token)) throw new Error('Invalid private image delivery configuration.');
    Object.assign(this, {repository, releaseId, data, store, fetcher});
    this.#token = token;
  }

  static fromEnv({data, store, env = process.env}) {
    const repository = env.PODS_IMAGE_RELEASE_REPOSITORY, releaseId = env.PODS_IMAGE_RELEASE_ID, token = env.PODS_IMAGE_RELEASE_TOKEN;
    if (!repository && !releaseId && !token) return null;
    return new GitHubImageDelivery({repository, releaseId:Number(releaseId), token, data, store});
  }

  async request(path, {upload = false, ...options} = {}) {
    const response = await this.fetcher(`https://${upload ? 'uploads' : 'api'}.github.com/repos/${this.repository}/${path}`, {
      ...options, redirect:'manual', headers:{Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', ...options.headers, Authorization:`Bearer ${this.#token}`},
    });
    if (!response.ok) { await cancel(response); throw new Error(`Private image storage request failed (${response.status}).`); }
    return response.json();
  }

  async privateRepository(signal) {
    const response = await this.fetcher(`https://api.github.com/repos/${this.repository}`, {
      headers:{Accept:'application/vnd.github+json', Authorization:`Bearer ${this.#token}`}, redirect:'manual', signal,
    });
    if (!response.ok) { await cancel(response); throw new Error('Private image repository is unavailable.'); }
    if ((await response.json()).private !== true) throw new Error('Image delivery requires a private repository.');
  }

  matches(asset, image) {
    return Number.isSafeInteger(asset?.id) && asset.id > 0 && asset.name === image.sha256 + '.gz' &&
      asset.state === 'uploaded' && asset.size === image.bytes && asset.digest === 'sha256:' + image.sha256;
  }

  async publish(images) {
    if (!images.length) return;
    if (!images.every(validImage)) throw new Error('Invalid image publication identity.');
    await this.privateRepository(AbortSignal.timeout(5000));
    for (const image of images) {
      let asset;
      for (let page = 1; page <= 10; page++) {
        const assets = await this.request(`releases/${this.releaseId}/assets?per_page=100&page=${page}`, {signal:AbortSignal.timeout(5000)});
        if (!Array.isArray(assets)) throw new Error('Invalid image asset inventory.');
        asset = assets.find(value => value.name === image.sha256 + '.gz');
        if (asset || assets.length < 100) break;
        if (page === 10) throw new Error('Image release asset capacity reached.');
      }
      if (!asset) {
        const path = join(this.data, 'images', image.sha256 + '.gz');
        if ((await stat(path)).size !== image.bytes) throw new Error('Prepared image size changed.');
        const hash = createHash('sha256');
        for await (const chunk of createReadStream(path)) hash.update(chunk);
        if (hash.digest('hex') !== image.sha256) throw new Error('Prepared image integrity check failed.');
        asset = await this.request(`releases/${this.releaseId}/assets?name=${image.sha256}.gz`, {
          upload:true, method:'POST', headers:{'Content-Type':'application/gzip', 'Content-Length':String(image.bytes)},
          body:createReadStream(path), duplex:'half', signal:AbortSignal.timeout(180000),
        });
      }
      if (!this.matches(asset, image)) throw new Error('Private image asset identity mismatch.');
      this.store.put('image-delivery', image.sha256, {repository:this.repository, releaseId:this.releaseId, assetId:asset.id, sha256:image.sha256, bytes:image.bytes});
    }
  }

  async resolve(image) {
    if (!validImage(image)) return null;
    const saved = this.store.get('image-delivery', image.sha256);
    if (!saved || saved.repository !== this.repository || saved.releaseId !== this.releaseId || saved.bytes !== image.bytes || saved.sha256 !== image.sha256 || !Number.isSafeInteger(saved.assetId) || saved.assetId < 1) return null;
    try {
      const signal = AbortSignal.timeout(5000);
      await this.privateRepository(signal);
      const response = await this.fetcher(`https://api.github.com/repos/${this.repository}/releases/assets/${saved.assetId}`, {
        headers:{Accept:'application/octet-stream', Authorization:`Bearer ${this.#token}`, 'X-GitHub-Api-Version':'2022-11-28'}, redirect:'manual', signal,
      });
      const location = response.status === 302 ? trustedImageUrl(response.headers.get('location')) : null;
      // GitHub may stream a 200 instead of redirecting. Keep the existing local
      // source in that case; do not proxy a second remote download through PODS.
      await cancel(response);
      return location;
    } catch { return null; }
  }
}
