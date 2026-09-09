import { createHash, randomBytes } from 'node:crypto';

import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { DemoAccountRecord, DemoRole, DemoSessionAccount, DemoSessionRow } from '../types/domain.js';
import { normalizePhone } from '../utils/validation.js';
import { expireMarketplace } from './mutation.repository.js';

type Row = Record<string, unknown>;

function asString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  return typeof value === 'string' ? value : String(value);
}

function asNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function mapAccountRow(row: Row): DemoAccountRecord {
  const role = asString(row.role_code) ?? asString(row.role) ?? 'farmer';
  return {
    id: String(row.id ?? ''),
    loginLabel: asString(row.login_label) ?? asString(row.loginLabel) ?? '',
    phone: asString(row.phone) ?? '',
    role: (role === 'farmer' || role === 'buyer' || role === 'logistics' ? role : 'farmer') as DemoRole,
    fullName: asString(row.full_name) ?? asString(row.fullName) ?? '',
    isEnabled: asBoolean(row.is_enabled ?? row.isEnabled ?? true),
    verification: asString(row.verification_status) ?? asString(row.verificationStatus) ?? null,
    farmLocation: asString(row.location_label) ?? asString(row.locationLabel) ?? null,
    farmArea: asNumber(row.farm_area_acres) ?? asNumber(row.farmAreaAcres) ?? null,
    businessType: asString(row.buyer_type) ?? asString(row.businessType) ?? null,
    businessName: asString(row.business_name) ?? asString(row.businessName) ?? null,
    deliveryLocation: asString(row.delivery_label) ?? asString(row.deliveryLocation) ?? null,
    vehicle: asString(row.vehicle_type) ?? asString(row.vehicleType) ?? null,
    capacity: asNumber(row.capacity_kg) ?? asNumber(row.capacityKg) ?? null,
    currentLocation: asString(row.current_location_label) ?? asString(row.currentLocationLabel) ?? asString(row.currentLocation) ?? null,
    trustScore: asNumber(row.trust_score) ?? asNumber(row.trustScore) ?? null,
    completedTransactions: asNumber(row.completed_transactions) ?? asNumber(row.completedTransactions) ?? null,
    qualityConsistency: asNumber(row.quality_consistency_score) ?? asNumber(row.qualityConsistencyScore) ?? null,
    paymentReliability: asNumber(row.payment_reliability_score) ?? asNumber(row.paymentReliabilityScore) ?? null,
    deliveryReliability: asNumber(row.delivery_reliability_score) ?? asNumber(row.deliveryReliabilityScore) ?? null,
  };
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function getDemoAccountByPhone(phone: string): Promise<DemoAccountRecord | null> {
  const normalized = normalizePhone(phone);
  const { data, error } = await supabaseAdmin
    .from('demo_accounts')
    .select('*')
    .eq('phone', normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapAccountRow(data as Row);
}

export async function getDemoAccountById(accountId: string): Promise<DemoAccountRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('demo_accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapAccountRow(data as Row);
}

export async function getDemoAccountByLoginLabel(loginLabel: string): Promise<DemoAccountRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('demo_accounts')
    .select('*')
    .eq('login_label', loginLabel)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapAccountRow(data as Row);
}

export async function createDemoSession(accountId: string, rawToken: string): Promise<DemoSessionRow> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('demo_sessions')
    .insert({
      account_id: accountId,
      token_hash: hashToken(rawToken),
      expires_at: expiresAt,
      revoked_at: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Failed to create demo session.');
  }

  return {
    id: String((data as Row).id ?? ''),
    accountId: String((data as Row).account_id ?? accountId),
    tokenHash: asString((data as Row).token_hash) ?? hashToken(rawToken),
    expiresAt: asString((data as Row).expires_at) ?? expiresAt,
    revokedAt: asString((data as Row).revoked_at) ?? null,
    lastSeenAt: asString((data as Row).last_seen_at) ?? null,
    createdAt: asString((data as Row).created_at) ?? new Date().toISOString(),
  };
}

export async function findActiveSessionByToken(rawToken: string): Promise<DemoSessionRow | null> {
  const tokenHash = hashToken(rawToken);
  const { data, error } = await supabaseAdmin
    .from('demo_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const session: DemoSessionRow = {
    id: String((data as Row).id ?? ''),
    accountId: String((data as Row).account_id ?? ''),
    tokenHash: asString((data as Row).token_hash) ?? tokenHash,
    expiresAt: asString((data as Row).expires_at) ?? new Date().toISOString(),
    revokedAt: asString((data as Row).revoked_at) ?? null,
    lastSeenAt: asString((data as Row).last_seen_at) ?? null,
    createdAt: asString((data as Row).created_at) ?? new Date().toISOString(),
  };

  if (session.revokedAt) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function updateSessionLastSeen(tokenHash: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('demo_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  if (error) {
    throw new Error(error.message);
  }
}

export async function revokeSessionByToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const { error } = await supabaseAdmin
    .from('demo_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .eq('revoked_at', null);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function getRoleProfile(accountId: string, role: DemoRole): Promise<Row | null> {
  const tableMap: Record<DemoRole, string> = {
    farmer: 'demo_farmer_profiles',
    buyer: 'demo_buyer_profiles',
    logistics: 'demo_logistics_profiles',
  };

  const { data, error } = await supabaseAdmin
    .from(tableMap[role])
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Row | null;
}

export async function getTrustProfile(accountId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin
    .from('demo_trust_scores')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Row | null;
}

export async function getMarketCategoryId(cropName: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', cropName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return asString((data as Row).id) ?? null;
}

export async function getMarketHistory(cropName: string, days: number): Promise<Row[]> {
  const categoryId = await getMarketCategoryId(cropName);
  if (!categoryId) {
    return [];
  }

  const cutoff = new Date(Date.now() - ((days ?? 30) * 24 * 60 * 60 * 1000)).toISOString();
  const { data, error } = await supabaseAdmin
    .from('mandi_prices')
    .select('*')
    .eq('category_id', categoryId)
    .gte('observed_at', cutoff)
    .order('observed_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Row[];
}

export async function getMarketCurrent(cropName: string): Promise<Row | null> {
  const categoryId = await getMarketCategoryId(cropName);
  if (!categoryId) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('mandi_prices')
    .select('*')
    .eq('category_id', categoryId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Row | null;
}

export async function getFarmerInventory(accountId: string): Promise<Row[]> {
  const { data, error } = await supabaseAdmin
    .from('demo_inventory_batches')
    .select('*')
    .eq('farmer_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Row[];
}

export async function getFarmerMarketplace(accountId: string): Promise<{ activeAuctions: Row[]; activeFixedPriceListings: Row[]; incomingActiveBids: Row[]; incomingPendingPurchaseRequests: Row[] }> {
  await expireMarketplace();
  const batches = await getFarmerInventory(accountId);
  const batchIds = batches.map(row => String(row.id));
  if (!batchIds.length) return { activeAuctions: [], activeFixedPriceListings: [], incomingActiveBids: [], incomingPendingPurchaseRequests: [] };
  // Ownership is on the batch, not on auctions, listings, bids or requests.
  const allAuctions = await supabaseAdmin.from('demo_auctions').select('id').in('batch_id', batchIds);
  const allListings = await supabaseAdmin.from('demo_fixed_price_listings').select('id').in('batch_id', batchIds);
  if (allAuctions.error) throw new Error(allAuctions.error.message);
  if (allListings.error) throw new Error(allListings.error.message);
  const [auctions, fixed, bids, requests] = await Promise.all([
    supabaseAdmin.from('demo_auctions').select('*').in('batch_id', batchIds).in('status', ['open', 'partially_sold']).order('created_at', { ascending: false }),
    supabaseAdmin.from('demo_fixed_price_listings').select('*').in('batch_id', batchIds).in('status', ['active', 'partially_sold']).order('created_at', { ascending: false }),
    allAuctions.data.length ? supabaseAdmin.from('demo_bids').select('*').in('auction_id', allAuctions.data.map(row => row.id)).in('status', ['active', 'partially_accepted']).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    allListings.data.length ? supabaseAdmin.from('demo_purchase_requests').select('*').in('listing_id', allListings.data.map(row => row.id)).in('status', ['pending', 'partially_accepted']).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);

  if (auctions.error) throw new Error(auctions.error.message);
  if (fixed.error) throw new Error(fixed.error.message);
  if (bids.error) throw new Error(bids.error.message);
  if (requests.error) throw new Error(requests.error.message);

  return {
    activeAuctions: (auctions.data ?? []) as Row[],
    activeFixedPriceListings: (fixed.data ?? []) as Row[],
    incomingActiveBids: (bids.data ?? []) as Row[],
    incomingPendingPurchaseRequests: (requests.data ?? []) as Row[],
  };
}

export async function getBuyerMarketplace(): Promise<{ openAuctions: Row[]; activeFixedPriceListings: Row[] }> {
  await expireMarketplace();
  const [auctions, fixed] = await Promise.all([
    supabaseAdmin.from('demo_auctions').select('*').eq('status', 'open').order('ends_at', { ascending: true }),
    supabaseAdmin.from('demo_fixed_price_listings').select('*').in('status', ['active', 'partially_sold']).gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: true }),
  ]);

  if (auctions.error) throw new Error(auctions.error.message);
  if (fixed.error) throw new Error(fixed.error.message);

  return {
    openAuctions: (auctions.data ?? []) as Row[],
    activeFixedPriceListings: (fixed.data ?? []) as Row[],
  };
}

export async function getBuyerActivity(accountId: string): Promise<{ activeCurrentBids: Row[]; bidHistory: Row[]; purchaseRequests: Row[]; orders: Row[] }> {
  const [bids, requests, orders] = await Promise.all([
    supabaseAdmin.from('demo_bids').select('*').eq('buyer_account_id', accountId).order('created_at', { ascending: false }),
    supabaseAdmin.from('demo_purchase_requests').select('*').eq('buyer_account_id', accountId).order('created_at', { ascending: false }),
    supabaseAdmin.from('demo_orders').select('*').eq('buyer_account_id', accountId).order('created_at', { ascending: false }),
  ]);

  if (bids.error) throw new Error(bids.error.message);
  if (requests.error) throw new Error(requests.error.message);
  if (orders.error) throw new Error(orders.error.message);

  return {
    activeCurrentBids: (bids.data ?? []).filter(row => ['active', 'partially_accepted'].includes(String(row.status))) as Row[],
    bidHistory: (bids.data ?? []) as Row[],
    purchaseRequests: (requests.data ?? []) as Row[],
    orders: (orders.data ?? []) as Row[],
  };
}

export async function getAvailableLogisticsJobs(accountId: string): Promise<Row[]> {
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('demo_logistics_profiles')
    .select('capacity_kg')
    .eq('account_id', accountId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profileData) return [];

  const capacityKg = asNumber((profileData as Row).capacity_kg) ?? 0;

  const { data, error } = await supabaseAdmin
    .from('demo_logistics_jobs')
    .select('*,demo_orders!inner(allocated_quantity_kg)')
    .eq('status', 'available');

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Row[];
  return rows.filter((row) => {
    const quantity = asNumber((row.demo_orders as Row).allocated_quantity_kg);
    if (quantity === null) return false;
    return quantity <= capacityKg;
  });
}

export async function getLogisticsActivity(accountId: string): Promise<{ assignedActiveJobs: Row[]; completedHistoryJobs: Row[] }> {
  const { data, error } = await supabaseAdmin
    .from('demo_logistics_jobs')
    .select('*')
    .eq('logistics_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Row[];
  return {
    assignedActiveJobs: rows.filter((row) => ['claimed', 'fee_proposed', 'fee_rejected', 'fee_accepted', 'advance_paid', 'pickup_confirmed', 'in_transit'].includes(String(row.status ?? ''))),
    completedHistoryJobs: rows.filter((row) => ['completed', 'delivered', 'cancelled'].includes(String(row.status ?? ''))),
  };
}

export async function getOrdersForAccount(accountId: string, role: DemoRole): Promise<Row[]> {
  let query = supabaseAdmin.from('demo_orders').select('*');

  if (role === 'farmer') {
    query = query.eq('farmer_account_id', accountId);
  } else if (role === 'buyer') {
    query = query.eq('buyer_account_id', accountId);
  } else {
    const jobs = await supabaseAdmin.from('demo_logistics_jobs').select('order_id').eq('logistics_account_id', accountId);
    if (jobs.error) throw new Error(jobs.error.message);
    if (!jobs.data.length) return [];
    query = query.in('id', jobs.data.map(row => row.order_id));
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export async function getOrderById(orderId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin
    .from('demo_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Row | null;
}

export async function getOrderEvents(orderId: string): Promise<Row[]> {
  const { data, error } = await supabaseAdmin
    .from('demo_order_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Row[];
}

export async function getPaymentsForOrder(orderId: string): Promise<Row[]> {
  const { data, error } = await supabaseAdmin
    .from('demo_payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Row[];
}

export async function getLogisticsJobForOrder(orderId: string): Promise<Row | null> {
  const { data, error } = await supabaseAdmin
    .from('demo_logistics_jobs')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Row | null;
}
