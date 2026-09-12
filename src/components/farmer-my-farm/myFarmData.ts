import type { ImageSourcePropType } from 'react-native';
import { dashboardAssets as a } from '../farmer-dashboard/dashboardAssets';
import type { FarmerMyFarmSummary } from '../../services/demo/demo.types';

export type FarmerMyFarmData = {
  farm: { id: string; name: string | null; location: string; area: number | null; areaUnit: 'acre' };
  summary: { cropCount: number; totalAvailableKg: number; activeBatchCount: number };
  crops: Array<{ id: string; name: 'Onion' | 'Tomato' | 'Potato'; image: ImageSourcePropType; availableKg: number; batchCount: number; status: 'active' | 'inactive' }>;
  activities: { cropsAdded: number; updatesThisMonth: number };
};
export function mapFarmerMyFarm(summary: FarmerMyFarmSummary): FarmerMyFarmData {
  const images = { Tomato: a.tomato, Onion: a.onion, Potato: a.potato };
  return {
    farm: summary.farm,
    summary: summary.summary,
    crops: summary.crops.map(crop => ({ ...crop, image: images[crop.name] })),
    activities: summary.activities,
  };
}
export type MyFarmIntent =
  | { type: 'FARM_OVERVIEW' | 'EDIT_FARM' | 'CROPS' | 'AVAILABLE_PRODUCE' | 'ADD_CROP' | 'UPDATES' | 'MAP' }
  | { type: 'CROP_DETAILS' | 'BATCHES'; cropId: string; cropName: string };

// UI-only fixture. All quantities are kilograms; replace this model at the data boundary in 1.9.1.
export const myFarmPrototype: FarmerMyFarmData = {
  farm: { id: 'prototype-farm', name: null, location: 'Wagholi, Pune, Maharashtra', area: 5, areaUnit: 'acre' },
  summary: { cropCount: 2, totalAvailableKg: 2200, activeBatchCount: 3 },
  crops: [
    { id: 'prototype-tomato', name: 'Tomato', image: a.tomato, availableKg: 1200, batchCount: 2, status: 'active' },
    { id: 'prototype-onion', name: 'Onion', image: a.onion, availableKg: 1000, batchCount: 1, status: 'active' },
  ],
  activities: { cropsAdded: 2, updatesThisMonth: 1 },
};
export const myFarmEmptyStates: Record<'noCrops' | 'noAvailableProduce', FarmerMyFarmData> = {
  noCrops: { ...myFarmPrototype, summary: { cropCount: 0, totalAvailableKg: 0, activeBatchCount: 0 }, crops: [] },
  noAvailableProduce: { ...myFarmPrototype, summary: { ...myFarmPrototype.summary, totalAvailableKg: 0, activeBatchCount: 0 }, crops: myFarmPrototype.crops.map(crop => ({ ...crop, availableKg: 0, batchCount: 0 })) },
};
export const quintals = (kg: number) => `${(kg / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Quintals`;
export function myFarmIntentMessage(intent: MyFarmIntent): string {
  const labels = { FARM_OVERVIEW: 'Farm overview', EDIT_FARM: 'Edit farm', CROPS: 'My crops', AVAILABLE_PRODUCE: 'Available produce', ADD_CROP: 'Add crop', UPDATES: 'Farm updates', MAP: 'Farm map' };
  return 'cropName' in intent ? `${intent.type === 'BATCHES' ? 'Physical batches' : 'Crop details'} — ${intent.cropName} will be available soon.` : `${labels[intent.type]} will be available soon.`;
}
