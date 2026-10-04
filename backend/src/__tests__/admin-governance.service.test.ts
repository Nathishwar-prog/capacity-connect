import { AdminUserService, AdminActionContext as AdminUserContext } from '../services/admin-user.service';
import { AnnouncementService, AdminActionContext as AnnouncementContext } from '../services/announcement.service';
import { NotificationService } from '../services/notification.service';
import { IUserRepository } from '../repositories/user.repository';
import { AuditService } from '../services/audit.service';
import { Role, UserStatus, AnnouncementType, AnnouncementStatus } from '@prisma/client';
import { NotFoundError } from '../errors/app-error';
import prisma from '../database/client';

// Mock dependencies
jest.mock('../database/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    announcement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../logger/winston.logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Admin Governance Module Unit Tests', () => {
  describe('AdminUserService - User Approval Lifecycle', () => {
    let userRepository: jest.Mocked<IUserRepository>;
    let auditService: jest.Mocked<AuditService>;
    let adminUserService: AdminUserService;

    const mockAdminContext: AdminUserContext = {
      adminUserId: 'admin-uuid-1',
      ipAddress: '127.0.0.1',
      userAgent: 'Jest-Test-Agent',
    };

    beforeEach(() => {
      userRepository = {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findAll: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateUserStatus: jest.fn(),
        updateUserRole: jest.fn(),
      } as any;

      auditService = {
        logEvent: jest.fn(),
        logUserApproved: jest.fn(),
        logUserRejected: jest.fn(),
        logStatusChanged: jest.fn(),
        logRoleChanged: jest.fn(),
      } as any;

      adminUserService = new AdminUserService(userRepository, auditService);
    });

    it('should successfully approve a PENDING trainee user and log audit trail', async () => {
      const pendingUser: any = {
        id: 'trainee-uuid-1',
        email: 'trainee@imd.gov.in',
        firstName: 'Aarav',
        lastName: 'Sharma',
        role: Role.TRAINEE,
        status: UserStatus.PENDING,
        organizationId: 'org-uuid-1',
      };

      const approvedUser = { ...pendingUser, status: UserStatus.APPROVED };

      userRepository.findById.mockResolvedValue(pendingUser);
      userRepository.updateUserStatus.mockResolvedValue(approvedUser);

      const result = await adminUserService.approveUser(pendingUser.id, mockAdminContext);

      expect(userRepository.findById).toHaveBeenCalledWith(pendingUser.id);
      expect(userRepository.updateUserStatus).toHaveBeenCalledWith(pendingUser.id, UserStatus.APPROVED);
      expect(auditService.logUserApproved).toHaveBeenCalledWith(
        mockAdminContext.adminUserId,
        pendingUser.id,
        pendingUser.organizationId,
        UserStatus.PENDING,
        expect.any(Object),
      );
      expect(result.status).toBe(UserStatus.APPROVED);
    });

    it('should be idempotent: returning already APPROVED user without re-mutating or failing', async () => {
      const alreadyApprovedUser: any = {
        id: 'trainer-uuid-1',
        email: 'trainer@imd.gov.in',
        firstName: 'Priya',
        lastName: 'Verma',
        role: Role.TRAINER,
        status: UserStatus.APPROVED,
        organizationId: 'org-uuid-1',
      };

      userRepository.findById.mockResolvedValue(alreadyApprovedUser);

      const result = await adminUserService.approveUser(alreadyApprovedUser.id, mockAdminContext);

      expect(userRepository.findById).toHaveBeenCalledWith(alreadyApprovedUser.id);
      expect(userRepository.updateUserStatus).not.toHaveBeenCalled();
      expect(auditService.logUserApproved).not.toHaveBeenCalled();
      expect(result.status).toBe(UserStatus.APPROVED);
    });

    it('should throw NotFoundError when attempting to approve a non-existent user ID', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        adminUserService.approveUser('non-existent-id', mockAdminContext),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('AnnouncementService - Audience Targeting & Notification Dispatch', () => {
    let announcementService: AnnouncementService;
    let auditService: jest.Mocked<AuditService>;

    beforeEach(() => {
      jest.clearAllMocks();
      auditService = {
        logEvent: jest.fn(),
        logUserApproved: jest.fn(),
        logUserRejected: jest.fn(),
        logStatusChanged: jest.fn(),
        logRoleChanged: jest.fn(),
      } as any;

      announcementService = new AnnouncementService(auditService);
    });

    it('should dispatch announcement to ALL audience (both approved trainees and trainers)', async () => {
      const adminId = 'admin-uuid-1';
      const orgId = 'org-uuid-1';
      const context: AnnouncementContext = {
        adminUserId: adminId,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest-Agent',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: adminId,
        organizationId: orgId,
        firstName: 'Admin',
        lastName: 'Officer',
      });

      const mockAnnouncement = {
        id: 'ann-uuid-1',
        organizationId: orgId,
        createdBy: adminId,
        title: 'Monsoon Operations Briefing',
        content: 'All faculty and trainees must attend the morning meteorological satellite symposium.',
        targetAudience: 'ALL',
        type: AnnouncementType.GENERAL,
        status: AnnouncementStatus.PUBLISHED,
        createdAt: new Date(),
      };

      (prisma.announcement.create as jest.Mock).mockResolvedValue(mockAnnouncement);

      // Recipients: 2 trainees, 1 trainer (all APPROVED)
      const mockRecipients = [
        { id: 'trainee-1' },
        { id: 'trainee-2' },
        { id: 'trainer-1' },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockRecipients);
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]); // No duplicates
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await announcementService.createAnnouncement(
        adminId,
        {
          title: 'Monsoon Operations Briefing',
          content: 'All faculty and trainees must attend the morning meteorological satellite symposium.',
          audience: 'ALL',
        },
        context,
      );

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          status: UserStatus.APPROVED,
          role: { in: [Role.TRAINEE, Role.TRAINER] },
        },
        select: { id: true },
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'trainee-1', title: 'Monsoon Operations Briefing' }),
          expect.objectContaining({ userId: 'trainee-2', title: 'Monsoon Operations Briefing' }),
          expect.objectContaining({ userId: 'trainer-1', title: 'Monsoon Operations Briefing' }),
        ]),
      });

      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: adminId,
          action: 'ANNOUNCEMENT_PUBLISHED',
          entityType: 'Announcement',
          entityId: 'ann-uuid-1',
          newValues: expect.objectContaining({
            title: 'Monsoon Operations Briefing',
            audience: 'ALL',
            recipientCount: 3,
          }),
        }),
      );

      expect(result.recipientCount).toBe(3);
    });

    it('should prevent duplicate notifications if some users already received it', async () => {
      const adminId = 'admin-uuid-1';
      const orgId = 'org-uuid-1';
      const context: AnnouncementContext = { adminUserId: adminId };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: adminId,
        organizationId: orgId,
        firstName: 'Admin',
        lastName: 'Officer',
      });

      (prisma.announcement.create as jest.Mock).mockResolvedValue({
        id: 'ann-uuid-dup',
        targetAudience: 'TRAINEES',
      });

      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'trainee-1' },
        { id: 'trainee-2' },
      ]);

      // trainee-1 already has a notification for this announcement
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { userId: 'trainee-1' },
      ]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await announcementService.createAnnouncement(
        adminId,
        {
          title: 'Exam Schedule',
          content: 'Trainee exam starts Monday at 09:00 IST.',
          audience: 'TRAINEES',
        },
        context,
      );

      // Only trainee-2 should receive the notification
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ userId: 'trainee-2', title: 'Exam Schedule' }),
        ],
      });
      expect(result.recipientCount).toBe(1);
    });
  });

  describe('NotificationService - Retrieval, IDOR Security & Database Deletion', () => {
    let notificationService: NotificationService;

    beforeEach(() => {
      jest.clearAllMocks();
      notificationService = new NotificationService();
    });

    it('should fetch user notifications and unread count via database transaction', async () => {
      const mockNotifications = [
        { id: 'notif-1', userId: 'user-1', title: 'Test 1', isRead: false },
        { id: 'notif-2', userId: 'user-1', title: 'Test 2', isRead: true },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([
        mockNotifications,
        2, // total
        1, // unread
      ]);

      const result = await notificationService.getUserNotifications('user-1', { page: 1, limit: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should fetch unread count for user directly', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(4);

      const count = await notificationService.getUnreadCount('user-1');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
      expect(count).toBe(4);
    });

    it('should retrieve a single notification with IDOR protection', async () => {
      const mockNotif = { id: 'notif-1', userId: 'user-1', title: 'Test 1', message: 'Hello' };
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotif);

      const result = await notificationService.getNotificationById('user-1', 'notif-1');

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockNotif);
    });

    it('should throw NotFoundError if attempting to view another user notification (IDOR block)', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationService.getNotificationById('user-attacker', 'notif-victim'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should delete notification from database on mark as read', async () => {
      const mockNotif = { id: 'notif-1', userId: 'user-1' };
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotif);
      (prisma.notification.delete as jest.Mock).mockResolvedValue(mockNotif);

      await notificationService.markAsRead('user-1', 'notif-1');

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
      });
      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });

    it('should throw NotFoundError if attempting to delete another user notification (IDOR block)', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationService.deleteNotification('user-attacker', 'notif-victim'),
      ).rejects.toThrow(NotFoundError);
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });

    it('should delete all notifications for a user on mark all as read', async () => {
      (prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const count = await notificationService.deleteAllNotifications('user-1');

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(count).toBe(3);
    });
  });
});
