import type { Session, User } from '@supabase/supabase-js';

import { publicEnv } from '../../config/env';
import { AuthServiceError } from './auth.types';

export interface OtpVerificationResult {
  user: User | null;
  session: Session | null;
  isMockAuth: boolean;
}

export interface OtpStrategy {
  request(phone: string): Promise<void>;
  verify(phone: string, token: string): Promise<OtpVerificationResult>;
  logout(): Promise<void>;
}

export class DevelopmentMockOtpStrategy implements OtpStrategy {
  // Temporary development-only OTP mock. Disable this before enabling real Supabase SMS.
  async request(): Promise<void> {
    return undefined;
  }

  async verify(phone: string, token: string): Promise<OtpVerificationResult> {
    if (!/^\d{6}$/.test(token)) {
      throw new AuthServiceError('invalid_otp', 'Enter the 6-digit OTP sent to your phone.');
    }

    return {
      user: null,
      session: null,
      isMockAuth: true,
    };
  }

  async logout(): Promise<void> {
    return undefined;
  }
}

export function isDevelopmentMockOtpEnabled() {
  return publicEnv.mockOtp;
}
