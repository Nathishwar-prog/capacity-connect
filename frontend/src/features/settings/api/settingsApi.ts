import { apiClient } from '@/api/client';
import {
  SystemSettingsData,
  PublicPortalSettings,
  SystemHealthData,
  ConnectionTestResult,
  SettingsAuditLog,
} from '../types/settings.types';

export const settingsApi = {
  getSettings: async (): Promise<SystemSettingsData> => {
    const res = await apiClient.get<{ success: boolean; data: SystemSettingsData }>('/admin/settings');
    return res.data.data;
  },

  getPublicSettings: async (): Promise<PublicPortalSettings> => {
    const res = await apiClient.get<{ success: boolean; data: PublicPortalSettings }>('/settings/public');
    return res.data.data;
  },

  updatePortalSettings: async (payload: Partial<SystemSettingsData>): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/portal',
      payload
    );
    return res.data.data;
  },

  updateLearningSettings: async (payload: Partial<SystemSettingsData>): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/learning',
      payload
    );
    return res.data.data;
  },

  updateNotificationSettings: async (payload: Partial<SystemSettingsData>): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/notifications',
      payload
    );
    return res.data.data;
  },

  updateAiSettings: async (
    payload: Partial<SystemSettingsData> & { apiKeyUpdate?: string }
  ): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/ai',
      payload
    );
    return res.data.data;
  },

  updateSecuritySettings: async (payload: Partial<SystemSettingsData>): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/security',
      payload
    );
    return res.data.data;
  },

  updateLocalizationSettings: async (payload: Partial<SystemSettingsData>): Promise<SystemSettingsData> => {
    const res = await apiClient.patch<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings/localization',
      payload
    );
    return res.data.data;
  },

  getHealthStatus: async (): Promise<SystemHealthData> => {
    const res = await apiClient.get<{ success: boolean; data: SystemHealthData }>('/admin/settings/system/health');
    return res.data.data;
  },

  testConnection: async (target: 'DATABASE' | 'AI_SERVICE' | 'STORAGE'): Promise<ConnectionTestResult> => {
    const res = await apiClient.post<{ success: boolean; data: ConnectionTestResult }>(
      '/admin/settings/test-connection',
      { target }
    );
    return res.data.data;
  },

  clearCache: async (): Promise<{ cleared: boolean; clearedAt: string; itemsEvicted: number }> => {
    const res = await apiClient.post<{ success: boolean; data: any }>('/admin/settings/cache/clear');
    return res.data.data;
  },

  getAuditLogs: async (page = 1, limit = 20): Promise<{ logs: SettingsAuditLog[]; pagination: any }> => {
    const res = await apiClient.get<{ success: boolean; data: { logs: SettingsAuditLog[]; pagination: any } }>(
      `/admin/settings/audit-logs?page=${page}&limit=${limit}`
    );
    return res.data.data;
  },
};
