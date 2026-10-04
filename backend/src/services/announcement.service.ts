import { Announcement, AnnouncementStatus, AnnouncementType, NotificationType, Role, UserStatus } from '@prisma/client';
import prisma from '../database/client';
import { CreateAnnouncementDto } from '../validators/announcement.validation';
import { NotFoundError } from '../errors/app-error';
import { AuditService } from './audit.service';
import logger from '../logger/winston.logger';
import appEventEmitter from '../events';

export interface AdminActionContext {
  adminUserId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnnouncementListResponse {
  announcements: (Announcement & {
    author?: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string;
    };
    recipientCount?: number;
  })[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AnnouncementService {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  /**
   * Creates an announcement, persists it to the database, resolves target recipients,
   * and creates persistent notifications for all approved audience members.
   */
  public async createAnnouncement(
    adminUserId: string,
    dto: CreateAnnouncementDto,
    context: AdminActionContext,
  ): Promise<{ announcement: Announcement; recipientCount: number }> {
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, organizationId: true, firstName: true, lastName: true },
    });

    if (!admin) {
      throw new NotFoundError('Admin user not found');
    }

    const organizationId = admin.organizationId;

    // 1. Persist Announcement
    const announcement = await prisma.announcement.create({
      data: {
        organizationId,
        createdBy: adminUserId,
        title: dto.title,
        content: dto.content,
        targetAudience: dto.audience,
        type: (dto.type as AnnouncementType) || AnnouncementType.GENERAL,
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // 2. Resolve audience roles (only APPROVED members receive announcements)
    let roleFilter: Role[] = [];
    if (dto.audience === 'ALL') {
      roleFilter = [Role.TRAINEE, Role.TRAINER];
    } else if (dto.audience === 'TRAINEES') {
      roleFilter = [Role.TRAINEE];
    } else if (dto.audience === 'TRAINERS') {
      roleFilter = [Role.TRAINER];
    }

    const recipients = await prisma.user.findMany({
      where: {
        organizationId,
        status: UserStatus.APPROVED,
        role: { in: roleFilter },
      },
      select: { id: true },
    });

    // 3. Batch insert notifications with duplicate protection and full content persistence
    let recipientCount = 0;
    if (recipients.length > 0) {
      // Find existing notification records for this announcement to prevent duplicates
      const existingNotifs = await prisma.notification.findMany({
        where: {
          entityType: 'Announcement',
          entityId: announcement.id,
          userId: { in: recipients.map((r: { id: string }) => r.id) },
        },
        select: { userId: true },
      });
      const existingUserIds = new Set(existingNotifs.map((n: { userId: string }) => n.userId));
      const newRecipients = recipients.filter((r: { id: string }) => !existingUserIds.has(r.id));

      if (newRecipients.length > 0) {
        recipientCount = newRecipients.length;
        const notificationRows = newRecipients.map((r: { id: string }) => ({
          userId: r.id,
          title: dto.title,
          message: dto.content,
          type: NotificationType.ANNOUNCEMENT,
          entityType: 'Announcement',
          entityId: announcement.id,
          isRead: false,
        }));

        await prisma.notification.createMany({
          data: notificationRows,
        });

        logger.info(
          `[AnnouncementService] Created ${notificationRows.length} notifications for announcement ${announcement.id} (${dto.audience})`,
        );
      }
    }

    // 4. Audit Log & Event
    await this.auditService.logEvent({
      organizationId,
      userId: adminUserId,
      action: 'ANNOUNCEMENT_PUBLISHED',
      entityType: 'Announcement',
      entityId: announcement.id,
      newValues: {
        title: dto.title,
        audience: dto.audience,
        recipientCount,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    appEventEmitter.emit('announcement.published', {
      announcementId: announcement.id,
      audience: dto.audience,
      recipientCount,
    });

    return {
      announcement,
      recipientCount,
    };
  }

  /**
   * Retrieves paginated list of announcements
   */
  public async getAnnouncements(query: {
    page?: number;
    limit?: number;
    audience?: string;
  }): Promise<AnnouncementListResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.audience && query.audience !== 'ALL') {
      where.targetAudience = query.audience;
    }

    const [announcements, total] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      announcements,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single announcement by ID
   */
  public async getAnnouncementById(id: string): Promise<Announcement> {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return announcement;
  }
}

export default AnnouncementService;
