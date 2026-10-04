import { Request, Response } from 'express';
import { AnnouncementService, AdminActionContext } from '../services/announcement.service';
import { ResponseHelper } from '../errors/response.helper';
import { CreateAnnouncementDto } from '../validators/announcement.validation';
import { UnauthorizedError } from '../errors/app-error';

export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor(announcementService: AnnouncementService = new AnnouncementService()) {
    this.announcementService = announcementService;
  }

  private extractActionContext(req: Request): AdminActionContext {
    return {
      adminUserId: req.user?.userId || 'unknown-admin',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] as string | undefined,
    };
  }

  public createAnnouncement = async (req: Request, res: Response): Promise<Response> => {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedError('Authenticated user required');
    }

    const dto = req.body as CreateAnnouncementDto;
    const context = this.extractActionContext(req);
    const result = await this.announcementService.createAnnouncement(adminUserId, dto, context);

    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: `Announcement published and dispatched to ${result.recipientCount} recipient(s) successfully`,
      data: result,
    });
  };

  public getAnnouncements = async (req: Request, res: Response): Promise<Response> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const audience = req.query.audience as string | undefined;

    const result = await this.announcementService.getAnnouncements({ page, limit, audience });

    return ResponseHelper.success({
      res,
      message: 'Announcements retrieved successfully',
      data: result.announcements,
      meta: result.meta as unknown as Record<string, unknown>,
    });
  };

  public getAnnouncementById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const announcement = await this.announcementService.getAnnouncementById(id);

    return ResponseHelper.success({
      res,
      message: 'Announcement retrieved successfully',
      data: announcement,
    });
  };
}

export default AnnouncementController;
