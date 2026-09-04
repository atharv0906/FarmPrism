import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';
import {
  AuthServiceError,
  type OtpRequestResult,
  type OtpVerificationResult,
} from './auth.types';
import {
  DevelopmentMockOtpStrategy,
  isDevelopmentMockOtpEnabled,
  type OtpStrategy,
} from './otp.strategy';

export function normalizeIndianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const withoutCountryCode = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;

  if (!/^[6-9]\d{9}$/.test(withoutCountryCode)) {
    throw new AuthServiceError('invalid_phone', 'Enter a valid 10-digit Indian mobile number.');
  }

  return `+91${withoutCountryCode}`;
}

function toAuthServiceError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) {
    return error;
  }

  const authError = error as Partial<AuthError> | null;
  const message = authError?.message ?? 'An unexpected authentication error occurred.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid phone')) {
    return new AuthServiceError('invalid_phone', 'Enter a valid Indian mobile number.', {
      status: authError?.status,
      cause: error,
    });
  }

  if (
    normalizedMessage.includes('invalid') &&
    (normalizedMessage.includes('otp') || normalizedMessage.includes('token'))
  ) {
    return new AuthServiceError('invalid_otp', 'That OTP is invalid. Check the code and try again.', {
      status: authError?.status,
      cause: error,
    });
  }

  if (
    normalizedMessage.includes('expired') &&
    (normalizedMessage.includes('otp') || normalizedMessage.includes('token'))
  ) {
    return new AuthServiceError('otp_expired', 'That OTP has expired. Request a new one.', {
      status: authError?.status,
      cause: error,
    });
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
  async requestOtp(phone: string): Promise<OtpRequestResult> {
    try {
      const normalizedPhone = normalizeIndianPhone(phone);
      if (isDevelopmentMockOtpEnabled()) {
        await otpStrategy.request(normalizedPhone);
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone });
        throwOnError(error);
      }

      return { phone: normalizedPhone };
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async verifyOtp(phone: string, token: string): Promise<OtpVerificationResult> {
    try {
      const normalizedPhone = normalizeIndianPhone(phone);
      if (isDevelopmentMockOtpEnabled()) {
        return await otpStrategy.verify(normalizedPhone, token);
      }

      if (!/^\d{6}$/.test(token)) {
        throw new AuthServiceError('invalid_otp', 'Enter the 6-digit OTP sent to your phone.');
      }

      const { data, error } = await supabase.auth.verifyOtp({ phone: normalizedPhone, token, type: 'sms' });
      throwOnError(error);
      return { user: data.user, session: data.session, isMockAuth: false };
    } catch (error) {
      throw toAuthServiceError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      if (isDevelopmentMockOtpEnabled()) {
        await otpStrategy.logout();
        return;
      }

      const { error } = await supabase.auth.signOut();
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

const otpStrategy: OtpStrategy = new DevelopmentMockOtpStrategy();

export { toAuthServiceError };
