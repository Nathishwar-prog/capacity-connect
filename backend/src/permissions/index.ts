import { Role } from '@prisma/client';

/**
 * APPLICATION PERMISSION CONFIGURATIONS
 *
 * Maps user roles to arrays of fine-grained action tags.
 */
export const permissionsMap: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'], // Unrestricted access
  ADMIN: [
    'users:read',
    'users:write',
    'courses:read',
    'courses:approve',
    'competencies:manage',
    'analytics:view',
  ],
  TRAINER: [
    'courses:read',
    'courses:write',
    'assessments:create',
    'assessments:evaluate',
  ],
  TRAINEE: [
    'courses:read',
    'assessments:take',
  ],
};

/**
 * Checks if a role has access to specific tags
 */
export const hasAccess = (role: Role, requiredPermission: string): boolean => {
  const granted = permissionsMap[role] || [];
  return granted.includes('*') || granted.includes(requiredPermission);
};
