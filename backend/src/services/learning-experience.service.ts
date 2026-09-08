import { EnrollmentStatus } from '@prisma/client';
import { LearningExperienceRepository } from '../repositories/learning-experience.repository';
import { NotFoundError, ForbiddenError } from '../errors/app-error';
import {
  CourseLearningOverviewDto,
  LessonDetailDto,
  CompleteLessonResponseDto,
  CourseProgressDto,
} from '../dto/learning-experience.dto';

export class LearningExperienceService {
  private repository: LearningExperienceRepository;

  constructor(repository: LearningExperienceRepository = new LearningExperienceRepository()) {
    this.repository = repository;
  }

  /**
   * Retrieve full course structure, modules, lessons, and trainee progress
   */
  public async getCourseLearningOverview(
    userId: string,
    courseId: string,
  ): Promise<CourseLearningOverviewDto> {
    // 1. Verify trainee is enrolled in this course
    const enrollment = await this.repository.findEnrollment(userId, courseId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course. Access denied.');
    }

    // 2. Fetch course hierarchy with modules and lessons
    const course = await this.repository.findCourseHierarchy(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // 3. Fetch progress for all lessons in this course for this user
    const userProgress = await this.repository.findUserLessonProgressForCourse(userId, courseId);
    const progressMap = new Map(userProgress.map((p) => [p.lessonId, p]));

    let totalLessonsCount = 0;
    let completedLessonsCount = 0;
    let firstUncompletedLessonId: string | null = null;
    let firstUncompletedModuleId: string | null = null;

    const modulesSummary = course.modules.map((mod) => {
      let moduleCompletedCount = 0;

      const lessonsSummary = mod.lessons.map((les) => {
        totalLessonsCount++;
        const prog = progressMap.get(les.id);
        const isCompleted = prog?.completed || false;

        if (isCompleted) {
          moduleCompletedCount++;
          completedLessonsCount++;
        } else if (!firstUncompletedLessonId) {
          firstUncompletedLessonId = les.id;
          firstUncompletedModuleId = mod.id;
        }

        return {
          id: les.id,
          moduleId: les.moduleId,
          title: les.title,
          description: les.description,
          contentType: les.contentType,
          durationMinutes: les.durationMinutes,
          orderIndex: les.orderIndex,
          isPreview: les.isPreview,
          completed: isCompleted,
          progressPercentage: isCompleted ? 100 : (prog?.progressPercentage || 0),
        };
      });

      const modTotal = mod.lessons.length;
      const modProgress = modTotal > 0 ? Math.round((moduleCompletedCount / modTotal) * 100) : 0;

      return {
        id: mod.id,
        courseId: mod.courseId,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        totalLessons: modTotal,
        completedLessons: moduleCompletedCount,
        progressPercentage: modProgress,
        lessons: lessonsSummary,
      };
    });

    const trainerName =
      `${course.trainer.firstName} ${course.trainer.lastName}`.trim() || 'MoES Faculty';

    // Current lesson defaults to first uncompleted, or first lesson if none completed, or last if all completed
    const allOrderedLessons = modulesSummary.flatMap((m) => m.lessons);
    const defaultLessonId =
      firstUncompletedLessonId ||
      (allOrderedLessons.length > 0 ? allOrderedLessons[0].id : null);
    const defaultModuleId =
      firstUncompletedModuleId ||
      (modulesSummary.length > 0 ? modulesSummary[0].id : null);

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      durationMinutes: course.durationMinutes,
      trainer: {
        id: course.trainer.id,
        name: trainerName,
        designation: course.trainer.trainerProfile?.designation || 'Scientific Officer',
        organizationName:
          course.trainer.trainerProfile?.organizationName || 'India Meteorological Department',
        avatarUrl: course.trainer.avatarUrl,
      },
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        lastAccessedAt: enrollment.lastAccessedAt ? enrollment.lastAccessedAt.toISOString() : null,
      },
      totalModules: course.modules.length,
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      currentLessonId: defaultLessonId,
      currentModuleId: defaultModuleId,
      modules: modulesSummary,
    };
  }

  /**
   * Retrieve details and resource for a specific lesson with navigation context
   */
  public async getLessonDetails(userId: string, lessonId: string): Promise<LessonDetailDto> {
    const lesson = await this.repository.findLessonDetails(lessonId);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const courseId = lesson.module.course.id;

    // Verify trainee is enrolled in the parent course
    const enrollment = await this.repository.findEnrollment(userId, courseId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    // Determine sequence: previous and next lessons across all modules in course
    const orderedLessons = await this.repository.findOrderedLessonsForCourse(courseId);
    const currentIndex = orderedLessons.findIndex((l) => l.id === lessonId);

    const previousLessonId = currentIndex > 0 ? orderedLessons[currentIndex - 1].id : null;
    const nextLessonId =
      currentIndex >= 0 && currentIndex < orderedLessons.length - 1
        ? orderedLessons[currentIndex + 1].id
        : null;

    // Fetch user progress for this specific lesson
    const progress = await this.repository.findLessonProgress(userId, lessonId);

    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.module.title,
      courseId: courseId,
      courseTitle: lesson.module.course.title,
      title: lesson.title,
      description: lesson.description,
      contentType: lesson.contentType,
      content: lesson.content,
      resourceUrl: lesson.resourceUrl,
      durationMinutes: lesson.durationMinutes,
      orderIndex: lesson.orderIndex,
      completed: progress?.completed || false,
      progressPercentage: progress?.progressPercentage || 0,
      previousLessonId,
      nextLessonId,
    };
  }

  /**
   * Mark a lesson complete and update overall course progress
   */
  public async completeLesson(
    userId: string,
    lessonId: string,
  ): Promise<CompleteLessonResponseDto> {
    const lesson = await this.repository.findLessonDetails(lessonId);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const courseId = lesson.module.course.id;
    const enrollment = await this.repository.findEnrollment(userId, courseId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    // 1. Mark lesson as completed
    await this.repository.upsertLessonProgress(userId, lessonId, enrollment.id, true);

    // 2. Fetch all ordered lessons to determine total and next lesson
    const orderedLessons = await this.repository.findOrderedLessonsForCourse(courseId);
    const totalLessons = orderedLessons.length;

    // 3. Count completed lessons
    const userProgress = await this.repository.findUserLessonProgressForCourse(userId, courseId);
    const completedCount = userProgress.filter((p) => p.completed).length;

    // 4. Calculate progress percentage
    const progressPercentage =
      totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 100;

    const newStatus: EnrollmentStatus =
      progressPercentage >= 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS;

    // 5. Update enrollment progress
    await this.repository.updateEnrollmentProgress(enrollment.id, progressPercentage, newStatus);

    // 6. Identify next lesson
    const currentIndex = orderedLessons.findIndex((l) => l.id === lessonId);
    const nextLessonId =
      currentIndex >= 0 && currentIndex < orderedLessons.length - 1
        ? orderedLessons[currentIndex + 1].id
        : null;

    return {
      success: true,
      message: 'Lesson completed successfully',
      lessonId,
      completed: true,
      courseProgressPercentage: progressPercentage,
      courseStatus: newStatus,
      nextLessonId,
    };
  }

  /**
   * Retrieve current progress summary for a course
   */
  public async getCourseProgress(userId: string, courseId: string): Promise<CourseProgressDto> {
    const enrollment = await this.repository.findEnrollment(userId, courseId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    const orderedLessons = await this.repository.findOrderedLessonsForCourse(courseId);
    const userProgress = await this.repository.findUserLessonProgressForCourse(userId, courseId);
    const completedCount = userProgress.filter((p) => p.completed).length;

    return {
      courseId,
      totalLessons: orderedLessons.length,
      completedLessons: completedCount,
      progressPercentage: enrollment.progressPercentage,
      status: enrollment.status,
      lastAccessedAt: enrollment.lastAccessedAt ? enrollment.lastAccessedAt.toISOString() : null,
    };
  }
}
