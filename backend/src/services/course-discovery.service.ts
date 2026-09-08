import { CourseDiscoveryRepository } from '../repositories/course-discovery.repository';
import { CourseQueryInput } from '../validators/course-discovery.validator';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/app-error';
import {
  CourseListResponseDto,
  CourseSummaryDto,
  CourseDetailsDto,
  CourseFiltersMetadataDto,
} from '../dto/course-discovery.dto';
import { CourseStatus } from '@prisma/client';

export class CourseDiscoveryService {
  private repository: CourseDiscoveryRepository;

  constructor(repository: CourseDiscoveryRepository = new CourseDiscoveryRepository()) {
    this.repository = repository;
  }

  public async getCourses(
    query: CourseQueryInput,
    currentUserId?: string,
  ): Promise<CourseListResponseDto> {
    const [{ courses, total }, filterMeta] = await Promise.all([
      this.repository.findCourses(query, currentUserId),
      this.repository.getFilterMetadata(),
    ]);

    const mappedCourses: CourseSummaryDto[] = courses.map((c) => {
      const lessonsCount = c.modules.reduce((acc, m) => acc + m._count.lessons, 0);
      const userEnrollment = c.enrollments && c.enrollments.length > 0 ? c.enrollments[0] : null;

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category,
        difficulty: c.difficulty,
        durationMinutes: c.durationMinutes,
        status: c.status,
        trainer: {
          id: c.trainer.id,
          name: `${c.trainer.firstName} ${c.trainer.lastName || ''}`.trim(),
          designation: c.trainer.trainerProfile?.designation || 'MoES Training Faculty',
          organizationName:
            c.trainer.trainerProfile?.organizationName || 'India Meteorological Department',
          avatarUrl: c.trainer.avatarUrl,
        },
        modulesCount: c.modules.length,
        lessonsCount,
        enrollmentStatus: userEnrollment ? userEnrollment.status : null,
      };
    });

    const limit = query.limit || 12;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      courses: mappedCourses,
      total,
      page: query.page || 1,
      limit,
      totalPages,
      filters: filterMeta,
    };
  }

  public async getCourseDetails(courseId: string, currentUserId?: string): Promise<CourseDetailsDto> {
    const course = await this.repository.findCourseById(courseId, currentUserId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const userEnrollment = course.enrollments && course.enrollments.length > 0 ? course.enrollments[0] : null;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      category: course.category,
      difficulty: course.difficulty,
      durationMinutes: course.durationMinutes,
      status: course.status,
      publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
      trainer: {
        id: course.trainer.id,
        name: `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim(),
        designation: course.trainer.trainerProfile?.designation || 'MoES Training Faculty',
        organizationName:
          course.trainer.trainerProfile?.organizationName || 'India Meteorological Department',
        avatarUrl: course.trainer.avatarUrl,
      },
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        orderIndex: m.orderIndex,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          durationMinutes: l.durationMinutes,
          orderIndex: l.orderIndex,
          isPreview: l.isPreview,
        })),
      })),
      prerequisites: course.prerequisites.map((p) => ({
        id: p.prerequisiteCourse.id,
        title: p.prerequisiteCourse.title,
        slug: p.prerequisiteCourse.slug,
        category: p.prerequisiteCourse.category,
        difficulty: p.prerequisiteCourse.difficulty,
      })),
      competencies: course.courseCompetencies.map((cc) => ({
        id: cc.competency.id,
        name: cc.competency.name,
        code: cc.competency.code,
        category: cc.competency.category,
        targetLevel: cc.targetLevel,
      })),
      isEnrolled: !!userEnrollment,
      enrollmentStatus: userEnrollment ? userEnrollment.status : null,
    };
  }

  public async enrollCourse(userId: string, courseId: string) {
    const course = await this.repository.findCourseById(courseId, userId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestError('Course is not open for enrollment');
    }

    // 1. Check duplicate enrollment
    const existing = await this.repository.findEnrollment(userId, courseId);
    if (existing) {
      throw new ConflictError('Trainee is already enrolled in this course');
    }

    // 2. Perform enrollment
    const enrollment = await this.repository.createEnrollment(userId, courseId);
    return {
      success: true,
      message: 'Successfully enrolled in course',
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      status: enrollment.status,
    };
  }

  public async getFilterMetadata(): Promise<CourseFiltersMetadataDto> {
    return this.repository.getFilterMetadata();
  }
}
