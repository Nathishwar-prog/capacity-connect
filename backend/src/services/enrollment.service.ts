import { IEnrollmentRepository } from '../repositories/enrollment.repository';
import { ILessonProgressRepository } from '../repositories/lesson-progress.repository';
import { ICourseRepository } from '../repositories/course.repository';
import { IUserRepository } from '../repositories/user.repository';
import { EnrollmentStatus, CourseStatus, Role } from '@prisma/client';
import {
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    ConflictError,
} from '../errors/app-error';

export interface UserContext {
    userId: string;
    role: Role;
    organizationId?: string;
    permissions?: string[];
}

export class EnrollmentService {
    constructor(
        private enrollmentRepo: IEnrollmentRepository,
        private lessonProgressRepo: ILessonProgressRepository,
        private courseRepo: ICourseRepository,
        private userRepo: IUserRepository
    ) { }

    async enrollInCourse(userId: string, courseId: string, userCtx: UserContext) {
        // 1. Verify User exists and is approved
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Enforce that userCtx caller is requesting for self, or is ADMIN/SUPER_ADMIN
        if (userCtx.userId !== userId && userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Cannot enroll on behalf of another user');
        }

        // 2. Verify Course exists
        const course = await this.courseRepo.findById(courseId);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // 3. Enforce Course Publication Status
        if (course.status !== CourseStatus.PUBLISHED) {
            throw new BadRequestError(`Cannot enroll in course with status '${course.status}'. Course must be PUBLISHED.`);
        }

        // 4. Enforce Organization Boundary
        if (user.organizationId !== course.organizationId) {
            throw new ForbiddenError('User and Course belong to different organizations');
        }

        // 5. Check for Existing Enrollment
        const existing = await this.enrollmentRepo.findByUserAndCourse(userId, courseId);
        if (existing) {
            if (existing.status === EnrollmentStatus.DROPPED) {
                // Re-enroll dropped course
                return this.enrollmentRepo.updateStatus(existing.id, EnrollmentStatus.ENROLLED);
            }
            throw new ConflictError('User is already enrolled in this course');
        }

        // 6. Create Enrollment
        return this.enrollmentRepo.create(userId, courseId);
    }

    async getMyEnrollments(userId: string, status?: EnrollmentStatus, skip = 0, take = 20, userCtx?: UserContext) {
        if (userCtx && userCtx.userId !== userId && userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Access denied to user enrollment records');
        }

        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.enrollmentRepo.findByUser(userId, status, skip, take);
    }

    async getEnrollmentById(enrollmentId: string, userCtx: UserContext) {
        const enrollment = await this.enrollmentRepo.findById(enrollmentId);
        if (!enrollment) {
            throw new NotFoundError('Enrollment record not found');
        }

        // Authorization check: Trainee must own enrollment; Admin/SuperAdmin can access; Trainer can access if course owner
        const isOwner = enrollment.userId === userCtx.userId;
        const isAdmin = userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN;
        const isCourseTrainer = enrollment.course?.trainerId === userCtx.userId;

        if (!isOwner && !isAdmin && !isCourseTrainer) {
            throw new ForbiddenError('Access denied to this enrollment record');
        }

        // Enforce Organization Boundary
        const user = await this.userRepo.findById(userCtx.userId);
        if (user && enrollment.course && user.organizationId !== enrollment.course.organizationId) {
            throw new ForbiddenError('User and Course belong to different organizations');
        }

        return enrollment;
    }

    async updateLessonProgress(
        enrollmentId: string,
        lessonId: string,
        completed: boolean,
        userCtx: UserContext,
        customProgressPercentage?: number
    ) {
        const enrollment = await this.enrollmentRepo.findById(enrollmentId);
        if (!enrollment) {
            throw new NotFoundError('Enrollment record not found');
        }

        // IDOR Ownership check: Only the enrolled trainee can update their lesson progress
        if (enrollment.userId !== userCtx.userId) {
            throw new ForbiddenError('You can only update progress for your own enrollments');
        }

        if (enrollment.status === EnrollmentStatus.DROPPED) {
            throw new BadRequestError('Cannot update progress for a dropped course enrollment');
        }

        // Verify lesson exists in course structure
        const totalLessonsCount = await this.enrollmentRepo.getTotalLessonsForCourse(enrollment.courseId);

        // Upsert Lesson Progress
        await this.lessonProgressRepo.upsert(
            userCtx.userId,
            lessonId,
            enrollmentId,
            completed,
            customProgressPercentage
        );

        // Calculate progress percentage
        const completedCount = await this.enrollmentRepo.countCompletedLessons(enrollmentId);
        const progressPercentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

        let status: EnrollmentStatus = enrollment.status;
        let completedAt: Date | null | undefined = undefined;

        if (totalLessonsCount > 0 && completedCount === totalLessonsCount) {
            status = EnrollmentStatus.COMPLETED;
            completedAt = new Date();
        } else if (completedCount > 0 || progressPercentage > 0) {
            status = EnrollmentStatus.IN_PROGRESS;
            completedAt = null;
        }

        const updatedEnrollment = await this.enrollmentRepo.updateProgress(
            enrollmentId,
            progressPercentage,
            status,
            completedAt
        );

        return {
            enrollment: updatedEnrollment,
            completedLessonsCount: completedCount,
            totalLessonsCount,
            progressPercentage,
        };
    }

    async dropEnrollment(enrollmentId: string, userCtx: UserContext) {
        const enrollment = await this.enrollmentRepo.findById(enrollmentId);
        if (!enrollment) {
            throw new NotFoundError('Enrollment record not found');
        }

        // Ownership check
        if (enrollment.userId !== userCtx.userId && userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('You can only drop your own course enrollments');
        }

        if (enrollment.status === EnrollmentStatus.COMPLETED) {
            throw new BadRequestError('Cannot drop a completed course enrollment');
        }

        return this.enrollmentRepo.updateStatus(enrollmentId, EnrollmentStatus.DROPPED);
    }
}
