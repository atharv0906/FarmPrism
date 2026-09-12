import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { roleService, RoleServiceError } from '../../services/roles/role.service';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';
import { RoleContext, type RoleContextValue } from '../../hooks/useRole';
import type { AvailableRole } from '../../types/role';
import { createMockFlowService } from '../../services/roles/mockFlow.service';

const mockFlow = createMockFlowService(AsyncStorage);
export function RoleProvider({ children }: PropsWithChildren) {
  const { user, demoAccount } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AvailableRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RoleServiceError | null>(null);
  const [loadedUser, setLoadedUser] = useState<string | null>(null);
  const requestId = useRef(0);
  const reloadRoles = useCallback(async () => {
    const id = ++requestId.current;
    if (!user) { setAvailableRoles([]); setSelectedRole(null); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      if (isDevelopmentMockOtpEnabled()) {
        if (!demoAccount) throw new RoleServiceError('not_assigned', 'Sign in to load your assigned role.');
        const state = await mockFlow.roles(demoAccount);
        if (id !== requestId.current) return;
        setAvailableRoles(state.availableRoles); setSelectedRole(state.selectedRole);
      } else {
        const state = await roleService.loadRoleState(user.id);
        if (id !== requestId.current) return;
        setAvailableRoles(state.availableRoles); setSelectedRole(state.selectedRole);
      }
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setAvailableRoles([]); setSelectedRole(null);
      setError(e instanceof RoleServiceError ? e : new RoleServiceError('unknown_error', 'The application roles could not be loaded.', e));
    } finally { if (id === requestId.current) { setLoadedUser(user.id); setLoading(false); } }
  }, [user, demoAccount]);
  useEffect(() => { void reloadRoles(); return () => { requestId.current++; }; }, [reloadRoles]);
  const value = useMemo<RoleContextValue>(() => ({
    loading: loading || (!!user && loadedUser !== user.id), availableRoles: loadedUser === user?.id ? availableRoles : [],
    selectedRole: loadedUser === user?.id ? selectedRole : null, error, reloadRoles,
    selectRole: async roleId => {
      if (!user) return;
      const assigned = availableRoles.find(r => r.id === roleId);
      if (!assigned || (demoAccount && assigned.code !== demoAccount.role)) {
        setError(new RoleServiceError('not_assigned', 'Sign out to use a different account role.')); return;
      }
      try {
        if (isDevelopmentMockOtpEnabled()) {
          if (!demoAccount) throw new Error('Missing demo identity.');
          const id = requestId.current;
          const selected = await mockFlow.confirmRole(demoAccount, assigned.id);
          if (id !== requestId.current) return;
          setSelectedRole(selected);
        } else setSelectedRole(await roleService.selectRole(user.id, roleId));
        setError(null);
      } catch (e) { setError(new RoleServiceError('unknown_error', 'The application role could not be selected.', e)); }
    },
    clearSelectedRole: () => { if (!demoAccount) setSelectedRole(null); },
  }), [availableRoles, demoAccount, error, loading, loadedUser, reloadRoles, selectedRole, user]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
