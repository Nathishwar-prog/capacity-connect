import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authenticated session
router.use(authenticate);

/**
 * GET /notifications
 * Retrieve paginated notifications for current user
 */
router.get('/', asyncHandler(notificationController.getMyNotifications));

/**
 * GET /notifications/unread-count
 * Retrieve unread notification count for current user
 */
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));

/**
 * GET /notifications/:id
 * Retrieve single notification details with IDOR protection
 */
router.get('/:id', asyncHandler(notificationController.getNotificationById));

/**
 * DELETE /notifications/read-all
 * Delete all notifications for current user (Mark all as read)
 */
router.delete('/read-all', asyncHandler(notificationController.deleteAllNotifications));

/**
 * DELETE /notifications/:id
 * Delete single notification for current user (Mark as read requirement)
 */
router.delete('/:id', asyncHandler(notificationController.deleteNotification));

/**
 * PATCH /notifications/read-all
 * Backwards-compatible endpoint to mark all as read (deletes from database)
 */
router.patch('/read-all', asyncHandler(notificationController.markAllAsRead));

/**
 * PATCH /notifications/:id/read
 * Backwards-compatible endpoint to mark single notification as read (deletes from database)
 */
router.patch('/:id/read', asyncHandler(notificationController.markAsRead));

export default router;
export { router as notificationRouter };
