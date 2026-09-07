import { Role } from '@prisma/client';

/**
 * STANDARD PERMISSION KEYS
 */
export const Permissions = {
  // Users & Access
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Courses & Curriculum
  COURSES_READ: 'courses:read',
  COURSES_CREATE: 'courses:create',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',
  COURSES_APPROVE: 'courses:approve',
  COURSES_ARCHIVE: 'courses:archive',
  COURSES_SUBMIT: 'courses:submit',
  COURSES_REJECT: 'courses:reject',
  COURSES_PUBLISH: 'courses:publish',
  COURSES_WRITE: 'courses:write',

  // Assessments & Quizzes
  ASSESSMENTS_READ: 'assessments:read',
  ASSESSMENTS_CREATE: 'assessments:create',
  ASSESSMENTS_UPDATE: 'assessments:update',
  ASSESSMENTS_TAKE: 'assessments:take',
  ASSESSMENTS_EVALUATE: 'assessments:evaluate',

  // Competencies & Skill Gaps
  COMPETENCIES_READ: 'competencies:read',
  COMPETENCIES_MANAGE: 'competencies:manage',

  // Organization & Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ORGANIZATION_MANAGE: 'organization:manage',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions] | '*';

/**
 * DEFAULT PERMISSION MAPPINGS BY ROLE
 */
export const permissionsMap: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'], // Unrestricted access bypass
  ADMIN: [
    Permissions.USERS_READ,
    Permissions.USERS_WRITE,
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_APPROVE,
    Permissions.COURSES_ARCHIVE,
    Permissions.COURSES_SUBMIT,
    Permissions.COURSES_REJECT,
    Permissions.COURSES_PUBLISH,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
    Permissions.COMPETENCIES_MANAGE,
    Permissions.ANALYTICS_VIEW,
    Permissions.ORGANIZATION_MANAGE,
  ],
  TRAINER: [
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_SUBMIT,
    Permissions.COURSES_ARCHIVE,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_UPDATE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
  ],
  TRAINEE: [
    Permissions.COURSES_READ,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_TAKE,
    Permissions.COMPETENCIES_READ,
  ],
};

/**
 * Evaluates whether a role or explicit permission set satisfies required permissions
 */
export const hasPermission = (
  userRole: Role,
  userPermissions: string[] = [],
  requiredPermission: string,
): boolean => {
  if (userRole === Role.SUPER_ADMIN || userPermissions.includes('*')) {
    return true;
  }
  const rolePermissions = permissionsMap[userRole] || [];
  return rolePermissions.includes(requiredPermission) || userPermissions.includes(requiredPermission);
};

export default permissionsMap;
