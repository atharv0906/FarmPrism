import type { PostgrestError, User as SupabaseAuthUser } from '@supabase/supabase-js';

import { supabase } from './client';
import type { ApplicationRole, AuthSession, UserRole } from './types';

export async function getCurrentAuthenticatedUser(): Promise<{
  data: SupabaseAuthUser | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.auth.getUser();

  return {
    data: data.user,
    error,
  };
}

export async function getCurrentSession(): Promise<{
  data: AuthSession | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.auth.getSession();

  return {
    data: data.session,
    error,
  };
}

function collectApplicationRoles(value: unknown, roles: Set<ApplicationRole>) {
  if (typeof value === 'string') {
    if (value === 'farmer' || value === 'buyer' || value === 'logistics') {
      roles.add(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectApplicationRoles(item, roles));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectApplicationRoles(item, roles));
  }
}

export async function getUserApplicationRoles(): Promise<{
  data: ApplicationRole[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase.from('user_roles').select('*, roles(*)');

  if (error) {
    return { data: [], error };
  }

  const roles = new Set<ApplicationRole>();
  collectApplicationRoles(data, roles);

  return {
    data: [...roles],
    error: null,
  };
}

export type { UserRole };
