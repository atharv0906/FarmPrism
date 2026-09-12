import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind } from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const { tradingWorkspace } = await import('./trading.repository.js');

test('workspace isolates offers, payments, tracking and unassigned logistics order contracts', async t => {
  const fixtures: Record<string, Record<string, unknown>[]> = {
    demo_accounts: [
      { id: 'farmer', login_label: 'farmer1', full_name: 'Farmer', role_code: 'farmer' },
      { id: 'buyer', login_label: 'buyer1', full_name: 'Buyer', role_code: 'buyer' },
      { id: 'outsider', login_label: 'buyer2', full_name: 'Other Buyer', role_code: 'buyer' },
      { id: 'driver', login_label: 'logistics1', full_name: 'Driver', role_code: 'logistics' },
    ],
    demo_farmer_profiles: [{ account_id: 'farmer', verification_status: 'verified' }],
    demo_buyer_profiles: [{ account_id: 'buyer', verification_status: 'verified' }],
    demo_logistics_profiles: [{ account_id: 'driver', verification_status: 'verified', capacity_kg: 200 }],
    demo_inventory_batches: [{ id: 'batch', farmer_account_id: 'farmer', batch_code: 'B-1', crop_name: 'Tomato', remaining_quantity_kg: 300, quality_grade: 'A', status: 'available' }],
    demo_auctions: [{ id: 'auction', batch_id: 'batch', offered_quantity_kg: 300, remaining_quantity_kg: 200, reserve_price_per_kg: 25, status: 'open', starts_at: '2026-09-10', ends_at: '2026-09-11' }],
    demo_bids: [{ id: 'bid', auction_id: 'auction', buyer_account_id: 'buyer', quantity_kg: 200, price_per_kg: 25, advance_percent: 30, status: 'partially_accepted' }],
    demo_orders: [{ id: 'order', order_code: 'FP-1', source_type: 'auction', accepted_bid_id: 'bid', batch_id: 'batch', farmer_account_id: 'farmer', buyer_account_id: 'buyer',
      allocated_quantity_kg: 100, unit_price_per_kg: 25, total_amount: 2500, farmer_advance_percent: 30, status: 'logistics_pending', created_at: '2026-09-10' }],
    demo_logistics_jobs: [{ id: 'job', order_id: 'order', logistics_account_id: null, status: 'available', proposed_fee: null, fee_status: 'not_proposed' }],
    demo_payments: [{ id: 'payment', order_id: 'order', payment_kind: 'farmer_advance', amount: 750, simulated: true, status: 'paid' }],
    demo_order_events: [{ id: 'event', order_id: 'order', event_type: 'order_created', created_at: '2026-09-10' }],
    demo_notifications: [{ id: 'notification', account_id: 'buyer', notification_type: 'delivery_otp', title: 'Delivery confirmation', body: '123456', data: { otp: '123456', orderId: 'order' } }],
    demo_tracking_points: [{ id: 'point', job_id: 'job', latitude: 18, longitude: 73, source: 'actual', recorded_at: '2026-09-10' }],
  };
  t.mock.method(supabaseAdmin, 'rpc', async () => ({ data: {}, error: null }));
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    let data = fixtures[table] ?? [];
    const query = {
      select() { return query; }, limit() { return query; }, order() { return query; },
      in(key: string, ids: string[]) { data = data.filter(row => ids.includes(String(row[key]))); return query; },
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({ data, error: null }).then(resolve); },
    };
    return query;
  });
  // Validate actual repository JSON with the same runtime contract used by mobile.
  const source = readFileSync(new URL('../../../src/services/api/workspace.contract.ts', import.meta.url), 'utf8');
  const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText;
  const contract: { workspaceContractError?: (value: unknown) => string | null } = {};
  new Function('exports', compiled)(contract);
  for (const table of Object.values(fixtures)) for (const row of table) {
    if (!('created_at' in row)) row.created_at = '2026-09-10T00:00:00Z';
    if (!('updated_at' in row)) row.updated_at = '2026-09-10T00:00:00Z';
  }
  for (const [id, role] of [['farmer', 'farmer'], ['buyer', 'buyer'], ['driver', 'logistics']] as const) {
    const workspace = await tradingWorkspace(id, role);
    assert.equal(contract.workspaceContractError!(JSON.parse(JSON.stringify(workspace))), null, role + ' mobile contract');
  }
  const buyer = await tradingWorkspace('buyer', 'buyer');
  assert.equal(buyer.orders.length, 1);
  assert.equal(buyer.offers[0].remainingKg, 100);
  assert.equal(buyer.payments.length, 1);
  assert.equal(JSON.stringify(buyer.notifications).includes('123456'), false);
  const outsider = await tradingWorkspace('outsider', 'buyer');
  assert.equal(outsider.orders.length, 0);
  assert.equal(outsider.offers.length, 0);
  assert.equal(outsider.payments.length, 0);
  assert.equal(outsider.notifications.length, 0);
  const driver = await tradingWorkspace('driver', 'logistics');
  assert.equal(driver.jobs[0].quantityKg, 100);
  assert.equal(driver.orders.length, 0);
  assert.equal(driver.payments.length, 0);
  assert.equal(driver.tracking.length, 0);
  fixtures.demo_logistics_jobs[0].logistics_account_id = 'driver';
  fixtures.demo_logistics_jobs[0].status = 'claimed';
  const assigned = await tradingWorkspace('driver', 'logistics');
  assert.equal(assigned.orders.length, 1);
  assert.equal(assigned.tracking.length, 1);
});
