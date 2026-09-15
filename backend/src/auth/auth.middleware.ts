import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { TokenUtils } from './token.utils';
import { PermissionKey, hasPermission } from '../permissions';
import { prisma } from '../database/client';

/**
 * Authentication Middleware: Validates incoming Bearer JWT Access Token
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    const payload = TokenUtils.verifyAccessToken(token);

    // Verify email exists in DB and fetch full user record
    const dbUser = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!dbUser) {
      throw new UnauthorizedError('User not found in database');
    }

    // Ensure role consistency (optional but recommended)
    if (payload.role && payload.role !== dbUser.role) {
      throw new ForbiddenError('Token role does not match database role');
    }

    // Attach enriched user context to request
    req.user = {
      userId: dbUser.id,
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      permissions: payload.permissions || [],
    };
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired authentication credentials'));
  }
};

/**
 * Role-Based Authorization Middleware: Checks if user's role is in the allowed roles list
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication credentials required'));
    }

    const userRole = req.user.role as Role;

    // Super Admin has unrestricted permissions across all roles
    if (userRole === Role.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${userRole}' is not authorized to perform this action.`,
        ),
      );
    }

    next();
  };
};

/**
 * Fine-Grained Permission Authorization Middleware: Checks specific permissions
 */
export const requirePermission = (
  required: PermissionKey | PermissionKey[],
  matchMode: 'all' | 'any' = 'all',
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication credentials required'));
    }

    const userRole = req.user.role as Role;
    const userPermissions = req.user.permissions || [];

    // Super Admin or wildcard bypasses all permission requirements
    if (userRole === Role.SUPER_ADMIN || userPermissions.includes('*')) {
      return next();
    }

    const requiredList = Array.isArray(required) ? required : [required];

    const isAuthorized =
      matchMode === 'all'
        ? requiredList.every((perm) => hasPermission(userRole, userPermissions, perm))
        : requiredList.some((perm) => hasPermission(userRole, userPermissions, perm));

    if (!isAuthorized) {
      return next(
        new ForbiddenError(
          `Access denied. Missing required permission(s): ${requiredList.join(', ')}`,
        ),
      );
    }

    next();
  };
};

/**
 * Self or Role Guard: Grants access if the user is operating on their own resource ID,
 * OR if the user belongs to one of the authorized administrative roles.
 */
export const requireSelfOrRole = (
  allowedRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN],
  getTargetUserId?: (req: Request) => string,
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication credentials required'));
    }

    const userRole = req.user.role as Role;
    const authenticatedUserId = req.user.userId;

    // Super Admin bypass
    if (userRole === Role.SUPER_ADMIN) {
      return next();
    }

    const targetUserId = getTargetUserId
      ? getTargetUserId(req)
      : req.params.id || req.params.userId;

    // Allow if operating on own identity
    if (targetUserId && targetUserId === authenticatedUserId) {
      return next();
    }

    // Allow if role is in privileged list
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return next(
      new ForbiddenError('You can only access or modify your own profile and resources.'),
    );
  };
};

export { hasPermission, Permissions, SOURCE_PERMISSIONS } from '../permissions';

export default {
  authenticate,
  requireRole,
  requirePermission,
  requireSelfOrRole,
};
