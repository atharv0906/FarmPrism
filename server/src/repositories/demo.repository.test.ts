import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const repository = await import('./demo.repository.js');
const { getDemoAccountById } = await import('../lib/demoStore.js');

test('read repositories follow persisted ownership, expiry and current trust', async t => {
  const operations: Array<{ table: string; method: string; args: unknown[] }> = [];
  let trustScore = 82;
  const rows: Record<string, unknown[]> = {
    demo_inventory_batches: [{ id: 'batch' }],
    demo_auctions: [{ id: 'auction' }],
    demo_fixed_price_listings: [{ id: 'listing' }],
    demo_bids: [{ id: 'current', status: 'active' }, { id: 'previous', status: 'replaced' }],
    demo_purchase_requests: [],
    demo_orders: [],
    demo_logistics_jobs: [
      { id: 'fits', order_id: 'order', demo_orders: { allocated_quantity_kg: 100 } },
      { id: 'too-large', order_id: 'order-large', demo_orders: { allocated_quantity_kg: 200 } },
    ],
  };
  t.mock.method(supabaseAdmin, 'rpc', async (name: string) => {
    operations.push({ table: name, method: 'rpc', args: [] });
    return { data: { expiredAuctions: 1, expiredListings: 1 }, error: null };
  });
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    operations.push({ table, method: 'from', args: [] });
    const query = {
      select(...args: unknown[]) { operations.push({ table, method: 'select', args }); return query; },
      eq(...args: unknown[]) { operations.push({ table, method: 'eq', args }); return query; },
      in(...args: unknown[]) { operations.push({ table, method: 'in', args }); return query; },
      gt(...args: unknown[]) { operations.push({ table, method: 'gt', args }); return query; },
      order(...args: unknown[]) { operations.push({ table, method: 'order', args }); return query; },
      async maybeSingle() {
        const data = table === 'demo_accounts' ? { id: 'account', role_code: 'logistics', is_enabled: true }
          : table === 'demo_trust_scores' ? { score: trustScore, completed_transactions: 4 }
          : { capacity_kg: 150 };
        return { data, error: null };
      },
      then(resolve: (result: unknown) => unknown) {
        return Promise.resolve({ data: rows[table] ?? [], error: null }).then(resolve);
      },
    };
    return query;
  });
  await repository.getBuyerMarketplace();
  assert.equal(operations[0].table, 'demo_expire_marketplace');
  operations.length = 0;
  await repository.getFarmerMarketplace('farmer');
  assert.equal(operations[0].table, 'demo_expire_marketplace');
  assert.ok(operations.some(op => op.table === 'demo_bids' && op.method === 'in' && op.args[0] === 'auction_id'));
  assert.equal(operations.some(op => op.table === 'demo_auctions' && op.args[0] === 'farmer_account_id'), false);
  const activity = await repository.getBuyerActivity('buyer');
  assert.deepEqual(activity.activeCurrentBids.map(row => row.id), ['current']);
  assert.equal(activity.bidHistory.length, 2);
  assert.deepEqual((await repository.getAvailableLogisticsJobs('logistics')).map(row => row.id), ['fits']);
  operations.length = 0;
  await repository.getOrdersForAccount('logistics', 'logistics');
  assert.equal(operations.some(op => op.table === 'demo_orders' && op.args[0] === 'logistics_account_id'), false);
  assert.ok(operations.some(op => op.table === 'demo_orders' && op.method === 'in' && op.args[0] === 'id'));
  assert.equal((await getDemoAccountById('account'))?.trustScore, 82);
  trustScore = 90;
  assert.equal((await getDemoAccountById('account'))?.trustScore, 90);
});
