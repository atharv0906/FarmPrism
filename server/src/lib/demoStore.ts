import { createHash } from 'node:crypto';

import { supabaseAdmin } from './supabaseAdmin.js';
import type { DemoAccountRecord, DemoRole, DemoSessionRow } from '../types/domain.js';
import { normalizePhone } from '../utils/validation.js';
import { getRoleProfile, getTrustProfile } from '../repositories/demo.repository.js';

function asStringOrNull(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  return typeof value === 'string' ? value : String(value);
}

function maybeNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDemoAccount(record: Record<string, unknown>): DemoAccountRecord {
  const roleValue = asStringOrNull(record.role_code ?? record.role) ?? 'farmer';
  const role = roleValue === 'farmer' || roleValue === 'buyer' || roleValue === 'logistics' ? roleValue : 'farmer';

  return {
    id: String(record.id ?? ''),
    loginLabel: asStringOrNull(record.login_label ?? record.loginLabel) ?? '',
    phone: asStringOrNull(record.phone) ?? '',
    role: role as DemoRole,
    fullName: asStringOrNull(record.full_name ?? record.fullName) ?? '',
    isEnabled: record.is_enabled === true || record.isEnabled === true,
    verification: asStringOrNull(record.verification_status ?? record.verification),
    farmLocation: asStringOrNull(record.location_label ?? record.farmLocation),
    farmArea: maybeNumber(record.farm_area_acres ?? record.farmArea),
    businessType: asStringOrNull(record.buyer_type ?? record.businessType),
    businessName: asStringOrNull(record.business_name ?? record.businessName),
    deliveryLocation: asStringOrNull(record.delivery_label ?? record.deliveryLocation),
    vehicle: asStringOrNull(record.vehicle_type ?? record.vehicle),
    capacity: maybeNumber(record.capacity_kg ?? record.capacity),
    currentLocation: asStringOrNull(record.current_location_label ?? record.currentLocation),
    trustScore: maybeNumber(record.trust_score ?? record.trustScore),
    completedTransactions: maybeNumber(record.completed_transactions ?? record.completedTransactions),
    qualityConsistency: maybeNumber(record.quality_consistency_score ?? record.qualityConsistency),
    paymentReliability: maybeNumber(record.payment_reliability_score ?? record.paymentReliability),
    deliveryReliability: maybeNumber(record.delivery_reliability_score ?? record.deliveryReliability),
  };
}

async function withProfile(record: Record<string, unknown>): Promise<DemoAccountRecord> {
  const account = toDemoAccount(record);
  const [profile, trust] = await Promise.all([getRoleProfile(account.id, account.role), getTrustProfile(account.id)]);
  return toDemoAccount({ ...record, ...profile, ...trust, id: account.id, trust_score: trust?.score ?? null });
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function getDemoAccounts(): Promise<DemoAccountRecord[]> {
  const { data, error } = await supabaseAdmin.from('demo_accounts').select('*');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => toDemoAccount(row as Record<string, unknown>));
}

export async function getDemoAccountByPhone(phoneValue: string): Promise<DemoAccountRecord | null> {
  const normalized = normalizePhone(phoneValue);
  const { data, error } = await supabaseAdmin.from('demo_accounts').select('*').eq('phone', normalized).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withProfile(data as Record<string, unknown>) : null;
}

export async function getDemoAccountById(accountId: string): Promise<DemoAccountRecord | null> {
  const { data, error } = await supabaseAdmin.from('demo_accounts').select('*').eq('id', accountId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withProfile(data as Record<string, unknown>) : null;
}

export async function getDemoAccountByLoginLabel(loginLabel: string): Promise<DemoAccountRecord | null> {
  const { data, error } = await supabaseAdmin.from('demo_accounts').select('*').eq('login_label', loginLabel).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? withProfile(data as Record<string, unknown>) : null;
}

export async function createDemoSessionRow(accountId: string, rawToken: string): Promise<DemoSessionRow> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin.from('demo_sessions').insert({
    account_id: accountId,
    token_hash: hashToken(rawToken),
    expires_at: expiresAt,
    revoked_at: null,
    created_at: now.toISOString(),
    last_seen_at: now.toISOString(),
  }).select('*').maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Failed to create demo session.');
  }

  return {
    id: String((data as Record<string, unknown>).id ?? ''),
    accountId: String((data as Record<string, unknown>).account_id ?? accountId),
    tokenHash: String((data as Record<string, unknown>).token_hash ?? hashToken(rawToken)),
    expiresAt: String((data as Record<string, unknown>).expires_at ?? expiresAt),
    revokedAt: ((data as Record<string, unknown>).revoked_at ?? null) as string | null,
    lastSeenAt: ((data as Record<string, unknown>).last_seen_at ?? null) as string | null,
    createdAt: String((data as Record<string, unknown>).created_at ?? now.toISOString()),
  };
}

export async function findActiveSessionByToken(rawToken: string): Promise<DemoSessionRow | null> {
  const tokenHash = hashToken(rawToken);
  const { data, error } = await supabaseAdmin.from('demo_sessions').select('*').eq('token_hash', tokenHash).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const session: DemoSessionRow = {
    id: String((data as Record<string, unknown>).id ?? ''),
    accountId: String((data as Record<string, unknown>).account_id ?? ''),
    tokenHash: String((data as Record<string, unknown>).token_hash ?? tokenHash),
    expiresAt: String((data as Record<string, unknown>).expires_at ?? new Date().toISOString()),
    revokedAt: ((data as Record<string, unknown>).revoked_at ?? null) as string | null,
    lastSeenAt: ((data as Record<string, unknown>).last_seen_at ?? null) as string | null,
    createdAt: String((data as Record<string, unknown>).created_at ?? new Date().toISOString()),
  };

  if (session.revokedAt) {
    return null;
  }

  if (!Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
    return null;
  }

  return session;
}

export async function revokeDemoSessionByToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const { error } = await supabaseAdmin.from('demo_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash).is('revoked_at', null);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function updateSessionLastSeen(tokenHash: string): Promise<void> {
  const { error } = await supabaseAdmin.from('demo_sessions').update({ last_seen_at: new Date().toISOString() }).eq('token_hash', tokenHash);

  if (error) {
    throw new Error(error.message);
  }
}

export function getValidDemoRole(role: DemoRole): DemoRole {
  if (role === 'farmer' || role === 'buyer' || role === 'logistics') {
    return role;
  }

  throw new Error('Unsupported demo role.');
}

export {
  getBuyerActivity,
  getBuyerMarketplace,
  getFarmerInventory,
  getFarmerMarketplace,
  getLogisticsActivity,
  getAvailableLogisticsJobs,
  getMarketCurrent,
  getMarketHistory,
  getOrderById,
  getOrderEvents,
  getOrdersForAccount,
  getPaymentsForOrder,
  getLogisticsJobForOrder,
} from '../repositories/demo.repository.js';
