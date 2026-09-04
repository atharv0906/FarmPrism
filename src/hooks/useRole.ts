import { createContext, useContext } from 'react';

import type { RoleServiceError } from '../services/roles/role.service';
import type { AvailableRole } from '../types/role';

export interface RoleContextValue {
  loading: boolean;
  availableRoles: AvailableRole[];
  selectedRole: AvailableRole | null;
  error: RoleServiceError | null;
  selectRole: (roleId: string) => Promise<void>;
  reloadRoles: () => Promise<void>;
}

export const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error('useRole must be used within a RoleProvider.');
  }

  return context;
}
