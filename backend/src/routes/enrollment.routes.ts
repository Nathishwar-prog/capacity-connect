import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { LessonProgressRepository } from '../repositories/lesson-progress.repository';
import { CourseRepository } from '../repositories/course.repository';
import { UserRepository } from '../repositories/user.repository';
import { EnrollmentService } from '../services/enrollment.service';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../auth/auth.middleware';

const prisma = new PrismaClient();

const enrollmentRepo = new EnrollmentRepository(prisma);
const lessonProgressRepo = new LessonProgressRepository(prisma);
const courseRepo = new CourseRepository();
const userRepo = new UserRepository();

const enrollmentService = new EnrollmentService(
    enrollmentRepo,
    lessonProgressRepo,
    courseRepo,
    userRepo
);

const enrollmentController = new EnrollmentController(enrollmentService);

export const enrollmentRouter = Router();

// All enrollment routes require authentication
enrollmentRouter.use(authenticate);

// Trainee / Admin / Trainer enrollment routes
enrollmentRouter.post('/', enrollmentController.enroll);
enrollmentRouter.get('/', enrollmentController.getMyEnrollments);
enrollmentRouter.get('/:id', enrollmentController.getEnrollmentDetails);
enrollmentRouter.post('/:id/lessons/:lessonId/progress', enrollmentController.updateLessonProgress);
enrollmentRouter.post('/:id/drop', enrollmentController.dropEnrollment);
enrollmentRouter.delete('/:id', enrollmentController.dropEnrollment);
