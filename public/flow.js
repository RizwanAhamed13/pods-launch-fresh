export const ended = status => ['ready', 'failed', 'stopped'].includes(status);
export const providerName = provider => provider === 'google' ? 'Google Cloud Shell' : 'GitHub Codespaces';
export function route(path) {
  if (path === '/develop') return { view: 'develop' };
  const match = /^\/launch\/([a-z0-9-]+)$/.exec(path);
  return match ? { view: 'launch', appId: match[1] } : { view: 'catalog' };
}
export function appForRoute(apps, page) {
  return page.view === 'launch' ? apps.find(app => app.id === page.appId) || null : null;
}
export function pendingForPage(raw, page, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (!value || !['github', 'google'].includes(value.provider) || !Number.isFinite(value.createdAt) || now - value.createdAt > 600000 || value.createdAt > now + 1000) return null;
    if (value.action === 'launch' && page.view === 'launch' && value.appId === page.appId) return value;
    if (value.action === 'build' && page.view === 'develop' && typeof value.url === 'string' && value.url.length <= 300 && typeof value.folder === 'string' && value.folder.length <= 200) return value;
  } catch { /* Expired or invalid browser state must never launch a different app. */ }
  return null;
}
export function previewAddress(value, origin) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:' && (url.hostname.endsWith('.app.github.dev') || url.hostname.endsWith('.cloudshell.dev'))) return url.href;
    // Same-origin loopback is reserved for the deterministic browser fixture.
    const own = new URL(origin);
    if (url.origin === own.origin && ['127.0.0.1', 'localhost'].includes(own.hostname)) return url.href;
  } catch { /* A missing preview URL cannot be opened. */ }
  return null;
}
