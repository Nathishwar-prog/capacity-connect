import apiClient from '@/api/client';
import { ApiResponse } from '@/features/auth/types/auth.types';
import {
  TraineeDashboardData,
  TrainerDashboardData,
  AdminDashboardData,
} from '../types/dashboard.types';

export const dashboardApi = {
  getTraineeDashboard: async (): Promise<TraineeDashboardData> => {
    const response = await apiClient.get<ApiResponse<TraineeDashboardData>>('/dashboard/trainee');
    return response.data.data;
  },

  getTrainerDashboard: async (): Promise<TrainerDashboardData> => {
    const response = await apiClient.get<ApiResponse<TrainerDashboardData>>('/dashboard/trainer');
    return response.data.data;
  },

  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    const response = await apiClient.get<ApiResponse<AdminDashboardData>>('/dashboard/admin');
    return response.data.data;
  },
};

export default dashboardApi;
