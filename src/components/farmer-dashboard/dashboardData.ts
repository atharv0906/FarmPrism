import { dashboardAssets as a } from './dashboardAssets';

export type DashboardProfile = {
  fullName: string; village: string; district: string; state: string;
  crops: string[]; farmSize: string;
};
export type Destination = 'Notifications' | 'My Farm' | 'Sell > Buyer Opportunities'
  | 'Sell > Compare Offers' | 'Insights > Market Prices' | 'Insights > Crop Market Detail'
  | 'Sell > My Listings' | 'Sell > Offer Details' | 'Sales History'
  | 'Sell > Create Listing' | 'Orders' | 'Sell' | 'Insights' | 'Farmer Profile';
type Action = { label: string; icon: number; destination: Destination; tone: 'green' | 'orange' | 'blue' | 'purple' };
export type DashboardData = {
  fullName: string; location: string;
  farm: { crops: number; acres: string; quintals: string };
  notifications: { unreadCount: number };
  opportunity: { crop: string; buyers: string; price: string; reference: string; advantage: string };
  market: { name: string; price: string; trend: string; image: number }[];
  activity: (Action & { value: string; action: string })[];
  quickActions: Action[];
  nav: { label: string; icon: number; destination: Destination | null }[];
};

// Approved UI prototype only. These values do not represent backend records.
const prototype: Omit<DashboardData, 'fullName' | 'location' | 'farm'> = {
  notifications: { unreadCount: 0 },
  opportunity: { crop: 'Tomato', buyers: '3 verified buyers are interested', price: '₹2,550', reference: '₹2,350', advantage: '₹200 more' },
  market: [
    { name: 'Onion', price: '₹1,800', trend: '+2.5%', image: a.onion },
    { name: 'Potato', price: '₹2,200', trend: '+1.8%', image: a.potato },
    { name: 'Tomato', price: '₹2,400', trend: '+3.1%', image: a.tomato },
  ],
  activity: [
    { value: '2', label: 'Active Listings', action: 'View Listings', icon: a.listing, tone: 'green', destination: 'Sell > My Listings' },
    { value: '1', label: 'New Offer', action: 'Review Now', icon: a.offer, tone: 'orange', destination: 'Sell > Offer Details' },
    { value: '₹18,500', label: 'Sold This Month', action: 'View History', icon: a.rupee, tone: 'blue', destination: 'Sales History' },
  ],
  quickActions: [
    { label: 'List Produce', icon: a.plus, tone: 'green', destination: 'Sell > Create Listing' },
    { label: 'Check Prices', icon: a.market, tone: 'orange', destination: 'Insights > Market Prices' },
    { label: 'Find Buyers', icon: a.buyers, tone: 'blue', destination: 'Sell > Buyer Opportunities' },
    { label: 'My Orders', icon: a.orders, tone: 'purple', destination: 'Orders' },
  ],
  nav: [
    { label: 'Home', icon: a.navHome, destination: null },
    { label: 'My Farm', icon: a.navMyFarm, destination: 'My Farm' },
    { label: 'Sell', icon: a.navSell, destination: 'Sell' },
    { label: 'Insights', icon: a.navInsights, destination: 'Insights' },
    { label: 'Profile', icon: a.navProfile, destination: 'Farmer Profile' },
  ],
};

export function createDashboardData(draft: DashboardProfile): DashboardData {
  return {
    ...prototype,
    fullName: draft.fullName.trim() || 'Farmer',
    location: [draft.village, draft.district, draft.state].map(value => value.trim()).filter(Boolean).join(', ') || 'Your farm location',
    farm: { crops: draft.crops.length, acres: draft.farmSize.trim() || '—', quintals: '12' },
  };
}
