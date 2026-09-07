import { Role } from '@prisma/client';
import { TrainerMonitoringRepository } from '../repositories/trainer-monitoring.repository';
import { TraineeMonitoringQuery, AssessmentMonitoringQuery } from '../dto/trainer-monitoring.dto';
import { ForbiddenError, NotFoundError } from '../errors/app-error';

export class TrainerMonitoringService {
    private repository: TrainerMonitoringRepository;

    constructor(repository?: TrainerMonitoringRepository) {
        this.repository = repository || new TrainerMonitoringRepository();
    }

    /**
     * Evaluates if user role has monitoring privileges and whether access is global.
     */
    private validateMonitoringRole(userRole: Role): { isGlobalAccess: boolean } {
        if (userRole === Role.TRAINEE) {
            throw new ForbiddenError('Trainees are not authorized to access trainer monitoring APIs');
        }
        const isGlobalAccess = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
        return { isGlobalAccess };
    }

    /**
     * Retrieves high-level monitoring dashboard overview metrics & course list.
     */
    public async getMonitoringOverview(userId: string, userRole: Role) {
        const { isGlobalAccess } = this.validateMonitoringRole(userRole);
        const authorizedCourseIds = await this.repository.findAuthorizedCourseIds(userId, isGlobalAccess);

        const metrics = await this.repository.getOverviewMetrics(authorizedCourseIds);
        const courses = await this.repository.getAuthorizedCoursesSummary(authorizedCourseIds);

        return {
            metrics,
            courses,
        };
    }

    /**
     * Retrieves paginated list of trainees with progress, enrollment, and assessment participation summary.
     */
    public async getTraineesMonitoring(userId: string, userRole: Role, query: TraineeMonitoringQuery) {
        const { isGlobalAccess } = this.validateMonitoringRole(userRole);
        const authorizedCourseIds = await this.repository.findAuthorizedCourseIds(userId, isGlobalAccess);

        // If query contains specific courseId, verify trainer ownership (IDOR check)
        if (query.courseId) {
            const isAuthorized = await this.repository.isCourseAuthorized(query.courseId, userId, isGlobalAccess);
            if (!isAuthorized) {
                throw new ForbiddenError('You are not authorized to monitor this course');
            }
        }

        return this.repository.findTraineesMonitoring(authorizedCourseIds, query);
    }

    /**
     * Retrieves detailed course monitoring metrics and enrolled trainees for a specific course.
     */
    public async getCourseMonitoring(userId: string, userRole: Role, courseId: string, query: TraineeMonitoringQuery) {
        const { isGlobalAccess } = this.validateMonitoringRole(userRole);

        const isAuthorized = await this.repository.isCourseAuthorized(courseId, userId, isGlobalAccess);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to monitor this course');
        }

        const courseMonitoring = await this.repository.getCourseMonitoring(courseId, query);
        if (!courseMonitoring) {
            throw new NotFoundError('Course not found');
        }

        return courseMonitoring;
    }

    /**
     * Retrieves comprehensive monitoring details for a specific trainee within an authorized course.
     */
    public async getTraineeCourseMonitoringDetails(
        userId: string,
        userRole: Role,
        courseId: string,
        traineeId: string,
    ) {
        const { isGlobalAccess } = this.validateMonitoringRole(userRole);

        const isAuthorized = await this.repository.isCourseAuthorized(courseId, userId, isGlobalAccess);
        if (!isAuthorized) {
            throw new ForbiddenError('You are not authorized to monitor this course');
        }

        const traineeDetail = await this.repository.getTraineeCourseDetail(courseId, traineeId);
        if (!traineeDetail) {
            throw new NotFoundError('Trainee enrollment record not found for this course');
        }

        return traineeDetail;
    }

    /**
     * Retrieves assessment attempts, scores, and pass/fail monitoring across authorized courses.
     */
    public async getAssessmentMonitoring(userId: string, userRole: Role, query: AssessmentMonitoringQuery) {
        const { isGlobalAccess } = this.validateMonitoringRole(userRole);
        const authorizedCourseIds = await this.repository.findAuthorizedCourseIds(userId, isGlobalAccess);

        if (query.courseId) {
            const isAuthorized = await this.repository.isCourseAuthorized(query.courseId, userId, isGlobalAccess);
            if (!isAuthorized) {
                throw new ForbiddenError('You are not authorized to monitor assessments for this course');
            }
        }

        return this.repository.findAssessmentMonitoring(authorizedCourseIds, query);
    }
}
