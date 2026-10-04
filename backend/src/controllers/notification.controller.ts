import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { ResponseHelper } from '../errors/response.helper';
import { UnauthorizedError } from '../errors/app-error';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService = new NotificationService()) {
    this.notificationService = notificationService;
  }

  public getMyNotifications = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await this.notificationService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly,
    });

    return ResponseHelper.success({
      res,
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      meta: {
        ...result.meta,
        unreadCount: result.unreadCount,
      } as unknown as Record<string, unknown>,
    });
  };

  public getUnreadCount = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const count = await this.notificationService.getUnreadCount(userId);

    return ResponseHelper.success({
      res,
      message: 'Unread notification count retrieved',
      data: { count },
    });
  };

  public getNotificationById = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const notification = await this.notificationService.getNotificationById(userId, id);

    return ResponseHelper.success({
      res,
      message: 'Notification details retrieved successfully',
      data: notification,
    });
  };

  public deleteNotification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    await this.notificationService.deleteNotification(userId, id);

    return ResponseHelper.success({
      res,
      message: 'Notification deleted successfully',
      data: { id },
    });
  };

  public deleteAllNotifications = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const count = await this.notificationService.deleteAllNotifications(userId);

    return ResponseHelper.success({
      res,
      message: 'All notifications deleted successfully',
      data: { deletedCount: count },
    });
  };

  public markAsRead = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    await this.notificationService.markAsRead(userId, id);

    return ResponseHelper.success({
      res,
      message: 'Notification marked as read (deleted from database)',
      data: { id },
    });
  };

  public markAllAsRead = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    await this.notificationService.markAllAsRead(userId);

    return ResponseHelper.success({
      res,
      message: 'All notifications marked as read (deleted from database)',
    });
  };
}

export default NotificationController;
