import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { clearTargets, preservedTargets, type CleanupStore } from '../services/clearDemoActivity.service.js';
const accountKey = new Set(['demo_trust_scores', 'demo_farmer_home_snapshots', 'demo_farmer_my_farm_snapshots']);
export const clearActivityStore: CleanupStore = {
  async count(table, official = false) {
    if (![...clearTargets, ...preservedTargets].some(t => t === table)) throw new Error('Unknown cleanup count target.');
    let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
    if (table === 'mandi_prices') query = query.eq('is_demo', !official);
    const { count, error } = await query;
    if (error || count === null) throw new Error('Activity count failed for ' + table);
    return count;
  },
  async clear(table) {
    if (!clearTargets.some(t => t === table)) throw new Error('Unknown cleanup delete target.');
    const deletion = supabaseAdmin.from(table).delete();
    const { error } = await (table === 'mandi_prices' ? deletion.eq('is_demo', true) : deletion.not(accountKey.has(table) ? 'account_id' : 'id', 'is', null));
    if (error) throw new Error('Activity cleanup stopped at ' + table);
  },
};
