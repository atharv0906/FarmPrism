import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createAdminService, createAdminSessions } from '../services/admin.service.js';
import { errorHandler } from '../middleware/error.middleware.js';
import { ApiError } from '../utils/apiError.js';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
const { registerAdminRoutes } = await import('./admin.routes.js');
const { createAdminRepository } = await import('../repositories/admin.repository.js');
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const { createMutationService } = await import('../services/mutation.service.js');
const { loadDemoSessionFromAuthorization } = await import('../middleware/auth.js');
const id = (n: number) => `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`;

test('admin sessions reject wrong, missing, invalid and expired credentials and revoke logout', () => {
  let clock = 0;
  const sessions = createAdminSessions('admin', 'admin', () => clock);
  for (const input of [null, {}, { username: 'wrong', password: 'admin' }, { username: 'admin', password: 'wrong' }]) {
    assert.throws(() => sessions.login(input), { status: 401, message: 'Invalid username or password.' });
  }
  const first = sessions.login({ username: 'admin', password: 'admin' });
  const second = sessions.login({ username: 'admin', password: 'admin' });
  assert.notEqual(first.token, second.token);
  assert.equal(sessions.valid(first.token), true);
  assert.equal(sessions.valid('mobile-session'), false);
  sessions.logout(first.token);
  assert.equal(sessions.valid(first.token), false);
  clock = 8 * 60 * 60 * 1000;
  assert.equal(sessions.valid(second.token), false);
  assert.throws(() => createAdminSessions('', '').login({ username: '', password: '' }), { status: 401 });
});

test('real admin routes/repository enforce role, DTO, filters, verification-only updates and session isolation', async t => {
  const rows = ['pending', 'verified', 'failed', 'pending', 'pending'].map((status, index) => ({
    account_id: id(index + 1), verification_status: status, buyer_type: 'wholesaler', business_name: 'Test Traders', updated_at: '2026-01-01T00:00:00Z',
    private_secret: 'must-not-leak', delivery_label: 'unchanged',
    demo_accounts: { full_name: 'Test Buyer', phone: '+919000000011', is_enabled: true, role_code: index === 3 ? 'farmer' : index === 4 ? 'logistics' : 'buyer' },
  }));
  const patches: Record<string, unknown>[] = [];
  let databaseError = false;
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    assert.ok(['demo_buyer_profiles', 'demo_sessions'].includes(table));
    let data = table === 'demo_sessions' ? [] : rows.slice();
    let patch: Record<string, unknown> | undefined;
    const query = {
      select(columns: string) { assert.notEqual(columns, '*'); return query; },
      order() { return query; }, limit() { return query; },
      eq(key: string, value: unknown) {
        data = data.filter(row => key === 'demo_accounts.role_code' ? row.demo_accounts.role_code === value : (row as unknown as Record<string, unknown>)[key] === value); return query;
      },
      in(key: string, values: unknown[]) { data = data.filter(row => values.includes((row as unknown as Record<string, unknown>)[key])); return query; },
      update(value: Record<string, unknown>) { patch = value; return query; },
      async maybeSingle() { return { data: data[0] ?? null, error: databaseError ? { message: 'private SQL detail' } : null }; },
      then(resolve: (value: unknown) => unknown) {
        if (patch && !databaseError) { patches.push(patch); for (const row of data) Object.assign(row, patch); }
        return Promise.resolve({ data, error: databaseError ? { message: 'private SQL detail' } : null }).then(resolve);
      },
    }; return query;
  });
  const repository = createAdminRepository();
  const service = createAdminService(repository);
  let clock = Date.now();
  const sessions = createAdminSessions('admin', 'admin', () => clock);
  const app = express(); app.use(express.json()); registerAdminRoutes(app, service, sessions); app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  const request = (path: string, token?: string, body?: unknown) => fetch(base + '/api/admin' + path, {
    method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  for (const body of [{ username: 'bad', password: 'admin' }, { username: 'admin', password: 'bad' }]) {
    const response = await request('/login', undefined, body); assert.equal(response.status, 401);
    assert.equal((await response.json()).error.message, 'Invalid username or password.');
  }
  const response = await request('/login', undefined, { username: 'admin', password: 'admin' });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  const { token } = await response.json();
  for (const bearer of [undefined, 'invalid', 'mobile-demo-token']) {
    assert.equal((await request('/buyers', bearer)).status, 401);
    assert.equal((await request('/buyers/' + id(1) + '/verify', bearer, {})).status, 401);
  }
  const all = await (await request('/buyers', token)).json();
  assert.equal(all.buyers.length, 3);
  assert.deepEqual(Object.keys(all.buyers[0]).sort(), ['accountId', 'name', 'phone', 'buyerType', 'businessName', 'verificationStatus', 'enabled', 'updatedAt'].sort());
  for (const status of ['pending', 'verified', 'failed']) {
    const filtered = await (await request('/buyers?status=' + status, token)).json();
    assert.equal(filtered.buyers.length, 1); assert.equal(filtered.buyers[0].verificationStatus, status);
  }
  assert.equal((await request('/buyers?status=bogus', token)).status, 400);
  assert.equal((await request('/buyers?status[]=pending', token)).status, 400);
  for (const accountId of [id(4), id(5), id(6), 'malformed']) assert.equal((await request('/buyers/' + accountId + '/verify', token, {})).status, 404);
  const before = structuredClone(rows[0]);
  const verified = await request('/buyers/' + id(1) + '/verify', token, { businessName: 'ignored' });
  assert.equal(verified.status, 200); assert.deepEqual(await verified.json(), { accountId: id(1), verificationStatus: 'verified' });
  assert.deepEqual(rows[0], { ...before, verification_status: 'verified', updated_at: rows[0].updated_at });
  assert.deepEqual(Object.keys(patches[0]).sort(), ['updated_at', 'verification_status']);
  const timestamp = rows[0].updated_at;
  await request('/buyers/' + id(1) + '/verify', token, {});
  await request('/buyers/' + id(2) + '/verify', token, {});
  assert.equal(rows[0].updated_at, timestamp); assert.equal(patches.length, 1);
  assert.equal((await request('/buyers/' + id(3) + '/verify', token, {})).status, 200);
  assert.equal(rows[2].verification_status, 'verified');
  databaseError = true;
  const failed = await request('/buyers', token); assert.equal(failed.status, 503);
  assert.equal(JSON.stringify(await failed.json()).includes('private SQL'), false);
  databaseError = false;
  // The real mobile middleware consults persisted demo sessions, never the admin map.
  t.mock.method(supabaseAdmin, 'from', () => {
    const query = { select() { return query; }, eq() { return query; }, async maybeSingle() { return { data: null, error: null }; } }; return query;
  });
  assert.equal(await loadDemoSessionFromAuthorization('Bearer ' + token), null);
  assert.equal((await request('/logout', token, {})).status, 200);
  assert.equal((await request('/buyers', token)).status, 401);
  const expiring = sessions.login({ username: 'admin', password: 'admin' }); clock += 8 * 60 * 60 * 1000;
  assert.equal((await request('/buyers', expiring.token)).status, 401);
  const page = await fetch(base + '/admin/'); assert.equal(page.status, 200);
  assert.ok(page.headers.get('content-security-policy')?.includes("connect-src 'self'"));
  const html = await page.text(); assert.equal(html.replace(/<[^>]*>/g, '').includes('admin/admin'), false);
  assert.equal((await fetch(base + '/admin/admin.js')).status, 200);
});

