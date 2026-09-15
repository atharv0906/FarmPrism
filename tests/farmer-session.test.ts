import test from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, ApiError, onApiUnauthorized, setCurrentDemoApiToken } from '../src/services/api/api.client';
import { demoSessionClient, parseCreatedSession, parseSessionAccount } from '../src/services/api/demoSession.client';
import { createDemoSessionService, DEMO_API_TOKEN_KEY, DEMO_API_EXPIRES_AT_KEY, DEMO_PHONE_KEY } from '../src/services/auth/demoSession.service';
import { createMockFlowService, roleKey, farmerOnboardingKey } from '../src/services/roles/mockFlow.service';
import { parseFarmerHome, parseFarmerMyFarm } from '../src/services/api/farmerSummary.contract';
import { farmerSummaryClient } from '../src/services/api/farmerSummary.client';

const account = parseSessionAccount({ phone: '+919000000001', loginLabel: 'farmer1', role: 'farmer', fullName: 'Server identity' });
const future = () => new Date(Date.now() + 3600000).toISOString();
function storage() {
  const values = new Map<string, string>();
  const getItem = async (k: string) => values.get(k) ?? null;
  const setItem = async (k: string, v: string) => { values.set(k, v); };
  const removeItem = async (k: string) => { values.delete(k); };
  return { values, getItem, setItem, removeItem, getItemAsync: getItem, setItemAsync: setItem, deleteItemAsync: removeItem };
}
test('fresh session and token restore use server identity; normal logout preserves role and onboarding', async () => {
  const secure = storage(), local = storage();
  const calls: string[] = [];
  const session = { account, token: 'unit-token', expiresAt: future() };
  const service = createDemoSessionService(secure, local, {
    create: async (phone, otp) => { assert.equal(phone, account.phone); assert.equal(otp, '123456'); calls.push('create'); return session; },
    me: async token => { assert.equal(token, session.token); calls.push('me'); return { ...account, fullName: 'Updated server name' }; },
    logout: async token => { assert.equal(token, session.token); calls.push('logout'); },
  });
  assert.equal((await service.login(account.phone, '123456')).account.fullName, 'Server identity');
  await local.setItem(DEMO_PHONE_KEY, '+919000000099');
  await local.setItem(roleKey(account.phone), 'mock-farmer');
  await local.setItem(farmerOnboardingKey(account.phone), 'complete');
  assert.equal((await service.restore())?.account.fullName, 'Updated server name');
  assert.equal(await local.getItem(DEMO_PHONE_KEY), account.phone);
  await service.logout(session.token);
  assert.deepEqual(calls, ['create', 'me', 'logout']);
  assert.equal(secure.values.size, 0);
  assert.equal(await local.getItem(DEMO_PHONE_KEY), null);
  assert.equal(await local.getItem(roleKey(account.phone)), 'mock-farmer');
  assert.equal(await local.getItem(farmerOnboardingKey(account.phone)), 'complete');
});
test('revoked, invalid and expired restore clear session; transient outages preserve stored credentials', async () => {
  for (const failure of [new ApiError(401, 'INVALID_SESSION', 'Expired'), new Error('Malformed identity'), new ApiError(503, 'UNAVAILABLE', 'Offline'), new TypeError('Network unavailable')]) {
    const s = storage();
    await s.setItem(DEMO_API_TOKEN_KEY, 'unit-token'); await s.setItem(DEMO_API_EXPIRES_AT_KEY, future());
    const service = createDemoSessionService(s, s, { create: async () => { throw Error(); }, me: async () => { throw failure; }, logout: async () => {} });
    if (failure instanceof TypeError || failure instanceof ApiError && failure.status === 503) {
      await assert.rejects(service.restore()); assert.equal(await s.getItem(DEMO_API_TOKEN_KEY), 'unit-token');
    } else { assert.equal(await service.restore(), null); assert.equal(s.values.size, 0); }
  }
  const s = storage(); await s.setItem(DEMO_API_TOKEN_KEY, 'expired'); await s.setItem(DEMO_API_EXPIRES_AT_KEY, '2000-01-01');
  const service = createDemoSessionService(s, s, { create: async () => { throw Error(); }, me: async () => { assert.fail('Expired token must not restore'); }, logout: async () => {} });
  assert.equal(await service.restore(), null); assert.equal(s.values.size, 0);
});
test('roles require explicit confirmation and onboarding completion is isolated per account', async () => {
  const s = storage(), flow = createMockFlowService(s);
  assert.deepEqual(await flow.roles(account), { selectedRole: null, availableRoles: [{ id: 'mock-farmer', code: 'farmer' }] });
  assert.equal(s.values.size, 0);
  await assert.rejects(flow.confirmRole(account, 'mock-buyer'));
  await flow.confirmRole(account, 'mock-farmer');
  assert.equal((await flow.roles(account)).selectedRole?.code, 'farmer');
  assert.equal(await flow.farmerStart(account.phone), 'Personal');
  await flow.completeFarmer(account);
  assert.equal(await flow.farmerStart(account.phone), 'Dashboard');
  const other = { ...account, phone: '+919000000002' };
  assert.equal((await flow.roles(other)).selectedRole, null);
  assert.equal(await flow.farmerStart(other.phone), 'Personal');
  await assert.rejects(flow.completeFarmer({ ...account, role: 'buyer' }));
  await s.setItem(roleKey(other.phone), 'mock-logistics');
  assert.equal((await flow.roles(other)).selectedRole, null);
  for (const role of ['buyer', 'logistics'] as const) {
    const a = { ...other, role }; await flow.confirmRole(a, 'mock-' + role);
    assert.equal((await flow.roles(a)).selectedRole?.code, role);
  }
});
const home = () => ({ farmer: { id: 'farmer', name: 'Current', location: 'Pune' }, farm: { cropCount: 0, totalAcres: null, quantityUnit: 'Quintals', availableQuantity: 0, availableQuantityKg: 0 }, topOpportunity: null, marketPrices: [], sellingActivity: { currency: 'INR', newOffers: 0, soldThisMonth: 0, activeAuctions: 0 }, notifications: { unreadCount: 0 } });
const farm = () => ({ farm: { id: 'farmer', name: null, location: 'Pune', area: null, areaUnit: 'acre' }, summary: { cropCount: 0, totalAvailableKg: 0, activeBatchCount: 0 }, crops: [], activities: { cropsAdded: 0, updatesThisMonth: 0 } });
test('summary contracts accept honest zero and reject malformed nested values or missing nullable fields', () => {
  assert.deepEqual(parseFarmerHome(home()), home()); assert.deepEqual(parseFarmerMyFarm(farm()), farm());
  for (const [factory, parse, paths] of [[home, parseFarmerHome, ['farm.totalAcres', 'farm.availableQuantityKg', 'notifications.unreadCount', 'marketPrices', 'topOpportunity']], [farm, parseFarmerMyFarm, ['farm.area', 'farm.name', 'summary.totalAvailableKg', 'crops', 'activities.updatesThisMonth']]] as const) {
    for (const path of paths) {
      const value: any = factory(); const keys = path.split('.'); const parent = keys.length === 2 ? value[keys[0]] : value;
      delete parent[keys.at(-1)!]; assert.throws(() => parse(value));
    }
  }
  for (const bad of ['0', -1, NaN, Infinity, null]) { const h: any = home(); h.farm.availableQuantityKg = bad; assert.throws(() => parseFarmerHome(h)); }
  const f: any = farm(); f.crops = [{ id: 'wheat', name: 'Wheat', status: 'active', availableKg: 10, batchCount: 1 }]; assert.throws(() => parseFarmerMyFarm(f));
});
test('session and summary clients use Node endpoints, bearer auth, strict parsing and current-token 401 cleanup', async t => {
  const get = apiClient.get, post = apiClient.post;
  t.mock.method(apiClient, 'get', (path: string, options = {}) => get(path, { ...options, headers: { 'x-api-base-url': 'http://test.invalid' } }));
  t.mock.method(apiClient, 'post', (path: string, body: unknown, options = {}) => post(path, body, { ...options, headers: { 'x-api-base-url': 'http://test.invalid' } }));
  let payload: unknown = { data: { token: 'unit-token', expiresAt: future(), account } }, status = 200, expired = 0;
  const calls: { url: string; auth: string | null }[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => { calls.push({ url: String(input), auth: new Headers(init?.headers).get('Authorization') }); return new Response(JSON.stringify(payload), { status }); });
  setCurrentDemoApiToken('unit-token'); onApiUnauthorized(() => { expired++; });
  t.after(() => { setCurrentDemoApiToken(null); onApiUnauthorized(null); });
  assert.equal((await demoSessionClient.create(account.phone, '123456')).account.fullName, account.fullName);
  assert.equal(calls.at(-1)?.auth, null);
  payload = { data: account }; assert.deepEqual(await demoSessionClient.me('unit-token'), account);
  assert.ok(calls.at(-1)?.url.endsWith('/api/demo/me')); assert.equal(calls.at(-1)?.auth, 'Bearer unit-token');
  payload = { data: home() }; await farmerSummaryClient.home(); assert.ok(calls.at(-1)?.url.endsWith('/api/farmer/home-summary'));
  payload = { data: farm() }; await farmerSummaryClient.myFarm(); assert.ok(calls.at(-1)?.url.endsWith('/api/farmer/my-farm-summary'));
  payload = { data: {} }; await assert.rejects(farmerSummaryClient.home());
  status = 401; await assert.rejects(farmerSummaryClient.myFarm()); assert.equal(expired, 1);
  assert.throws(() => parseCreatedSession({ token: 'x', expiresAt: future(), account }, '+919000000002'));
  assert.throws(() => parseSessionAccount({ ...account, role: 'fpo' }));
});
