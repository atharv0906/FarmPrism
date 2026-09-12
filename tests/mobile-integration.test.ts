import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validListing, validAdvance, marketSourceLabel } from '../src/services/api/trading.validation';
import { apiRequest, onApiUnauthorized, setCurrentDemoApiToken } from '../src/services/api/api.client';

test('listing and advance validation enforce quantity, price and 10–90% bounds', () => {
  assert.equal(validListing(100, 100, 20), true);
  for (const q of [0, -1, 101, NaN, Infinity]) assert.equal(validListing(q, 100, 20), false);
  assert.equal(validListing(50, 100, 0), false);
  for (const p of [10, 30, 90]) assert.equal(validAdvance(p), true);
  for (const p of [5, 95, NaN]) assert.equal(validAdvance(p), false);
  assert.equal(marketSourceLabel(true, 'seed'), 'Demo market data');
});
test('401 expires only the current API session; network errors and 409 do not', async t => {
  let expired = 0;
  onApiUnauthorized(() => { expired++; });
  setCurrentDemoApiToken('current-token');
  t.after(() => { onApiUnauthorized(null); setCurrentDemoApiToken(null); });
  const headers = { 'x-api-base-url': 'http://test.invalid' };
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 'CONFLICT', message: 'Refresh data.' } }), { status: 409 }));
  await assert.rejects(apiRequest('/api/test', { headers }), { status: 409 });
  assert.equal(expired, 0);
  fetchMock.mock.mockImplementation(async () => { throw new Error('Network unavailable'); });
  await assert.rejects(apiRequest('/api/test', { headers }));
  assert.equal(expired, 0);
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify({ error: { code: 'invalid_session' } }), { status: 401 }));
  await assert.rejects(apiRequest('/api/test', { bearerToken: 'old-token', headers }));
  assert.equal(expired, 0);
  await assert.rejects(apiRequest('/api/test', { headers }));
  assert.equal(expired, 1);
});
test('Farmer sell entry routes exist and frozen Home has no Trust Score', () => {
  const routes = readFileSync('src/navigation/TradingNavigator.tsx', 'utf8');
  for (const route of ['SellHome', 'SelectBatch', 'Quality', 'PriceInsight', 'ChooseMethod', 'CreateListing', 'Offers', 'Offer', 'Order']) assert.ok(routes.includes('name="' + route + '"'));
  const home = readFileSync('src/components/farmer-dashboard/FarmerDashboardView.tsx', 'utf8');
  assert.equal(/Trust Score/i.test(home), false);
});
