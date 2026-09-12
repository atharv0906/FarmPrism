import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const { farmerSummaryRepository } = await import('./farmerSummary.repository.js');

test('summary repository scopes every read to actor or owned parents and never calls snapshot/mutation RPCs', async t => {
  const fixtures: Record<string, Record<string, unknown>[]> = {
    demo_accounts: [{ id: 'owner', full_name: 'Owner' }, { id: 'other', full_name: 'Other' }],
    demo_farmer_profiles: [{ account_id: 'owner', location_label: 'Pune', farm_area_acres: '2.5' }],
    demo_inventory_batches: [
      { id: 'batch', farmer_account_id: 'owner', crop_name: 'Tomato', remaining_quantity_kg: '72.25', status: 'available', created_at: '2026-09-01', updated_at: '2026-09-02' },
      { id: 'foreign', farmer_account_id: 'other', crop_name: 'Onion', remaining_quantity_kg: 9999 },
    ],
    demo_auctions: [{ id: 'auction', batch_id: 'batch', remaining_quantity_kg: 72.25, starts_at: '2026-09-01', ends_at: '2026-09-20', status: 'open' }, { id: 'foreign-auction', batch_id: 'foreign' }],
    demo_bids: [{ id: 'bid', auction_id: 'auction', buyer_account_id: 'buyer', quantity_kg: 50, price_per_kg: 20, status: 'active' }, { id: 'foreign-bid', auction_id: 'foreign-auction' }],
    demo_orders: [{ farmer_account_id: 'owner', accepted_bid_id: null, allocated_quantity_kg: 5, total_amount: 100, status: 'completed', completed_at: '2026-09-03' }, { farmer_account_id: 'other' }],
    demo_notifications: [{ account_id: 'owner', notification_type: 'new_bid', read_at: null }, { account_id: 'other' }],
  };
  const filters: string[] = [];
  t.mock.method(supabaseAdmin, 'rpc', () => { assert.fail('Summary reads must not call RPCs'); });
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    let data = fixtures[table] ?? [];
    const q = {
      select() { return q; }, limit() { return q; },
      eq(key: string, value: string) { filters.push(table + '.' + key); data = data.filter(row => row[key] === value); return q; },
      in(key: string, ids: string[]) { filters.push(table + '.' + key); data = data.filter(row => ids.includes(String(row[key]))); return q; },
      then(resolve: (result: unknown) => unknown) { return Promise.resolve({ data, error: null }).then(resolve); },
    };
    return q;
  });
  const result = await farmerSummaryRepository.read('owner');
  assert.equal(result.batches.length, 1); assert.equal(result.batches[0].remainingKg, 72.25);
  assert.equal(result.auctions.length, 1); assert.equal(result.bids.length, 1);
  assert.equal(result.orders.length, 1); assert.equal(result.notifications.length, 1);
  assert.deepEqual(filters.sort(), ['demo_accounts.id', 'demo_farmer_profiles.account_id', 'demo_inventory_batches.farmer_account_id', 'demo_orders.farmer_account_id', 'demo_notifications.account_id', 'demo_auctions.batch_id', 'demo_bids.auction_id'].sort());
  fixtures.demo_inventory_batches = [];
  const empty = await farmerSummaryRepository.read('owner');
  assert.deepEqual(empty.batches, []); assert.deepEqual(empty.auctions, []); assert.deepEqual(empty.bids, []);
  fixtures.demo_notifications = Array.from({ length: 1000 }, () => ({ account_id: 'owner', notification_type: 'new_bid', read_at: null }));
  await assert.rejects(farmerSummaryRepository.read('owner'), { code: 'FARM_DATA_UNAVAILABLE' });
});
