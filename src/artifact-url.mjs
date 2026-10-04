// Only this provider-owned host may receive a signed image request. Never attach
// a PODS capability or GitHub credential to that request.
export function trustedImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'release-assets.githubusercontent.com' &&
      !url.username && !url.password && !url.port && !url.hash && Boolean(url.search) ? url.href : null;
  } catch { return null; }
}
