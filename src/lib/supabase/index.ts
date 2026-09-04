export { requireSupabaseClient, supabase, initializeAuthSessionRefresh } from './client';
export { getCurrentAuthenticatedUser, getCurrentSession, getUserApplicationRoles } from './helpers';
export type {
  ApplicationRole,
  AuthSession,
  Database,
  Role,
  User,
  UserPreferences,
  UserRole,
} from './types';
