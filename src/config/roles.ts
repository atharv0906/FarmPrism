import type { ApplicationRole } from '../types/role';

export const APPLICATION_ROLE_CODES = ['farmer', 'buyer', 'logistics'] as const;

export function isApplicationRole(value: string | null | undefined): value is ApplicationRole {
  return Boolean(
    value &&
      APPLICATION_ROLE_CODES.includes(
        value as (typeof APPLICATION_ROLE_CODES)[number],
      ),
  );
}
