import test from 'node:test';
import assert from 'node:assert/strict';
import { createFarmerInventoryService, parseFarmPatch, parseInventoryInput, type NewBatch, type InventoryRepository } from './farmerInventory.service.js';
import { ApiError } from '../utils/apiError.js';
const actor = { accountId: 'farmer-owner', role: 'farmer' };
function fixture() {
  const records: NewBatch[] = [], patches: unknown[] = [];
  const repository: InventoryRepository = {
    batches: async id => { assert.equal(id, actor.accountId); return records.map(b => ({ crop: b.crop_name, remainingKg: b.remaining_quantity_kg, status: b.status })); },
    insert: async b => { records.push(b); return { id: String(records.length), batchCode: b.batch_code, crop: b.crop_name, originalQuantityKg: b.original_quantity_kg, remainingQuantityKg: b.remaining_quantity_kg, qualityGrade: b.quality_grade, status: b.status, createdAt: '2026-09-15', updatedAt: '2026-09-15', sellable: true }; },
    update: async (id, patch) => { assert.equal(id, actor.accountId); patches.push(patch); },
  };
  return { records, patches, repository, service: createFarmerInventoryService(repository) };
}
test('Add Crop and Add Produce create separate actor-owned ungraded available batches', async () => {
  const f = fixture(), first = await f.service.add(actor, { crop: 'Tomato', quantityKg: 100 }, true);
  assert.match(first.batchCode, /^FPB-[A-F0-9]{32}$/);
  await assert.rejects(f.service.add(actor, { crop: 'Tomato', quantityKg: 10 }, true), { code: 'CROP_ALREADY_EXISTS', status: 409 });
  const second = await f.service.add(actor, { crop: 'Tomato', quantityKg: 50 }, false);
  assert.notEqual(first.id, second.id); assert.notEqual(first.batchCode, second.batchCode);
  assert.equal(f.records.length, 2); assert.equal(f.records[0].remaining_quantity_kg, 100);
  for (const b of f.records) { assert.equal(b.farmer_account_id, actor.accountId); assert.equal(b.quality_grade, null); assert.equal(b.quality_source, 'farmer_declared'); assert.equal(b.quality_notes, null); assert.equal(b.status, 'available'); assert.equal(b.original_quantity_kg, b.remaining_quantity_kg); }
});
test('inactive history allows Add Crop; Add Produce requires positive nonterminal crop', async () => {
  for (const status of ['available', 'sold', 'completed', 'cancelled', 'reserved']) {
    const f = fixture(); f.repository.batches = async () => [{ crop: 'Onion', remainingKg: status === 'available' ? 0 : 15, status }];
    if (status === 'reserved') { await assert.rejects(f.service.add(actor, { crop: 'Onion', quantityKg: 1 }, true), { code: 'CROP_ALREADY_EXISTS' }); await f.service.add(actor, { crop: 'Onion', quantityKg: 1 }, false); }
    else { await assert.rejects(f.service.add(actor, { crop: 'Onion', quantityKg: 1 }, false), { code: 'CROP_NOT_ACTIVE' }); await f.service.add(actor, { crop: 'Onion', quantityKg: 1 }, true); }
  }
});
test('quantity, crop and identity validation rejects unsupported inputs before writes', async () => {
  for (const quantityKg of [0, -1, NaN, Infinity, 1_000_001, 0.001, '10', null]) assert.throws(() => parseInventoryInput({ crop: 'Tomato', quantityKg }), { status: 400 });
  for (const crop of ['tomato', 'Wheat', null]) assert.throws(() => parseInventoryInput({ crop, quantityKg: 1 }));
  assert.throws(() => parseInventoryInput({ crop: 'Tomato', quantityKg: 1, farmerAccountId: 'other' }));
  const f = fixture();
  for (const role of ['buyer', 'logistics']) { await assert.rejects(f.service.add({ ...actor, role }, { crop: 'Potato', quantityKg: 1 }, true), { status: 403 }); await assert.rejects(f.service.edit({ ...actor, role }, { locationLabel: 'x' }), { status: 403 }); }
  await assert.rejects(f.service.add({ ...actor, accountId: '' }, {}, true), { status: 401 }); assert.equal(f.records.length, 0);
});
test('simultaneous Add Crop requests serialize checks; unique code collision retries safely', async () => {
  const f = fixture(); const results = await Promise.allSettled([f.service.add(actor, { crop: 'Tomato', quantityKg: 1 }, true), f.service.add(actor, { crop: 'Tomato', quantityKg: 1 }, true)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal(f.records.length, 1);
  const g = fixture(), insert = g.repository.insert; let calls = 0;
  g.repository.insert = async b => { if (++calls === 1) throw new ApiError(409, 'BATCH_CODE_COLLISION', 'collision'); return insert(b); };
  await g.service.add(actor, { crop: 'Onion', quantityKg: 1 }, true); assert.equal(calls, 2);
});
test('Edit Farm whitelists real fields and preserves omitted coordinates', async () => {
  assert.deepEqual(parseFarmPatch({ locationLabel: ' Pune ', farmAreaAcres: 0 }), { location_label: 'Pune', farm_area_acres: 0 });
  assert.deepEqual(parseFarmPatch({ latitude: -90, longitude: 180 }), { latitude: -90, longitude: 180 });
  for (const body of [{}, { farmAreaAcres: -1 }, { farmAreaAcres: Infinity }, { farmAreaAcres: 100001 }, { locationLabel: 'x'.repeat(201) }, { latitude: 91, longitude: 0 }, { latitude: 0 }, { role: 'buyer' }, { phone: 'x' }, { verification: 'verified' }, { farmerCode: 'x' }, { farmName: 'x' }]) assert.throws(() => parseFarmPatch(body));
  const f = fixture(); await f.service.edit(actor, { locationLabel: ' Nashik ' }); assert.deepEqual(f.patches, [{ location_label: 'Nashik' }]);
});
