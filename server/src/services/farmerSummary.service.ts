import type { Crop, MarketHistory, MarketPoint } from '../types/market.js';

export type FarmerSummaryData = {
  account: { id: string; name: string };
  profile: { location: string; area: number | null };
  batches: { id: string; crop: Crop; remainingKg: number; status: string; createdAt: string; updatedAt: string }[];
  auctions: { id: string; batchId: string; remainingKg: number; startsAt: string; endsAt: string; status: string }[];
  bids: { id: string; auctionId: string; buyerId: string; quantityKg: number; pricePerKg: number; status: string }[];
  orders: { bidId: string | null; quantityKg: number; total: number; status: string; completedAt: string | null }[];
  notifications: { type: string; readAt: string | null }[];
};
export type FarmerSummaryRepository = { read(accountId: string): Promise<FarmerSummaryData> };
type Market = { history(crop: string, days: 30 | 60 | 90, district?: string): Promise<MarketHistory> };
const crops = ['Tomato', 'Onion', 'Potato'] as const;
const eligible = (batch: FarmerSummaryData['batches'][number]) => batch.status === 'available' && batch.remainingKg > 0;
const round = (value: number) => Math.round(value * 100) / 100;
const month = (date: string | Date) => {
  const d = new Date(date);
  return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(d) : null;
};
function inventory(data: FarmerSummaryData, now: Date) {
  const represented = crops.filter(crop => data.batches.some(b => b.crop === crop));
  const current = data.batches.filter(eligible);
  return {
    farm: { id: data.account.id, name: null, location: data.profile.location, area: data.profile.area, areaUnit: 'acre' as const },
    summary: { cropCount: represented.length, totalAvailableKg: current.reduce((sum, b) => sum + b.remainingKg, 0), activeBatchCount: current.length },
    crops: represented.map(crop => {
      const batches = current.filter(b => b.crop === crop);
      return { id: crop.toLowerCase(), name: crop, status: batches.length ? 'active' as const : 'inactive' as const,
        availableKg: batches.reduce((sum, b) => sum + b.remainingKg, 0), batchCount: batches.length };
    }),
    // Count distinct physical batches created OR updated this month, not edit events.
    activities: { cropsAdded: represented.length, updatesThisMonth: data.batches.filter(b =>
      [b.createdAt, b.updatedAt].some(at => month(at) === month(now) && Date.parse(at) <= now.getTime())).length },
  };
}
function validPoint(p: MarketPoint) { return Number.isFinite(p.modalPricePerKg) && p.modalPricePerKg > 0 && Number.isFinite(Date.parse(p.observedAt)); }
export function marketTrend(points: MarketPoint[], latest: MarketPoint): number {
  const previous = points.filter(p => validPoint(p) && p.mandi === latest.mandi && p.state === latest.state && p.district === latest.district &&
    p.observedAt.slice(0, 10) < latest.observedAt.slice(0, 10)).sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];
  return previous ? round((latest.modalPricePerKg / previous.modalPricePerKg - 1) * 100) : 0;
}
export function createFarmerSummaryService(repository: FarmerSummaryRepository, market: Market, clock: () => Date = () => new Date()) {
  return {
    async myFarm(accountId: string) { return inventory(await repository.read(accountId), clock()); },
    async home(accountId: string) {
      const data = await repository.read(accountId), now = clock(), farm = inventory(data, now);
      const district = data.profile.location.split(',').map(p => p.trim()).find(p => /^(Pune|Nashik|Nagpur|Satara|Solapur|Ahmednagar)$/i.test(p));
      const histories = await Promise.all(crops.map(async crop => {
        try { return await market.history(crop, 30, district); } catch { return null; }
      }));
      const marketPrices = histories.flatMap((history, i) => {
        const points = history?.points.filter(p => p.crop === crops[i] && validPoint(p)) ?? [];
        const latest = [...points].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt)).at(-1);
        return latest ? [{ unit: 'Quintal', cropId: crops[i].toLowerCase(), cropName: crops[i],
          pricePerQuintal: round(latest.modalPricePerKg * 100), changePercent: marketTrend(points, latest) }] : [];
      });
      const auctions = data.auctions.filter(a => ['open', 'partially_sold'].includes(a.status) && a.remainingKg > 0 &&
        Date.parse(a.startsAt) <= now.getTime() && Date.parse(a.endsAt) > now.getTime() && data.batches.some(b => b.id === a.batchId && eligible(b)));
      const bids = data.bids.filter(b => ['active', 'partially_accepted'].includes(b.status) && auctions.some(a => a.id === b.auctionId) &&
        b.quantityKg > data.orders.filter(o => o.bidId === b.id && o.status !== 'cancelled').reduce((sum, o) => sum + o.quantityKg, 0));
      const highest = [...bids].sort((a, b) => b.pricePerKg - a.pricePerKg || a.id.localeCompare(b.id))[0];
      const auction = highest && auctions.find(a => a.id === highest.auctionId)!;
      const batch = auction && data.batches.find(b => b.id === auction.batchId)!;
      const reference = batch && marketPrices.find(p => p.cropName === batch.crop)?.pricePerQuintal;
      const offer = highest ? round(highest.pricePerKg * 100) : null;
      return {
        farmer: { id: data.account.id, name: data.account.name, location: data.profile.location },
        farm: { cropCount: farm.summary.cropCount, totalAcres: data.profile.area, quantityUnit: 'Quintals',
          availableQuantity: farm.summary.totalAvailableKg / 100, availableQuantityKg: farm.summary.totalAvailableKg },
        topOpportunity: highest && batch ? { unit: 'Quintal', cropId: batch.crop.toLowerCase(), cropName: batch.crop, auctionId: highest.auctionId,
          buyerCount: new Set(bids.filter(b => b.auctionId === highest.auctionId).map(b => b.buyerId)).size, demandLevel: null,
          highestOfferPerQuintal: offer, marketReferencePerQuintal: reference ?? null, differencePerQuintal: reference == null ? null : round(offer! - reference) } : null,
        marketPrices,
        sellingActivity: { currency: 'INR', activeAuctions: auctions.length,
          newOffers: data.notifications.filter(n => n.readAt === null && ['new_bid', 'bid_revised'].includes(n.type)).length,
          soldThisMonth: round(data.orders.filter(o => o.status === 'completed' && o.completedAt !== null && month(o.completedAt) === month(now) && Date.parse(o.completedAt) <= now.getTime()).reduce((sum, o) => sum + o.total, 0)) },
        notifications: { unreadCount: data.notifications.filter(n => n.readAt === null).length },
      };
    },
  };
}
