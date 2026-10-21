import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SettingsService, UserContext } from '../services/settings.service';
import { ResponseHelper } from '../errors/response.helper';

export class SettingsController {
  private service: SettingsService;

  constructor(service: SettingsService = new SettingsService()) {
    this.service = service;
  }

  private extractContext(req: Request): UserContext {
    return {
      userId: req.user?.id || req.user?.userId || 'unknown-admin',
      role: req.user?.role || 'ADMIN',
      organizationId: req.user?.organizationId,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  public getSettings = async (_req: Request, res: Response): Promise<Response> => {
    const settings = await this.service.getSettings();
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'System settings retrieved successfully',
      data: settings,
    });
  };

  public getPublicSettings = async (_req: Request, res: Response): Promise<Response> => {
    const publicSettings = await this.service.getPublicSettings();
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Public portal settings retrieved successfully',
      data: publicSettings,
    });
  };

  public updatePortalSettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updatePortalSettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Portal & branding settings updated successfully',
      data: updated,
    });
  };

  public updateLearningSettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updateLearningSettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Learning policies and revision configuration updated successfully',
      data: updated,
    });
  };

  public updateNotificationSettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updateNotificationSettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Notification distribution policies updated successfully',
      data: updated,
    });
  };

  public updateAiSettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updateAiSettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'AI & Analytics model configuration updated successfully',
      data: updated,
    });
  };

  public updateSecuritySettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updateSecuritySettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Security and session policies updated successfully',
      data: updated,
    });
  };

  public updateLocalizationSettings = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const updated = await this.service.updateLocalizationSettings(req.body, context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Localization and timezone preferences updated successfully',
      data: updated,
    });
  };

  public getHealthStatus = async (_req: Request, res: Response): Promise<Response> => {
    const health = await this.service.getHealthStatus();
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'System health diagnostics retrieved successfully',
      data: health,
    });
  };

  public testConnection = async (req: Request, res: Response): Promise<Response> => {
    const { target } = req.body;
    const result = await this.service.testConnection(target);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: `Connection test completed for ${target}`,
      data: result,
    });
  };

  public clearCache = async (req: Request, res: Response): Promise<Response> => {
    const context = this.extractContext(req);
    const result = await this.service.clearCache(context);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Platform caches cleared successfully',
      data: result,
    });
  };

  public getSettingsAuditLogs = async (req: Request, res: Response): Promise<Response> => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const data = await this.service.getSettingsAuditLogs(page, limit);
    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Settings audit history retrieved successfully',
      data,
    });
  };
}
