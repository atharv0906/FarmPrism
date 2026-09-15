import type { FarmBatch } from './farmerSummary.types';
export const validProduceQuantity = (text: string) => /^\d+(\.\d{1,2})?$/.test(text.trim()) && Number(text) > 0 && Number(text) <= 1_000_000;
export const currentFarmBatch = (b: FarmBatch) => b.remainingQuantityKg > 0 && !['sold', 'completed', 'cancelled'].includes(b.status);
export function farmMapsUrl(farm: { latitude: number | null; longitude: number | null }): string | null {
  const { latitude, longitude } = farm;
  return latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}` : null;
}
