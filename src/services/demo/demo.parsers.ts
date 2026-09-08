import type { DemoAccount, DemoNotification, FarmerHomeSummary, FarmerMyFarmSummary } from './demo.types';

function invalid(): never { throw new Error('The demo service returned an unexpected response. Please retry.'); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function number(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : invalid(); }
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
function nullableNumber(value: unknown): number | null { return value == null ? null : number(value); }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : invalid(); }
function oneOf<T extends string>(value: unknown, values: readonly T[]): T {
  const parsed = text(value);
  return values.includes(parsed as T) ? parsed as T : invalid();
}

export function parseDemoAccount(value: unknown): DemoAccount | null {
  if (value === null) return null;
  const v = object(value);
  if (v.isDemo !== true || !['farmer', 'buyer', 'logistics'].includes(text(v.role))) return invalid();
  return { role: v.role as DemoAccount['role'], phone: text(v.phone), isDemo: true,
    userId: nullableText(v.userId), fullName: text(v.fullName), loginLabel: text(v.loginLabel) };
}

export function parseFarmerHome(value: unknown): FarmerHomeSummary {
  const v = object(value), farmer = object(v.farmer), farm = object(v.farm);
  const selling = object(v.sellingActivity), notifications = object(v.notifications);
  const opportunity = v.topOpportunity == null ? null : object(v.topOpportunity);
  return {
    farmer: { id: text(farmer.id), name: text(farmer.name), location: text(farmer.location) },
    farm: { cropCount: number(farm.cropCount), totalAcres: nullableNumber(farm.totalAcres),
      quantityUnit: text(farm.quantityUnit), availableQuantity: number(farm.availableQuantity),
      availableQuantityKg: number(farm.availableQuantityKg) },
    topOpportunity: opportunity && {
      unit: text(opportunity.unit), cropId: text(opportunity.cropId), cropName: text(opportunity.cropName),
      auctionId: nullableText(opportunity.auctionId), buyerCount: number(opportunity.buyerCount),
      demandLevel: nullableText(opportunity.demandLevel), highestOfferPerQuintal: nullableNumber(opportunity.highestOfferPerQuintal),
      marketReferencePerQuintal: nullableNumber(opportunity.marketReferencePerQuintal),
      differencePerQuintal: nullableNumber(opportunity.differencePerQuintal),
    },
    marketPrices: array(v.marketPrices).map(item => { const p = object(item); return {
      unit: text(p.unit), cropId: text(p.cropId), cropName: text(p.cropName),
      pricePerQuintal: number(p.pricePerQuintal), changePercent: number(p.changePercent),
    }; }),
    sellingActivity: { currency: text(selling.currency), newOffers: number(selling.newOffers),
      soldThisMonth: number(selling.soldThisMonth), activeAuctions: number(selling.activeAuctions) },
    notifications: { unreadCount: number(notifications.unreadCount) },
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
      cropCount: number(summary.cropCount), totalAvailableKg: number(summary.totalAvailableKg),
      activeBatchCount: number(summary.activeBatchCount),
    },
    crops: array(v.crops).map(item => {
      const crop = object(item);
      return {
        id: text(crop.id), name: oneOf(crop.name, ['Onion', 'Tomato', 'Potato']),
        status: oneOf(crop.status, ['active', 'inactive']),
        availableKg: number(crop.availableKg), batchCount: number(crop.batchCount),
      };
    }),
    activities: { cropsAdded: number(activities.cropsAdded), updatesThisMonth: number(activities.updatesThisMonth) },
  };
}

export function parseNotifications(value: unknown): DemoNotification[] {
  return array(value).map(item => {
    const n = object(item), data = n.data == null ? {} : object(n.data);
    return { id: text(n.id), title: text(n.title), body: text(n.body), type: text(n.type),
      readAt: nullableText(n.readAt), createdAt: text(n.createdAt), entityKey: nullableText(n.entityKey),
      entityType: nullableText(n.entityType), data: typeof data.crop === 'string' ? { crop: data.crop } : {} };
  });
}
