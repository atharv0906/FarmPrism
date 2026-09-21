import type { Crop } from '../types/market.js';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/apiError.js';
import * as v from '../utils/mutationValidation.js';
import { isCrop } from '../utils/validation.js';
import { isCurrentBatch } from '../utils/farmerInventory.js';

export type FarmPatch = { location_label?: string; farm_area_acres?: number | null; latitude?: number | null; longitude?: number | null };
export type NewBatch = { farmer_account_id: string; batch_code: string; crop_name: Crop; original_quantity_kg: number; remaining_quantity_kg: number; quality_grade: null; quality_source: 'farmer_declared'; quality_notes: null; status: 'available' };
export type FarmBatch = { id: string; batchCode: string; crop: Crop; originalQuantityKg: number; remainingQuantityKg: number; qualityGrade: 'A' | 'B' | 'C' | null; status: string; createdAt: string; updatedAt: string; sellable: boolean };
export type InventoryRepository = {
  batches(accountId: string): Promise<{ crop: Crop; remainingKg: number; status: string }[]>;
  insert(batch: NewBatch): Promise<FarmBatch>;
  update(accountId: string, patch: FarmPatch): Promise<void>;
};
export function parseInventoryInput(body: unknown) {
  const input = v.object(body, ['crop', 'quantityKg']);
  if (typeof input.crop !== 'string' || !isCrop(input.crop)) return v.invalid();
  const quantityKg = v.number(input.quantityKg, 0.01, 1_000_000);
  if (Math.abs(quantityKg * 100 - Math.round(quantityKg * 100)) > 0.000001) return v.invalid();
  return { crop: input.crop, quantityKg };
}
export function parseFarmPatch(body: unknown): FarmPatch {
  const input = v.object(body, ['locationLabel', 'farmAreaAcres', 'latitude', 'longitude']);
  if (!Object.keys(input).length) return v.invalid();
  const patch: FarmPatch = {};
  if ('locationLabel' in input) {
    if (typeof input.locationLabel !== 'string' || input.locationLabel.trim().length > 200) return v.invalid();
    patch.location_label = input.locationLabel.trim();
  }
  if ('farmAreaAcres' in input) patch.farm_area_acres = input.farmAreaAcres === null ? null : v.number(input.farmAreaAcres, 0, 100_000);
  if (('latitude' in input) !== ('longitude' in input)) return v.invalid();
  if ('latitude' in input) {
    if (input.latitude === null && input.longitude === null) { patch.latitude = null; patch.longitude = null; }
    else { patch.latitude = v.number(input.latitude, -90, 90); patch.longitude = v.number(input.longitude, -180, 180); }
  }
  return patch;
}
export function createFarmerInventoryService(repository: InventoryRepository, code = () => 'FPB-' + randomUUID().replaceAll('-', '').toUpperCase()) {
  // Serializes crop checks and inserts for this prototype's single Node process.
  // Multiple Node replicas require a database transaction/lock before deployment.
  const locks = new Map<string, Promise<unknown>>();
  async function serialize<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) ?? Promise.resolve();
    const pending = previous.catch(() => {}).then(operation);
    locks.set(key, pending);
    try { return await pending; } finally { if (locks.get(key) === pending) locks.delete(key); }
  }
  function authorize(actor: { accountId: string; role: string }) {
    if (!actor.accountId) throw new ApiError(401, 'invalid_session', 'Please sign in again.');
    if (actor.role !== 'farmer') throw new ApiError(403, 'FORBIDDEN', 'Only Farmers can edit farm inventory.');
  }
  return {
    async add(actor: { accountId: string; role: string }, body: unknown, first: boolean) {
      authorize(actor);
      const { crop, quantityKg } = parseInventoryInput(body);
      return serialize(actor.accountId + ':' + crop, async () => {
        const exists = (await repository.batches(actor.accountId)).some(b => b.crop === crop && isCurrentBatch(b));
        if (first && exists) throw new ApiError(409, 'CROP_ALREADY_EXISTS', 'This crop is already in your farm. Open Crop Details and choose Add Produce.');
        if (!first && !exists) throw new ApiError(409, 'CROP_NOT_ACTIVE', 'This crop has no current produce. Choose Add Crop to get started.');
        for (let attempt = 0; attempt < 3; attempt++) {
          try { return await repository.insert({ farmer_account_id: actor.accountId, batch_code: code(), crop_name: crop,
            original_quantity_kg: quantityKg, remaining_quantity_kg: quantityKg, quality_grade: null,
            quality_source: 'farmer_declared', quality_notes: null, status: 'available' }); }
          catch (error) { if (!(error instanceof ApiError) || error.code !== 'BATCH_CODE_COLLISION' || attempt === 2) throw error; }
        }
        throw new ApiError(503, 'FARM_WRITE_FAILED', 'Unable to create produce. Please retry.');
      });
    },
    async edit(actor: { accountId: string; role: string }, body: unknown) {
      authorize(actor); await repository.update(actor.accountId, parseFarmPatch(body)); return { saved: true };
    },
  };
}
