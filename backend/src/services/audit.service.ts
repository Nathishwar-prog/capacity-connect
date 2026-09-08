import { AuditLog, Role } from '@prisma/client';
import {
  AuditRepository,
  IAuditRepository,
  AuditLogFilter,
  PaginationOptions,
} from '../repositories/audit.repository';
import { AuditAction, AuditActionType } from '../constants/audit.constants';
import { AuditSanitizer } from '../utils/audit-sanitizer.util';
import logger from '../logger/winston.logger';
import { NotFoundError } from '../errors/app-error';

export interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RequesterContext {
  userId: string;
  role: Role | string;
  organizationId: string;
}

export interface AuditLogDto {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface PaginatedAuditLogs {
  data: AuditLogDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AuditLogWithRelations = AuditLog & {
  user?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: string;
  } | null;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
};

export class AuditService {
  private auditRepository: IAuditRepository;

  constructor(auditRepository: IAuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  /**
   * Generic audit event logging with mandatory pre-sanitization.
   */
  public async logEvent(data: {
    organizationId?: string | null;
    userId?: string | null;
    action: AuditActionType;
    entityType: string;
    entityId?: string | null;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    const sanitizedOld = data.oldValues ? AuditSanitizer.sanitize(data.oldValues) : null;
    const sanitizedNew = data.newValues ? AuditSanitizer.sanitize(data.newValues) : null;

    const logEntry = await this.auditRepository.createAuditLog({
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValues: sanitizedOld,
      newValues: sanitizedNew,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    logger.info(
      `[AuditLog] Event '${data.action}' recorded for ${data.entityType}:${data.entityId || 'N/A'} by user ${data.userId || 'system'}`,
    );

    return logEntry;
  }

  /**
   * 1. USER_APPROVED — Tracks user registration approval
   */
  public async logUserApproved(
    adminUserId: string,
    targetUserId: string,
    organizationId: string | null,
    oldStatus: string,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: adminUserId,
      action: AuditAction.USER_APPROVED,
      entityType: 'USER',
      entityId: targetUserId,
      oldValues: { status: oldStatus },
      newValues: { status: 'APPROVED' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * 2. USER_REJECTED — Tracks user registration rejection
   */
  public async logUserRejected(
    adminUserId: string,
    targetUserId: string,
    organizationId: string | null,
    oldStatus: string,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: adminUserId,
      action: AuditAction.USER_REJECTED,
      entityType: 'USER',
      entityId: targetUserId,
      oldValues: { status: oldStatus },
      newValues: { status: 'REJECTED' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * 3. ROLE_CHANGED — Tracks administrative role updates
   */
  public async logRoleChanged(
    adminUserId: string,
    targetUserId: string,
    organizationId: string | null,
    oldRole: string,
    newRole: string,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: adminUserId,
      action: AuditAction.ROLE_CHANGED,
      entityType: 'USER',
      entityId: targetUserId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * 4. ACCOUNT_SUSPENDED — Tracks user account suspension
   */
  public async logAccountSuspended(
    adminUserId: string,
    targetUserId: string,
    organizationId: string | null,
    oldStatus: string,
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: adminUserId,
      action: AuditAction.ACCOUNT_SUSPENDED,
      entityType: 'USER',
      entityId: targetUserId,
      oldValues: { status: oldStatus },
      newValues: { status: 'SUSPENDED' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * 5. COURSE_APPROVAL — Reusable helper for course approval workflow.
   * Note: Originating workflow is owned by the Course Management / LMS module.
   */
  public async logCourseApproval(
    approverId: string,
    courseId: string,
    organizationId: string | null,
    details?: { oldStatus?: string; newStatus?: string; remarks?: string },
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: approverId,
      action: AuditAction.COURSE_APPROVAL,
      entityType: 'COURSE',
      entityId: courseId,
      oldValues: { status: details?.oldStatus || 'PENDING_APPROVAL' },
      newValues: {
        status: details?.newStatus || 'PUBLISHED',
        remarks: details?.remarks,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * 6. CERTIFICATE_VERIFICATION — Reusable helper for certificate verification workflow.
   * Note: Originating workflow is owned by the Certificate / Verification module.
   */
  public async logCertificateVerification(
    verifierId: string,
    certificateId: string,
    organizationId: string | null,
    details?: { oldStatus?: string; newStatus?: string; remarks?: string },
    context?: AuditContext,
  ): Promise<AuditLog> {
    return this.logEvent({
      organizationId,
      userId: verifierId,
      action: AuditAction.CERTIFICATE_VERIFICATION,
      entityType: 'CERTIFICATE',
      entityId: certificateId,
      oldValues: { status: details?.oldStatus || 'PENDING' },
      newValues: {
        status: details?.newStatus || 'VERIFIED',
        remarks: details?.remarks,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
  }

  /**
   * Queries audit logs with organization boundary enforcement and pagination.
   */
  public async getAuditLogs(
    filter: AuditLogFilter,
    pagination: PaginationOptions,
    requester: RequesterContext,
  ): Promise<PaginatedAuditLogs> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));

    // Enforce Organization Isolation:
    // Super Admins may filter across all orgs or query specific org.
    // Standard Admins are strictly scoped to their own organization.
    const effectiveFilter: AuditLogFilter = { ...filter };
    if (requester.role !== Role.SUPER_ADMIN) {
      effectiveFilter.organizationId = requester.organizationId;
    }

    const { logs, total } = await this.auditRepository.findAuditLogs(effectiveFilter, {
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: logs.map((log) => this.mapToDto(log)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single audit log by ID, enforcing organization boundaries.
   */
  public async getAuditLogById(id: string, requester: RequesterContext): Promise<AuditLogDto> {
    const orgConstraint =
      requester.role === Role.SUPER_ADMIN ? undefined : requester.organizationId;
    const log = await this.auditRepository.findById(id, orgConstraint);

    if (!log) {
      throw new NotFoundError(`Audit log record with ID '${id}' was not found`);
    }

    return this.mapToDto(log);
  }

  private mapToDto(log: AuditLogWithRelations): AuditLogDto {
    return {
      id: log.id,
      organizationId: log.organizationId,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: (log.oldValues as Record<string, unknown>) || null,
      newValues: (log.newValues as Record<string, unknown>) || null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
      user: log.user
        ? {
            id: log.user.id,
            firstName: log.user.firstName,
            lastName: log.user.lastName,
            email: log.user.email,
            role: log.user.role,
          }
        : null,
      organization: log.organization
        ? {
            id: log.organization.id,
            name: log.organization.name,
            code: log.organization.code,
          }
        : null,
    };
  }
}
