import { Role, UserStatus } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  organizationId?: string;
  departmentId?: string;
  role?: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken?: string;
}

export interface AuthUserDto {
  id: string;
  organizationId: string;
  organizationName?: string;
  departmentId: string | null;
  departmentName?: string | null;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  traineeProfile?: {
    id: string;
    designation: string | null;
    bio: string | null;
    interests: string[];
    profileCompletion: number;
  } | null;
  trainerProfile?: {
    id: string;
    designation: string;
    organizationName: string | null;
    bio: string;
    yearsExperience: number;
  } | null;
}

export interface AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}
