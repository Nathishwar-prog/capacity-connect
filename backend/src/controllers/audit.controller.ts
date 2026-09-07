import { Request, Response } from 'express';
import { AuditService, RequesterContext } from '../services/audit.service';
import { ResponseHelper } from '../errors/response.helper';
import { AuditLogQueryInput } from '../validators/audit.validation';
import prisma from '../database/client';

export class AuditController {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  private async getRequesterContext(req: Request): Promise<RequesterContext> {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let organizationId = (req.user as unknown as Record<string, unknown>)?.organizationId as
      | string
      | undefined;
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });
      organizationId = user?.organizationId || '';
    }

    return {
      userId,
      role,
      organizationId,
    };
  }

  /**
   * GET /api/v1/admin/audit-logs
   * Retrieves a paginated list of audit logs with multi-parameter filtering and organization isolation.
   */
  public getAuditLogs = async (req: Request, res: Response): Promise<Response> => {
    const query = req.query as unknown as AuditLogQueryInput;
    const requester = await this.getRequesterContext(req);

    const filter = {
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const pagination = {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    };

    const result = await this.auditService.getAuditLogs(filter, pagination, requester);

    return ResponseHelper.success({
      res,
      message: 'Audit logs retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  };

  /**
   * GET /api/v1/admin/audit-logs/:id
   * Retrieves a single audit log entry by ID, enforcing organization boundaries.
   */
  public getAuditLogById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const requester = await this.getRequesterContext(req);

    const log = await this.auditService.getAuditLogById(id, requester);

    return ResponseHelper.success({
      res,
      message: 'Audit log retrieved successfully',
      data: log,
    });
  };
}

export default AuditController;
