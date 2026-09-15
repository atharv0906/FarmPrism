import test from 'node:test';
import assert from 'node:assert/strict';
import { currentFarmBatch, farmMapsUrl, validProduceQuantity } from '../src/services/api/farmerInventory.validation';
import { parseFarmBatch, parseFarmerMyFarm } from '../src/services/api/farmerSummary.contract';
import { farmerInventoryClient } from '../src/services/api/farmerInventory.client';
import { apiClient, ApiError } from '../src/services/api/api.client';
const batch = () => ({ id: 'batch-id', batchCode: 'FPB-TEST', crop: 'Tomato', originalQuantityKg: 100, remainingQuantityKg: 100, qualityGrade: null, status: 'available', createdAt: '2026-09-15', updatedAt: '2026-09-15', sellable: true });
test('produce quantity input allows positive bounded KG and rejects malformed values', () => {
  for (const value of ['1', '0.01', '100', '50.25', '1000000']) assert.ok(validProduceQuantity(value));
  for (const value of ['', '0', '-1', 'Infinity', 'NaN', '1e6', '0.001', '1000001']) assert.equal(validProduceQuantity(value), false);
});
test('batch details retain null grade, current and sellable states remain distinct', () => {
  const b = parseFarmBatch(batch()); assert.equal(b.qualityGrade, null); assert.ok(currentFarmBatch(b));
  assert.equal(currentFarmBatch({ ...b, remainingQuantityKg: 0 }), false);
  for (const status of ['sold', 'completed', 'cancelled']) assert.equal(currentFarmBatch({ ...b, status }), false);
  assert.ok(currentFarmBatch({ ...b, status: 'reserved', sellable: false }));
  assert.throws(() => parseFarmBatch({ ...batch(), sellable: false }));
  assert.throws(() => parseFarmBatch({ ...batch(), crop: 'Wheat' }));
});
test('Maps uses saved geographic coordinates and is unavailable with missing coordinates', () => {
  assert.equal(farmMapsUrl({ latitude: null, longitude: null }), null);
  assert.equal(farmMapsUrl({ latitude: 18, longitude: null }), null);
  assert.equal(farmMapsUrl({ latitude: NaN, longitude: 73 }), null);
  assert.equal(farmMapsUrl({ latitude: 91, longitude: 73 }), null);
  assert.equal(farmMapsUrl({ latitude: -18.5, longitude: 73.8 }), 'https://www.google.com/maps/search/?api=1&query=-18.5%2C73.8');
});
test('inventory client sends only crop/quantity, preserves conflicts and validates safe batch response', async t => {
  const calls: unknown[] = [];
  t.mock.method(apiClient, 'post', async (path: string, body: unknown) => { calls.push([path, body]); return { data: batch() }; });
  assert.equal((await farmerInventoryClient.addCrop('Tomato', 100)).qualityGrade, null);
  await farmerInventoryClient.addProduce('Tomato', 50);
  assert.deepEqual(calls, [['/api/farmer/crops', { crop: 'Tomato', quantityKg: 100 }], ['/api/farmer/batches', { crop: 'Tomato', quantityKg: 50 }]]);
  t.mock.method(apiClient, 'post', async () => { throw new ApiError(409, 'CROP_ALREADY_EXISTS', 'Open Crop Details and choose Add Produce.'); });
  await assert.rejects(farmerInventoryClient.addCrop('Tomato', 10), { code: 'CROP_ALREADY_EXISTS' });
});
test('farm edit sends omitted coordinates unchanged and checks successful save', async t => {
  t.mock.method(apiClient, 'patch', async (path: string, body: unknown) => { assert.equal(path, '/api/farmer/farm'); assert.deepEqual(body, { locationLabel: 'Pune', farmAreaAcres: 2 }); return { data: { saved: true } }; });
  await farmerInventoryClient.editFarm({ locationLabel: 'Pune', farmAreaAcres: 2 });
});
test('clean farm contract has no invented crops, batches or activities', () => {
  const empty = { farm: { id: 'farmer', name: null, location: '', area: null, areaUnit: 'acre', latitude: null, longitude: null }, summary: { cropCount: 0, totalAvailableKg: 0, activeBatchCount: 0 }, crops: [], batches: [], activityEvents: [], activities: { cropsAdded: 0, updatesThisMonth: 0 } };
  assert.deepEqual(parseFarmerMyFarm(empty), empty);
  assert.throws(() => parseFarmerMyFarm({ ...empty, batches: undefined }));
});
