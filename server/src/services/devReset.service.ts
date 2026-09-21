export const RESET_CONFIRMATION = 'RESET_FARMPRISM_DEMO';
type ResetRpc = (name: 'demo_reset_prototype_data') => PromiseLike<{ data: unknown; error: unknown }>;

export function validateResetRequest(nodeEnv: string | undefined, args: readonly string[]): void {
  if (nodeEnv === 'production') throw new Error('Demo reset is disabled in production.');
  if (args.length !== 1 || args[0] !== RESET_CONFIRMATION) throw new Error('Demo reset requires exactly RESET_FARMPRISM_DEMO.');
}

export async function resetPrototype(nodeEnv: string | undefined, args: readonly string[], rpc: ResetRpc) {
  validateResetRequest(nodeEnv, args);
  let result;
  try { result = await rpc('demo_reset_prototype_data'); }
  catch { throw new Error('Demo reset failed. No private diagnostics were printed.'); }
  if (result.error) throw new Error('Demo reset failed. No private diagnostics were printed.');
  // Whitelist the deployed RPC summary. Never print arbitrary returned strings.
  const row = result.data && typeof result.data === 'object' ? result.data as Record<string, unknown> : {};
  const summary: Record<string, boolean | number | string> = {};
  for (const key of ['reset', 'sessionsCleared']) if (typeof row[key] === 'boolean') summary[key] = row[key];
  for (const key of ['accounts', 'farmer1InventoryKg']) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) summary[key] = value;
  }
  for (const key of ['activeAuctionId', 'activeFixedListingId']) {
    const value = row[key];
    if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) summary[key] = value;
  }
  return summary;
}
