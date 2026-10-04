import apiClient from '@/api/client';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationApi = {
  /**
   * Fetches paginated notifications for current authenticated user
   */
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> {
    const response = await apiClient.get('/notifications', { params });
    return {
      notifications: response.data.data || [],
      unreadCount: response.data.meta?.unreadCount || 0,
      meta: response.data.meta || {
        page: 1,
        limit: 20,
        total: (response.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetches unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.data?.count || 0;
  },

  /**
   * Fetches details for a single notification
   */
  async getNotificationById(id: string): Promise<AppNotification> {
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data.data;
  },

  /**
   * Mark as read by deleting the notification from database
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Mark all notifications as read by deleting them from database
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.delete('/notifications/read-all');
  },
};

export default notificationApi;
