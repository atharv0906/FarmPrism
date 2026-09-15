import type { FarmerHomeSummary, FarmerMyFarmSummary } from '../demo/demo.types';

function invalid(): never { throw new Error('The farm API returned an unexpected response. Please retry.'); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function number(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : invalid(); }
function count(value: unknown): number { const n = number(value); return Number.isInteger(n) && n >= 0 ? n : invalid(); }
function nonnegative(value: unknown): number { const n = number(value); return n >= 0 ? n : invalid(); }
function nullableText(value: unknown): string | null { return value === null ? null : text(value); }
function nullableNumber(value: unknown): number | null { return value === null ? null : nonnegative(value); }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : invalid(); }
function oneOf<T extends string>(value: unknown, values: readonly T[]): T {
  const parsed = text(value);
  return values.includes(parsed as T) ? parsed as T : invalid();
}

export function parseFarmerHome(value: unknown): FarmerHomeSummary {
  const v = object(value), farmer = object(v.farmer), farm = object(v.farm);
  const selling = object(v.sellingActivity), notifications = object(v.notifications);
  const opportunity = v.topOpportunity === null ? null : object(v.topOpportunity);
  return {
    farmer: { id: text(farmer.id), name: text(farmer.name), location: text(farmer.location) },
    farm: { cropCount: count(farm.cropCount), totalAcres: nullableNumber(farm.totalAcres),
      quantityUnit: oneOf(farm.quantityUnit, ['Quintals']), availableQuantity: nonnegative(farm.availableQuantity),
      availableQuantityKg: nonnegative(farm.availableQuantityKg) },
    topOpportunity: opportunity && {
      unit: oneOf(opportunity.unit, ['Quintal']), cropId: text(opportunity.cropId), cropName: oneOf(opportunity.cropName, ['Tomato', 'Onion', 'Potato']),
      auctionId: nullableText(opportunity.auctionId), buyerCount: count(opportunity.buyerCount),
      demandLevel: nullableText(opportunity.demandLevel), highestOfferPerQuintal: nullableNumber(opportunity.highestOfferPerQuintal),
      marketReferencePerQuintal: nullableNumber(opportunity.marketReferencePerQuintal),
      differencePerQuintal: opportunity.differencePerQuintal === null ? null : number(opportunity.differencePerQuintal),
    },
    marketPrices: array(v.marketPrices).map(item => { const p = object(item); return {
      unit: oneOf(p.unit, ['Quintal']), cropId: text(p.cropId), cropName: oneOf(p.cropName, ['Tomato', 'Onion', 'Potato']),
      pricePerQuintal: nonnegative(p.pricePerQuintal), changePercent: number(p.changePercent),
    }; }),
    sellingActivity: { currency: oneOf(selling.currency, ['INR']), newOffers: count(selling.newOffers),
      soldThisMonth: nonnegative(selling.soldThisMonth), activeAuctions: count(selling.activeAuctions) },
    notifications: { unreadCount: count(notifications.unreadCount) },
  };
}

export function parseFarmerMyFarm(value: unknown): FarmerMyFarmSummary {
  const v = object(value), farm = object(v.farm), summary = object(v.summary), activities = object(v.activities);
  return {
    farm: {
      id: text(farm.id), name: nullableText(farm.name), location: text(farm.location),
      area: nullableNumber(farm.area), areaUnit: oneOf(farm.areaUnit, ['acre']),
    },
    summary: {
      cropCount: count(summary.cropCount), totalAvailableKg: nonnegative(summary.totalAvailableKg),
      activeBatchCount: count(summary.activeBatchCount),
    },
    crops: array(v.crops).map(item => {
      const crop = object(item);
      return {
        id: text(crop.id), name: oneOf(crop.name, ['Onion', 'Tomato', 'Potato']),
        status: oneOf(crop.status, ['active', 'inactive']),
        availableKg: nonnegative(crop.availableKg), batchCount: count(crop.batchCount),
      };
    }),
    activities: { cropsAdded: count(activities.cropsAdded), updatesThisMonth: count(activities.updatesThisMonth) },
  };
}
