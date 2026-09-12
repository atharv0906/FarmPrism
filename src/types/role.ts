export type ApplicationRole = 'farmer' | 'buyer' | 'logistics';

export interface AvailableRole {
  id: string;
  code: ApplicationRole;
}

export interface RoleState {
  availableRoles: AvailableRole[];
  selectedRole: AvailableRole | null;
}
