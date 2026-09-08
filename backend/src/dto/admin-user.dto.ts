import { Role, UserStatus } from '@prisma/client';
import { UserResponseDto } from './user.dto';

export interface AdminUserFilterDto {
  search?: string;
  role?: Role;
  status?: UserStatus;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserStatusUpdateDto {
  status: UserStatus;
}

export interface AdminUserRoleUpdateDto {
  role: Role;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedUsersResponseDto {
  users: UserResponseDto[];
  meta: PaginationMeta;
}
