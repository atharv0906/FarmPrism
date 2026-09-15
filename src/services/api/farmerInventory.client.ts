import { apiClient } from './api.client';
import { parseFarmBatch } from './farmerSummary.contract';
import type { Crop } from './market.types';
import type { FarmPatch } from './farmerSummary.types';
export const farmerInventoryClient = {
  async addCrop(crop: Crop, quantityKg: number) { return parseFarmBatch((await apiClient.post<{ data: unknown }>('/api/farmer/crops', { crop, quantityKg })).data); },
  async addProduce(crop: Crop, quantityKg: number) { return parseFarmBatch((await apiClient.post<{ data: unknown }>('/api/farmer/batches', { crop, quantityKg })).data); },
  async editFarm(patch: FarmPatch) {
    const result = await apiClient.patch<{ data: { saved: boolean } }>('/api/farmer/farm', patch);
    if (result?.data?.saved !== true) throw new Error('The farm save could not be confirmed. Refresh before retrying.');
  },
};
