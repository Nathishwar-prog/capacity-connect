export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'TRAINEE';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface TraineeProfileSummary {
  id: string;
  designation: string | null;
  bio: string | null;
  interests: string[];
  profileCompletion: number;
}

export interface TrainerProfileSummary {
  id: string;
  designation: string;
  organizationName: string | null;
  bio: string;
  yearsExperience: number;
}

export interface AuthUser {
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
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  traineeProfile?: TraineeProfileSummary | null;
  trainerProfile?: TrainerProfileSummary | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  organizationId?: string;
  departmentId?: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  requiresApproval: boolean;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

export interface DepartmentMeta {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface SkillMeta {
  id: string;
  name: string;
  code: string;
  category: string | null;
}

export interface OnboardingMeta {
  departments: DepartmentMeta[];
  skills: SkillMeta[];
}

export interface TraineeOnboardingInput {
  firstName?: string;
  lastName?: string;
  departmentId: string;
  designation: string;
  skills: string[];
  interests: string[];
  bio?: string;
}
