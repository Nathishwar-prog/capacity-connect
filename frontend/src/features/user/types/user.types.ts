export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'TRAINEE';

export interface UserDepartment {
  id: string;
  name: string;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status?: string;
  isActive?: boolean;
  departmentId?: string | null;
  department?: UserDepartment | null;
  departmentName?: string | null;
  traineeProfile?: {
    id: string;
    designation?: string | null;
    bio?: string | null;
    profileCompletion?: number;
  } | null;
  trainerProfile?: {
    id: string;
    designation?: string | null;
    organizationName?: string | null;
    yearsExperience?: number;
  } | null;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string;
  permissions?: string[];
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  departmentId?: string;
  skip?: number;
  take?: number;
}

export interface PaginatedUsersResponse {
  users: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
