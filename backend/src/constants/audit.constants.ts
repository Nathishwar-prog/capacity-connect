/**
 * CAPACITY CONNECT — AUDIT & SECURITY CONSTANTS
 * Source-defined audit events and sanitization rules.
 */

/**
 * 6 Source-Defined Audit Events explicitly mandated by the platform:
 * 1. USER_APPROVED
 * 2. USER_REJECTED
 * 3. ROLE_CHANGED
 * 4. ACCOUNT_SUSPENDED
 * 5. COURSE_APPROVAL
 * 6. CERTIFICATE_VERIFICATION
 */
export const AuditAction = {
  USER_APPROVED: 'USER_APPROVED',
  USER_REJECTED: 'USER_REJECTED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  COURSE_APPROVAL: 'COURSE_APPROVAL',
  CERTIFICATE_VERIFICATION: 'CERTIFICATE_VERIFICATION',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction] | string;

/**
 * The 6 Source-Defined Audit Events that MUST be strictly supported.
 */
export const SOURCE_AUDIT_EVENTS: readonly string[] = [
  AuditAction.USER_APPROVED,
  AuditAction.USER_REJECTED,
  AuditAction.ROLE_CHANGED,
  AuditAction.ACCOUNT_SUSPENDED,
  AuditAction.COURSE_APPROVAL,
  AuditAction.CERTIFICATE_VERIFICATION,
] as const;

/**
 * Sensitive field names that MUST NEVER be persisted in AuditLog or printed in application logs.
 */
export const SENSITIVE_FIELDS: readonly string[] = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'tokenhash',
  'jwt',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'secret',
  'clientsecret',
  'privatekey',
  'credentials',
] as const;
