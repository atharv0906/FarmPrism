import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import { authService, normalizeIndianPhone, toAuthServiceError } from '../../services/auth/auth.service';
import type { AuthServiceError } from '../../services/auth/auth.types';
import { AuthContext, type AuthContextValue } from '../../hooks/useAuth';
import { SplashScreen } from '../../screens/SplashScreen';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';
import { demoService } from '../../services/demo/demo.service';
import type { DemoAccount } from '../../services/demo/demo.types';
import { getCurrentDemoApiToken, setCurrentDemoApiToken } from '../../services/api/api.client';

// This is a development identity preference, never an Auth token or real session.
const DEMO_PHONE_KEY = 'farmprism.demo.phone.v1';
const DEMO_API_TOKEN_KEY = 'farmprism.demoApiToken.v1';
const DEMO_API_EXPIRES_AT_KEY = 'farmprism.demoApiExpiresAt.v1';

type DemoSessionResponse = {
  token?: string;
  expiresAt?: string;
  account?: {
    phone?: string;
    fullName?: string;
    role?: string;
    loginLabel?: string;
  };
};

function createMockUser(phone: string): User {
  return { id: `development-mock:${phone}`, app_metadata: {}, user_metadata: {},
    aud: 'authenticated', created_at: new Date(0).toISOString(), phone,
    role: 'authenticated', identities: [], is_anonymous: false };
}

function hasExpiredDemoToken(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return Number(new Date(expiresAt).getTime()) <= Date.now();
}

async function clearDemoApiSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(DEMO_API_TOKEN_KEY),
    SecureStore.deleteItemAsync(DEMO_API_EXPIRES_AT_KEY),
  ]);
  setCurrentDemoApiToken(null);
}

async function createDemoApiSession(phone: string, otp: string): Promise<DemoSessionResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const response = await fetch(`${baseUrl}/api/demo/session`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });

  const payload = await response.json().catch(() => null) as { data?: DemoSessionResponse; error?: { message?: string } } | null;

  if (!response.ok || !payload?.data?.token) {
    throw new Error(payload?.error?.message ?? 'The demo session could not be created.');
  }

  return payload.data;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthServiceError | null>(null);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [demoApiToken, setDemoApiToken] = useState<string | null>(null);
  const [demoApiSessionReady, setDemoApiSessionReady] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const mock = isDevelopmentMockOtpEnabled();
    const subscription = mock || !supabase ? null : supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next); setUser(next?.user ?? null); setError(null);
      if (restoredRef.current) setLoading(false);
    });
    void (async () => {
      if (mock) {
        const phone = await AsyncStorage.getItem(DEMO_PHONE_KEY);
        const storedToken = await SecureStore.getItemAsync(DEMO_API_TOKEN_KEY);
        const storedExpiresAt = await SecureStore.getItemAsync(DEMO_API_EXPIRES_AT_KEY);

        if (storedToken && !hasExpiredDemoToken(storedExpiresAt)) {
          setDemoApiToken(storedToken);
          setCurrentDemoApiToken(storedToken);
        } else if (storedToken) {
          await clearDemoApiSession();
        }

        if (phone) {
          // Revalidate the fixed role with the RPC; cached role data is never trusted.
          const account = await demoService.account(normalizeIndianPhone(phone));
          if (mounted && account) {
            setDemoAccount(account); setUser(createMockUser(account.phone)); setMockAuthenticated(true);
          }
        }
        if (mounted) setDemoApiSessionReady(true);
      } else {
        const restored = await authService.restoreSession();
        if (mounted) { setSession(restored.session); setUser(restored.user); }
        if (mounted) setDemoApiSessionReady(true);
      }
    })().catch(e => { if (mounted) setError(toAuthServiceError(e)); })
      .finally(() => { if (mounted) { restoredRef.current = true; setLoading(false); } });
    return () => { mounted = false; subscription?.data.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading, authenticated: Boolean((session && user) || mockAuthenticated), user, session,
    demoAccount, demoApiToken, demoApiSessionReady, authMode: mockAuthenticated ? 'development-mock' : 'supabase', error,
    requestOtp: async phone => { const r = await authService.requestOtp(phone); setError(null); return r; },
    verifyOtp: async (phone, token) => {
      const normalized = normalizeIndianPhone(phone);
      const r = await authService.verifyOtp(normalized, token);
      const account = r.isMockAuth ? await demoService.account(normalized) : null;
      let serverDemoToken: string | null = null;
      if (r.isMockAuth) {
        const sessionData = await createDemoApiSession(normalized, token);
        serverDemoToken = sessionData.token ?? null;
        if (serverDemoToken) {
          await SecureStore.setItemAsync(DEMO_API_TOKEN_KEY, serverDemoToken);
          await SecureStore.setItemAsync(DEMO_API_EXPIRES_AT_KEY, sessionData.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
          setCurrentDemoApiToken(serverDemoToken);
          setDemoApiToken(serverDemoToken);
          setDemoApiSessionReady(true);
        }
      }
      if (r.isMockAuth) await AsyncStorage.setItem(DEMO_PHONE_KEY, normalized);
      setDemoAccount(account); setSession(r.session);
      setUser(r.isMockAuth ? createMockUser(normalized) : r.user);
      setMockAuthenticated(r.isMockAuth); setError(null);
      return r;
    },
    logout: async () => {
      const tokenToRevoke = demoApiToken ?? getCurrentDemoApiToken();
      if (tokenToRevoke) {
        try {
          const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
          await fetch(`${baseUrl}/api/demo/logout`, {
            method: 'POST',
            headers: { Accept: 'application/json', Authorization: `Bearer ${tokenToRevoke}` },
          });
        } catch {
          // Keep logout resilient if the session service is unavailable.
        }
      }
      await authService.logout();
      await AsyncStorage.removeItem(DEMO_PHONE_KEY);
      await clearDemoApiSession();
      setSession(null); setUser(null); setDemoAccount(null); setMockAuthenticated(false); setError(null); setDemoApiToken(null); setDemoApiSessionReady(false);
    },
  }), [demoAccount, demoApiSessionReady, demoApiToken, error, loading, mockAuthenticated, session, user]);
  if (loading) return <SplashScreen />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
