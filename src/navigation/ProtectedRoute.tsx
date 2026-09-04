import type { ReactNode } from 'react';

import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import type { ApplicationRole } from '../types/role';

interface ProtectedRouteProps {
  requiredRole: ApplicationRole;
  children: ReactNode;
}

export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { authenticated } = useAuth();
  const { selectedRole } = useRole();

  if (!authenticated || selectedRole?.code !== requiredRole) {
    return null;
  }

  return children;
}
