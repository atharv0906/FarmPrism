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
import { demoSessionClient } from '../../services/api/demoSession.client';
import { createDemoSessionService } from '../../services/auth/demoSession.service';
import type { DemoAccount } from '../../services/demo/demo.types';
import { getCurrentDemoApiToken, setCurrentDemoApiToken, onApiUnauthorized } from '../../services/api/api.client';


const demoSessions = createDemoSessionService(SecureStore, AsyncStorage, demoSessionClient);

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
  const [demoApiToken, setDemoApiToken] = useState<string | null>(null);
  const [demoApiSessionReady, setDemoApiSessionReady] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    onApiUnauthorized(() => {
      setCurrentDemoApiToken(null);
      setDemoApiToken(null); setMockAuthenticated(false); setDemoAccount(null); setUser(null);
      setDemoApiSessionReady(false);
      void demoSessions.clear().catch(() => {});
    });
    return () => onApiUnauthorized(null);
  }, []);

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
        const restored = await demoSessions.restore();
        if (mounted && restored) {
          setCurrentDemoApiToken(restored.token); setDemoApiToken(restored.token);
          setDemoAccount(restored.account); setUser(createMockUser(restored.account.phone)); setMockAuthenticated(true);
        } else if (mounted) { setCurrentDemoApiToken(null); setDemoApiToken(null); }
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
      let account: DemoAccount | null = null;
      if (r.isMockAuth) {
        const sessionData = await demoSessions.login(normalized, token);
        account = sessionData.account;
        setCurrentDemoApiToken(sessionData.token); setDemoApiToken(sessionData.token); setDemoApiSessionReady(true);
      }
      setDemoAccount(account); setSession(r.session);
      setUser(r.isMockAuth && account ? createMockUser(account.phone) : r.user);
      setMockAuthenticated(r.isMockAuth); setError(null);
      return r;
    },
    logout: async () => {
      const tokenToRevoke = demoApiToken ?? getCurrentDemoApiToken();
      await demoSessions.logout(tokenToRevoke);
      setCurrentDemoApiToken(null);
      await authService.logout();
      setSession(null); setUser(null); setDemoAccount(null); setMockAuthenticated(false); setError(null); setDemoApiToken(null); setDemoApiSessionReady(false);
    },
  }), [demoAccount, demoApiSessionReady, demoApiToken, error, loading, mockAuthenticated, session, user]);
  if (loading) return <SplashScreen />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
