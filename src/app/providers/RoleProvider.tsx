import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { useAuth } from '../../hooks/useAuth';
import {
  RoleServiceError,
  roleService,
} from '../../services/roles/role.service';
import { RoleContext, type RoleContextValue } from '../../hooks/useRole';
import type { AvailableRole } from '../../types/role';

export function RoleProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AvailableRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RoleServiceError | null>(null);
  const requestId = useRef(0);

  const normalizeRoleError = (roleError: unknown): RoleServiceError => {
    if (roleError instanceof RoleServiceError) {
      return roleError;
    }

    return new RoleServiceError(
      'unknown_error',
      'The application roles could not be loaded.',
      roleError,
    );
  };

  const reloadRoles = useCallback(async () => {
    const currentRequest = ++requestId.current;

    if (!user) {
      setAvailableRoles([]);
      setSelectedRole(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const state = await roleService.loadRoleState(user.id);
      if (currentRequest !== requestId.current) {
        return;
      }

      setAvailableRoles(state.availableRoles);
      setSelectedRole(state.selectedRole);
      setError(null);
    } catch (roleError) {
      if (currentRequest !== requestId.current) {
        return;
      }

      setAvailableRoles([]);
      setSelectedRole(null);
      setError(normalizeRoleError(roleError));
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    void reloadRoles();
  }, [reloadRoles]);

  const value = useMemo<RoleContextValue>(
    () => ({
      loading,
      availableRoles,
      selectedRole,
      error,
      selectRole: async (roleId) => {
        if (!user) {
          return;
        }

        const assignedRole = availableRoles.find((role) => role.id === roleId);
        if (!assignedRole) {
          setError(
            new RoleServiceError(
              'not_assigned',
              'The selected role is not assigned to this user.',
            ),
          );
          return;
        }

        try {
          const role = await roleService.selectRole(user.id, roleId);
          setSelectedRole(role);
          setError(null);
        } catch (roleError) {
          setError(normalizeRoleError(roleError));
        }
      },
      reloadRoles,
    }),
    [availableRoles, error, loading, reloadRoles, selectedRole, user],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
