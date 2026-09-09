import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import type { MarketRepository } from '../services/market.service.js';
import type { MarketPoint } from '../types/market.js';
import { ApiError } from '../utils/apiError.js';
import { createHash } from 'node:crypto';

export const marketRepository: MarketRepository = {
  async cache(points) {
    if (!points.length) return;
    const category = await supabaseAdmin.from('categories').select('id').eq('name', points[0].crop).single();
    if (category.error) throw new Error('Market cache unavailable.');
    // Existing schema has no variety/grade columns. Keep one normalized observation
    // for each crop, market and date; a deterministic primary key makes retries safe.
    const records = new Map<string, Record<string, unknown>>();
    for (const point of points) {
      if (point.isDemo) continue;
      const hash = createHash('sha256').update([point.crop, point.state, point.district, point.mandi, point.observedAt, point.source].join('|')).digest('hex');
      const id = hash.slice(0, 8) + '-' + hash.slice(8, 12) + '-4' + hash.slice(13, 16) + '-8' + hash.slice(17, 20) + '-' + hash.slice(20, 32);
      records.set(id, { id, crop_category_id: category.data.id, mandi_name: point.mandi, district: point.district, state: point.state,
        min_price_per_kg: point.minPricePerKg, max_price_per_kg: point.maxPricePerKg, modal_price_per_kg: point.modalPricePerKg,
        observed_at: point.observedAt, source: point.source, is_demo: false });
    }
    if (records.size) {
      const result = await supabaseAdmin.from('mandi_prices').upsert([...records.values()], { onConflict: 'id' });
      if (result.error) throw new Error('Market cache unavailable.');
    }
  },
  async history(crop, days) {
    const category = await supabaseAdmin.from('categories').select('id').eq('name', crop).maybeSingle();
    if (category.error) throw new ApiError(503, 'MARKET_UNAVAILABLE', 'Market data is unavailable.');
    if (!category.data) return [];
    const result = await supabaseAdmin.from('mandi_prices').select('*').eq('crop_category_id', category.data.id)
      .order('observed_at', { ascending: false }).limit(1000);
    if (result.error) throw new ApiError(503, 'MARKET_UNAVAILABLE', 'Market data is unavailable.');
    const rows = result.data ?? [];
    if (!rows.length) return [];
    // Preserve dated prototype observations when the seed is older than today.
    const cutoff = Date.parse(rows[0].observed_at) - days * 86400000;
    return rows.filter(row => Date.parse(row.observed_at) >= cutoff).map(row => ({
      crop, mandi: row.mandi_name, district: row.district, state: row.state,
      minPricePerKg: row.min_price_per_kg === null ? null : Number(row.min_price_per_kg),
      maxPricePerKg: row.max_price_per_kg === null ? null : Number(row.max_price_per_kg),
      modalPricePerKg: Number(row.modal_price_per_kg), observedAt: row.observed_at, source: row.source, isDemo: row.is_demo,
    } satisfies MarketPoint));
  },
};

export async function cropDemand(crop: string): Promise<number> {
  const [bids, requests] = await Promise.all([
    supabaseAdmin.from('demo_bids').select('id,demo_auctions!inner(demo_inventory_batches!inner(crop_name))', { count: 'exact', head: true })
      .eq('demo_auctions.demo_inventory_batches.crop_name', crop).in('status', ['active', 'partially_accepted']),
    supabaseAdmin.from('demo_purchase_requests').select('id,demo_fixed_price_listings!inner(demo_inventory_batches!inner(crop_name))', { count: 'exact', head: true })
      .eq('demo_fixed_price_listings.demo_inventory_batches.crop_name', crop).in('status', ['pending', 'partially_accepted']),
  ]);
  if (bids.error || requests.error) throw new ApiError(503, 'DEMAND_UNAVAILABLE', 'Marketplace demand could not be loaded.');
  return (bids.count ?? 0) + (requests.count ?? 0);
}
