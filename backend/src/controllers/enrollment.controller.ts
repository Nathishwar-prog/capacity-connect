import { Request, Response, NextFunction } from 'express';
import { EnrollmentService, UserContext } from '../services/enrollment.service';
import { enrollCourseSchema, updateLessonProgressSchema, enrollmentQuerySchema } from '../validators/enrollment.validation';
import { Role } from '@prisma/client';

export class EnrollmentController {
    constructor(private enrollmentService: EnrollmentService) { }

    enroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const courseId = req.params.courseId || req.body.courseId;
            const validated = enrollCourseSchema.parse({ courseId });

            const userCtx: UserContext = {
                userId: req.user!.userId,
                role: req.user!.role as Role,
                permissions: req.user!.permissions,
            };

            const enrollment = await this.enrollmentService.enrollInCourse(
                userCtx.userId,
                validated.courseId,
                userCtx
            );

            res.status(201).json({
                success: true,
                message: 'Successfully enrolled in course',
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

    getMyEnrollments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = enrollmentQuerySchema.parse(req.query);

            const userCtx: UserContext = {
                userId: req.user!.userId,
                role: req.user!.role as Role,
                permissions: req.user!.permissions,
            };

            const result = await this.enrollmentService.getMyEnrollments(
                userCtx.userId,
                query.status,
                query.skip,
                query.take,
                userCtx
            );

            res.status(200).json({
                success: true,
                data: result.enrollments,
                pagination: {
                    total: result.total,
                    skip: query.skip || 0,
                    take: query.take || 20,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getEnrollmentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const userCtx: UserContext = {
                userId: req.user!.userId,
                role: req.user!.role as Role,
                permissions: req.user!.permissions,
            };

            const enrollment = await this.enrollmentService.getEnrollmentById(id, userCtx);

            res.status(200).json({
                success: true,
                data: enrollment,
            });
        } catch (error) {
            next(error);
        }
    };

    updateLessonProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id, lessonId } = req.params;
            const validated = updateLessonProgressSchema.parse(req.body);

            const userCtx: UserContext = {
                userId: req.user!.userId,
                role: req.user!.role as Role,
                permissions: req.user!.permissions,
            };

            const result = await this.enrollmentService.updateLessonProgress(
                id,
                lessonId,
                validated.completed,
                userCtx,
                validated.progressPercentage
            );

            res.status(200).json({
                success: true,
                message: 'Lesson progress updated successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    dropEnrollment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            const userCtx: UserContext = {
                userId: req.user!.userId,
                role: req.user!.role as Role,
                permissions: req.user!.permissions,
            };

            const updated = await this.enrollmentService.dropEnrollment(id, userCtx);

            res.status(200).json({
                success: true,
                message: 'Successfully dropped course enrollment',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };
}
