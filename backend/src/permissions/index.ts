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

  // Granular Operational Permissions
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_WRITE: 'users:write',

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

  ASSESSMENTS_READ: 'assessments:read',
  ASSESSMENTS_CREATE: 'assessments:create',
  ASSESSMENTS_UPDATE: 'assessments:update',
  ASSESSMENTS_GRADE: 'assessments:grade',
  ASSESSMENTS_TAKE: 'assessments:take',
  ASSESSMENTS_EVALUATE: 'assessments:evaluate',

  COMPETENCIES_READ: 'competencies:read',
  COMPETENCIES_MANAGE: 'competencies:manage',

  SKILL_GAPS_READ: 'skill-gaps:read',
  SKILL_GAPS_MANAGE: 'skill-gaps:manage',

  RECOMMENDATIONS_READ: 'recommendations:read',
  RECOMMENDATIONS_MANAGE: 'recommendations:manage',

  REVISION_READ: 'revision:read',
  REVISION_GENERATE: 'revision:generate',

  ANALYTICS_READ: 'analytics:read',

  TRAINER_READ: 'trainer:read',
  TRAINER_MANAGE: 'trainer:manage',

  // Resource Library
  RESOURCES_READ: 'resources:read',
  RESOURCES_CREATE: 'resources:create',
  RESOURCES_UPDATE: 'resources:update',
  RESOURCES_APPROVE: 'resources:approve',
  RESOURCES_PUBLISH: 'resources:publish',
  RESOURCES_DELETE: 'resources:delete',
  RESOURCES_MANAGE: 'resources:manage',

  // Organization
  ORGANIZATION_MANAGE: 'organization:manage',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions] | string;

/**
 * The Source-Defined Permissions required by the project specifications
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
  Permissions.SKILL_GAPS_READ,
  Permissions.RECOMMENDATIONS_READ,
  Permissions.REVISION_READ,
] as const;

/**
 * DEFAULT PERMISSION MAPPINGS BY ROLE
 * ADMIN: manage users, manage courses, manage platform
 * TRAINER: manage own courses, upload resources, create assessments, monitor own trainees
 * TRAINEE: enroll, learn, take assessments, revision, recommendations
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
    // Granular keys
    Permissions.USERS_READ,
    Permissions.USERS_CREATE,
    Permissions.USERS_UPDATE,
    Permissions.USERS_DELETE,
    Permissions.USERS_WRITE,
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_APPROVE,
    Permissions.COURSES_ARCHIVE,
    Permissions.COURSES_SUBMIT,
    Permissions.COURSES_REJECT,
    Permissions.COURSES_PUBLISH,
    Permissions.COURSES_DELETE,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_UPDATE,
    Permissions.ASSESSMENTS_GRADE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
    Permissions.COMPETENCIES_MANAGE,
    Permissions.SKILL_GAPS_READ,
    Permissions.SKILL_GAPS_MANAGE,
    Permissions.RECOMMENDATIONS_READ,
    Permissions.RECOMMENDATIONS_MANAGE,
    Permissions.REVISION_READ,
    Permissions.REVISION_GENERATE,
    Permissions.ANALYTICS_READ,
    Permissions.TRAINER_READ,
    Permissions.TRAINER_MANAGE,
    Permissions.RESOURCES_READ,
    Permissions.RESOURCES_CREATE,
    Permissions.RESOURCES_UPDATE,
    Permissions.RESOURCES_APPROVE,
    Permissions.RESOURCES_PUBLISH,
    Permissions.RESOURCES_DELETE,
    Permissions.RESOURCES_MANAGE,
    Permissions.ORGANIZATION_MANAGE,
  ],
  TRAINER: [
    // Source permissions
    Permissions.COURSE_CREATE,
    Permissions.COURSE_UPDATE,
    Permissions.ASSESSMENT_CREATE,
    Permissions.RESOURCE_UPLOAD,
    Permissions.ANALYTICS_VIEW,
    // Granular keys
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_SUBMIT,
    Permissions.COURSES_ARCHIVE,
    Permissions.COURSES_PUBLISH,
    Permissions.COURSES_DELETE,
    Permissions.COURSES_WRITE,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_UPDATE,
    Permissions.ASSESSMENTS_GRADE,
    Permissions.ASSESSMENTS_EVALUATE,
    Permissions.COMPETENCIES_READ,
    Permissions.SKILL_GAPS_READ,
    Permissions.RECOMMENDATIONS_READ,
    Permissions.REVISION_READ,
    Permissions.ANALYTICS_READ,
    Permissions.TRAINER_READ,
    Permissions.RESOURCES_READ,
    Permissions.RESOURCES_CREATE,
    Permissions.RESOURCES_UPDATE,
    Permissions.RESOURCES_PUBLISH,
    Permissions.RESOURCES_MANAGE,
  ],
  TRAINEE: [
    // Learners have read-access to catalog, assessment taking, revision, recommendations
    Permissions.COURSES_READ,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_TAKE,
    Permissions.COMPETENCIES_READ,
    Permissions.SKILL_GAPS_READ,
    Permissions.RECOMMENDATIONS_READ,
    Permissions.REVISION_READ,
    Permissions.REVISION_GENERATE,
    Permissions.RESOURCES_READ,
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
