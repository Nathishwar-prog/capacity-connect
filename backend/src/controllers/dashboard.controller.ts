import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ResponseHelper } from '../errors/response.helper';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  public getTraineeDashboard = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.dashboardService.getTraineeDashboard(userId);

    return ResponseHelper.success({
      res,
      message: 'Trainee dashboard summary retrieved successfully',
      data,
    });
  };

  public getTrainerDashboard = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.dashboardService.getTrainerDashboard(userId);

    return ResponseHelper.success({
      res,
      message: 'Trainer dashboard summary retrieved successfully',
      data,
    });
  };

  public getAdminDashboard = async (_req: Request, res: Response): Promise<Response> => {
    // If multi-tenant organizationId exists, scope to it
    const data = await this.dashboardService.getAdminDashboard();

    return ResponseHelper.success({
      res,
      message: 'Administrative dashboard overview retrieved successfully',
      data,
    });
  };
}

export default DashboardController;
