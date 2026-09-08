import AsyncStorage from '@react-native-async-storage/async-storage';
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

// This is a development identity preference, never an Auth token or real session.
const DEMO_PHONE_KEY = 'farmprism.demo.phone.v1';
function createMockUser(phone: string): User {
  return { id: `development-mock:${phone}`, app_metadata: {}, user_metadata: {},
    aud: 'authenticated', created_at: new Date(0).toISOString(), phone,
    role: 'authenticated', identities: [], is_anonymous: false };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthServiceError | null>(null);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
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
        if (phone) {
          // Revalidate the fixed role with the RPC; cached role data is never trusted.
          const account = await demoService.account(normalizeIndianPhone(phone));
          if (mounted && account) {
            setDemoAccount(account); setUser(createMockUser(account.phone)); setMockAuthenticated(true);
          }
        }
      } else {
        const restored = await authService.restoreSession();
        if (mounted) { setSession(restored.session); setUser(restored.user); }
      }
    })().catch(e => { if (mounted) setError(toAuthServiceError(e)); })
      .finally(() => { if (mounted) { restoredRef.current = true; setLoading(false); } });
    return () => { mounted = false; subscription?.data.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    loading, authenticated: Boolean((session && user) || mockAuthenticated), user, session,
    demoAccount, authMode: mockAuthenticated ? 'development-mock' : 'supabase', error,
    requestOtp: async phone => { const r = await authService.requestOtp(phone); setError(null); return r; },
    verifyOtp: async (phone, token) => {
      const normalized = normalizeIndianPhone(phone);
      const r = await authService.verifyOtp(normalized, token);
      const account = r.isMockAuth ? await demoService.account(normalized) : null;
      if (r.isMockAuth) await AsyncStorage.setItem(DEMO_PHONE_KEY, normalized);
      setDemoAccount(account); setSession(r.session);
      setUser(r.isMockAuth ? createMockUser(normalized) : r.user);
      setMockAuthenticated(r.isMockAuth); setError(null);
      return r;
    },
    logout: async () => {
      await authService.logout();
      await AsyncStorage.removeItem(DEMO_PHONE_KEY);
      setSession(null); setUser(null); setDemoAccount(null); setMockAuthenticated(false); setError(null);
    },
  }), [demoAccount, error, loading, mockAuthenticated, session, user]);
  if (loading) return <SplashScreen />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
