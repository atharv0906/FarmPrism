import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';
import {
  AuthServiceError,
  type AuthCredentials,
  type AuthUserResult,
  type PasswordResetOptions,
  type SignUpResult,
} from './auth.types';

function toAuthServiceError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) {
    return error;
  }

  const authError = error as Partial<AuthError> | null;
  const message = authError?.message ?? 'An unexpected authentication error occurred.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return new AuthServiceError('invalid_credentials', 'The email or password is incorrect.', {
      status: authError?.status,
      cause: error,
    });
  }

  if (
    normalizedMessage.includes('email not confirmed') ||
    normalizedMessage.includes('email_not_confirmed')
  ) {
    return new AuthServiceError(
      'email_not_confirmed',
      'Please verify your email address before signing in.',
      { status: authError?.status, cause: error },
    );
  }

  if (
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('fetch') ||
    normalizedMessage.includes('connection')
  ) {
    return new AuthServiceError('network_error', 'Unable to reach the authentication service.', {
      status: authError?.status,
      cause: error,
    });
  }

  if (
    normalizedMessage.includes('session') ||
    normalizedMessage.includes('token') ||
    normalizedMessage.includes('refresh')
  ) {
    return new AuthServiceError('session_expired', 'Your session has expired. Please sign in again.', {
      status: authError?.status,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AuthServiceError('supabase_error', error.message, {
      status: authError?.status,
      cause: error,
    });
  }

  return new AuthServiceError('unknown_error', message, {
    status: authError?.status,
    cause: error,
  });
}

function throwOnError(error: AuthError | null): void {
  if (error) {
    throw toAuthServiceError(error);
  }
}

export const authService = {
  async signUp({ email, password, fullName }: AuthCredentials): Promise<SignUpResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: fullName ? { data: { full_name: fullName } } : undefined,
      });
      throwOnError(error);

      return {
        user: data.user,
        session: data.session,
        requiresEmailVerification: Boolean(data.user && !data.session),
      };
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async login({ email, password }: AuthCredentials): Promise<AuthUserResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      throwOnError(error);

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      throwOnError(error);
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async requestPasswordReset(email: string, options?: PasswordResetOptions): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: options?.redirectTo,
      });
      throwOnError(error);
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async restoreSession(): Promise<{ session: Session | null; user: User | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      throwOnError(error);

      return {
        session: data.session,
        user: data.session?.user ?? null,
      };
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },
};

export { toAuthServiceError };
