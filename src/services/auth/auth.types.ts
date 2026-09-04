import type { Session, User } from '@supabase/supabase-js';

export type AuthServiceErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
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

export interface AuthCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthUserResult {
  user: User | null;
  session: Session | null;
}

export interface SignUpResult extends AuthUserResult {
  requiresEmailVerification: boolean;
}

export interface PasswordResetOptions {
  redirectTo?: string;
}
