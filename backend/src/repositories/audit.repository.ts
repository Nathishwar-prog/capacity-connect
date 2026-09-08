import prisma from '../database/client';
import { AuditLog, Prisma } from '@prisma/client';
import { AuditSanitizer } from '../utils/audit-sanitizer.util';

export interface CreateAuditLogData {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogFilter {
  organizationId?: string | null;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface IAuditRepository {
  createAuditLog(data: CreateAuditLogData): Promise<AuditLog>;
  findAuditLogs(
    filter: AuditLogFilter,
    pagination: PaginationOptions,
  ): Promise<{ logs: AuditLog[]; total: number }>;
  findById(id: string, organizationId?: string): Promise<AuditLog | null>;
}

export class AuditRepository implements IAuditRepository {
  /**
   * Persists an audit log record with pre-sanitized values.
   */
  public async createAuditLog(data: CreateAuditLogData): Promise<AuditLog> {
    const sanitizedOld = data.oldValues ? AuditSanitizer.sanitize(data.oldValues) : undefined;
    const sanitizedNew = data.newValues ? AuditSanitizer.sanitize(data.newValues) : undefined;

    return prisma.auditLog.create({
      data: {
        organizationId: data.organizationId || null,
        userId: data.userId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldValues: sanitizedOld ? (sanitizedOld as Prisma.InputJsonValue) : undefined,
        newValues: sanitizedNew ? (sanitizedNew as Prisma.InputJsonValue) : undefined,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent ? AuditSanitizer.sanitize(data.userAgent) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  /**
   * Queries audit logs based on filters and pagination, enforcing organization isolation where provided.
   */
  public async findAuditLogs(
    filter: AuditLogFilter,
    pagination: PaginationOptions,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filter.organizationId !== undefined) {
      where.organizationId = filter.organizationId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.entityType) {
      where.entityType = filter.entityType;
    }

    if (filter.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = pagination.skip !== undefined ? pagination.skip : (page - 1) * limit;
    const take = pagination.take !== undefined ? pagination.take : limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
    ]);

    return { logs, total };
  }

  /**
   * Retrieves a single audit log by ID, respecting organization isolation if organizationId is passed.
   */
  public async findById(id: string, organizationId?: string): Promise<AuditLog | null> {
    const where: Prisma.AuditLogWhereInput = { id };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return prisma.auditLog.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }
}
