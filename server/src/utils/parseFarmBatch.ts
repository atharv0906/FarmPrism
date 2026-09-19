import type { FarmBatch } from '../services/farmerInventory.service.js';
import { ApiError } from './apiError.js';
import { isCrop } from './validation.js';
import { isSellableBatch } from './farmerInventory.js';
export function parseFarmBatch(row: Record<string, unknown>): FarmBatch {
  function invalid(): never { throw new ApiError(503, 'FARM_DATA_UNAVAILABLE', 'Current batch data could not be loaded.'); }
  const text = (v: unknown) => typeof v === 'string' && v.length ? v : invalid();
  const num = (v: unknown) => (typeof v === 'number' || typeof v === 'string') && String(v).trim() && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : invalid();
  const date = (v: unknown) => { const s = text(v); return Number.isFinite(Date.parse(s)) ? s : invalid(); };
  const remainingQuantityKg = num(row.remaining_quantity_kg), status = text(row.status);
  return { id: text(row.id), batchCode: text(row.batch_code), crop: typeof row.crop_name === 'string' && isCrop(row.crop_name) ? row.crop_name : invalid(),
    originalQuantityKg: num(row.original_quantity_kg), remainingQuantityKg,
    qualityGrade: row.quality_grade === null || row.quality_grade === 'A' || row.quality_grade === 'B' || row.quality_grade === 'C' ? row.quality_grade : invalid(),
    status, createdAt: date(row.created_at), updatedAt: date(row.updated_at), sellable: isSellableBatch({ remainingKg: remainingQuantityKg, status }) };
}