test('admin verification feeds the existing bid RPC gate; quantity and deadline errors still propagate (injected RPC)', async () => {
  let status = 'pending';
  let expired = false;
  const buyer = { accountId: id(1), name: 'Test', phone: 'test', buyerType: 'wholesaler', businessName: 'Test', verificationStatus: 'pending' as const, enabled: true, updatedAt: '2026-01-01' };
  const admin = createAdminService({ list: async () => [buyer], find: async () => ({ ...buyer, verificationStatus: status as 'pending' | 'verified' }), verify: async () => { status = 'verified'; } });
  const trading = createMutationService(async (name, args) => {
    assert.equal(name, 'demo_place_or_revise_bid'); assert.equal(args.p_buyer_account_id, id(1));
    // Model the inspected deployed RPC boundary; this is not a live SQL execution.
    if (status !== 'verified') throw new ApiError(403, 'FORBIDDEN', 'This action is not allowed.');
    if (expired) throw new ApiError(409, 'AUCTION_NOT_OPEN', 'Auction not open.');
    if (Number(args.p_quantity_kg) > 100) throw new ApiError(409, 'QUANTITY_EXCEEDS_AVAILABLE', 'Quantity exceeds available.');
    return { bidId: id(8), status: 'active', revised: false };
  });
  const actor = { accountId: id(1), role: 'buyer' as const };
  const body = { quantityKg: 50, pricePerKg: 20, advancePercent: 30, delivery: { label: 'Pune', latitude: 18, longitude: 73 } };
  await assert.rejects(trading.execute('placeOrReviseBid', actor, id(9), body), { status: 403 });
  await admin.verify(id(1));
  assert.equal((await trading.execute('placeOrReviseBid', actor, id(9), body)).status, 'active');
  await assert.rejects(trading.execute('placeOrReviseBid', actor, id(9), { ...body, quantityKg: 101 }), { code: 'QUANTITY_EXCEEDS_AVAILABLE' });
  expired = true;
  await assert.rejects(trading.execute('placeOrReviseBid', actor, id(9), body), { code: 'AUCTION_NOT_OPEN' });
  await assert.rejects(trading.execute('placeOrReviseBid', actor, id(9), { ...body, quantityKg: 0 }), { status: 400 });
});
