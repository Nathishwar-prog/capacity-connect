import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AssessmentService } from '../services/assessment.service';
import {
    CreateAssessmentSchema,
    UpdateAssessmentSchema,
    AssessmentQuerySchema,
    CreateQuestionSchema,
    UpdateQuestionSchema,
    SubmitAnswersSchema,
} from '../dto/assessment.dto';

export class AssessmentController {
    private service: AssessmentService;

    constructor(service?: AssessmentService) {
        this.service = service || new AssessmentService();
    }

    /**
     * POST /api/v1/assessments
     */
    public createAssessment = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const input = CreateAssessmentSchema.parse(req.body);

        const data = await this.service.createAssessment(userId, userRole, input);

        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data,
        });
    };

    /**
     * GET /api/v1/assessments
     */
    public listAssessments = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const query = AssessmentQuerySchema.parse(req.query);

        const result = await this.service.listAssessments(userId, userRole, query);

        res.status(200).json({
            success: true,
            message: 'Assessments retrieved successfully',
            data: result.data,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    };

    /**
     * GET /api/v1/assessments/:id
     */
    public getAssessmentById = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { id } = req.params;

        const data = await this.service.getAssessmentById(id, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Assessment details retrieved successfully',
            data,
        });
    };

    /**
     * PATCH /api/v1/assessments/:id
     */
    public updateAssessment = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { id } = req.params;
        const input = UpdateAssessmentSchema.parse(req.body);

        const data = await this.service.updateAssessment(id, userId, userRole, input);

        res.status(200).json({
            success: true,
            message: 'Assessment updated successfully',
            data,
        });
    };

    /**
     * DELETE /api/v1/assessments/:id
     */
    public deleteAssessment = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { id } = req.params;

        await this.service.deleteAssessment(id, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Assessment deleted successfully',
        });
    };

    /**
     * POST /api/v1/assessments/:assessmentId/questions
     */
    public addQuestion = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId } = req.params;
        const input = CreateQuestionSchema.parse(req.body);

        const data = await this.service.addQuestion(assessmentId, userId, userRole, input);

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data,
        });
    };

    /**
     * PATCH /api/v1/assessments/:assessmentId/questions/:questionId
     */
    public updateQuestion = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId, questionId } = req.params;
        const input = UpdateQuestionSchema.parse(req.body);

        const data = await this.service.updateQuestion(assessmentId, questionId, userId, userRole, input);

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data,
        });
    };

    /**
     * DELETE /api/v1/assessments/:assessmentId/questions/:questionId
     */
    public deleteQuestion = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId, questionId } = req.params;

        await this.service.deleteQuestion(assessmentId, questionId, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
        });
    };

    /**
     * POST /api/v1/assessments/:assessmentId/attempts
     */
    public startAttempt = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId } = req.params;

        const data = await this.service.startAttempt(assessmentId, userId, userRole);

        res.status(201).json({
            success: true,
            message: data.isResumed ? 'Existing attempt resumed' : 'Assessment attempt started successfully',
            data,
        });
    };

    /**
     * GET /api/v1/assessments/:assessmentId/attempts/:attemptId
     */
    public getAttempt = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { attemptId } = req.params;

        const data = await this.service.getAttempt(attemptId, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Attempt status retrieved successfully',
            data,
        });
    };

    /**
     * POST /api/v1/assessments/:assessmentId/attempts/:attemptId/submit
     */
    public submitAttempt = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId, attemptId } = req.params;
        const input = SubmitAnswersSchema.parse(req.body);

        const data = await this.service.submitAttempt(assessmentId, attemptId, userId, userRole, input);

        res.status(200).json({
            success: true,
            message: 'Assessment attempt submitted and scored successfully',
            data: data.result,
        });
    };

    /**
     * GET /api/v1/assessments/:assessmentId/attempts/:attemptId/result
     */
    public getResult = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.userId;
        const userRole = req.user!.role as Role;
        const { assessmentId, attemptId } = req.params;

        const data = await this.service.getResult(assessmentId, attemptId, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Assessment result retrieved successfully',
            data,
        });
    };
}
