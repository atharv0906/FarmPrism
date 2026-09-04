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

function createDevelopmentMockUser(phone: string): User {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: '',
    phone,
    app_metadata: { provider: 'phone', providers: ['phone'] },
    user_metadata: { development_mock_auth: true },
    identities: [],
    created_at: '1970-01-01T00:00:00.000Z',
    confirmed_at: '1970-01-01T00:00:00.000Z',
    last_sign_in_at: '1970-01-01T00:00:00.000Z',
    phone_confirmed_at: '1970-01-01T00:00:00.000Z',
    is_anonymous: false,
    is_sso_user: false,
  };
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
      user: createDevelopmentMockUser(phone),
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
