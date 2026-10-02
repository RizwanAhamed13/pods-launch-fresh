import { digest } from './util.mjs';

export function parseRepository(value, folder = '') {
  let url;
  try { url = new URL(value); } catch { throw new Error('Enter a GitHub repository URL, such as https://github.com/owner/application.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash) {
    throw new Error('Use a plain HTTPS GitHub repository URL without credentials or query parameters.');
  }
  const match = /^\/([a-zA-Z0-9-]{1,100})\/([a-zA-Z0-9_.-]{1,100})\/?$/.exec(url.pathname);
  if (!match) throw new Error('Paste the repository root URL. An application folder can be selected separately.');
  const owner = match[1].toLowerCase(), name = match[2].replace(/\.git$/, '').toLowerCase();
  if (!name || name === '.' || name === '..') throw new Error('Invalid repository name.');
  if (typeof folder !== 'string' || folder.length > 200 || (folder && !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(folder)) || folder.split('/').some(p => p === '.' || p === '..')) {
    throw new Error('Choose a relative application folder inside the repository.');
  }
  const canonical = `https://github.com/${owner}/${name}`;
  return { url: canonical, owner, name, folder, key: digest(canonical + '\n' + folder).slice(0, 24) };
}
