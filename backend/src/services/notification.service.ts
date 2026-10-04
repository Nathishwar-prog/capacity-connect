import prisma from '../database/client';
import { Notification } from '@prisma/client';
import { NotFoundError } from '../errors/app-error';

export interface UserNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class NotificationService {
  /**
   * Retrieves notifications for a specific authenticated user
   */
  public async getUserNotifications(
    userId: string,
    options?: { page?: number; limit?: number; unreadOnly?: boolean },
  ): Promise<UserNotificationsResponse> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves only the count of unread notifications for a user
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Retrieves details for a specific notification ensuring strict IDOR protection
   */
  public async getNotificationById(userId: string, notificationId: string): Promise<Notification> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found or access denied');
    }

    return notification;
  }

  /**
   * Deletes a single notification from the database ("Mark as Read" deletion requirement)
   * Strictly enforces that notification exists and belongs to the authenticated user.
   */
  public async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const existing = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Notification not found or access denied');
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }

  /**
   * Deletes all notifications for the authenticated user
   */
  public async deleteAllNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
    return result.count;
  }

  /**
   * Mark as read operation — delegates to database deletion per project requirements
   */
  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.deleteNotification(userId, notificationId);
  }

  /**
   * Mark all as read operation — deletes all notification records for the user
   */
  public async markAllAsRead(userId: string): Promise<void> {
    await this.deleteAllNotifications(userId);
  }

  /**
   * Creates a notification record for a user
   */
  public async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: any;
    entityType?: string;
    entityId?: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'COURSE',
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }
}

export default NotificationService;
