import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { AuthServiceError } from '../services/auth/auth.types';

export interface AuthContextValue {
  loading: boolean;
  authenticated: boolean;
  user: User | null;
  session: Session | null;
  authMode: 'supabase' | 'development-mock';
  error: AuthServiceError | null;
  requestOtp: (phone: string) => Promise<{ phone: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
