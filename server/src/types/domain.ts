export type DemoRole = 'farmer' | 'buyer' | 'logistics';

export type DemoAccountRecord = {
  id: string;
  loginLabel: string;
  phone: string;
  role: DemoRole;
  fullName: string;
  isEnabled: boolean;
  verification?: string | null;
  farmLocation?: string | null;
  farmArea?: number | null;
  businessType?: string | null;
  businessName?: string | null;
  deliveryLocation?: string | null;
  vehicle?: string | null;
  capacity?: number | null;
  currentLocation?: string | null;
  trustScore?: number | null;
  completedTransactions?: number | null;
  qualityConsistency?: number | null;
  paymentReliability?: number | null;
  deliveryReliability?: number | null;
};

export type DemoSessionRow = {
  id: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

export type DemoSessionAccount = {
  loginLabel: string;
  phone: string;
  role: DemoRole;
  fullName: string;
  verification?: string | null;
  farmLocation?: string | null;
  farmArea?: number | null;
  businessType?: string | null;
  businessName?: string | null;
  deliveryLocation?: string | null;
  vehicle?: string | null;
  capacity?: number | null;
  currentLocation?: string | null;
  trustScore?: number | null;
  completedTransactions?: number | null;
  qualityConsistency?: number | null;
  paymentReliability?: number | null;
  deliveryReliability?: number | null;
};

export type PublicProfile = {
  loginLabel: string;
  name: string;
  role: DemoRole;
  verification?: string | null;
  trustScore?: number | null;
  completedTransactions?: number | null;
  qualityConsistency?: number | null;
  paymentReliability?: number | null;
  deliveryReliability?: number | null;
  businessType?: string | null;
  businessName?: string | null;
  vehicle?: string | null;
};

export type MarketPricePoint = {
  observedAt: string;
  pricePerKg: number;
  minPricePerKg: number;
  maxPricePerKg: number;
  modalPricePerKg: number;
  source: string;
  isDemo: boolean;
  mandi: string;
  district: string;
  state: string;
};

export type InventoryBatch = {
  batchCode: string;
  cropName: string;
  originalQuantityKg: number;
  remainingQuantityKg: number;
  qualityGrade: string;
  qualitySource: string;
  status: string;
};

export type AuctionSummary = {
  id: string;
  crop: string;
  quantityKg: number;
  reservePricePerKg: number;
  status: string;
  farmer: { loginLabel: string; name: string; trustScore?: number | null };
};

export type FixedListingSummary = {
  id: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  farmer: { loginLabel: string; name: string; trustScore?: number | null };
};

export type BidSummary = {
  id: string;
  crop: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
};

export type PurchaseRequestSummary = {
  id: string;
  crop: string;
  quantityKg: number;
  requestedAdvancePercent: number;
  status: string;
};

export type OrderSummary = {
  id: string;
  sourceType: 'auction' | 'fixed-price';
  crop: string;
  quantityKg: number;
  unitPrice: number;
  farmerAdvancePercent: number;
  paymentState: string;
  logisticsStatus: string;
  timeline: Array<{ label: string; status: string; at: string }>;
  farmer: { loginLabel: string; name: string };
  buyer: { loginLabel: string; name: string };
};

export type LogisticsJobSummary = {
  id: string;
  status: 'available' | 'assigned' | 'completed';
  crop: string;
  quantityKg: number;
  pickupSummary: string;
  deliverySummary: string;
  orderCode: string;
  distanceKm?: number | null;
};

export type TrustScore = {
  score: number;
  label: string;
  completedTransactions: number;
  reliability: number;
};

export type ApiEnvelope<T> = {
  data: T;
};

export type ApiErrorEnvelope = {
  error: { code: string; message: string };
};

export type DemoSessionRequest = {
  phone: string;
  otp: string;
};
