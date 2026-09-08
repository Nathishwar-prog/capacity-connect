import { Role, UserStatus } from '@prisma/client';
import { IRbacRepository, RbacRepository } from '../repositories/rbac.repository';
import {
  permissionsMap,
  hasPermission as evaluatePermission,
  SOURCE_PERMISSIONS,
} from '../permissions';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

export interface IRbacService {
  resolveUserPermissions(role: Role, userId?: string): Promise<string[]>;
  hasPermission(userRole: Role, userPermissions: string[], required: string): boolean;
  authorizeUser(userId: string, requiredPermission: string): Promise<boolean>;
  getRolePermissionMatrix(): Record<Role, string[]>;
  syncPermissions(): Promise<void>;
}

export class RbacService implements IRbacService {
  private rbacRepository: IRbacRepository;

  constructor(rbacRepository: IRbacRepository = new RbacRepository()) {
    this.rbacRepository = rbacRepository;
  }

  /**
   * Resolves granted permissions for a user, combining fast code-level rules and DB-backed mappings
   */
  public async resolveUserPermissions(role: Role, userId?: string): Promise<string[]> {
    if (role === Role.SUPER_ADMIN) {
      return ['*'];
    }

    if (userId) {
      try {
        const dbPermissions = await this.rbacRepository.getUserPermissions(userId);
        if (dbPermissions && dbPermissions.length > 0) {
          return dbPermissions;
        }
      } catch (err) {
        // Fallback safely to code matrix if database connection encounters issues
      }
    }

    return permissionsMap[role] || [];
  }

  /**
   * Pure evaluation of whether a role/permission set satisfies a required permission
   */
  public hasPermission(userRole: Role, userPermissions: string[] = [], required: string): boolean {
    return evaluatePermission(userRole, userPermissions, required);
  }

  /**
   * Complete server-side verification: verifies user exists, is APPROVED, and has required permission
   */
  public async authorizeUser(userId: string, requiredPermission: string): Promise<boolean> {
    const userMeta = await this.rbacRepository.getUserRoleAndStatus(userId);

    if (!userMeta) {
      throw new UnauthorizedError('User account not found');
    }

    if (userMeta.status !== UserStatus.APPROVED) {
      throw new UnauthorizedError('User account is not approved or inactive');
    }

    if (userMeta.role === Role.SUPER_ADMIN) {
      return true;
    }

    const permissions = await this.resolveUserPermissions(userMeta.role, userId);
    const isAllowed = this.hasPermission(userMeta.role, permissions, requiredPermission);

    if (!isAllowed) {
      throw new ForbiddenError(
        `Access denied. Missing required permission: '${requiredPermission}'`,
      );
    }

    return true;
  }

  /**
   * Exposes the active role-to-permission matrix
   */
  public getRolePermissionMatrix(): Record<Role, string[]> {
    return permissionsMap;
  }

  /**
   * Exposes the official source-defined permissions list
   */
  public getSourcePermissions(): readonly string[] {
    return SOURCE_PERMISSIONS;
  }

  /**
   * Synchronizes permissions in the database
   */
  public async syncPermissions(): Promise<void> {
    await this.rbacRepository.syncSourcePermissions();
  }
}

export default RbacService;
