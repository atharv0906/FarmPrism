import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { ApiError } from '../utils/apiError.js';
import { farmerSummaryRepository } from './farmerSummary.repository.js';
import type { InventoryRepository } from '../services/farmerInventory.service.js';
import { parseFarmBatch } from '../utils/parseFarmBatch.js';

export const farmerInventoryRepository: InventoryRepository = {
  async batches(accountId) { return (await farmerSummaryRepository.read(accountId)).batches; },
  async insert(batch) {
    const { data, error } = await supabaseAdmin.from('demo_inventory_batches').insert(batch).select('id,batch_code,crop_name,original_quantity_kg,remaining_quantity_kg,quality_grade,status,created_at,updated_at').single();
    if (error?.code === '23505') throw new ApiError(409, 'BATCH_CODE_COLLISION', 'Please retry creating the batch.');
    if (error || !data) throw new ApiError(503, 'FARM_WRITE_FAILED', 'Unable to save produce. Refresh your farm before retrying.');
    return parseFarmBatch(data);
  },
  async update(accountId, patch) {
    const { data, error } = await supabaseAdmin.from('demo_farmer_profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('account_id', accountId).select('account_id').single();
    if (error || !data) throw new ApiError(503, 'FARM_WRITE_FAILED', 'Unable to save farm details. Please retry.');
  },
};
