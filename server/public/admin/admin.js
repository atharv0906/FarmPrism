'use strict';
const $ = id => document.getElementById(id);
const storageKey = 'farmprism.admin.session';
let token = sessionStorage.getItem(storageKey);
let buyers = [];
let selected = null;
let generation = 0;
function signedOut(message = '') {
  generation++;
  token = null;
  buyers = [];
  selected = null;
  sessionStorage.removeItem(storageKey);
  $('confirmation').close();
  $('buyers').replaceChildren();
  $('summary').replaceChildren();
  $('dashboard').hidden = true;
  $('login').hidden = false;
  $('login-error').textContent = message;
}
async function api(path, body) {
  let response;
  try {
    response = await fetch('/api/admin' + path, {
      method: body === undefined ? 'GET' : 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch { throw new Error('Unable to connect. Check your connection and retry.'); }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/login') signedOut('Your session has ended. Sign in again.');
    throw new Error(data.error?.message || 'Unable to complete the request. Please retry.');
  }
  return data;
}
function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render() {
  $('summary').replaceChildren();
  for (const [label, status] of [['Pending', 'pending'], ['Verified', 'verified'], ['Failed', 'failed'], ['Total Buyers', 'all']]) {
    const card = element('div', '', 'stat');
    card.append(element('p', label), element('strong', String(status === 'all' ? buyers.length : buyers.filter(b => b.verificationStatus === status).length)));
    $('summary').append(card);
  }
  const status = $('status').value;
  const query = $('search').value.trim().toLowerCase();
  const visible = buyers.filter(b => (status === 'all' || b.verificationStatus === status) && [b.name, b.businessName, b.phone, b.buyerType].some(v => (v || '').toLowerCase().includes(query)));
  $('buyers').replaceChildren();
  $('load-state').hidden = visible.length > 0;
  $('load-state').textContent = status === 'pending' && !query ? 'No buyers waiting for verification.' : 'No buyers match your search.';
  $('table-wrap').hidden = visible.length === 0;
  for (const buyer of visible) {
    const row = document.createElement('tr');
    for (const value of [buyer.name, buyer.phone, buyer.buyerType || '—', buyer.businessName || '—']) row.append(element('td', value));
    const statusCell = document.createElement('td');
    statusCell.append(element('span', buyer.verificationStatus[0].toUpperCase() + buyer.verificationStatus.slice(1), 'badge ' + buyer.verificationStatus));
    row.append(statusCell, element('td', new Date(buyer.updatedAt).toLocaleString()));
    const action = document.createElement('td');
    if (buyer.verificationStatus !== 'verified') {
      const button = element('button', 'Verify Buyer');
      button.addEventListener('click', () => {
        selected = buyer;
        $('confirm-buyer').textContent = [buyer.name, buyer.businessName].filter(Boolean).join('\n');
        $('confirm-error').textContent = '';
        $('confirmation').showModal();
        $('cancel').focus();
      });
      action.append(button);
    } else action.textContent = '—';
    row.append(action); $('buyers').append(row);
  }
}
async function load() {
  const current = ++generation;
  $('login').hidden = true; $('dashboard').hidden = false;
  $('load-error').hidden = true; $('table-wrap').hidden = true;
  $('load-state').hidden = false; $('load-state').textContent = 'Loading buyers…';
  $('refresh').disabled = true;
  try {
    const data = await api('/buyers');
    if (current !== generation) return;
    buyers = data.buyers; render();
  } catch (error) {
    if (current !== generation) return;
    $('load-state').hidden = true; $('load-error').hidden = false;
    $('load-error-text').textContent = error.message;
  } finally { $('refresh').disabled = false; }
}
$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); $('sign-in').disabled = true; $('login-error').textContent = '';
  try {
    const result = await api('/login', { username: $('username').value, password: $('password').value });
    token = result.token; sessionStorage.setItem(storageKey, token);
    $('password').value = ''; $('notice').textContent = ''; await load();
  } catch (error) { $('login-error').textContent = error.message; }
  finally { $('password').value = ''; $('sign-in').disabled = false; }
});
$('logout').addEventListener('click', async () => {
  $('logout').disabled = true;
  try { await api('/logout', {}); signedOut(); }
  catch (error) { $('notice').textContent = error.message; }
  finally { $('logout').disabled = false; }
});
$('cancel').addEventListener('click', () => $('confirmation').close());
$('confirmation').addEventListener('cancel', event => { if ($('verify').disabled) event.preventDefault(); });
$('verify').addEventListener('click', async () => {
  if (!selected) return;
  const buyer = selected;
  const activeToken = token;
  $('verify').disabled = true; $('cancel').disabled = true;
  try {
    const result = await api('/buyers/' + encodeURIComponent(buyer.accountId) + '/verify', {});
    if (token !== activeToken) return;
    buyer.verificationStatus = result.verificationStatus;
    $('confirmation').close(); render(); $('notice').textContent = 'Buyer verified successfully.';
    await load(); // Refresh the database timestamp and any concurrent admin changes.
  } catch (error) { $('confirm-error').textContent = error.message; }
  finally { $('verify').disabled = false; $('cancel').disabled = false; }
});
$('search').addEventListener('input', () => { if ($('load-error').hidden && !$('refresh').disabled) render(); });
$('status').addEventListener('change', () => { if ($('load-error').hidden && !$('refresh').disabled) render(); });
$('retry').addEventListener('click', load);
$('refresh').addEventListener('click', load);
if (token) void load();
