import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ApiError } from '../utils/apiError.js';

export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type Buyer = { accountId: string; name: string; phone: string; buyerType: string | null; businessName: string | null; verificationStatus: VerificationStatus; enabled: boolean; updatedAt: string };
export interface AdminRepository {
  list(status: VerificationStatus | 'all'): Promise<Buyer[]>;
  find(accountId: string): Promise<Buyer | null>;
  verify(accountId: string): Promise<void>;
}
export function createAdminService(repository: AdminRepository) {
  return {
    async list(status: unknown) {
      if (status !== undefined && !['all', 'pending', 'verified', 'failed'].includes(status as string)) throw new ApiError(400, 'INVALID_STATUS', 'Invalid verification status.');
      return { buyers: await repository.list((status ?? 'all') as VerificationStatus | 'all') };
    },
    async verify(accountId: unknown) {
      if (typeof accountId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) throw new ApiError(404, 'BUYER_NOT_FOUND', 'Buyer not found.');
      const buyer = await repository.find(accountId);
      if (!buyer) throw new ApiError(404, 'BUYER_NOT_FOUND', 'Buyer not found.');
      if (buyer.verificationStatus !== 'verified') await repository.verify(accountId);
      return { accountId, verificationStatus: 'verified' as const };
    },
  };
}

const digest = (value: string) => createHash('sha256').update(value).digest();
export function createAdminSessions(username: string, password: string, now = Date.now) {
  const sessions = new Map<string, number>();
  const key = (token: string) => digest(token).toString('hex');
  function prune() { for (const [token, expiry] of sessions) if (expiry <= now()) sessions.delete(token); }
  return {
    login(input: unknown) {
      const body = input as { username?: unknown; password?: unknown } | null;
      const userMatches = typeof body?.username === 'string' && timingSafeEqual(digest(body.username), digest(username));
      const passwordMatches = typeof body?.password === 'string' && timingSafeEqual(digest(body.password), digest(password));
      if (!username || !password || !userMatches || !passwordMatches) throw new ApiError(401, 'INVALID_ADMIN_LOGIN', 'Invalid username or password.');
      prune();
      if (sessions.size >= 1000) throw new ApiError(503, 'ADMIN_SESSION_LIMIT', 'Too many admin sessions. Try again later.');
      const token = 'fp_admin_' + randomBytes(32).toString('base64url');
      const expiresAt = now() + 8 * 60 * 60 * 1000;
      sessions.set(key(token), expiresAt);
      return { token, expiresAt: new Date(expiresAt).toISOString() };
    },
    valid(token: string) { prune(); return sessions.has(key(token)); },
    logout(token: string) { sessions.delete(key(token)); },
  };
}
