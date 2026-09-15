import test from 'node:test';
import assert from 'node:assert/strict';
import { clearDemoActivity, clearTargets, preservedTargets, validateClearRequest, type CleanupStore } from './clearDemoActivity.service.js';
test('cleanup guards refuse production and anything except exact confirmation before DB access', async () => {
  for (const env of ['production', 'PRODUCTION', ' production ']) assert.throws(() => validateClearRequest(env, ['CLEAR_FARMPRISM_ACTIVITY']));
  for (const args of [[], ['RESET_FARMPRISM_DEMO'], ['CLEAR_FARMPRISM_ACTIVITY', 'extra']]) assert.throws(() => validateClearRequest('development', args));
  const store: CleanupStore = { count: async () => assert.fail('must not read'), clear: async () => assert.fail('must not delete') };
  await assert.rejects(clearDemoActivity('production', ['CLEAR_FARMPRISM_ACTIVITY'], store));
});
test('cleanup fixed FK order leaves identities and official markets intact with verified zero activity', async () => {
  const deleted: string[] = [];
  const store: CleanupStore = { count: async (t, official) => official ? 42 : t === 'demo_accounts' ? 9 : preservedTargets.some(p => p === t) ? 3 : deleted.includes(t) ? 0 : 5,
    clear: async t => { assert.ok(clearTargets.includes(t)); assert.ok(!preservedTargets.some(p => p === String(t))); deleted.push(t); } };
  const result = await clearDemoActivity('development', ['CLEAR_FARMPRISM_ACTIVITY'], store);
  assert.deepEqual(deleted, [...clearTargets]); assert.equal(result.after.demo_sessions, 0); assert.equal(result.after.mandi_prices_demo, 0); assert.equal(result.after.mandi_prices_official, 42); assert.equal(result.after.demo_accounts, 9);
  for (const child of ['demo_logistics_jobs', 'demo_payments', 'demo_order_events'] as const) assert.ok(deleted.indexOf(child) < deleted.indexOf('demo_orders'));
  for (const parent of ['demo_bids', 'demo_purchase_requests', 'demo_auctions', 'demo_inventory_batches'] as const) assert.ok(deleted.indexOf('demo_orders') < deleted.indexOf(parent));
});
test('cleanup stops on partial failure and refuses identity mismatch', async () => {
  let calls = 0;
  const store: CleanupStore = { count: async t => t === 'demo_accounts' ? 9 : preservedTargets.some(p => p === t) ? 3 : 1, clear: async () => { calls++; throw new Error('failed'); } };
  await assert.rejects(clearDemoActivity('development', ['CLEAR_FARMPRISM_ACTIVITY'], store)); assert.equal(calls, 1);
  calls = 0; store.count = async () => 0;
  await assert.rejects(clearDemoActivity('development', ['CLEAR_FARMPRISM_ACTIVITY'], store)); assert.equal(calls, 0);
});
