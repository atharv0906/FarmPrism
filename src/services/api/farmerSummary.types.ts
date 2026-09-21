import type { Crop } from './market.types';
export type FarmBatch = {
  id: string; batchCode: string; crop: Crop; originalQuantityKg: number; remainingQuantityKg: number;
  qualityGrade: 'A' | 'B' | 'C' | null; status: string; createdAt: string; updatedAt: string; sellable: boolean;
};
export type FarmActivity = { id: string; batchId: string; crop: Crop; type: 'Crop Added' | 'Produce Added' | 'Produce Updated'; at: string };
export type FarmPatch = { locationLabel?: string; farmAreaAcres?: number | null; latitude?: number | null; longitude?: number | null };
