import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { AuthServiceError } from '../services/auth/auth.types';

export interface AuthContextValue {
  loading: boolean;
  authenticated: boolean;
  user: User | null;
  session: Session | null;
  error: AuthServiceError | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{
    user: User | null;
    session: Session | null;
    requiresEmailVerification: boolean;
  }>;
  login: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
  }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
