import { useAuth } from './useAuth';

export function useCurrentUser() {
  const { user, session, loading, authenticated, error } = useAuth();

  return {
    user,
    session,
    loading,
    authenticated,
    error,
  };
}
