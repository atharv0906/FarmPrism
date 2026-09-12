import test from 'node:test';
import assert from 'node:assert/strict';
import { resetPrototype, RESET_CONFIRMATION } from './devReset.service.js';

test('reset rejects production, missing/wrong confirmation and extra RPC arguments without calls', async () => {
  let calls = 0;
  const rpc = async () => { calls++; return { data: {}, error: null }; };
  for (const [env, args] of [
    ['production', [RESET_CONFIRMATION]], ['development', []], ['development', ['wrong']],
    ['development', [RESET_CONFIRMATION, 'arbitrary_rpc']], ['development', ['demo_reset_prototype_data']],
  ] as const) await assert.rejects(resetPrototype(env, args, rpc));
  assert.equal(calls, 0);
});
test('confirmed development reset calls only existing RPC and returns safe summary', async () => {
  const calls: string[] = [];
  const summary = await resetPrototype('development', [RESET_CONFIRMATION], async name => {
    calls.push(name);
    return { data: { reset: true, accounts: 9, farmer1InventoryKg: 1200, sessionsCleared: true,
      activeAuctionId: '11111111-1111-4111-8111-111111111111', activeFixedListingId: 'secret-token',
      secret: 'secret-key', token: 'secret-token' }, error: null };
  });
  assert.deepEqual(calls, ['demo_reset_prototype_data']);
  assert.deepEqual(summary, { reset: true, sessionsCleared: true, accounts: 9, farmer1InventoryKg: 1200, activeAuctionId: '11111111-1111-4111-8111-111111111111' });
  assert.equal(JSON.stringify(summary).includes('secret'), false);
});
test('reset failure does not expose RPC errors or secrets', async () => {
  for (const rpc of [async () => { throw new Error('secret-key'); }, async () => ({ data: null, error: 'secret-token' })]) {
    await assert.rejects(resetPrototype('development', [RESET_CONFIRMATION], rpc), error => error instanceof Error && !error.message.includes('secret-'));
  }
});
