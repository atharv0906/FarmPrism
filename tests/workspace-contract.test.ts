import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkspace, workspaceContractError } from '../src/services/api/workspace.contract';
import type { Role, TradingWorkspace } from '../src/services/api/trading.types';

function fixture(role: Role): TradingWorkspace {
  const me = { id: role, name: role, loginLabel: role + '1', role, trustScore: null, completedTransactions: null,
    qualityConsistency: null, paymentReliability: null, deliveryReliability: null, verification: null,
    location: null, area: null, farmerCode: null, vehicle: null, capacity: null };
  return { me, profiles: [me], batches: [], items: [], offers: [], orders: [], jobs: [], payments: [], events: [], tracking: [], notifications: [] };
}
for (const role of ['farmer', 'buyer', 'logistics'] as const) {
  test(`${role} workspace accepts domain nulls and empty collections; rejects missing collections`, () => {
    const data = fixture(role);
    assert.equal(parseWorkspace(data), data);
    for (const key of Object.keys(data)) {
      const incomplete = { ...data } as Record<string, unknown>; delete incomplete[key];
      assert.notEqual(workspaceContractError(incomplete), null, key);
    }
  });
}
test('nested financial/quantity fields cannot silently become null, strings, or fake zero defaults', () => {
  const data = fixture('buyer');
  data.payments.push({ id: 'payment', orderId: 'order', kind: 'farmer_advance', amount: 250, status: 'paid', simulated: true, paidAt: null });
  for (const amount of [null, undefined, '250', NaN, Infinity]) {
    assert.equal(workspaceContractError({ ...data, payments: [{ ...data.payments[0], amount }] }), 'workspace.payments[0].amount');
  }
  assert.equal(parseWorkspace(data).payments[0].amount, 250);
  assert.throws(() => parseWorkspace(null), /Trading data is incomplete/);
});
test('saved delivery coordinates are optional but validated when supplied', () => {
  const data = fixture('buyer');
  data.deliveryLocation = { label: 'Saved address', latitude: null, longitude: null };
  assert.equal(workspaceContractError(data), null);
  assert.equal(workspaceContractError({ ...data, deliveryLocation: { label: 'Saved address', latitude: 'bad', longitude: null } }), 'workspace.deliveryLocation.latitude');
});

test('auction policy is an explicit boolean; Fixed Price has no policy contract', () => {
  const data = fixture('buyer');
  const item = { id: 'a', kind: 'auction', batch: { id: 'b', farmerId: 'f', code: 'B', crop: 'Tomato', quantityKg: 10, grade: 'A', status: 'available' }, offeredKg: 10, remainingKg: 10, pricePerKg: 20, startsAt: '2026-09-01', endsAt: '2099-01-01', status: 'open' };
  for (const allowPartialSale of [true, false]) assert.equal(workspaceContractError({ ...data, items: [{ ...item, allowPartialSale }] }), null);
  for (const allowPartialSale of [undefined, null, 'false', 0]) assert.equal(workspaceContractError({ ...data, items: [{ ...item, allowPartialSale }] }), 'workspace.items[0].allowPartialSale');
  assert.equal(workspaceContractError({ ...data, items: [{ ...item, kind: 'fixed' }] }), null);
});
