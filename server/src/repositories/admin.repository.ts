import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { ApiError } from '../utils/apiError.js';
import type { AdminRepository, Buyer } from '../services/admin.service.js';

const columns = 'account_id,buyer_type,business_name,verification_status,updated_at,demo_accounts!inner(id,full_name,phone,is_enabled,role_code)';
const unavailable = () => new ApiError(503, 'BUYER_DATA_UNAVAILABLE', 'Unable to load or save buyers. Please retry.');
type JoinedRow = { account_id: string; buyer_type: string | null; business_name: string | null; verification_status: Buyer['verificationStatus']; updated_at: string; demo_accounts: { full_name: string; phone: string; is_enabled: boolean; role_code: string } };
function dto(row: JoinedRow): Buyer {
  return { accountId: row.account_id, name: row.demo_accounts.full_name, phone: row.demo_accounts.phone, buyerType: row.buyer_type, businessName: row.business_name, verificationStatus: row.verification_status, enabled: row.demo_accounts.is_enabled, updatedAt: row.updated_at };
}
export function createAdminRepository(client = supabaseAdmin): AdminRepository {
  return {
    async list(status) {
      let query = client.from('demo_buyer_profiles').select(columns).eq('demo_accounts.role_code', 'buyer').order('account_id').limit(1000);
      if (status !== 'all') query = query.eq('verification_status', status);
      const { data, error } = await query;
      if (error || !data || data.length >= 1000) throw unavailable();
      return (data as unknown as JoinedRow[]).filter(row => row.demo_accounts.role_code === 'buyer').map(dto);
    },
    async find(accountId) {
      const { data, error } = await client.from('demo_buyer_profiles').select(columns).eq('demo_accounts.role_code', 'buyer').eq('account_id', accountId).maybeSingle();
      if (error) throw unavailable();
      const row = data as unknown as JoinedRow | null;
      return row?.demo_accounts.role_code === 'buyer' ? dto(row) : null;
    },
    async verify(accountId) {
      // Role and profile existence were checked by find; application roles are permanent.
      // Conditional update also leaves updated_at untouched on concurrent/repeated verification.
      const { error } = await client.from('demo_buyer_profiles').update({ verification_status: 'verified', updated_at: new Date().toISOString() }).eq('account_id', accountId).in('verification_status', ['pending', 'failed']);
      if (error) throw unavailable();
      const result = await this.find(accountId);
      if (!result || result.verificationStatus !== 'verified') throw unavailable();
    },
  };
}
export const adminRepository = createAdminRepository();
