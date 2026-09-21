import { apiClient } from './api.client';
import { parseFarmerHome, parseFarmerMyFarm } from './farmerSummary.contract';

export const farmerSummaryClient = {
  async home() { return parseFarmerHome((await apiClient.get<{ data: unknown }>('/api/farmer/home-summary'))?.data); },
  async myFarm() { return parseFarmerMyFarm((await apiClient.get<{ data: unknown }>('/api/farmer/my-farm-summary'))?.data); },
};
