import apiClient from '@/api/client';

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  audience: 'ALL' | 'TRAINEES' | 'TRAINERS';
  type?: 'GENERAL' | 'COURSE' | 'ACHIEVEMENT' | 'LEARNING_CONTENT' | 'SYSTEM';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface AnnouncementItem {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  content: string;
  targetAudience: string;
  type: string;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
  recipientCount?: number;
}

export interface PaginatedAnnouncementsResponse {
  announcements: AnnouncementItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const announcementApi = {
  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    audience?: string;
  }): Promise<PaginatedAnnouncementsResponse> {
    const response = await apiClient.get('/admin/announcements', { params });
    return {
      announcements: response.data.data || [],
      meta: response.data.meta || {
        page: 1,
        limit: 20,
        total: (response.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  async getAnnouncementById(id: string): Promise<AnnouncementItem> {
    const response = await apiClient.get(`/admin/announcements/${id}`);
    return response.data.data;
  },

  async createAnnouncement(
    payload: CreateAnnouncementPayload,
  ): Promise<{ announcement: AnnouncementItem; recipientCount: number }> {
    const response = await apiClient.post('/admin/announcements', payload);
    return response.data.data;
  },
};

export default announcementApi;
