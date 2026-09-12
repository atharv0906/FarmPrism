import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { expireMarketplace } from './mutation.repository.js';
import { ApiError } from '../utils/apiError.js';
import type { Batch, Profile, SellingItem, Offer, Order, Job, Role, TradingWorkspace } from '../types/trading.js';
type Row = Record<string, any>;
const n = (v: unknown): number => {
  if ((typeof v !== 'number' && typeof v !== 'string') || String(v).trim() === '' || !Number.isFinite(Number(v))) {
    throw new ApiError(503, 'DATA_INCOMPLETE', 'Trading data is incomplete. Please retry to load your workspace.');
  }
  return Number(v);
};
const nullableNumber = (v: unknown): number | null => v == null ? null : n(v);

// Prototype read aggregation only. Every returned private row is scoped to the actor.
async function rows(table: string): Promise<Row[]> {
  const result = await supabaseAdmin.from(table).select('*').limit(1000);
  if (result.error) throw new ApiError(503, 'DATA_UNAVAILABLE', 'Unable to load trading data.');
  if (result.data.length === 1000) throw new ApiError(503, 'DATA_LIMIT', 'Trading data needs pagination before it can be displayed safely.');
  return result.data;
}
export async function tradingWorkspace(accountId: string, role: Role): Promise<TradingWorkspace> {
  await expireMarketplace();
  const [batchRows, auctions, listings, bids, requests, orderRows, jobRows, accounts, trusts, farmers, buyers, logistics] = await Promise.all(
    ['demo_inventory_batches', 'demo_auctions', 'demo_fixed_price_listings', 'demo_bids', 'demo_purchase_requests', 'demo_orders', 'demo_logistics_jobs',
      'demo_accounts', 'demo_trust_scores', 'demo_farmer_profiles', 'demo_buyer_profiles', 'demo_logistics_profiles'].map(rows));
  const profiles: Profile[] = accounts.map(a => {
    const trust = trusts.find(t => t.account_id === a.id);
    const profile = [...farmers, ...buyers, ...logistics].find(p => p.account_id === a.id);
    return { id: a.id, loginLabel: a.login_label, name: a.role_code === 'buyer' ? profile?.business_name ?? a.full_name : a.full_name, role: a.role_code,
      trustScore: nullableNumber(trust?.score), completedTransactions: nullableNumber(trust?.completed_transactions),
      qualityConsistency: nullableNumber(trust?.quality_consistency_score), paymentReliability: nullableNumber(trust?.payment_reliability_score),
      deliveryReliability: nullableNumber(trust?.delivery_reliability_score), verification: profile?.verification_status ?? null,
      location: profile?.location_label ?? null, area: nullableNumber(profile?.farm_area_acres), farmerCode: profile?.farmer_code ?? null,
      vehicle: profile?.vehicle_type ?? null, capacity: nullableNumber(profile?.capacity_kg) };
  });
  const me = profiles.find(p => p.id === accountId);
  if (!me) throw new ApiError(401, 'invalid_session', 'Session account no longer exists.');
  const batches: Batch[] = batchRows.map(b => ({ id: b.id, farmerId: b.farmer_account_id, code: b.batch_code, crop: b.crop_name,
    quantityKg: n(b.remaining_quantity_kg), grade: b.quality_grade, qualityNotes: b.quality_notes ?? b.qualityNotes ?? null, status: b.status }));
  const batch = (id: string) => {
    const result = batches.find(b => b.id === id);
    if (!result) throw new ApiError(503, 'DATA_UNAVAILABLE', 'Batch data is unavailable.');
    return result;
  };
  const allItems: SellingItem[] = [
    ...auctions.map(a => ({ id: a.id, kind: 'auction' as const, batch: batch(a.batch_id), offeredKg: n(a.offered_quantity_kg), remainingKg: n(a.remaining_quantity_kg),
      pricePerKg: n(a.reserve_price_per_kg), startsAt: a.starts_at, endsAt: a.ends_at, status: a.status })),
    ...listings.map(a => ({ id: a.id, kind: 'fixed' as const, batch: batch(a.batch_id), offeredKg: n(a.offered_quantity_kg), remainingKg: n(a.remaining_quantity_kg),
      pricePerKg: n(a.fixed_price_per_kg), startsAt: a.starts_at, endsAt: a.expires_at, status: a.status })),
  ];
  const jobs: Omit<Job, 'crop' | 'quantityKg' | 'orderCode'>[] = jobRows.map(j => ({ id: j.id, orderId: j.order_id, logisticsId: j.logistics_account_id, status: j.status,
    fee: nullableNumber(j.proposed_fee), feeStatus: j.fee_status, pickup: j.pickup_label ?? null, delivery: j.delivery_label ?? null }));
  const visibleOrderRows = orderRows.filter(o => o.farmer_account_id === accountId || o.buyer_account_id === accountId ||
    jobs.some(j => j.orderId === o.id && (j.logisticsId === accountId || (role === 'logistics' && j.status === 'available' && me.verification === 'verified' && me.capacity !== null && n(o.allocated_quantity_kg) <= me.capacity))))
  const orders: Order[] = visibleOrderRows.filter(o => o.farmer_account_id === accountId || o.buyer_account_id === accountId || jobs.some(j => j.orderId === o.id && j.logisticsId === accountId))
    .map(o => ({ id: o.id, code: o.order_code, kind: o.source_type === 'auction' ? 'auction' : 'fixed', batch: batch(o.batch_id),
      buyerId: o.buyer_account_id, farmerId: o.farmer_account_id, quantityKg: n(o.allocated_quantity_kg), pricePerKg: n(o.unit_price_per_kg),
      total: n(o.total_amount), advancePercent: n(o.farmer_advance_percent), status: o.status, createdAt: o.created_at }));
  const visibleJobs = jobs.filter(j => visibleOrderRows.some(o => o.id === j.orderId)).map(j => {
    const o = visibleOrderRows.find(o => o.id === j.orderId)!;
    return { ...j, crop: batch(o.batch_id).crop, quantityKg: n(o.allocated_quantity_kg), orderCode: String(o.order_code) };
  });
  const privateOrderIds = orders.filter(o => o.farmerId === accountId || o.buyerId === accountId || visibleJobs.some(j => j.orderId === o.id && j.logisticsId === accountId)).map(o => o.id);
  const offerRows: Array<Row & { kind: 'auction' | 'fixed'; itemId: string }> = [...bids.map(b => ({ ...b, kind: 'auction' as const, itemId: b.auction_id })), ...requests.map(b => ({ ...b, kind: 'fixed' as const, itemId: b.listing_id }))];
  const offers: Offer[] = offerRows
    .filter(b => b.buyer_account_id === accountId || allItems.some(item => item.id === b.itemId && item.batch.farmerId === accountId))
    .map(b => {
      const item = allItems.find(item => item.id === b.itemId)!;
      const allocated = orderRows.filter(o => o.status !== 'cancelled' && (o.accepted_bid_id === b.id || o.purchase_request_id === b.id)).reduce((sum, o) => sum + n(o.allocated_quantity_kg), 0);
      return { id: b.id, kind: b.kind, itemId: b.itemId, buyerId: b.buyer_account_id, quantityKg: n(b.quantity_kg), remainingKg: Math.max(0, n(b.quantity_kg) - allocated),
        pricePerKg: b.kind === 'auction' ? n(b.price_per_kg) : item.pricePerKg, advancePercent: n(b.advance_percent), delivery: b.delivery_label ?? null,
        latitude: nullableNumber(b.delivery_latitude), longitude: nullableNumber(b.delivery_longitude), status: b.status, createdAt: b.created_at, updatedAt: b.updated_at };
    });
  const items = allItems.filter(item => item.batch.farmerId === accountId || (role === 'buyer' && (['open', 'active', 'partially_sold'].includes(item.status) || offers.some(o => o.itemId === item.id))));
  async function related(table: string, key: string, ids: string[]) {
    if (!ids.length) return [];
    const result = await supabaseAdmin.from(table).select('*').in(key, ids).order('created_at', { ascending: false });
    if (result.error) throw new ApiError(503, 'DATA_UNAVAILABLE', 'Unable to load related data.');
    return result.data as Row[];
  }
  const [payments, events, notifications] = await Promise.all([
    related('demo_payments', 'order_id', privateOrderIds), related('demo_order_events', 'order_id', privateOrderIds),
    related('demo_notifications', 'account_id', [accountId]),
  ]);
  const trackingIds = visibleJobs.filter(j => privateOrderIds.includes(j.orderId)).map(j => j.id);
  const trackingResult = trackingIds.length ? await supabaseAdmin.from('demo_tracking_points').select('id,job_id,latitude,longitude,source,recorded_at').in('job_id', trackingIds).order('recorded_at', { ascending: false }).limit(200) : { data: [], error: null };
  if (trackingResult.error) throw new ApiError(503, 'DATA_UNAVAILABLE', 'Unable to load tracking.');
  const deliveryProfile = role === 'buyer' ? buyers.find(p => p.account_id === accountId) : null;
  const deliveryLocation = deliveryProfile?.delivery_label ? { label: deliveryProfile.delivery_label,
    latitude: nullableNumber(deliveryProfile.delivery_latitude), longitude: nullableNumber(deliveryProfile.delivery_longitude) } : null;
  return { me, profiles, deliveryLocation, batches: batches.filter(b => b.farmerId === accountId), items, offers, orders, jobs: visibleJobs,
    payments: payments.map(p => ({ id: p.id, orderId: p.order_id, kind: p.payment_kind, amount: n(p.amount), status: p.status, simulated: p.simulated, paidAt: p.paid_at ?? null })),
    events: events.map(e => ({ id: e.id, orderId: e.order_id, type: e.event_type, createdAt: e.created_at })),
    tracking: trackingResult.data.map(p => ({ id: p.id, jobId: p.job_id, latitude: n(p.latitude), longitude: n(p.longitude), source: p.source, recordedAt: p.recorded_at })),
    notifications: notifications.map(p => {
      // Seed notifications may use human batch/order codes. Resolve canonical IDs
      // only against entities visible to this actor.
      const item = items.find(i => i.id === p.entity_key || i.batch.code === p.entity_key);
      const order = orders.find(o => o.id === p.entity_key || o.code === p.entity_key);
      const job = visibleJobs.find(j => j.id === p.entity_key || j.orderId === p.entity_key || j.orderCode === p.entity_key);
      const isListing = ['auction', 'fixed_listing'].includes(p.entity_type);
      return { id: p.id, title: p.title, body: p.notification_type === 'delivery_otp' ? 'Open the order for delivery confirmation.' : p.body ?? null,
        type: p.notification_type, entityType: p.entity_type ?? null,
        entityKey: isListing ? item?.id ?? null : p.entity_type === 'order' ? order?.id ?? null : p.entity_key ?? null,
        orderId: typeof p.data?.orderId === 'string' && orders.some(o => o.id === p.data.orderId) ? p.data.orderId : order?.id ?? null,
        jobId: typeof p.data?.jobId === 'string' && visibleJobs.some(j => j.id === p.data.jobId) ? p.data.jobId : role === 'logistics' ? job?.id ?? null : null,
        createdAt: p.created_at, readAt: p.read_at ?? null };
    }),
  };
}
