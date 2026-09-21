import { apiClient } from './api.client';
import type { DemoAccount } from '../demo/demo.types';

function invalid(): never { throw new Error('The server returned an invalid demo session. Please sign in again.'); }
function object(value: unknown): Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid(); }
export function parseSessionAccount(value: unknown): DemoAccount {
  const a = object(value);
  if (!['farmer', 'buyer', 'logistics'].includes(String(a.role)) || typeof a.phone !== 'string' || !/^\+91\d{10}$/.test(a.phone) ||
    typeof a.fullName !== 'string' || !a.fullName.trim() || typeof a.loginLabel !== 'string' || !a.loginLabel.trim()) return invalid();
  return { role: a.role as DemoAccount['role'], phone: a.phone, fullName: a.fullName, loginLabel: a.loginLabel, isDemo: true, userId: null };
}
export function hasExpiredDemoToken(expiresAt: string | null): boolean {
  return !expiresAt || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now();
}
export type DemoApiSession = { token: string; expiresAt: string; account: DemoAccount };
export function parseCreatedSession(value: unknown, phone: string): DemoApiSession {
  const s = object(value), account = parseSessionAccount(s.account);
  if (typeof s.token !== 'string' || !s.token.trim() || typeof s.expiresAt !== 'string' || hasExpiredDemoToken(s.expiresAt) || account.phone !== phone) return invalid();
  return { token: s.token, expiresAt: s.expiresAt, account };
}
export const demoSessionClient = {
  async create(phone: string, otp: string) {
    const body = await apiClient.post<{ data: unknown }>('/api/demo/session', { phone, otp }, { bearerToken: '' });
    return parseCreatedSession(body?.data, phone);
  },
  async me(token: string) {
    const body = await apiClient.get<{ data: unknown }>('/api/demo/me', { bearerToken: token });
    return parseSessionAccount(body?.data);
  },
  async logout(token: string) { await apiClient.post('/api/demo/logout', {}, { bearerToken: token }); },
};
