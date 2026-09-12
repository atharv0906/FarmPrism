import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function checkSupabaseReadiness(): Promise<{ ok: true }> {
  const { error } = await getSupabaseAdmin().from('demo_accounts').select('id').limit(1);
  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
}