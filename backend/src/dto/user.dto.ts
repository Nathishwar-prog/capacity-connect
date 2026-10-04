import { Role, UserStatus } from '@prisma/client';
import { IUser } from '../models/user.model';

export interface CreateUserDto {
  organizationId: string;
  departmentId?: string;
  email: string;
  password?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  status?: UserStatus;
}

export interface UpdateUserDto {
  departmentId?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role?: Role;
  status?: UserStatus;
  emailVerified?: boolean;
}

export interface UserResponseDto {
  id: string;
  organizationId: string;
  departmentId: string | null;
  department?: { id: string; name: string; code?: string } | null;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  traineeProfile?: {
    id: string;
    designation?: string | null;
    bio?: string | null;
    interests?: string[];
    profileCompletion?: number;
  } | null;
  trainerProfile?: {
    id: string;
    designation?: string | null;
    organizationName?: string | null;
    bio?: string | null;
    yearsExperience?: number;
  } | null;
}

import { permissionsMap } from '../permissions';

export class UserDtoMapper {
  /**
   * Sanitizes database/domain user objects by stripping password and formatting fields
   */
  public static toResponse(user: any, permissions?: string[]): UserResponseDto {
    const perms = permissions || permissionsMap[user.role as Role] || [];
    return {
      id: user.id,
      organizationId: user.organizationId,
      departmentId: user.departmentId || null,
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
            code: user.department.code,
          }
        : null,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName || null,
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
      permissions: perms,
      traineeProfile: user.traineeProfile || null,
      trainerProfile: user.trainerProfile || null,
    };
  }

  /**
   * Sanitizes lists of users
   */
  public static toResponseList(users: IUser[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  }
}
