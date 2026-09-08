import type { ApplicationRole } from '../../types/role';

export type DemoAccount = {
  role: ApplicationRole;
  phone: string;
  isDemo: true;
  userId: string | null;
  fullName: string;
  loginLabel: string;
};

export type FarmerHomeSummary = {
  farmer: { id: string; name: string; location: string };
  farm: {
    cropCount: number;
    totalAcres: number | null;
    quantityUnit: string;
    availableQuantity: number;
    availableQuantityKg: number;
  };
  topOpportunity: {
    unit: string;
    cropId: string;
    cropName: string;
    auctionId: string | null;
    buyerCount: number;
    demandLevel: string | null;
    highestOfferPerQuintal: number | null;
    marketReferencePerQuintal: number | null;
    differencePerQuintal: number | null;
  } | null;
  marketPrices: {
    unit: string; cropId: string; cropName: string;
    pricePerQuintal: number; changePercent: number;
  }[];
  sellingActivity: {
    currency: string; newOffers: number; soldThisMonth: number; activeAuctions: number;
  };
  notifications: { unreadCount: number };
};

export type FarmerMyFarmSummary = {
  farm: {
    id: string;
    name: string | null;
    location: string;
    area: number | null;
    areaUnit: 'acre';
  };
  summary: {
    cropCount: number;
    totalAvailableKg: number;
    activeBatchCount: number;
  };
  crops: Array<{
    id: string;
    name: 'Onion' | 'Tomato' | 'Potato';
    status: 'active' | 'inactive';
    availableKg: number;
    batchCount: number;
  }>;
  activities: {
    cropsAdded: number;
    updatesThisMonth: number;
  };
};

export type DemoNotification = {
  id: string; title: string; body: string; type: string;
  readAt: string | null; createdAt: string;
  entityKey: string | null; entityType: string | null;
  data: { crop?: string };
};
