import { UserRole } from '../types';

// Define permissions by role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  FLEET_MANAGER: ['manage:vehicles', 'manage:maintenance', 'view:dashboard', 'view:vehicles', 'view:maintenance'],
  DRIVER: ['manage:trips', 'view:dashboard', 'view:trips'],
  SAFETY_OFFICER: ['manage:drivers', 'view:dashboard', 'view:drivers'],
  FINANCIAL_ANALYST: ['manage:fuel-expenses', 'view:dashboard', 'view:fuel-expenses', 'view:reports', 'view:analytics'],
};

export function checkPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
