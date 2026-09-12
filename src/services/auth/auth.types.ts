import type { Session, User } from '@supabase/supabase-js';

export type AuthServiceErrorCode =
  | 'invalid_phone'
  | 'invalid_otp'
  | 'otp_expired'
  | 'otp_not_sent'
  | 'network_error'
  | 'session_expired'
  | 'supabase_error'
  | 'unknown_error';

export class AuthServiceError extends Error {
  readonly code: AuthServiceErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    code: AuthServiceErrorCode,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
    this.status = options?.status;
    this.cause = options?.cause;
  }
}

export interface OtpRequestResult {
  phone: string;
}

export interface OtpVerificationResult {
  user: User | null;
  session: Session | null;
  isMockAuth: boolean;
}
