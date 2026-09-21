import { ApiError } from '../api/api.client';
import { hasExpiredDemoToken, type DemoApiSession } from '../api/demoSession.client';
import type { DemoAccount } from '../demo/demo.types';

// Preserve the existing SecureStore keys and lifecycle. Role/onboarding UX is separate.
export const DEMO_PHONE_KEY = 'farmprism.demo.phone.v1';
export const DEMO_API_TOKEN_KEY = 'farmprism.demoApiToken.v1';
export const DEMO_API_EXPIRES_AT_KEY = 'farmprism.demoApiExpiresAt.v1';
type Secure = { getItemAsync(key: string): Promise<string | null>; setItemAsync(key: string, value: string): Promise<void>; deleteItemAsync(key: string): Promise<void> };
type Local = { setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
type Client = { create(phone: string, otp: string): Promise<DemoApiSession>; me(token: string): Promise<DemoAccount>; logout(token: string): Promise<void> };
export function createDemoSessionService(secure: Secure, local: Local, client: Client) {
  const clear = async () => {
    await Promise.all([secure.deleteItemAsync(DEMO_API_TOKEN_KEY), secure.deleteItemAsync(DEMO_API_EXPIRES_AT_KEY), local.removeItem(DEMO_PHONE_KEY)]);
  };
  return {
    clear,
    async login(phone: string, otp: string) {
      const session = await client.create(phone, otp);
      await Promise.all([secure.setItemAsync(DEMO_API_TOKEN_KEY, session.token), secure.setItemAsync(DEMO_API_EXPIRES_AT_KEY, session.expiresAt), local.setItem(DEMO_PHONE_KEY, session.account.phone)]);
      return session;
    },
    async restore(): Promise<DemoApiSession | null> {
      const [token, expiresAt] = await Promise.all([secure.getItemAsync(DEMO_API_TOKEN_KEY), secure.getItemAsync(DEMO_API_EXPIRES_AT_KEY)]);
      if (!token || hasExpiredDemoToken(expiresAt)) { await clear(); return null; }
      try {
        const account = await client.me(token);
        await local.setItem(DEMO_PHONE_KEY, account.phone);
        return { token, expiresAt: expiresAt!, account };
      } catch (error) {
        // Offline/server outages are not proof of revocation. Keep credentials for retry.
        if (error instanceof ApiError && error.status !== 401) throw error;
        if (error instanceof TypeError) throw error;
        await clear();
        return null;
      }
    },
    async logout(token: string | null) {
      try { if (token) await client.logout(token); } catch { /* Always clear the local session. */ }
      await clear();
    },
  };
}
