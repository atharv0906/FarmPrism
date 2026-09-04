import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';
import { authService, toAuthServiceError } from '../../services/auth/auth.service';
import type { AuthServiceError } from '../../services/auth/auth.types';
import { AuthContext, type AuthContextValue } from '../../hooks/useAuth';
import { SplashScreen } from '../../screens/SplashScreen';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthServiceError | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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

    void authService
      .restoreSession()
      .then((restored) => {
        if (!mounted) {
          return;
        }

        setSession(restored.session);
        setUser(restored.user);
        setError(null);
      })
      .catch((restoreError: unknown) => {
        if (!mounted) {
          return;
        }

        setSession(null);
        setUser(null);
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
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      authenticated: Boolean(session && user),
      user,
      session,
      error,
      requestOtp: async (phone) => {
        const result = await authService.requestOtp(phone);
        setError(null);
        return result;
      },
      verifyOtp: async (phone, token) => {
        const result = await authService.verifyOtp(phone, token);
        setError(null);
        return result;
      },
      logout: async () => {
        await authService.logout();
        setError(null);
      },
    }),
    [error, loading, session, user],
  );

  if (loading) {
    return <SplashScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

