export const CLEAR_CONFIRMATION = 'CLEAR_FARMPRISM_ACTIVITY';
// FK order verified against deployed metadata. No accounts, profiles or config here.
export const clearTargets = [
  'demo_tracking_points', 'demo_delivery_otps', 'demo_feedback', 'demo_disputes', 'demo_payments',
  'demo_order_events', 'demo_logistics_jobs', 'demo_orders', 'demo_bids', 'demo_purchase_requests',
  'demo_auctions', 'demo_fixed_price_listings', 'demo_price_recommendations', 'demo_inventory_batches',
  'demo_notifications', 'demo_trust_scores', 'demo_farmer_home_snapshots', 'demo_farmer_my_farm_snapshots',
  'mandi_prices', 'demo_sessions',
] as const;
export const preservedTargets = ['demo_accounts', 'demo_farmer_profiles', 'demo_buyer_profiles', 'demo_logistics_profiles'] as const;
export type ClearTarget = typeof clearTargets[number];
export type CountTarget = ClearTarget | typeof preservedTargets[number];
export type CleanupStore = {
  count(table: CountTarget, official?: boolean): Promise<number>;
  clear(table: ClearTarget): Promise<void>;
};
export function validateClearRequest(nodeEnv: string | undefined, args: readonly string[]) {
  if (nodeEnv?.trim().toLowerCase() === 'production') throw new Error('Activity cleanup is disabled in production.');
  if (args.length !== 1 || args[0] !== CLEAR_CONFIRMATION) throw new Error('Activity cleanup requires exactly CLEAR_FARMPRISM_ACTIVITY.');
}
export async function activityCounts(store: CleanupStore) {
  const counts: Record<string, number> = {};
  for (const table of [...clearTargets, ...preservedTargets]) counts[table === 'mandi_prices' ? 'mandi_prices_demo' : table] = await store.count(table);
  counts.mandi_prices_official = await store.count('mandi_prices', true);
  return counts;
}
export async function clearDemoActivity(nodeEnv: string | undefined, args: readonly string[], store: CleanupStore) {
  validateClearRequest(nodeEnv, args);
  const before = await activityCounts(store);
  if (before.demo_accounts !== 9 || preservedTargets.slice(1).some(t => before[t] !== 3)) throw new Error('Identity counts differ from the nine-account prototype. Cleanup refused.');
  // Sequential Data API requests are not a cross-table transaction. Stop on failure;
  // a guarded rerun is safe. Run with the development API stopped.
  for (const table of clearTargets) await store.clear(table);
  const after = await activityCounts(store);
  if (clearTargets.some(t => after[t === 'mandi_prices' ? 'mandi_prices_demo' : t] !== 0) || preservedTargets.some(t => before[t] !== after[t]) || before.mandi_prices_official !== after.mandi_prices_official) throw new Error('Cleanup verification failed. Inspect safe counts before retrying.');
  return { before, after };
}
