import { apiClient } from '@/api/client';
import {
  LoginInput,
  RegisterInput,
  AuthResponse,
  AuthUser,
  ApiResponse,
} from '../types/auth.types';

export const authApi = {
  /**
   * Authenticate with email & password
   */
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  /**
   * Register a new user account
   */
  register: async (userData: RegisterInput): Promise<AuthResponse> => {
    const { confirmPassword, ...payload } = userData;
    void confirmPassword;
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return response.data.data;
  },

  /**
   * Refresh the access token using HttpOnly refresh cookie
   */
  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return response.data.data;
  },

  /**
   * Log out active session and revoke refresh tokens
   */
  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/logout');
  },

  /**
   * Fetch current authenticated user's profile and permissions
   */
  getMe: async (): Promise<AuthUser> => {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  },
};

export default authApi;
