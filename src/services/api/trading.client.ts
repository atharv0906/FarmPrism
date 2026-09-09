import { apiClient } from './api.client';
import type { TradingWorkspace } from './trading.types';
import type { Crop, MarketHistory, MarketPoint, PriceInsight } from './market.types';

export const tradingClient = {
  async workspace() { return (await apiClient.get<{ data: TradingWorkspace }>('/api/workspace')).data; },
  async history(crop: Crop, days: 30 | 60 | 90) {
    return (await apiClient.get<{ data: MarketHistory }>(`/api/market/${crop}/history?days=${days}`)).data;
  },
  async current(crop: Crop) {
    return (await apiClient.get<{ data: MarketPoint & { retrievedAt: string; fallback: boolean } }>(`/api/market/${crop}/current`)).data;
  },
  async insight(batchId: string) { return (await apiClient.post<{ data: PriceInsight }>('/api/farmer/price-insight', { batchId })).data; },
  async markRead(id: string) { await apiClient.post('/api/notifications/' + encodeURIComponent(id) + '/read', {}); },
};
