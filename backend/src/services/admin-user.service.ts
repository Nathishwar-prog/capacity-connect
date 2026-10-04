import { Role, User, UserStatus } from '@prisma/client';
import { IUserRepository } from '../repositories/user.repository';
import { AdminUserFilterDto, PaginatedUsersResponseDto } from '../dto/admin-user.dto';
import { UserDtoMapper } from '../dto/user.dto';
import { NotFoundError } from '../errors/app-error';
import { AuditService } from './audit.service';
import logger from '../logger/winston.logger';

export interface AdminActionContext {
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminUserService {
  private userRepository: IUserRepository;
  private auditService: AuditService;

  constructor(userRepository: IUserRepository, auditService: AuditService = new AuditService()) {
    this.userRepository = userRepository;
    this.auditService = auditService;
  }

  /**
   * Retrieves a paginated list of users filtered by search term, role, status, and department
   */
  public async getUsers(filters: AdminUserFilterDto): Promise<PaginatedUsersResponseDto> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const { users, total } = await this.userRepository.findPaginatedUsers({
      search: filters.search,
      role: filters.role,
      status: filters.status,
      departmentId: filters.departmentId,
      department: (filters as Record<string, unknown>).department as string | undefined,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;
    const sanitizedUsers = UserDtoMapper.toResponseList(users);

    return {
      users: sanitizedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves administrative details for a specific user by UUID
   */
  public async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User with the specified ID does not exist');
    }
    return user;
  }

  /**
   * Retrieves paginated list of pending users requiring administrative approval
   */
  public async getPendingUsers(filters: AdminUserFilterDto): Promise<PaginatedUsersResponseDto> {
    return this.getUsers({
      ...filters,
      status: UserStatus.PENDING,
    });
  }

  /**
   * Approves a pending user registration and logs the USER_APPROVED audit event
   * Safe and idempotent: if user is already approved, returns existing approved record safely
   */
  public async approveUser(id: string, context: AdminActionContext): Promise<User> {
    const user = await this.getUserById(id);
    const oldStatus = user.status;

    // Idempotent guard: if already approved, return early without error
    if (oldStatus === UserStatus.APPROVED) {
      return user;
    }

    const updatedUser = await this.userRepository.updateUserStatus(id, UserStatus.APPROVED);

    await this.auditService.logUserApproved(
      context.adminUserId,
      id,
      user.organizationId,
      oldStatus,
      { ipAddress: context.ipAddress, userAgent: context.userAgent },
    );

    logger.info(
      `[UserManagement] User ${id} (${user.email}) approved by admin ${context.adminUserId}`,
    );
    return updatedUser;
  }

  /**
   * Rejects a user registration, revokes any active sessions, and logs USER_REJECTED
   */
  public async rejectUser(id: string, context: AdminActionContext): Promise<User> {
    const user = await this.getUserById(id);
    const oldStatus = user.status;

    // Revoke all active refresh tokens so rejected users cannot obtain sessions
    await this.userRepository.revokeUserRefreshTokens(id);

    const updatedUser = await this.userRepository.updateUserStatus(id, UserStatus.REJECTED);

    await this.auditService.logUserRejected(
      context.adminUserId,
      id,
      user.organizationId,
      oldStatus,
      { ipAddress: context.ipAddress, userAgent: context.userAgent },
    );

    logger.info(
      `[UserManagement] User ${id} (${user.email}) rejected by admin ${context.adminUserId}`,
    );
    return updatedUser;
  }

  /**
   * Updates user account status (PENDING, APPROVED, REJECTED, SUSPENDED, DEACTIVATED)
   */
  public async updateUserStatus(
    id: string,
    newStatus: UserStatus,
    context: AdminActionContext,
  ): Promise<User> {
    const user = await this.getUserById(id);
    const oldStatus = user.status;

    // If status is SUSPENDED, DEACTIVATED, or REJECTED, terminate existing sessions
    if (
      newStatus === UserStatus.SUSPENDED ||
      newStatus === UserStatus.DEACTIVATED ||
      newStatus === UserStatus.REJECTED
    ) {
      await this.userRepository.revokeUserRefreshTokens(id);
    }

    const updatedUser = await this.userRepository.updateUserStatus(id, newStatus);

    if (newStatus === UserStatus.SUSPENDED) {
      await this.auditService.logAccountSuspended(
        context.adminUserId,
        id,
        user.organizationId,
        oldStatus,
        { ipAddress: context.ipAddress, userAgent: context.userAgent },
      );
    } else if (newStatus === UserStatus.APPROVED) {
      await this.auditService.logUserApproved(
        context.adminUserId,
        id,
        user.organizationId,
        oldStatus,
        { ipAddress: context.ipAddress, userAgent: context.userAgent },
      );
    } else if (newStatus === UserStatus.REJECTED) {
      await this.auditService.logUserRejected(
        context.adminUserId,
        id,
        user.organizationId,
        oldStatus,
        { ipAddress: context.ipAddress, userAgent: context.userAgent },
      );
    } else {
      await this.auditService.logEvent({
        organizationId: user.organizationId,
        userId: context.adminUserId,
        action: 'USER_STATUS_UPDATED',
        entityType: 'USER',
        entityId: id,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    logger.info(
      `[UserManagement] User ${id} status updated from ${oldStatus} to ${newStatus} by admin ${context.adminUserId}`,
    );
    return updatedUser;
  }

  /**
   * Updates user role and revokes active sessions to enforce newly assigned role claims
   */
  public async updateUserRole(
    id: string,
    newRole: Role,
    context: AdminActionContext,
  ): Promise<User> {
    const user = await this.getUserById(id);
    const oldRole = user.role;

    // Invalidate refresh tokens to guarantee token rotation enforces new role claims
    await this.userRepository.revokeUserRefreshTokens(id);

    const updatedUser = await this.userRepository.updateUserRole(id, newRole);

    await this.auditService.logRoleChanged(
      context.adminUserId,
      id,
      user.organizationId,
      oldRole,
      newRole,
      { ipAddress: context.ipAddress, userAgent: context.userAgent },
    );

    logger.info(
      `[UserManagement] User ${id} role updated from ${oldRole} to ${newRole} by admin ${context.adminUserId}`,
    );
    return updatedUser;
  }
}

export default AdminUserService;
