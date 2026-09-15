import type { Crop } from '../services/api/market.types';
export type TradingRoutes = {
  SellHome: undefined; SelectBatch: undefined; Quality: { batchId: string };
  PriceInsight: { batchId: string }; ChooseMethod: { batchId: string; suggestedPrice?: number };
  CreateListing: { batchId: string; kind: 'auction' | 'fixed'; suggestedPrice?: number };
  Item: { itemId: string }; Offers: { kind?: 'auction' | 'fixed'; itemId?: string } | undefined;
  Offer: { offerId: string }; History: undefined; Orders: undefined; Order: { orderId: string };
  Profile: { accountId?: string } | undefined; Notifications: undefined;
  Market: undefined; MarketDetails: { crop: Crop }; BuyerHome: undefined; BuyerMarket: undefined; MyBids: undefined;
  BidForm: { itemId: string }; LogisticsHome: undefined; Jobs: undefined; Active: undefined;
  Job: { jobId: string };
};
