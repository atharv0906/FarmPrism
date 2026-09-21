import type { PostgrestError } from '@supabase/supabase-js';

import { isApplicationRole } from '../../config/roles';
import { requireSupabaseClient } from '../../lib/supabase/client';
import type { ApplicationRole, AvailableRole, RoleState } from '../../types/role';

type RoleRow = {
  id: string;
  code: string | null;
};

type UserRoleRow = {
  role_id: string;
};

type LastRolePreferenceRow = {
  last_role_id: string | null;
};

export type RoleServiceErrorCode =
  | 'not_assigned'
  | 'unknown_role'
  | 'database_error'
  | 'unknown_error';

export class RoleServiceError extends Error {
  readonly code: RoleServiceErrorCode;
  readonly cause?: unknown;

  constructor(code: RoleServiceErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'RoleServiceError';
    this.code = code;
    this.cause = cause;
  }
}

function databaseError(message: string, cause: unknown): RoleServiceError {
  return new RoleServiceError('database_error', message, cause);
}

function toRole(row: RoleRow): AvailableRole | null {
  return row.id && isApplicationRole(row.code)
    ? { id: row.id, code: row.code }
    : null;
}

async function getAssignedRoleIds(userId: string): Promise<string[]> {
  const { data, error } = await requireSupabaseClient()
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (error) {
    throw databaseError('The user roles could not be loaded.', error);
  }

  return ((data ?? []) as unknown as UserRoleRow[])
    .map((row) => row.role_id)
    .filter((roleId): roleId is string => Boolean(roleId));
}

async function getRolesByIds(roleIds: string[]): Promise<AvailableRole[]> {
  if (roleIds.length === 0) {
    return [];
  }

  const { data, error } = await requireSupabaseClient()
    .from('roles')
    .select('id, code')
    .in('id', roleIds);

  if (error) {
    throw databaseError('The available application roles could not be loaded.', error);
  }

  const roles = ((data ?? []) as unknown as RoleRow[])
    .map(toRole)
    .filter((role): role is AvailableRole => role !== null);

  return roles.filter(
    (role, index) => roles.findIndex((candidate) => candidate.id === role.id) === index,
  );
}

async function getLastRoleId(userId: string): Promise<string | null> {
  const { data, error } = await requireSupabaseClient()
    .from('user_preferences')
    .select('last_role_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw databaseError('The last selected role could not be loaded.', error);
  }

  return ((data ?? null) as unknown as LastRolePreferenceRow | null)?.last_role_id ?? null;
}

async function verifyRoleAssignment(userId: string, roleId: string): Promise<AvailableRole> {
  const { data: roleData, error: roleError } = await requireSupabaseClient()
    .from('roles')
    .select('id, code')
    .eq('id', roleId)
    .maybeSingle();

  if (roleError) {
    throw databaseError('The selected role could not be verified.', roleError);
  }

  const role = roleData ? toRole(roleData as unknown as RoleRow) : null;
  if (!role) {
    throw new RoleServiceError('unknown_role', 'The selected role is not recognized.');
  }

  const { data: assignment, error: assignmentError } = await requireSupabaseClient()
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (assignmentError) {
    throw databaseError('The selected role assignment could not be verified.', assignmentError);
  }

  if (!assignment) {
    throw new RoleServiceError('not_assigned', 'The selected role is not assigned to this user.');
  }

  return role;
}

async function persistLastRole(userId: string, roleId: string): Promise<void> {
  const { error } = await requireSupabaseClient()
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        last_role_id: roleId,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw databaseError('The selected role could not be saved.', error);
  }
}

export const roleService = {
  async loadRoleState(userId: string): Promise<RoleState> {
    try {
      const roleIds = await getAssignedRoleIds(userId);
      const availableRoles = await getRolesByIds(roleIds);
      const lastRoleId = await getLastRoleId(userId);
      const validLastRole = availableRoles.find((role) => role.id === lastRoleId) ?? null;

      if (availableRoles.length === 1) {
        const onlyRole = availableRoles[0];
        if (onlyRole.id !== lastRoleId) {
          await persistLastRole(userId, onlyRole.id);
        }
        return { availableRoles, selectedRole: onlyRole };
      }

      return {
        availableRoles,
        selectedRole: validLastRole,
      };
    } catch (error) {
      if (error instanceof RoleServiceError) {
        throw error;
      }

      throw new RoleServiceError('unknown_error', 'The application roles could not be loaded.', error);
    }
  },

  async selectRole(userId: string, roleId: string): Promise<AvailableRole> {
    try {
      const role = await verifyRoleAssignment(userId, roleId);
      await persistLastRole(userId, role.id);
      return role;
    } catch (error) {
      if (error instanceof RoleServiceError) {
        throw error;
      }

      throw new RoleServiceError('unknown_error', 'The application role could not be selected.', error);
    }
  },
};

export type { ApplicationRole, PostgrestError };
