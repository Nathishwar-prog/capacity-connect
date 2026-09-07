import { Request, Response } from 'express';
import { AdminUserService, AdminActionContext } from '../services/admin-user.service';
import { ResponseHelper } from '../errors/response.helper';
import { UserDtoMapper } from '../dto/user.dto';
import { AdminUserFilterDto } from '../dto/admin-user.dto';

export class AdminUserController {
  private adminUserService: AdminUserService;

  constructor(adminUserService: AdminUserService) {
    this.adminUserService = adminUserService;
  }

  private extractActionContext(req: Request): AdminActionContext {
    return {
      adminUserId: req.user?.userId || 'unknown-admin',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string | undefined,
    };
  }

  public getUsers = async (req: Request, res: Response): Promise<Response> => {
    const filters = req.query as unknown as AdminUserFilterDto;
    const result = await this.adminUserService.getUsers(filters);

    return ResponseHelper.success({
      res,
      message: 'User directory retrieved successfully',
      data: result.users,
      meta: result.meta as unknown as Record<string, unknown>,
    });
  };

  public getUserById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const user = await this.adminUserService.getUserById(id);
    const sanitizedUser = UserDtoMapper.toResponse(user);

    return ResponseHelper.success({
      res,
      message: 'User retrieved successfully',
      data: sanitizedUser,
    });
  };

  public approveUser = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const context = this.extractActionContext(req);
    const user = await this.adminUserService.approveUser(id, context);
    const sanitizedUser = UserDtoMapper.toResponse(user);

    return ResponseHelper.success({
      res,
      message: 'User approved successfully',
      data: sanitizedUser,
    });
  };

  public rejectUser = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const context = this.extractActionContext(req);
    const user = await this.adminUserService.rejectUser(id, context);
    const sanitizedUser = UserDtoMapper.toResponse(user);

    return ResponseHelper.success({
      res,
      message: 'User rejected successfully',
      data: sanitizedUser,
    });
  };

  public updateStatus = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { status } = req.body;
    const context = this.extractActionContext(req);
    const user = await this.adminUserService.updateUserStatus(id, status, context);
    const sanitizedUser = UserDtoMapper.toResponse(user);

    return ResponseHelper.success({
      res,
      message: 'User status updated successfully',
      data: sanitizedUser,
    });
  };

  public updateRole = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { role } = req.body;
    const context = this.extractActionContext(req);
    const user = await this.adminUserService.updateUserRole(id, role, context);
    const sanitizedUser = UserDtoMapper.toResponse(user);

    return ResponseHelper.success({
      res,
      message: 'User role updated successfully',
      data: sanitizedUser,
    });
  };
}

export default AdminUserController;
