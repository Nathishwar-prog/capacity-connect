import { Request, Response } from 'express';
import { AdminCapacityBuildingService } from '../services/admin-capacity-building.service';
import { ResponseHelper } from '../errors/response.helper';
import { NotFoundError } from '../errors/app-error';

export class AdminCapacityBuildingController {
  private service: AdminCapacityBuildingService;

  constructor(service?: AdminCapacityBuildingService) {
    this.service = service || new AdminCapacityBuildingService();
  }

  /**
   * GET /api/v1/admin/capacity-building/overview
   */
  public getOverview = async (_req: Request, res: Response): Promise<Response> => {
    const data = await this.service.getOverview();
    return ResponseHelper.success({
      res,
      message: 'Capacity building overview retrieved successfully',
      data,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/trainees
   */
  public getTrainees = async (req: Request, res: Response): Promise<Response> => {
    const { search, departmentId, status, courseId, page, limit, sortBy, sortOrder } =
      req.query;

    const result = await this.service.getTrainees({
      search: search as string | undefined,
      departmentId: departmentId as string | undefined,
      status: status as string | undefined,
      courseId: courseId as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    return ResponseHelper.success({
      res,
      message: 'Trainees cohort retrieved successfully',
      data: {
        trainees: result.trainees,
        departments: result.departments,
        kpis: result.kpis,
      },
      meta: result.meta as unknown as Record<string, unknown>,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/trainees/:id
   */
  public getTraineeById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const trainee = await this.service.getTraineeById(id);

    if (!trainee) {
      throw new NotFoundError(`Trainee not found with ID ${id}`);
    }

    return ResponseHelper.success({
      res,
      message: 'Trainee profile and learning metrics retrieved successfully',
      data: trainee,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/trainers
   */
  public getTrainers = async (req: Request, res: Response): Promise<Response> => {
    const { search, departmentId, status, page, limit, sortBy, sortOrder } = req.query;

    const result = await this.service.getTrainers({
      search: search as string | undefined,
      departmentId: departmentId as string | undefined,
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    return ResponseHelper.success({
      res,
      message: 'Trainers directory and workload metrics retrieved successfully',
      data: {
        trainers: result.trainers,
        departments: result.departments,
        kpis: result.kpis,
      },
      meta: result.meta as unknown as Record<string, unknown>,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/trainers/:id
   */
  public getTrainerById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const trainer = await this.service.getTrainerById(id);

    if (!trainer) {
      throw new NotFoundError(`Trainer not found with ID ${id}`);
    }

    return ResponseHelper.success({
      res,
      message: 'Trainer profile and portfolio workload retrieved successfully',
      data: trainer,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/resources
   */
  public getResources = async (req: Request, res: Response): Promise<Response> => {
    const { search, resourceType, status, courseId, page, limit } = req.query;

    const result = await this.service.getResources({
      search: search as string | undefined,
      resourceType: resourceType as string | undefined,
      status: status as string | undefined,
      courseId: courseId as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return ResponseHelper.success({
      res,
      message: 'Learning resources list and analytics retrieved successfully',
      data: {
        resources: result.resources,
        kpis: result.kpis,
      },
      meta: result.meta as unknown as Record<string, unknown>,
    });
  };

  /**
   * GET /api/v1/admin/capacity-building/resources/:id
   */
  public getResourceById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const resource = await this.service.getResourceById(id);

    if (!resource) {
      throw new NotFoundError(`Learning resource not found with ID ${id}`);
    }

    return ResponseHelper.success({
      res,
      message: 'Learning resource details retrieved successfully',
      data: resource,
    });
  };
}
