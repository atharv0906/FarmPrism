import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketService } from './market.service.js';
import { parseMarketConfig } from '../config/marketConfig.js';
import type { MarketPoint } from '../types/market.js';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { createMutationService } = await import('./mutation.service.js');
const { assertBidBeforeExpiry } = await import('../repositories/mutation.repository.js');
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const id = '11111111-1111-4111-8111-111111111111';
const farmer = { accountId: '22222222-2222-4222-8222-222222222222', role: 'farmer' as const };
const logistics = { accountId: '33333333-3333-4333-8333-333333333333', role: 'logistics' as const };

test('Pickup RPCs receive exact actor-owned parameters and expose only the contracted fields', async () => {
  const calls: unknown[] = [];
  const service = createMutationService(async (name, args) => {
    calls.push([name, args]);
    return name === 'demo_generate_pickup_otp'
      ? { orderId: id, otp: '123456', expiresAt: '2099-01-01T00:00:00Z', code_hash: 'private' }
      : { verified: true, orderId: id, status: 'pickup_confirmed', attemptCount: 1, attemptsRemaining: 4, code_hash: 'private' };
  });
  const generated = await service.execute('generatePickupOtp', farmer, id, {});
  assert.deepEqual(generated, { orderId: id, otp: '123456', expiresAt: '2099-01-01T00:00:00Z' });
  const verified = await service.execute('verifyPickupOtp', logistics, id, { otp: '123456' });
  assert.deepEqual(verified, { verified: true, orderId: id, status: 'pickup_confirmed', attemptCount: 1, attemptsRemaining: 4 });
  assert.deepEqual(calls, [
    ['demo_generate_pickup_otp', { p_farmer_account_id: farmer.accountId, p_order_id: id }],
    ['demo_verify_pickup_otp_v2', { p_logistics_account_id: logistics.accountId, p_order_id: id, p_otp: '123456' }],
  ]);
});

test('Pickup invalid and fifth attempts preserve committed safe metadata and never leak the OTP/hash', async () => {
  for (const [errorCode, count, remaining, status] of [['INVALID_OTP', 1, 4, 400], ['OTP_ATTEMPTS_EXCEEDED', 5, 0, 409]] as const) {
    const service = createMutationService(async () => ({ verified: false, errorCode, attemptCount: count, attemptsRemaining: remaining, otp: '123456', code_hash: 'private' }));
    await assert.rejects(service.execute('verifyPickupOtp', logistics, id, { otp: '123456' }), (e: any) => {
      assert.equal(e.status, status); assert.equal(e.code, errorCode);
      assert.deepEqual(e.details, { attemptCount: count, attemptsRemaining: remaining });
      assert.doesNotMatch(JSON.stringify(e), /123456|private|code_hash/);
      return true;
    });
  }
});

test('malformed Pickup responses cannot report a successful handoff or display invalid secrets', async () => {
  for (const raw of [
    { verified: true, orderId: id, status: 'in_transit', attemptCount: 1, attemptsRemaining: 4 },
    { verified: true, orderId: farmer.accountId, status: 'pickup_confirmed', attemptCount: 1, attemptsRemaining: 4 },
    { verified: false, errorCode: 'SQL_PRIVATE', attemptCount: 1, attemptsRemaining: 4 },
    { verified: false, errorCode: 'INVALID_OTP', attemptCount: 1, attemptsRemaining: 99 },
  ]) await assert.rejects(createMutationService(async () => raw).execute('verifyPickupOtp', logistics, id, { otp: '123456' }), { code: 'PICKUP_RESPONSE_INVALID' });
  for (const otp of ['12345', 'abcdef']) await assert.rejects(createMutationService(async () => ({ orderId: id, otp, expiresAt: '2099-01-01T00:00:00Z' })).execute('generatePickupOtp', farmer, id, {}), { code: 'PICKUP_RESPONSE_INVALID' });
});

test('Node rejects accept/reject for expired open and partial auctions before calling the mutation RPC', async t => {
  let status = 'open', endsAt = '2000-01-01T00:00:00Z', unavailable = false;
  const filters: unknown[] = [];
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    assert.equal(table, 'demo_bids');
    const query = { select() { return query; }, eq(key: string, value: string) { filters.push([key, value]); return query; },
      async maybeSingle() { return { data: { demo_auctions: { status, ends_at: endsAt } }, error: unavailable ? {} : null }; } };
    return query;
  });
  const service = createMutationService(async () => { assert.fail('Expired auction must not reach mutation RPC'); });
  for (const s of ['open', 'partially_sold', 'expired']) {
    status = s;
    for (const command of ['acceptBid', 'rejectBid'] as const) await assert.rejects(service.execute(command, farmer, id, command === 'acceptBid' ? { quantityKg: 55 } : {}), { code: 'AUCTION_EXPIRED' });
  }
  assert.ok(filters.some((f: any) => f[0] === 'demo_auctions.demo_inventory_batches.farmer_account_id' && f[1] === farmer.accountId));
  status = 'partially_sold'; endsAt = '2099-01-01T00:00:00Z';
  await assertBidBeforeExpiry(id, farmer.accountId);
  unavailable = true;
  await assert.rejects(assertBidBeforeExpiry(id, farmer.accountId), { code: 'AUCTION_READ_UNAVAILABLE' });
});

test('historyMany keeps healthy batching, stored fallback, combined observations and partial official availability', async () => {
  const stored: MarketPoint = { crop: 'Tomato', mandi: 'Pune', district: 'Pune', state: 'Maharashtra', minPricePerKg: 20, modalPricePerKg: 25, maxPricePerKg: 30, observedAt: '2026-09-01T00:00:00Z', source: 'prototype_seed', isDemo: true };
  for (const live of [false, true]) {
    let batches = 0;
    const service = createMarketService({
      history: async () => { assert.fail('Must keep batched repository read'); },
      historyMany: async crops => { batches++; assert.deepEqual(crops, ['Tomato', 'Onion', 'Potato']); return crops.map(crop => [{ ...stored, crop }]); },
    }, parseMarketConfig({ MARKET_API_KEY: 'test-only', MARKET_RESOURCE_ID: 'resource' }), (async () => {
      if (!live) throw new Error('official outage');
      return new Response(JSON.stringify({ records: [{ commodity: 'Tomato', market: 'Pune', district: 'Pune', state: 'Maharashtra', arrival_date: '12/09/2026', min_price: '2000', modal_price: '2700', max_price: '3000' }] }));
    }) as typeof fetch);
    const histories = await service.historyMany(['Tomato', 'Onion', 'Potato'], 30, 'Pune');
    assert.equal(batches, 1);
    assert.equal(histories.length, 3);
    assert.equal(histories[0].fallback, !live);
    assert.equal(histories[0].points.length, live ? 2 : 1);
    assert.equal(histories[1].fallback, true);
    assert.equal(histories[2].points[0].modalPricePerKg, 25);
    if (live) assert.ok(histories[0].points.some(p => !p.isDemo && p.modalPricePerKg === 27));
  }
});
