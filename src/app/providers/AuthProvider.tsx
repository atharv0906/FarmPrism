import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';
import { authService, toAuthServiceError } from '../../services/auth/auth.service';
import type { AuthServiceError } from '../../services/auth/auth.types';
import { AuthContext, type AuthContextValue } from '../../hooks/useAuth';
import { SplashScreen } from '../../screens/SplashScreen';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthServiceError | null>(null);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const mockAuthEnabled = isDevelopmentMockOtpEnabled();

    const subscription = mockAuthEnabled
      ? null
      : supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          setError(null);
          if (restoredRef.current) {
            setLoading(false);
          }
      });

    if (mockAuthEnabled) {
      restoredRef.current = true;
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    void authService.restoreSession()
      .then((restored) => {
        if (!mounted) {
          return;
        }

        setSession(restored.session);
        setUser(restored.user);
        setMockAuthenticated(false);
        setError(null);
      })
      .catch((restoreError: unknown) => {
        if (!mounted) {
          return;
        }

        setSession(null);
        setUser(null);
        setMockAuthenticated(false);
        setError(toAuthServiceError(restoreError));
      })
      .finally(() => {
        if (mounted) {
          restoredRef.current = true;
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      authenticated: Boolean((session && user) || mockAuthenticated),
      user,
      session,
      authMode: mockAuthenticated ? 'development-mock' : 'supabase',
      error,
      requestOtp: async (phone) => {
        const result = await authService.requestOtp(phone);
        setError(null);
        return result;
      },
      verifyOtp: async (phone, token) => {
        const result = await authService.verifyOtp(phone, token);
        setSession(result.session);
        setUser(result.user);
        setMockAuthenticated(result.isMockAuth);
        setError(null);
        return result;
      },
      logout: async () => {
        await authService.logout();
        setSession(null);
        setUser(null);
        setMockAuthenticated(false);
        setError(null);
      },
    }),
    [error, loading, mockAuthenticated, session, user],
  );

  if (loading) {
    return <SplashScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

