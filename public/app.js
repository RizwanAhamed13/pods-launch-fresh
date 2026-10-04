import { ended, providerName, route, appForRoute, pendingForPage, previewAddress } from './flow.js';

const $ = id => document.getElementById(id);
const page = route(location.pathname);
let me, app, active, building, timer, autoOpen = false, busy = false, initializing = true;
let pollVersion = 0, pollController;
function cancelPolling() { pollVersion++; clearTimeout(timer); pollController?.abort(); }
window.addEventListener('pagehide', cancelPolling);
const selected = () => document.querySelector('input[name="provider"]:checked').value;
const notice = text => { $('notice').textContent = text; $('notice').hidden = !text; };
const title = item => {
  if (!item.verification?.title) return item.name;
  // Prepared HTML titles contain character references. Escape literal markup
  // before decoding, then callers render only text (never the decoded HTML).
  const text = document.createElement('textarea');
  text.innerHTML = item.verification.title.replaceAll('<', '&lt;');
  return text.value;
};
const time = ms => `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
const storage = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Current-page actions work without storage. */ } },
  remove(key) { try { sessionStorage.removeItem(key); } catch {} },
};
async function api(path, options = {}) {
  let response;
  try { response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', 'X-Pods-CSRF': me?.csrf || '', ...options.headers } }); }
  catch { throw Object.assign(new Error('The connection to PODS was interrupted.'), { retryable: true }); }
  const retryable = response.status === 408 || response.status >= 500;
  const unreadable = () => Object.assign(new Error('PODS could not return an update. Please try again.'), { status: response.status, retryable: response.ok || retryable });
  if ((response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') { await response.body?.cancel(); throw unreadable(); }
  let result; try { result = await response.json(); } catch { throw unreadable(); }
  if (!response.ok) throw Object.assign(new Error(result.error || 'The request could not be completed.'), { status: response.status, code: result.code, retryable });
  return result;
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function provider(value) {
  document.querySelector(`input[name="provider"][value="${value === 'google' ? 'google' : 'github'}"]`).checked = true;
}
function connections() {
  for (const c of me.connections) $(`${c.provider}-status`).textContent = c.connected ? `Connected · ${c.name}` : 'Connect your ' + (c.provider === 'google' ? 'Google' : 'GitHub') + ' account';
  const current = me.connections.find(c => c.provider === selected());
  $('disconnect').hidden = !current?.connected;
  $('token-connect').hidden = Boolean(current?.oauthReady || current?.connected);
  $('token-help').textContent = 'Browser authorization is not configured on this preview yet. ' + (selected() === 'google' ? 'A Google token needs Cloud Shell access and OpenID identity scopes.' : 'A GitHub token needs the codespace scope to launch.') + ' Connections expire after one hour.';
  $('launch').textContent = current?.connected ? 'Open ' + (app ? title(app) : 'application') : 'Connect and open application';
}
function setBusy(value) {
  busy = value;
  const locked = value || initializing;
  $('launch').disabled = locked || !app;
  $('prepare').disabled = locked || !me?.buildsEnabled;
  $('repository').readOnly = locked; $('folder').readOnly = locked;
  document.querySelectorAll('input[name="provider"]').forEach(input => { input.disabled = locked; });
}
function catalogue() {
  $('apps').replaceChildren();
  if (!me.apps.length) {
    $('apps').append(element('p', 'No applications are prepared yet.'));
    const link = element('a', 'Prepare the first application', 'secondary'); link.href = '/develop'; $('apps').append(link); return;
  }
  const sorted = [...me.apps].sort((a, b) => (b.preparedAt || b.builtAt || '').localeCompare(a.preparedAt || a.builtAt || ''));
  for (const item of sorted) {
    const link = element('a', '', 'app-choice'); link.href = '/launch/' + item.id;
    const info = element('div'); info.append(element('h3', title(item)));
    info.append(element('p', item.description || (item.source ? 'From ' + new URL(item.source.url).pathname.slice(1) : 'A prepared application, ready for your compute.')));
    link.append(info, element('span', 'Try application', 'app-action')); $('apps').append(link);
  }
}
function application() {
  if (!app) { $('workspace').hidden = true; $('page-title').textContent = 'Application unavailable'; $('page-intro').textContent = 'This launch link does not point to an available prepared version.'; notice('This prepared version is unavailable. Choose an application from the home page or ask its developer for a new link.'); return; }
  document.title = `${title(app)} · PODS`;
  $('page-title').textContent = 'Make yourself at home.';
  $('page-intro').textContent = 'This version is prepared. Choose your compute to open the application.';
  $('application-title').textContent = title(app);
  $('application-description').textContent = app.description || 'Ready to run in your own environment.';
  const facts = $('application-facts'); facts.replaceChildren();
  if (app.source) {
    const row = element('div'), value = element('dd'), link = element('a', new URL(app.source.url).pathname.slice(1));
    link.href = app.source.url + '/tree/' + app.source.revision; link.target = '_blank'; link.rel = 'noreferrer';
    value.append(link); row.append(element('dt', 'Source'), value); facts.append(row);
    const revision = element('div'); revision.append(element('dt', 'Version'), element('dd', app.source.revision.slice(0, 12))); facts.append(revision);
  }
  const downloadBytes = app.bytes + (app.images || []).reduce((sum, image) => sum + image.bytes, 0);
  const downloadSize = downloadBytes >= 1024 * 1024 ? `${(downloadBytes / 1024 / 1024).toFixed(1)} MB` : `${(downloadBytes / 1024).toFixed(1)} KB`;
  const size = element('div'); size.append(element('dt', 'Prepared download'), element('dd', downloadSize)); facts.append(size);
}
async function ensureConnection(intent, reconnect = false) {
  if (!reconnect && me.connections.find(c => c.provider === intent.provider)?.connected) return true;
  storage.set('pods-pending', { ...intent, createdAt: Date.now() });
  if (me.connections.find(c => c.provider === intent.provider)?.oauthReady) location.assign('/auth/' + intent.provider + '?returnTo=' + encodeURIComponent(location.pathname));
  else {
    $('token-connect').hidden = false; $('token-connect').open = true; $('token').focus();
    notice('Browser authorization is not configured on this preview. Use the preview connection below to continue.');
  }
  return false;
}
function stages(labels, phase, failed = false) {
  $('stages').replaceChildren(...labels.map((label, index) => {
    const item = element('li', label); item.className = index < phase ? 'done' : index === phase ? 'active' : '';
    if (index === phase) item.setAttribute('aria-current', 'step');
    if (failed && index === phase) item.className = 'failed';
    return item;
  }));
}
const launchLabels = { connecting: 'Connecting your compute', provisioning: 'Starting your environment', delivering: 'Sending the prepared application', downloading: 'Receiving the prepared application', starting: 'Starting your application', ready: 'Opening your application', failed: 'Your application could not start', stopped: 'Application stopped' };
function showLaunch(state) {
  if (active?.id !== state.id) cancelPolling();
  const changed = active?.id !== state.id || active?.status !== state.status || active?.stopRequested !== state.stopRequested;
  active = state; $('progress').hidden = false; setBusy(!ended(state.status) || state.stopRequested && !['failed', 'stopped'].includes(state.status));
  $('elapsed').textContent = time((state.readyAt || Date.now()) - state.createdAt);
  const address = previewAddress(state.previewUrl, location.origin);
  $('open-app').hidden = state.status !== 'ready' || !address;
  if (address) $('open-app').href = address;
  $('open-app').textContent = 'Open ' + state.appName;
  $('stop').hidden = ['failed', 'stopped'].includes(state.status); $('stop').disabled = Boolean(state.stopRequested);
  $('stop').textContent = state.stopRequested ? 'Stopping application…' : 'Stop application';
  if (changed) {
    $('stage-title').textContent = state.status === 'ready' && !autoOpen ? 'Your application is ready' : launchLabels[state.status] || 'Starting your application';
    stages(['Start your environment', 'Receive the prepared app', 'Open the product'], state.status === 'ready' ? 2 : ['delivering', 'downloading', 'starting'].includes(state.status) ? 1 : 0, state.status === 'failed');
    $('stage-detail').textContent = state.error || (state.status === 'ready' ? `The app is healthy on your ${providerName(state.provider)}. Your provider may ask you to sign in to its private preview.${state.storageMode === 'ephemeral' ? ' This session uses temporary storage; changes are lost when the environment resets.' : ''}` : state.status === 'stopped' ? 'You can start a new preview when you are ready.' : ['connecting', 'provisioning'].includes(state.status) ? 'Your provider is preparing compute. A cold environment can take longer than 20 seconds.' : 'The app is already built. PODS is checking it before opening the product.');
  }
  if (state.status === 'ready' && autoOpen && address) {
    autoOpen = false; storage.set('pods-active', { id: state.id, appId: state.appId, autoOpen: false });
    storage.set('pods-last-navigation', { launchId: state.id, acceptedAt: state.createdAt, healthyAt: state.readyAt, navigationAt: Date.now() });
    cancelPolling(); location.assign(address);
  }
}
const buildLabels = { queued: 'Waiting for a build slot', preparing: 'Preparing the build environment', fetching: 'Getting your repository', detecting: 'Finding the application', installing: 'Installing build dependencies', compiling: 'Compiling the application', packaging: 'Preparing the launch artifact', verifying: 'Checking the product page', publishing: 'Saving your prepared version', ready: 'Your application is prepared', failed: 'Preparation needs attention' };
function showBuild(state) {
  if (building?.id !== state.id) cancelPolling();
  const changed = building?.id !== state.id || building?.status !== state.status;
  const wasRunning = building && !ended(building.status);
  building = state; $('progress').hidden = false; setBusy(!ended(state.status));
  $('elapsed').textContent = time((state.finishedAt || Date.now()) - state.createdAt);
  $('repository').value = state.repository.url; $('folder').value = state.repository.folder;
  if (state.repository.folder) document.querySelector('.folder-options').open = true;
  if (changed) {
    $('stage-title').textContent = buildLabels[state.status] || 'Preparing your application';
    stages(['Get the source', 'Build and check the product', 'Save a reusable version'], state.status === 'ready' ? 2 : ['queued', 'preparing', 'fetching'].includes(state.status) ? 0 : 1, state.status === 'failed');
    $('stage-detail').textContent = state.error || (state.status === 'ready' ? 'Preparation is complete. Share the link below; each person runs this version on their own compute.' : 'PODS is doing this work on the server. You can return to this page to check progress.');
  }
  $('build-result').hidden = state.status !== 'ready';
  if (state.status === 'ready') {
    $('result-detail').textContent = `${title(state.app)} · prepared in ${time(state.finishedAt - state.createdAt)}`;
    $('launch-link').value = state.launchUrl; $('try-version').href = state.launchUrl; $('prepare').textContent = 'Prepare another version';
    if (changed && wasRunning) { $('result-title').tabIndex = -1; $('result-title').focus(); }
  } else if (state.status === 'failed') $('prepare').textContent = 'Try preparation again';
}
function clearChangedBuild() {
  if (page.view !== 'develop' || busy || initializing || !building || !ended(building.status)) return;
  if ($('repository').value.trim() === building.repository.url && $('folder').value.trim() === building.repository.folder) return;
  building = null; cancelPolling();
  $('progress').hidden = true; $('build-result').hidden = true; $('retry-status').hidden = true;
  $('launch-link').value = ''; $('try-version').removeAttribute('href'); $('copy-status').textContent = '';
  $('prepare').textContent = 'Prepare application'; notice('');
}
async function poll(kind, failures = 0, version) {
  if (version === undefined) { cancelPolling(); version = pollVersion; }
  const id = kind === 'build' ? building?.id : active?.id;
  const current = () => version === pollVersion && id === (kind === 'build' ? building?.id : active?.id);
  if (!id || !current()) return;
  clearTimeout(timer); $('retry-status').hidden = true;
  const controller = new AbortController(); pollController = controller;
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const state = await api(`/api/${kind === 'build' ? 'builds' : 'launches'}/${id}`, { signal: controller.signal });
    if (!current()) return;
    notice('');
    if (kind === 'build') showBuild(state); else showLaunch(state);
    if (!current()) return;
    if (!ended(state.status) || state.stopRequested && !['failed', 'stopped'].includes(state.status)) timer = setTimeout(() => poll(kind, 0, version), 1000);
    else await history().catch(() => {});
  } catch (error) {
    if (!current()) return;
    if (error.retryable && failures < 3) {
      notice('Connection interrupted. Reconnecting to your progress…');
      timer = setTimeout(() => poll(kind, failures + 1, version), 1000 * 2 ** failures);
    } else { notice(error.message + ' Check progress again to reconnect.'); $('retry-status').hidden = false; }
  } finally { clearTimeout(timeout); if (pollController === controller) pollController = null; }
}
async function history() {
  const kind = page.view === 'develop' ? 'build' : 'launch';
  const rows = await api('/api/' + (kind === 'build' ? 'builds' : 'launches'));
  $('recent').hidden = !rows.length; $('history').replaceChildren(); $('recent-title').textContent = kind === 'build' ? 'Your recent preparations' : 'Your recent launches';
  for (const row of rows.slice(0, 5)) {
    const item = element('div', '', 'history-row'), info = element('div');
    info.append(element('strong', kind === 'build' ? row.repository.name : row.appName));
    info.append(element('span', kind === 'build' ? buildLabels[row.status] : `${providerName(row.provider)} · ${row.status}`)); item.append(info);
    const link = element('a', kind === 'build' ? row.status === 'ready' ? 'Try this version' : 'View preparation' : 'View application');
    if (kind === 'build' && row.status !== 'ready') { link.href = '#progress'; link.addEventListener('click', () => { showBuild(row); if (!ended(row.status)) poll('build'); }); }
    else link.href = kind === 'build' ? row.launchUrl : '/launch/' + row.appId;
    item.append(link); $('history').append(item);
  }
  return rows;
}
async function errorNotice(error, intent, reconnected) {
  setBusy(false); notice(error.message);
  if (error.status === 401 || error.status === 403 && error.code === 'SESSION_CHANGED') {
    try {
      me = await api('/api/me'); connections();
      // Submission rejects expired authorization or stale CSRF before creating work. Resume once,
      // carrying the limit through OAuth navigation so failed authorization cannot loop.
      if (intent && !reconnected) await ensureConnection({ ...intent, reconnected: true }, true);
    } catch { notice(error.message + ' Refresh the page to reconnect.'); }
  }
}
async function launch(reconnected = false) {
  if (!app || busy) return;
  notice(''); const intent = { action: 'launch', provider: selected(), appId: app.id };
  if (!await ensureConnection(intent)) return;
  storage.remove('pods-pending'); setBusy(true); autoOpen = true;
  try {
    const state = await api('/api/launches', { method: 'POST', body: JSON.stringify({ provider: intent.provider, appId: app.id }) });
    storage.set('pods-active', { id: state.id, appId: app.id, autoOpen: true }); showLaunch(state);
    if (!ended(state.status)) poll('launch');
  } catch (error) { autoOpen = false; await errorNotice(error, intent, reconnected); }
}
async function prepare(reconnected = false) {
  if (busy || !$('build-form').reportValidity()) return;
  notice(''); const intent = { action: 'build', provider: selected(), url: $('repository').value.trim(), folder: $('folder').value.trim() };
  if (!await ensureConnection(intent)) return;
  storage.remove('pods-pending'); setBusy(true); $('build-result').hidden = true;
  try { const state = await api('/api/builds', { method: 'POST', body: JSON.stringify(intent) }); showBuild(state); if (!ended(state.status)) poll('build'); }
  catch (error) { await errorNotice(error, intent, reconnected); }
}

$('build-form').addEventListener('submit', event => { event.preventDefault(); prepare(); });
for (const id of ['repository', 'folder']) $(id).addEventListener('input', clearChangedBuild);
$('launch').addEventListener('click', () => launch());
document.querySelectorAll('input[name="provider"]').forEach(input => input.addEventListener('change', () => { notice(''); connections(); }));
$('token-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; notice('');
  try {
    await api('/api/connections/' + selected(), { method: 'POST', body: JSON.stringify({ token: $('token').value.trim() }) });
    $('token').value = ''; me = await api('/api/me'); connections(); $('token-connect').open = false;
    const pending = pendingForPage(storage.get('pods-pending'), page);
    const reconnected = pending?.provider === selected() && pending.reconnected === true;
    if (page.view === 'develop') await prepare(reconnected); else await launch(reconnected);
  } catch (error) { notice(error.message); } finally { button.disabled = false; }
});
$('disconnect').addEventListener('click', async () => {
  try { await api('/api/connections/' + selected(), { method: 'DELETE' }); me = await api('/api/me'); connections(); notice('Account disconnected. You can connect a different account.'); } catch (error) { notice(error.message); }
});
$('stop').addEventListener('click', async () => {
  try { autoOpen = false; cancelPolling(); storage.set('pods-active', { id: active.id, appId: active.appId, autoOpen: false }); await api('/api/launches/' + active.id + '/stop', { method: 'POST', body: '{}' }); await poll('launch'); } catch (error) { notice(error.message); $('retry-status').hidden = false; }
});
$('retry-status').addEventListener('click', () => { notice(''); poll(page.view === 'develop' ? 'build' : 'launch'); });
$('copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('launch-link').value); $('copy-status').textContent = 'Link copied. Anyone with it can launch this version.'; }
  catch { $('launch-link').select(); $('copy-status').textContent = 'Select and copy the launch link above.'; }
});

try {
  $('catalog').hidden = page.view !== 'catalog'; $('workspace').hidden = page.view === 'catalog'; $('developer').hidden = page.view !== 'develop'; $('application').hidden = page.view !== 'launch';
  $('prepare').hidden = page.view !== 'develop'; $('launch').hidden = page.view === 'develop';
  $(page.view === 'develop' ? 'develop-nav' : 'browse-nav').setAttribute('aria-current', 'page');
  if (page.view === 'develop') {
    document.title = 'Prepare your application · PODS'; $('page-title').textContent = 'Prepare your app. Share the product.'; $('page-intro').textContent = 'Give PODS a repository URL. We’ll build it here, so others can try it on their own compute.';
    $('action-title').textContent = 'Prepare with your account'; $('account-intro').textContent = 'Connect Google or GitHub to start a preparation and keep track of your builds.';
    $('github-label').textContent = 'GitHub account'; $('google-label').textContent = 'Google account'; $('target').hidden = true; $('compute-note').textContent = 'Preparation runs on the PODS server. Your compute starts only when you launch the product.';
  } else {
    $('page-title').textContent = page.view === 'launch' ? 'Make yourself at home.' : 'Prepared here. Running with you.';
    $('page-intro').textContent = page.view === 'launch' ? 'Loading this prepared application…' : 'Choose an application, connect your compute, and step into the product.';
  }
  me = await api('/api/me'); app = appForRoute(me.apps, page);
  if (page.view === 'develop' && !me.buildsEnabled) notice('Repository preparation is unavailable right now. Please try again later.');
  if (page.view === 'launch') application(); else if (page.view === 'catalog') catalogue();
  const query = new URLSearchParams(location.search);
  const pending = pendingForPage(storage.get('pods-pending'), page);
  const expectedProvider = query.has('error') && ['github', 'google'].includes(query.get('provider')) ? query.get('provider') : pending?.provider;
  if (pending) { provider(pending.provider); if (pending.action === 'build') { $('repository').value = pending.url; $('folder').value = pending.folder; } }
  if (page.view === 'launch' && expectedProvider) provider(expectedProvider);
  connections(); const rows = await history();
  if (page.view === 'develop' && rows.length) { const current = rows.find(row => !ended(row.status)) || rows[0]; showBuild(current); if (!ended(current.status)) poll('build'); }
  if (page.view === 'launch' && app) {
    let saved; try { saved = JSON.parse(storage.get('pods-active')); } catch {}
    const current = rows.find(row => row.appId === app.id && (!expectedProvider || row.provider === expectedProvider) && !['failed', 'stopped'].includes(row.status));
    if (current) { provider(current.provider); connections(); autoOpen = saved?.id === current.id && saved?.autoOpen === true; showLaunch(current); if (!ended(current.status)) poll('launch'); }
  }
  // History describes earlier work; the interrupted draft also survives cancellation.
  if (pending?.action === 'build') {
    $('repository').value = pending.url; $('folder').value = pending.folder;
    if (pending.folder) document.querySelector('.folder-options').open = true;
  }
  initializing = false; $('workspace').inert = false; $('workspace').removeAttribute('aria-busy'); $('loading').hidden = true; setBusy(busy);
  clearChangedBuild();
  if (query.has('error')) {
    storage.remove('pods-pending');
    const account = pending ? providerName(pending.provider) + ': ' : '';
    notice(account + query.get('error') + (page.view === 'develop' ? ' Select Prepare application to connect again.' : ' Choose your compute and connect again to open the application.'));
  }
  else if (pending && query.get('connected') === pending.provider && me.connections.some(c => c.provider === pending.provider && c.connected)) {
    storage.remove('pods-pending');
    if (pending.action === 'build') await prepare(pending.reconnected === true);
    else if (active && !ended(active.status)) { autoOpen = true; storage.set('pods-active', { id: active.id, appId: app.id, autoOpen: true }); await poll('launch'); }
    else await launch(pending.reconnected === true);
  }
  if (query.has('error') || query.has('connected')) window.history.replaceState(null, '', location.pathname);
} catch (error) { $('loading').hidden = true; notice('Could not load PODS. Refresh this page to retry. ' + error.message); }
