import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { FarmerSummaryRepository } from '../services/farmerSummary.service.js';
import { ApiError } from '../utils/apiError.js';
import { isCrop } from '../utils/validation.js';

type Row = Record<string, unknown>;
function invalid(): never { throw new ApiError(503, 'FARM_DATA_UNAVAILABLE', 'Current farm data could not be loaded. Please retry.'); }
function text(v: unknown): string { return typeof v === 'string' ? v : invalid(); }
function number(v: unknown): number { return (typeof v === 'number' || typeof v === 'string') && String(v).trim() && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : invalid(); }
function date(v: unknown): string { const s = text(v); return Number.isFinite(Date.parse(s)) ? s : invalid(); }
async function rows(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<Row[]> {
  const result = await query;
  if (result.error || !Array.isArray(result.data) || result.data.length >= 1000) return invalid();
  return result.data as Row[];
}
export const farmerSummaryRepository: FarmerSummaryRepository = {
  async read(accountId) {
    const [accounts, profiles, batches, orders, notifications] = await Promise.all([
      rows(supabaseAdmin.from('demo_accounts').select('id,full_name').eq('id', accountId).limit(1000)),
      rows(supabaseAdmin.from('demo_farmer_profiles').select('account_id,location_label,farm_area_acres').eq('account_id', accountId).limit(1000)),
      rows(supabaseAdmin.from('demo_inventory_batches').select('id,crop_name,remaining_quantity_kg,status,created_at,updated_at').eq('farmer_account_id', accountId).limit(1000)),
      rows(supabaseAdmin.from('demo_orders').select('accepted_bid_id,allocated_quantity_kg,total_amount,status,completed_at').eq('farmer_account_id', accountId).limit(1000)),
      rows(supabaseAdmin.from('demo_notifications').select('notification_type,read_at').eq('account_id', accountId).limit(1000)),
    ]);
    if (accounts.length !== 1 || profiles.length !== 1) return invalid();
    const auctions = batches.length ? await rows(supabaseAdmin.from('demo_auctions').select('id,batch_id,remaining_quantity_kg,starts_at,ends_at,status').in('batch_id', batches.map(b => text(b.id))).limit(1000)) : [];
    const bids = auctions.length ? await rows(supabaseAdmin.from('demo_bids').select('id,auction_id,buyer_account_id,quantity_kg,price_per_kg,status').in('auction_id', auctions.map(a => text(a.id))).limit(1000)) : [];
    return {
      account: { id: text(accounts[0].id), name: text(accounts[0].full_name) },
      profile: { location: profiles[0].location_label === null ? '' : text(profiles[0].location_label), area: profiles[0].farm_area_acres === null ? null : number(profiles[0].farm_area_acres) },
      batches: batches.map(b => ({ id: text(b.id), crop: typeof b.crop_name === 'string' && isCrop(b.crop_name) ? b.crop_name : invalid(), remainingKg: number(b.remaining_quantity_kg), status: text(b.status), createdAt: date(b.created_at), updatedAt: date(b.updated_at) })),
      auctions: auctions.map(a => ({ id: text(a.id), batchId: text(a.batch_id), remainingKg: number(a.remaining_quantity_kg), startsAt: date(a.starts_at), endsAt: date(a.ends_at), status: text(a.status) })),
      bids: bids.map(b => ({ id: text(b.id), auctionId: text(b.auction_id), buyerId: text(b.buyer_account_id), quantityKg: number(b.quantity_kg), pricePerKg: number(b.price_per_kg), status: text(b.status) })),
      orders: orders.map(o => ({ bidId: o.accepted_bid_id === null ? null : text(o.accepted_bid_id), quantityKg: number(o.allocated_quantity_kg), total: number(o.total_amount), status: text(o.status), completedAt: o.completed_at === null ? null : date(o.completed_at) })),
      notifications: notifications.map(n => ({ type: text(n.notification_type), readAt: n.read_at === null ? null : date(n.read_at) })),
    };
  },
};
