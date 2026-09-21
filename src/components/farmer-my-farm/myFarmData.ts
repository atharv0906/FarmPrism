import type { ImageSourcePropType } from 'react-native';
import { dashboardAssets as a } from '../farmer-dashboard/dashboardAssets';
import type { FarmerMyFarmSummary } from '../../services/demo/demo.types';

export type FarmerMyFarmData = {
  farm: FarmerMyFarmSummary['farm'];
  batches: FarmerMyFarmSummary['batches'];
  activityEvents: FarmerMyFarmSummary['activityEvents'];
  summary: { cropCount: number; totalAvailableKg: number; activeBatchCount: number };
  crops: Array<{ id: string; name: 'Onion' | 'Tomato' | 'Potato'; image: ImageSourcePropType; availableKg: number; batchCount: number; status: 'active' | 'inactive' }>;
  activities: { cropsAdded: number; updatesThisMonth: number };
};
export function mapFarmerMyFarm(summary: FarmerMyFarmSummary): FarmerMyFarmData {
  const images = { Tomato: a.tomato, Onion: a.onion, Potato: a.potato };
  return {
    farm: summary.farm,
    batches: summary.batches,
    activityEvents: summary.activityEvents,
    summary: summary.summary,
    crops: summary.crops.map(crop => ({ ...crop, image: images[crop.name] })),
    activities: summary.activities,
  };
}
export type MyFarmIntent =
  | { type: 'FARM_OVERVIEW' | 'EDIT_FARM' | 'CROPS' | 'AVAILABLE_PRODUCE' | 'ADD_CROP' | 'UPDATES' | 'MAP' }
  | { type: 'CROP_DETAILS' | 'BATCHES'; cropId: string; cropName: string };

export const quintals = (kg: number) => `${(kg / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Quintals`;
