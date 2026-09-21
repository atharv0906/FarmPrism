import type { ImageSourcePropType } from 'react-native';
import type { FarmerHomeSummary } from '../../services/demo/demo.types';
import { dashboardAssets as a } from './dashboardAssets';

export type DashboardOpportunity = {
  cropId: string; cropName: string; image: ImageSourcePropType; demandLevel?: string;
  verifiedBuyerCount?: number; highestOffer?: number; marketReference?: number;
  differencePerUnit?: number; unit: string;
};
export type DashboardProfile = {
  fullName: string; village: string; district: string; state: string; crops: string[]; farmSize: string;
};
export type Destination = 'Notifications' | 'My Farm' | 'Sell > Buyer Offers'
  | 'Insights > Market Prices' | 'Insights > Crop Market Details' | 'Sell > My Auctions'
  | 'Offer Details' | 'Sell > Selling History' | 'Sell > Create Listing'
  | 'Orders' | 'Sell' | 'Insights' | 'Farmer Profile';
type Action = { label: string; icon: number; destination: Destination; tone: 'green' | 'orange' | 'blue' | 'purple' };
export type DashboardData = {
  fullName: string; location: string;
  farm: { crops: number; acres: string; quintals: string; quantityUnit: string; availableQuantityKg: number | null };
  notifications: { unreadCount: number };
  opportunity: DashboardOpportunity | null;
  market: { cropId: string; name: string; price: string; unit: string; trend: string; direction: string; image: number }[];
  activity: (Action & { value: string; action: string; emptyMessage?: string })[];
  quickActions: Action[];
  nav: { label: string; icon: number; destination: Destination | null }[];
};
const quickActions: Action[] = [
  { label: 'List Produce', icon: a.plus, tone: 'green', destination: 'Sell > Create Listing' },
  { label: 'Market Prices', icon: a.market, tone: 'orange', destination: 'Insights > Market Prices' },
  { label: 'Buyer Offers', icon: a.buyers, tone: 'blue', destination: 'Sell > Buyer Offers' },
  { label: 'My Orders', icon: a.orders, tone: 'purple', destination: 'Orders' },
];
const nav: DashboardData['nav'] = [
  { label: 'Home', icon: a.navHome, destination: null },
  { label: 'My Farm', icon: a.navMyFarm, destination: 'My Farm' },
  { label: 'Sell', icon: a.navSell, destination: 'Sell' },
  { label: 'Insights', icon: a.navInsights, destination: 'Insights' },
  { label: 'Profile', icon: a.navProfile, destination: 'Farmer Profile' },
];
const currency = (value: number, code = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
function cropImage(name: string): number {
  const images: Record<string, number> = { onion: a.onion, potato: a.potato, tomato: a.tomato };
  return images[name.toLowerCase()] ?? a.farm;
}
function activity(auctions: number, offers: number, sales: number, code = 'INR'): DashboardData['activity'] {
  return [
    { value: auctions ? String(auctions) : '—', emptyMessage: auctions ? undefined : 'No auctions yet', label: 'Active Auctions', action: 'View Auctions', icon: a.listing, tone: 'green', destination: 'Sell > My Auctions' },
    { value: offers ? String(offers) : '—', emptyMessage: offers ? undefined : 'No offers yet', label: 'New Offer', action: 'Review Now', icon: a.offer, tone: 'orange', destination: 'Offer Details' },
    { value: sales ? currency(sales, code) : '—', emptyMessage: sales ? undefined : 'No sales yet', label: 'Sold This Month', action: 'View History', icon: a.rupee, tone: 'blue', destination: 'Sell > Selling History' },
  ];
}
export function mapFarmerHome(summary: FarmerHomeSummary): DashboardData {
  const item = summary.topOpportunity;
  return {
    fullName: summary.farmer.name, location: summary.farmer.location,
    farm: { crops: summary.farm.cropCount, acres: summary.farm.totalAcres == null ? '—' : String(summary.farm.totalAcres),
      quintals: String(summary.farm.availableQuantity), quantityUnit: summary.farm.quantityUnit,
      availableQuantityKg: summary.farm.availableQuantityKg },
    notifications: summary.notifications,
    opportunity: item && { cropId: item.cropId, cropName: item.cropName, image: cropImage(item.cropName),
      demandLevel: item.demandLevel ?? undefined, verifiedBuyerCount: item.buyerCount,
      highestOffer: item.highestOfferPerQuintal ?? undefined, marketReference: item.marketReferencePerQuintal ?? undefined,
      differencePerUnit: item.differencePerQuintal ?? undefined, unit: item.unit },
    market: summary.marketPrices.map(p => ({ cropId: p.cropId, name: p.cropName,
      price: currency(p.pricePerQuintal, summary.sellingActivity.currency), unit: p.unit,
      trend: `${p.changePercent > 0 ? '+' : ''}${p.changePercent}%`, direction: p.changePercent > 0 ? '↗' : p.changePercent < 0 ? '↘' : '→', image: cropImage(p.cropName) })),
    activity: activity(summary.sellingActivity.activeAuctions, summary.sellingActivity.newOffers,
      summary.sellingActivity.soldThisMonth, summary.sellingActivity.currency), quickActions, nav,
  };
}
// One non-demo preview fallback: draft identity/land only, with no fabricated offers, sales or prices.
export function createDashboardFallback(draft: DashboardProfile): DashboardData {
  return { fullName: draft.fullName.trim() || 'Farmer',
    location: [draft.village, draft.district, draft.state].filter(Boolean).join(', ') || 'Your farm location',
    farm: { crops: draft.crops.length, acres: draft.farmSize.trim() || '—', quintals: '—', quantityUnit: 'Quintals', availableQuantityKg: null },
    notifications: { unreadCount: 0 }, opportunity: null, market: [], activity: activity(0, 0, 0), quickActions, nav };
}
