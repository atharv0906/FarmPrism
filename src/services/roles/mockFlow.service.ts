import type { DemoAccount } from '../demo/demo.types';
import type { AvailableRole } from '../../types/role';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> };
export const roleKey = (phone: string) => `farmprism.mock.role.v3:${phone}`;
export const farmerOnboardingKey = (phone: string) => `farmprism.mock.farmerOnboarding.v1:${phone}`;
export function createMockFlowService(storage: Storage) {
  return {
    async roles(account: DemoAccount) {
      const assigned: AvailableRole = { id: 'mock-' + account.role, code: account.role };
      const stored = await storage.getItem(roleKey(account.phone));
      return { availableRoles: [assigned], selectedRole: stored === assigned.id ? assigned : null };
    },
    async confirmRole(account: DemoAccount, roleId: string): Promise<AvailableRole> {
      if (roleId !== 'mock-' + account.role) throw new Error('This role is not assigned to your account.');
      await storage.setItem(roleKey(account.phone), roleId);
      return { id: roleId, code: account.role };
    },
    async farmerStart(phone: string): Promise<'Personal' | 'Dashboard'> {
      return await storage.getItem(farmerOnboardingKey(phone)) === 'complete' ? 'Dashboard' : 'Personal';
    },
    async completeFarmer(account: DemoAccount) {
      if (account.role !== 'farmer') throw new Error('Farmer onboarding requires a Farmer account.');
      await storage.setItem(farmerOnboardingKey(account.phone), 'complete');
    },
  };
}
