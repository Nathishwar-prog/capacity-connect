import { CourseStructureService, UserContext } from '../services/course-structure.service';
import { Role, CourseStatus, EnrollmentStatus, LessonContentType } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../errors/app-error';

describe('Trainee Course Viewer Service Tests', () => {
    let service: CourseStructureService;
    let mockPrisma: any;
    let mockModuleRepo: any;
    let mockLessonRepo: any;
    let mockCourseRepo: any;
    let mockUserRepo: any;

    const traineeCtx: UserContext = {
        userId: 'trainee-1',
        role: Role.TRAINEE,
        permissions: ['courses:read'],
    };

    const trainerCtx: UserContext = {
        userId: 'trainer-1',
        role: Role.TRAINER,
        permissions: ['courses:read', 'courses:update'],
    };

    beforeEach(() => {
        mockModuleRepo = {};
        mockLessonRepo = {};
        mockCourseRepo = {};
        mockUserRepo = {};

        mockPrisma = {
            course: {
                findFirst: jest.fn(),
            },
            courseModule: {
                findMany: jest.fn(),
            },
            lesson: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                count: jest.fn(),
            },
            enrollment: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            lessonProgress: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                upsert: jest.fn(),
                count: jest.fn(),
            },
            lessonTopic: {
                findFirst: jest.fn(),
            },
        };

        service = new CourseStructureService(
            mockModuleRepo,
            mockLessonRepo,
            mockCourseRepo,
            mockUserRepo,
            mockPrisma
        );
    });

    describe('getCourseOutline', () => {
        const mockCourse = {
            id: 'course-1',
            title: 'Atmospheric Dynamics & NWP',
            slug: 'atmospheric-dynamics',
            description: 'Advanced NWP course',
            status: CourseStatus.PUBLISHED,
            durationMinutes: 180,
        };

        it('should throw NotFoundError if course does not exist', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(null);

            await expect(
                service.getCourseOutline('non-existent', traineeCtx)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ForbiddenError if trainee is not enrolled in the course', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
            mockPrisma.enrollment.findUnique.mockResolvedValue(null);

            await expect(
                service.getCourseOutline('course-1', traineeCtx)
            ).rejects.toThrow(ForbiddenError);
        });

        it('should return outline with ordered modules, lessons, and progress for enrolled trainee', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
            mockPrisma.enrollment.findUnique.mockResolvedValue({
                id: 'enr-1',
                userId: 'trainee-1',
                courseId: 'course-1',
                status: EnrollmentStatus.IN_PROGRESS,
            });

            mockPrisma.courseModule.findMany.mockResolvedValue([
                {
                    id: 'mod-1',
                    title: 'Module 1',
                    orderIndex: 0,
                    lessons: [
                        { id: 'les-1', moduleId: 'mod-1', title: 'Lesson 1', durationMinutes: 15, orderIndex: 0, _count: { lessonResources: 1 } },
                        { id: 'les-2', moduleId: 'mod-1', title: 'Lesson 2', durationMinutes: 20, orderIndex: 1, _count: { lessonResources: 0 } },
                    ],
                },
                {
                    id: 'mod-2',
                    title: 'Module 2',
                    orderIndex: 1,
                    lessons: [
                        { id: 'les-3', moduleId: 'mod-2', title: 'Lesson 3', durationMinutes: 25, orderIndex: 0, _count: { lessonResources: 2 } },
                    ],
                },
            ]);

            mockPrisma.lessonProgress.findMany.mockResolvedValue([
                { lessonId: 'les-1' },
            ]);

            const result = await service.getCourseOutline('course-1', traineeCtx);

            expect(result.course.title).toBe('Atmospheric Dynamics & NWP');
            expect(result.modules).toHaveLength(2);
            expect(result.modules[0].completedCount).toBe(1);
            expect(result.modules[0].totalCount).toBe(2);
            expect(result.modules[0].lessons[0].isCompleted).toBe(true);
            expect(result.modules[0].lessons[1].isCompleted).toBe(false);
            expect(result.progress.completedLessonsCount).toBe(1);
            expect(result.progress.totalLessonsCount).toBe(3);
            expect(result.progress.progressPercentage).toBe(33);
        });
    });

    describe('getLessonDetail', () => {
        const mockCourse = { id: 'course-1', title: 'Atmospheric Dynamics', status: CourseStatus.PUBLISHED };
        const mockLesson = {
            id: 'les-2',
            title: 'Lesson 2',
            contentType: LessonContentType.VIDEO,
            content: JSON.stringify([{ type: 'heading', content: 'Intro' }]),
            learningObjectives: ['Objective 1', 'Objective 2'],
            keyTakeaways: ['Takeaway 1'],
            module: { id: 'mod-1', courseId: 'course-1', title: 'Module 1', orderIndex: 0 },
            lessonResources: [
                {
                    resource: {
                        id: 'res-1',
                        title: 'NWP Guide PDF',
                        fileType: 'PDF',
                        url: 'https://cdn.example.com/nwp.pdf',
                        fileSize: BigInt(1024),
                    },
                },
            ],
        };

        it('should return complete lesson details with next and previous lesson IDs', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
            mockPrisma.enrollment.findUnique.mockResolvedValue({ id: 'enr-1', status: EnrollmentStatus.IN_PROGRESS });
            mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrisma.lesson.findMany.mockResolvedValue([
                { id: 'les-1' },
                { id: 'les-2' },
                { id: 'les-3' },
            ]);
            mockPrisma.lessonProgress.findUnique.mockResolvedValue({ completed: true });

            const result = await service.getLessonDetail('course-1', 'les-2', traineeCtx);

            expect(result.id).toBe('les-2');
            expect(result.title).toBe('Lesson 2');
            expect(result.isCompleted).toBe(true);
            expect(result.prevLessonId).toBe('les-1');
            expect(result.nextLessonId).toBe('les-3');
            expect(result.learningObjectives).toEqual(['Objective 1', 'Objective 2']);
            expect(result.resources[0].fileSize).toBe(1024);
        });
    });

    describe('completeLesson', () => {
        const mockCourse = { id: 'course-1', title: 'Atmospheric Dynamics' };
        const mockLesson = {
            id: 'les-1',
            durationMinutes: 15,
            module: { id: 'mod-1', courseId: 'course-1' },
        };

        it('should idempotently mark lesson as complete and update enrollment progress', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
            mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrisma.enrollment.findUnique.mockResolvedValue({
                id: 'enr-1',
                status: EnrollmentStatus.IN_PROGRESS,
            });

            mockPrisma.lessonProgress.upsert.mockResolvedValue({});
            mockPrisma.lesson.count.mockResolvedValue(4);
            mockPrisma.lessonProgress.count.mockResolvedValue(2);
            mockPrisma.enrollment.update.mockResolvedValue({});
            mockPrisma.lessonTopic.findFirst.mockResolvedValue({ topicId: 'topic-dyn-1' });

            const result = await service.completeLesson('course-1', 'les-1', traineeCtx);

            expect(result.success).toBe(true);
            expect(result.isCompleted).toBe(true);
            expect(result.progressPercentage).toBe(50);
            expect(result.completedLessonsCount).toBe(2);
            expect(result.totalLessonsCount).toBe(4);
            expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId_lessonId: { userId: 'trainee-1', lessonId: 'les-1' } },
                    create: expect.objectContaining({ completed: true }),
                    update: expect.objectContaining({ completed: true }),
                })
            );
            expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'enr-1' },
                    data: expect.objectContaining({ progressPercentage: 50, status: EnrollmentStatus.IN_PROGRESS }),
                })
            );
        });

        it('should return preview simulation response when trainer completes a lesson without enrollment', async () => {
            mockPrisma.course.findFirst.mockResolvedValue(mockCourse);
            mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
            mockPrisma.enrollment.findUnique.mockResolvedValue(null);

            const result = await service.completeLesson('course-1', 'les-1', trainerCtx);

            expect(result.success).toBe(true);
            expect(result.isPreview).toBe(true);
            expect(result.isCompleted).toBe(true);
        });
    });
});
