import apiClient from '../../../api/client';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UserListParams,
  PaginatedUsersResponse,
} from '../types/user.types';

export const userApi = {
  /**
   * Fetches paginated directory users via administrative endpoint
   */
  async getAdminUsers(params?: UserListParams): Promise<PaginatedUsersResponse> {
    const response = await apiClient.get('/admin/users', { params });
    // response.data has { success, message, data: User[], meta: { page, limit, total, totalPages } }
    return {
      users: response.data.data || [],
      meta: response.data.meta || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: (response.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Legacy user list endpoint
   */
  async getUsers(params?: UserListParams): Promise<User[]> {
    const response = await apiClient.get('/users', { params });
    return response.data.data;
  },

  /**
   * Fetches current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },

  /**
   * Creates a new user account
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await apiClient.post('/users', payload);
    return response.data.data;
  },

  /**
   * Updates user details
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const endpoint = !id || id === 'me' ? '/users/me' : `/users/${id}`;
    const response = await apiClient.patch(endpoint, payload);
    return response.data.data;
  },

  /**
   * Approves a pending user registration
   */
  async approveUser(id: string): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/approve`);
    return response.data.data;
  },

  /**
   * Rejects a user registration
   */
  async rejectUser(id: string): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/reject`);
    return response.data.data;
  },

  /**
   * Updates user status (APPROVED, PENDING, SUSPENDED, DEACTIVATED)
   */
  async updateUserStatus(id: string, status: string): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Updates user role (TRAINEE, TRAINER, ADMIN)
   */
  async updateUserRole(id: string, role: string): Promise<User> {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return response.data.data;
  },

  /**
   * Deletes a user account (Super Admin only)
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export default userApi;
