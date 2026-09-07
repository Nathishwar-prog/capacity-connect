import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { TrainerMonitoringService } from '../services/trainer-monitoring.service';
import {
    TraineeMonitoringQuerySchema,
    CourseMonitoringParamSchema,
    TraineeCourseParamSchema,
    AssessmentMonitoringQuerySchema,
} from '../dto/trainer-monitoring.dto';

export class TrainerMonitoringController {
    private service: TrainerMonitoringService;

    constructor(service?: TrainerMonitoringService) {
        this.service = service || new TrainerMonitoringService();
    }

    /**
     * GET /api/v1/trainer/monitoring/overview
     */
    public getOverview = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;

        const data = await this.service.getMonitoringOverview(userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Trainer monitoring overview retrieved successfully',
            data,
        });
    };

    /**
     * GET /api/v1/trainer/monitoring/trainees
     */
    public getTrainees = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const query = TraineeMonitoringQuerySchema.parse(req.query);

        const result = await this.service.getTraineesMonitoring(userId, userRole, query);

        res.status(200).json({
            success: true,
            message: 'Trainees monitoring list retrieved successfully',
            data: result.data,
            pagination: result.pagination,
        });
    };

    /**
     * GET /api/v1/trainer/monitoring/courses/:courseId
     */
    public getCourseMonitoring = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { courseId } = CourseMonitoringParamSchema.parse(req.params);
        const query = TraineeMonitoringQuerySchema.parse(req.query);

        const data = await this.service.getCourseMonitoring(userId, userRole, courseId, query);

        res.status(200).json({
            success: true,
            message: 'Course monitoring details retrieved successfully',
            data,
        });
    };

    /**
     * GET /api/v1/trainer/monitoring/courses/:courseId/trainees/:traineeId
     */
    public getTraineeCourseDetails = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { courseId, traineeId } = TraineeCourseParamSchema.parse(req.params);

        const data = await this.service.getTraineeCourseMonitoringDetails(userId, userRole, courseId, traineeId);

        res.status(200).json({
            success: true,
            message: 'Trainee course monitoring detail retrieved successfully',
            data,
        });
    };

    /**
     * GET /api/v1/trainer/monitoring/assessments
     */
    public getAssessmentsMonitoring = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const query = AssessmentMonitoringQuerySchema.parse(req.query);

        const result = await this.service.getAssessmentMonitoring(userId, userRole, query);

        res.status(200).json({
            success: true,
            message: 'Assessment monitoring retrieved successfully',
            data: result.data,
            pagination: result.pagination,
        });
    };
}
