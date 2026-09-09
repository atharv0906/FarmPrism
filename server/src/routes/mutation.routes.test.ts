import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';

// Set before dynamic imports: no real environment or database is used.
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-placeholder';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const { registerMutationRoutes } = await import('./mutation.routes.js');
const { errorHandler } = await import('../middleware/error.middleware.js');
const { mapRpcError } = await import('../utils/apiError.js');
const { createMutationService } = await import('../services/mutation.service.js');

const id = '11111111-1111-4111-8111-111111111111';
const actors = {
  farmer: '22222222-2222-4222-8222-222222222222',
  buyer: '33333333-3333-4333-8333-333333333333',
  logistics: '44444444-4444-4444-8444-444444444444',
};
const delivery = { label: 'Warehouse', latitude: 18.5, longitude: 73.8 };

test('mutation routes use authenticated actors and existing atomic RPCs', async t => {
  let calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  let rpcError: string | null = null;
  let revoked = false;
  let expired = false;
  let disabled = false;
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    const filters: Record<string, unknown> = {};
    const query = {
      select() { return query; },
      eq(key: string, value: unknown) { filters[key] = value; return query; },
      update() { return query; },
      async maybeSingle() {
        if (table === 'demo_sessions') {
          const role = Object.keys(actors).find(role => filters.token_hash === createHash('sha256').update(role).digest('hex')) as keyof typeof actors | undefined;
          return { data: role ? { id, account_id: actors[role], token_hash: filters.token_hash, expires_at: new Date(Date.now() + (expired ? -60000 : 60000)).toISOString(), revoked_at: revoked ? new Date().toISOString() : null } : null, error: null };
        }
        if (table === 'demo_accounts') {
          const role = Object.keys(actors).find(role => actors[role as keyof typeof actors] === filters.id);
          return { data: { id: filters.id, login_label: role, role_code: role, is_enabled: !disabled, full_name: 'Test account' }, error: null };
        }
        return { data: null, error: null };
      },
      async single() {
        assert.equal(table, 'demo_orders');
        return { data: { id, order_code: 'FP-TEST', source_type: 'auction', farmer_account_id: actors.farmer, buyer_account_id: actors.buyer, batch_id: id, allocated_quantity_kg: 100, unit_price_per_kg: 25, total_amount: 2500, farmer_advance_percent: 30, status: 'farmer_advance_pending' }, error: null };
      },
      then(resolve: (result: unknown) => unknown) { return Promise.resolve({ data: [], error: null }).then(resolve); },
    };
    return query;
  });
  t.mock.method(supabaseAdmin, 'rpc', async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    return { error: rpcError ? { message: rpcError } : null, data: {
      auctionId: id, listingId: id, bidId: id, requestId: id, orderId: id,
      orderCode: 'FP-TEST', acceptedQuantityKg: 100, totalAmount: 2500,
      jobId: id, paymentId: id, trackingPointId: id, disputeId: id,
      amount: 750, farmerBalance: 1750, logisticsBalance: 600,
      fee: 1000, feeStatus: 'proposed', accepted: true, revised: true,
      source: 'simulated', status: 'test', toAccountId: actors.buyer, rating: 5,
      otp: '123456', expiresAt: '2026-09-10T00:10:00Z',
      private_key: 'must never be returned',
    } };
  });
  const app = express();
  app.use(express.json());
  registerMutationRoutes(app);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  async function post(path: string, role: string | null, body: unknown = {}) {
    const response = await fetch(base + path.replaceAll(':id', id), {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: 'Bearer ' + role } : {}) },
      body: JSON.stringify(body),
    });
    return { status: response.status, payload: await response.json() as { data?: Record<string, unknown>; error?: { code: string; message: string } } };
  }

  const success: Array<[string, keyof typeof actors, string, Record<string, unknown>]> = [
    ['/api/farmer/auctions', 'farmer', 'create_auction', { batchId: id, quantityKg: 100, reservePricePerKg: 25, durationHours: 24 }],
    ['/api/farmer/auctions/:id/close', 'farmer', 'close_auction', {}],
    ['/api/farmer/fixed-listings', 'farmer', 'create_fixed_listing', { batchId: id, quantityKg: 100, fixedPricePerKg: 25 }],
    ['/api/farmer/fixed-listings/:id/close', 'farmer', 'close_fixed_listing', {}],
    ['/api/buyer/auctions/:id/bids', 'buyer', 'place_or_revise_bid', { quantityKg: 100, pricePerKg: 25, advancePercent: 30, delivery }],
    ['/api/buyer/bids/:id/withdraw', 'buyer', 'withdraw_bid', {}],
    ['/api/buyer/fixed-listings/:id/requests', 'buyer', 'create_purchase_request', { quantityKg: 100, advancePercent: 30, delivery }],
    ['/api/buyer/purchase-requests/:id/withdraw', 'buyer', 'withdraw_purchase_request', {}],
    ['/api/farmer/bids/:id/accept', 'farmer', 'accept_bid', { quantityKg: 100 }],
    ['/api/farmer/purchase-requests/:id/accept', 'farmer', 'accept_purchase_request', { quantityKg: 100 }],
    ['/api/buyer/orders/:id/pay-farmer-advance', 'buyer', 'pay_farmer_advance', {}],
    ['/api/logistics/jobs/:id/claim', 'logistics', 'claim_logistics_job', {}],
    ['/api/logistics/jobs/:id/fee', 'logistics', 'propose_logistics_fee', { fee: 1000 }],
    ['/api/buyer/logistics-jobs/:id/fee-response', 'buyer', 'respond_logistics_fee', { accept: true }],
    ['/api/buyer/orders/:id/pay-logistics-advance', 'buyer', 'pay_logistics_advance', {}],
    ['/api/logistics/jobs/:id/pickup', 'logistics', 'confirm_pickup', {}],
    ['/api/logistics/jobs/:id/location', 'logistics', 'update_tracking', { latitude: 18.5, longitude: 73.8, source: 'simulated' }],
    ['/api/buyer/orders/:id/delivery-otp', 'buyer', 'generate_delivery_otp', {}],
    ['/api/logistics/orders/:id/verify-delivery', 'logistics', 'verify_delivery_otp', { otp: '123456' }],
    ['/api/buyer/orders/:id/pay-final-balances', 'buyer', 'pay_final_balances', {}],
    ['/api/orders/:id/feedback', 'farmer', 'submit_feedback', { toAccountId: actors.buyer, rating: 5, comment: 'Good' }],
    ['/api/orders/:id/disputes', 'buyer', 'raise_dispute', { againstAccountId: null, reason: 'Delivery issue', description: 'Details' }],
  ];
  for (const [path, role, rpc, body] of success) await t.test(rpc, async () => {
    calls = [];
    const result = await post(path, role, body);
    assert.equal(result.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'demo_' + rpc);
    const actorKey = rpc === 'submit_feedback' || rpc === 'raise_dispute' ? 'p_from_account_id' : 'p_' + role + '_account_id';
    assert.equal(calls[0].args[actorKey], actors[role]);
    assert.equal(JSON.stringify(result.payload).includes('private_key'), false);
    if (rpc !== 'generate_delivery_otp') assert.equal(JSON.stringify(result.payload).includes('123456'), false);
    if (rpc.startsWith('pay_')) assert.equal(result.payload.data?.simulated, true);
    if (rpc.startsWith('accept_')) assert.equal((result.payload.data?.order as { totalAmount: number }).totalAmount, 2500);
  });

  const invalid: Array<[string, string | null, unknown, number]> = [
    ['/api/buyer/bids/:id/withdraw', 'farmer', {}, 403],
    ['/api/farmer/bids/:id/accept', 'buyer', { quantityKg: 100 }, 403],
    ['/api/logistics/jobs/:id/claim', 'logistics', { capacity: 99999 }, 400],
    ...[5, 95].map(advancePercent => ['/api/buyer/auctions/:id/bids', 'buyer', { quantityKg: 100, pricePerKg: 25, advancePercent, delivery }, 400] as [string, string, unknown, number]),
    ['/api/farmer/auctions', 'farmer', { batchId: id, quantityKg: 100, reservePricePerKg: 25, durationHours: 18 }, 400],
    ['/api/buyer/fixed-listings/:id/requests', 'buyer', { quantityKg: 100, advancePercent: 30, delivery, pricePerKg: 1 }, 400],
    ['/api/logistics/jobs/:id/location', 'logistics', { latitude: 91, longitude: 73.8, source: 'actual' }, 400],
    ['/api/logistics/jobs/:id/location', 'logistics', { latitude: 18, longitude: -181, source: 'actual' }, 400],
    ['/api/logistics/orders/:id/verify-delivery', 'logistics', {}, 400],
    ['/api/logistics/orders/:id/verify-delivery', 'logistics', { otp: 123456 }, 400],
    ['/api/logistics/jobs/:id/claim', 'wrong-session', {}, 401],
    ['/api/logistics/jobs/:id/claim', null, {}, 401],
    ['/api/buyer/orders/:id/pay-farmer-advance', 'buyer', { amount: 1 }, 400],
    ['/api/buyer/orders/:id/pay-logistics-advance', 'buyer', { percent: 1 }, 400],
    ['/api/buyer/orders/:id/pay-final-balances', 'buyer', { amount: 1 }, 400],
    ...['farmerAccountId', 'buyerAccountId', 'logisticsAccountId', 'actorAccountId'].map(key => ['/api/logistics/jobs/:id/claim', 'logistics', { [key]: id }, 400] as [string, string, unknown, number]),
    ['/api/farmer/bids/not-a-uuid/accept', 'farmer', { quantityKg: 100 }, 400],
    ['/api/farmer/bids/:id/accept', 'farmer', { quantityKg: '100' }, 400],
  ];
  for (const [path, role, body, status] of invalid) await t.test('reject ' + path + ' ' + JSON.stringify(body) + ' ' + role, async () => {
    calls = [];
    assert.equal((await post(path, role, body)).status, status);
    assert.equal(calls.length, 0);
  });
  for (const state of ['revoked', 'expired', 'disabled']) await t.test(state + ' session', async () => {
    revoked = state === 'revoked'; expired = state === 'expired'; disabled = state === 'disabled';
    assert.equal((await post('/api/logistics/jobs/:id/claim', 'logistics')).status, 401);
    revoked = expired = disabled = false;
  });
  for (const code of ['JOB_ALREADY_CLAIMED', 'CAPACITY_EXCEEDED', 'INVALID_JOB_STATE', 'OTP_EXPIRED', 'OTP_ATTEMPTS_EXCEEDED']) await t.test('RPC conflict ' + code, async () => {
    rpcError = code;
    const result = await post('/api/logistics/jobs/:id/claim', 'logistics');
    assert.equal(result.status, 409);
    assert.equal(result.payload.error?.code, code);
    rpcError = null;
  });
  await t.test('unexpected RPC errors are sanitized', async () => {
    rpcError = 'SQL secret details';
    const result = await post('/api/logistics/jobs/:id/claim', 'logistics');
    assert.equal(result.status, 500);
    assert.equal(JSON.stringify(result.payload).includes('secret'), false);
    rpcError = null;
  });
  await t.test('partial acceptance and fee rejection are passed unchanged', async () => {
    await post('/api/farmer/bids/:id/accept', 'farmer', { quantityKg: 25 });
    assert.equal(calls.at(-1)?.args.p_accept_quantity_kg, 25);
    await post('/api/buyer/logistics-jobs/:id/fee-response', 'buyer', { accept: false });
    assert.equal(calls.at(-1)?.args.p_accept, false);
  });
});

test('known RPC errors map without exposing database details', () => {
  assert.equal(mapRpcError({ message: 'INVALID_INPUT' }).status, 400);
  assert.equal(mapRpcError({ message: 'INVALID_OTP' }).status, 400);
  assert.equal(mapRpcError({ message: 'FORBIDDEN' }).status, 403);
  assert.equal(mapRpcError({ message: 'ORDER_NOT_FOUND' }).status, 404);
  assert.equal(mapRpcError({ message: 'PRICE_BELOW_RESERVE' }).status, 409);
  assert.equal(mapRpcError({ message: 'unknown SQL' }).status, 500);
});

test('service rejects nonfinite quantities before RPC', async () => {
  const service = createMutationService(async () => { assert.fail('RPC must not run'); });
  for (const quantityKg of [NaN, Infinity, -1, 0]) {
    await assert.rejects(service.execute('acceptBid', { accountId: actors.farmer, role: 'farmer' }, id, { quantityKg }));
  }
});
