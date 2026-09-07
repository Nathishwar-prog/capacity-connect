import { Role } from '@prisma/client';

/**
 * CAPACITY CONNECT SOURCE-DEFINED RBAC PERMISSION KEYS
 * Explicitly specified in project sources:
 * - user:read
 * - user:approve
 * - user:reject
 * - user:role:update
 * - course:create
 * - course:update
 * - course:approve
 * - assessment:create
 * - resource:upload
 * - analytics:view
 */
export const Permissions = {
  // Official Source Permissions
  USER_READ: 'user:read',
  USER_APPROVE: 'user:approve',
  USER_REJECT: 'user:reject',
  USER_ROLE_UPDATE: 'user:role:update',

  COURSE_CREATE: 'course:create',
  COURSE_UPDATE: 'course:update',
  COURSE_APPROVE: 'course:approve',

  ASSESSMENT_CREATE: 'assessment:create',
  RESOURCE_UPLOAD: 'resource:upload',
  ANALYTICS_VIEW: 'analytics:view',

  // Legacy / Backward Compatibility Aliases
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  COURSES_READ: 'courses:read',
  COURSES_CREATE: 'courses:create',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',
  COURSES_APPROVE: 'courses:approve',
  COURSES_WRITE: 'courses:write',
  ASSESSMENTS_READ: 'assessments:read',
  ASSESSMENTS_CREATE: 'assessments:create',
  ASSESSMENTS_UPDATE: 'assessments:update',
  ASSESSMENTS_TAKE: 'assessments:take',
  ASSESSMENTS_EVALUATE: 'assessments:evaluate',
  COMPETENCIES_READ: 'competencies:read',
  COMPETENCIES_MANAGE: 'competencies:manage',
  ORGANIZATION_MANAGE: 'organization:manage',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions] | string;

/**
 * The 10 Source-Defined Permissions explicitly required by the project specifications
 */
export const SOURCE_PERMISSIONS: readonly string[] = [
  Permissions.USER_READ,
  Permissions.USER_APPROVE,
  Permissions.USER_REJECT,
  Permissions.USER_ROLE_UPDATE,
  Permissions.COURSE_CREATE,
  Permissions.COURSE_UPDATE,
  Permissions.COURSE_APPROVE,
  Permissions.ASSESSMENT_CREATE,
  Permissions.RESOURCE_UPLOAD,
  Permissions.ANALYTICS_VIEW,
] as const;

/**
 * DEFAULT PERMISSION MAPPINGS BY ROLE
 * ADMIN: manage users, manage courses, manage platform
 * TRAINER: manage own courses, upload resources, create assessments, monitor own trainees
 * TRAINEE: enroll, learn, take assessments
 * SUPER_ADMIN: platform root governance (wildcard bypass)
 */
export const permissionsMap: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'], // Unrestricted access bypass
  ADMIN: [
    // Source permissions
    Permissions.USER_READ,
    Permissions.USER_APPROVE,
    Permissions.USER_REJECT,
    Permissions.USER_ROLE_UPDATE,
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.COURSE_APPROVE,
    Permissions.ASSESSMENT_CREATE,
    Permissions.RESOURCE_UPLOAD,
    Permissions.ANALYTICS_VIEW,
    // Legacy compatibility keys
    Permissions.USERS_READ,
    Permissions.USERS_WRITE,
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_APPROVE,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
    Permissions.COMPETENCIES_MANAGE,
    Permissions.ANALYTICS_VIEW,
    Permissions.ORGANIZATION_MANAGE,
  ],
  TRAINER: [
    // Source permissions
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.ASSESSMENT_CREATE,
    Permissions.RESOURCE_UPLOAD,
    Permissions.ANALYTICS_VIEW,
    // Legacy compatibility keys
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_UPDATE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
  ],
  TRAINEE: [
    // Learners have read-access to course catalog and assessment taking
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
  return (
    rolePermissions.includes(requiredPermission) || userPermissions.includes(requiredPermission)
  );
};

export default permissionsMap;
