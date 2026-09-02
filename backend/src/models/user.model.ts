import { Role, UserStatus } from '@prisma/client';

export interface IUser {
  id: string;
  organizationId: string;
  departmentId?: string | null;
  email: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type UserRole = Role;

export const UserRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN' as Role,
  ADMIN: 'ADMIN' as Role,
  TRAINER: 'TRAINER' as Role,
  TRAINEE: 'TRAINEE' as Role,
} as const;

