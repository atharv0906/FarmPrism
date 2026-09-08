import type { ImageSourcePropType } from 'react-native';
import { dashboardAssets as a } from '../farmer-dashboard/dashboardAssets';

export type FarmerMyFarmData = {
  farm: { id: string; name?: string; location?: string; area?: number; areaUnit: 'acre'; soilHealth?: string; soilUpdated?: string; irrigation?: string };
  summary: { cropCount: number; totalAvailableKg: number };
  crops: Array<{ id: string; name: 'Onion' | 'Tomato' | 'Potato'; image: ImageSourcePropType; availableKg: number; batchCount: number; area?: number; status?: string; harvest?: string }>;
  activities: { updatesThisMonth: number; photoCount: number };
};
export type MyFarmIntent =
  | { type: 'FARM_OVERVIEW' | 'EDIT_FARM' | 'CROPS' | 'AVAILABLE_PRODUCE' | 'ADD_CROP' | 'UPDATES' | 'PHOTOS' | 'MAP' }
  | { type: 'CROP_DETAILS' | 'BATCHES'; cropId: string; cropName: string };

// UI-only fixture. All quantities are kilograms; replace this model at the data boundary in 1.9.1.
export const myFarmPrototype: FarmerMyFarmData = {
  farm: { id: 'prototype-farm', location: 'Wagholi, Pune, Maharashtra', area: 5, areaUnit: 'acre', soilHealth: 'Good', soilUpdated: '12 Aug 2025', irrigation: 'Drip' },
  summary: { cropCount: 2, totalAvailableKg: 2200 },
  crops: [
    { id: 'prototype-tomato', name: 'Tomato', image: a.tomato, availableKg: 1200, batchCount: 2, area: 2.5, status: 'Active', harvest: 'Nov 2025' },
    { id: 'prototype-onion', name: 'Onion', image: a.onion, availableKg: 1000, batchCount: 1, area: 2.5, status: 'Active', harvest: 'Dec 2025' },
  ],
  activities: { updatesThisMonth: 1, photoCount: 0 },
};
export const myFarmEmptyStates: Record<'noCrops' | 'noAvailableProduce', FarmerMyFarmData> = {
  noCrops: { ...myFarmPrototype, summary: { cropCount: 0, totalAvailableKg: 0 }, crops: [] },
  noAvailableProduce: { ...myFarmPrototype, summary: { ...myFarmPrototype.summary, totalAvailableKg: 0 }, crops: myFarmPrototype.crops.map(crop => ({ ...crop, availableKg: 0, batchCount: 0 })) },
};
export const quintals = (kg: number) => `${(kg / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Quintals`;
export function myFarmIntentMessage(intent: MyFarmIntent): string {
  const labels = { FARM_OVERVIEW: 'Farm overview', EDIT_FARM: 'Edit farm', CROPS: 'My crops', AVAILABLE_PRODUCE: 'Available produce', ADD_CROP: 'Add crop', UPDATES: 'Farm updates', PHOTOS: 'Farm photos', MAP: 'Farm map' };
  return 'cropName' in intent ? `${intent.type === 'BATCHES' ? 'Physical batches' : 'Crop details'} — ${intent.cropName} will be available soon.` : `${labels[intent.type]} will be available soon.`;
}
