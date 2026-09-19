import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { ApiError, mapRpcError } from '../utils/apiError.js';
import type { OrderContract } from '../types/mutations.js';

export type RpcArguments = Record<string, string | number | boolean | null>;
export type RpcExecutor = (name: string, args: RpcArguments) => Promise<unknown>;

export const executeRpc: RpcExecutor = async (name, args) => {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error) throw mapRpcError(error);
  return data;
};

export async function readCreatedOrder(id: string): Promise<OrderContract> {
  const { data, error } = await supabaseAdmin.from('demo_orders')
    .select('id,order_code,source_type,farmer_account_id,buyer_account_id,batch_id,allocated_quantity_kg,unit_price_per_kg,total_amount,farmer_advance_percent,status')
    .eq('id', id).single();
  if (error || !data) throw new ApiError(500, 'server_error', 'Unable to load created order.');
  return {
    id: data.id, orderCode: data.order_code, sourceType: data.source_type,
    farmerAccountId: data.farmer_account_id, buyerAccountId: data.buyer_account_id,
    batchId: data.batch_id, quantityKg: Number(data.allocated_quantity_kg),
    unitPricePerKg: Number(data.unit_price_per_kg), totalAmount: Number(data.total_amount),
    farmerAdvancePercent: Number(data.farmer_advance_percent), status: data.status,
  };
}

export async function expireMarketplace(): Promise<void> {
  await executeRpc('demo_expire_marketplace', {});
}

// Read-only guard for stale clients. The RPC must still enforce the deadline atomically.
export async function assertBidBeforeExpiry(bidId: string, farmerId: string): Promise<void> {
  const { data, error } = await supabaseAdmin.from('demo_bids')
    .select('demo_auctions!inner(status,ends_at,demo_inventory_batches!inner(farmer_account_id))')
    .eq('id', bidId).eq('demo_auctions.demo_inventory_batches.farmer_account_id', farmerId).maybeSingle();
  if (error) throw new ApiError(503, 'AUCTION_READ_UNAVAILABLE', 'Unable to confirm the auction deadline. Refresh and retry.');
  if (!data) throw new ApiError(404, 'BID_NOT_FOUND', 'This offer is unavailable.');
  const relation = data.demo_auctions;
  const auction = Array.isArray(relation) ? relation[0] : relation;
  if (!auction || auction.status === 'expired' || !Number.isFinite(Date.parse(auction.ends_at)) || Date.parse(auction.ends_at) <= Date.now()) {
    throw new ApiError(409, 'AUCTION_EXPIRED', 'This auction has expired. Unaccepted offers are no longer actionable.');
  }
}

export async function readBatchQuality(id: string, farmerId: string) {
  const { data, error } = await supabaseAdmin.from('demo_inventory_batches')
    .select('id,quality_grade,quality_notes,status').eq('id', id).eq('farmer_account_id', farmerId).single();
  if (error || !data) throw new ApiError(503, 'QUALITY_READ_UNAVAILABLE', 'Quality was saved, but could not be refreshed. Retry to view the saved batch.');
  return { batchId: data.id, grade: data.quality_grade, notes: data.quality_notes, status: data.status };
}
