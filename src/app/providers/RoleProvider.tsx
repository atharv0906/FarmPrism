import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { roleService, RoleServiceError } from '../../services/roles/role.service';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';
import { RoleContext, type RoleContextValue } from '../../hooks/useRole';
import type { AvailableRole } from '../../types/role';

const MOCK_ROLES: AvailableRole[] = [
  { id: 'mock-farmer', code: 'farmer' }, { id: 'mock-buyer', code: 'buyer' }, { id: 'mock-logistics', code: 'logistics' },
];
const roleKey = (phone: string) => `farmprism.mock.role.v3:${phone}`;
export function RoleProvider({ children }: PropsWithChildren) {
  const { user, demoAccount } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AvailableRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RoleServiceError | null>(null);
  const requestId = useRef(0);
  const reloadRoles = useCallback(async () => {
    const id = ++requestId.current;
    if (!user) { setAvailableRoles([]); setSelectedRole(null); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      if (isDevelopmentMockOtpEnabled()) {
        const fixed = demoAccount ? MOCK_ROLES.find(r => r.code === demoAccount.role)! : null;
        const stored = fixed?.id ?? await AsyncStorage.getItem(roleKey(user.phone!));
        if (fixed) await AsyncStorage.setItem(roleKey(user.phone!), fixed.id);
        if (id !== requestId.current) return;
        setAvailableRoles(fixed ? [fixed] : MOCK_ROLES);
        setSelectedRole(fixed ?? MOCK_ROLES.find(r => r.id === stored) ?? null);
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
    } finally { if (id === requestId.current) setLoading(false); }
  }, [user, demoAccount]);
  useEffect(() => { void reloadRoles(); }, [reloadRoles]);
  const value = useMemo<RoleContextValue>(() => ({
    loading: demoAccount ? false : loading, availableRoles,
    selectedRole: demoAccount ? MOCK_ROLES.find(r => r.code === demoAccount.role)! : selectedRole, error, reloadRoles,
    selectRole: async roleId => {
      if (!user) return;
      const assigned = availableRoles.find(r => r.id === roleId);
      if (!assigned || (demoAccount && assigned.code !== demoAccount.role)) {
        setError(new RoleServiceError('not_assigned', 'Sign out to use a different account role.')); return;
      }
      try {
        if (isDevelopmentMockOtpEnabled()) {
          await AsyncStorage.setItem(roleKey(user.phone!), assigned.id); setSelectedRole(assigned);
        } else setSelectedRole(await roleService.selectRole(user.id, roleId));
        setError(null);
      } catch (e) { setError(new RoleServiceError('unknown_error', 'The application role could not be selected.', e)); }
    },
    clearSelectedRole: () => { if (!demoAccount) setSelectedRole(null); },
  }), [availableRoles, demoAccount, error, loading, reloadRoles, selectedRole, user]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
