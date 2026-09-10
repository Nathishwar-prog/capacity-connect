import prisma from '../database/client';
import { NotFoundError } from '../errors/app-error';

export interface ValidationIssue {
    id: string;
    entityType: 'COURSE' | 'MODULE' | 'LESSON' | 'TOPIC' | 'ASSESSMENT';
    entityId?: string;
    entityTitle?: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
    path?: string; // e.g. "Module 1 > Lesson 2"
}

export interface CourseValidationResult {
    courseId: string;
    title: string;
    healthScore: number; // 0 to 100
    isPublishable: boolean;
    errorsCount: number;
    warningsCount: number;
    issues: ValidationIssue[];
    checklist: {
        courseMetadataValid: boolean;
        modulesPresent: boolean;
        lessonsComplete: boolean;
        competenciesMapped: boolean;
        assessmentsValid: boolean;
    };
}

export class CourseValidationService {
    /**
     * Validates a course for completeness, structure, competency links, and publish readiness
     */
    public async validateCourse(courseId: string): Promise<CourseValidationResult> {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                lessonTopics: {
                                    include: {
                                        topic: {
                                            include: {
                                                competencyMappings: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                assessments: {
                    include: {
                        questions: {
                            include: {
                                options: true,
                            },
                        },
                    },
                },
                courseCompetencies: true,
            },
        });

        if (!course) {
            throw new NotFoundError(`Course not found: ${courseId}`);
        }

        const typedCourse = course as any;
        const issues: ValidationIssue[] = [];

        // 1. Course Metadata Validation
        if (!course.title || course.title.trim().length < 5) {
            issues.push({
                id: 'course-title-missing',
                entityType: 'COURSE',
                entityId: course.id,
                entityTitle: course.title,
                message: 'Course title is missing or too short (minimum 5 characters required).',
                severity: 'ERROR',
            });
        }

        if (!course.description || course.description.trim().length < 20) {
            issues.push({
                id: 'course-desc-short',
                entityType: 'COURSE',
                entityId: course.id,
                entityTitle: course.title,
                message: 'Course description is too brief (minimum 20 characters recommended).',
                severity: 'WARNING',
            });
        }

        if (!course.category) {
            issues.push({
                id: 'course-category-missing',
                entityType: 'COURSE',
                entityId: course.id,
                entityTitle: course.title,
                message: 'Course domain category is required before publication.',
                severity: 'ERROR',
            });
        }

        // 2. Module Structure Validation
        if (!typedCourse.modules || typedCourse.modules.length === 0) {
            issues.push({
                id: 'no-modules',
                entityType: 'COURSE',
                entityId: course.id,
                entityTitle: course.title,
                message: 'Course must contain at least one module.',
                severity: 'ERROR',
            });
        }

        let totalLessons = 0;
        let lessonsWithContent = 0;
        let totalTopics = 0;
        let topicsWithCompetencies = 0;

        for (const mod of typedCourse.modules) {
            if (!mod.title || mod.title.trim().length === 0) {
                issues.push({
                    id: `module-title-${mod.id}`,
                    entityType: 'MODULE',
                    entityId: mod.id,
                    entityTitle: `Module ${mod.orderIndex}`,
                    message: `Module ${mod.orderIndex} does not have a valid title.`,
                    severity: 'ERROR',
                    path: `Module ${mod.orderIndex}`,
                });
            }

            if (!mod.lessons || mod.lessons.length === 0) {
                issues.push({
                    id: `module-empty-${mod.id}`,
                    entityType: 'MODULE',
                    entityId: mod.id,
                    entityTitle: mod.title,
                    message: `Module "${mod.title}" contains no lessons.`,
                    severity: 'ERROR',
                    path: mod.title,
                });
            }

            for (const lesson of mod.lessons) {
                totalLessons++;
                const lessonPath = `${mod.title} > ${lesson.title}`;

                if (!lesson.title || lesson.title.trim().length === 0) {
                    issues.push({
                        id: `lesson-title-${lesson.id}`,
                        entityType: 'LESSON',
                        entityId: lesson.id,
                        entityTitle: `Lesson ${lesson.orderIndex}`,
                        message: `Lesson in "${mod.title}" is missing a title.`,
                        severity: 'ERROR',
                        path: lessonPath,
                    });
                }

                // Check content blocks or text content
                let hasSubstantiveContent = false;
                if (lesson.content) {
                    try {
                        const blocks = JSON.parse(lesson.content);
                        if (Array.isArray(blocks) && blocks.length > 0) {
                            hasSubstantiveContent = true;
                        }
                    } catch {
                        if (lesson.content.trim().length > 20) {
                            hasSubstantiveContent = true;
                        }
                    }
                }

                if (!hasSubstantiveContent) {
                    issues.push({
                        id: `lesson-no-content-${lesson.id}`,
                        entityType: 'LESSON',
                        entityId: lesson.id,
                        entityTitle: lesson.title,
                        message: `Lesson "${lesson.title}" has no educational content.`,
                        severity: 'ERROR',
                        path: lessonPath,
                    });
                } else {
                    lessonsWithContent++;
                }

                // Objectives check
                const objectives = lesson.learningObjectives as string[] | null;
                if (!objectives || objectives.length === 0) {
                    issues.push({
                        id: `lesson-no-objectives-${lesson.id}`,
                        entityType: 'LESSON',
                        entityId: lesson.id,
                        entityTitle: lesson.title,
                        message: `Lesson "${lesson.title}" has no learning objectives specified.`,
                        severity: 'WARNING',
                        path: lessonPath,
                    });
                }

                // Topics & Competency mappings check
                for (const lt of lesson.lessonTopics) {
                    totalTopics++;
                    if (lt.topic.competencyMappings && lt.topic.competencyMappings.length > 0) {
                        topicsWithCompetencies++;
                    } else {
                        issues.push({
                            id: `topic-unmapped-${lt.topic.id}`,
                            entityType: 'TOPIC',
                            entityId: lt.topic.id,
                            entityTitle: lt.topic.name,
                            message: `Topic "${lt.topic.name}" is not mapped to any domain competency.`,
                            severity: 'WARNING',
                            path: `${lessonPath} > ${lt.topic.name}`,
                        });
                    }
                }
            }
        }

        // 3. Assessment Validation
        for (const ass of typedCourse.assessments) {
            if (!ass.questions || ass.questions.length === 0) {
                issues.push({
                    id: `assessment-no-questions-${ass.id}`,
                    entityType: 'ASSESSMENT',
                    entityId: ass.id,
                    entityTitle: ass.title,
                    message: `Assessment "${ass.title}" has no questions.`,
                    severity: 'WARNING',
                });
            }

            for (const q of ass.questions) {
                const hasCorrect = Array.isArray(q.options) && q.options.some((o: any) => o.isCorrect);
                if (!hasCorrect) {
                    const qTitle = q.questionText || 'Question';
                    issues.push({
                        id: `question-no-answer-${q.id}`,
                        entityType: 'ASSESSMENT',
                        entityId: q.id,
                        entityTitle: qTitle,
                        message: `Knowledge check question "${qTitle.substring(0, 35)}..." has no correct answer selected.`,
                        severity: 'WARNING',
                    });
                }
            }
        }

        // Compute Health Score (0 - 100)
        const errors = issues.filter(i => i.severity === 'ERROR');
        const warnings = issues.filter(i => i.severity === 'WARNING');

        let score = 100;
        score -= errors.length * 15;
        score -= warnings.length * 3;
        const healthScore = Math.max(0, Math.min(100, Math.round(score)));

        const isPublishable = errors.length === 0 && totalLessons > 0;

        return {
            courseId: course.id,
            title: course.title,
            healthScore,
            isPublishable,
            errorsCount: errors.length,
            warningsCount: warnings.length,
            issues,
            checklist: {
                courseMetadataValid: Boolean(course.title && course.category),
                modulesPresent: typedCourse.modules.length > 0,
                lessonsComplete: totalLessons > 0 && lessonsWithContent === totalLessons,
                competenciesMapped: totalTopics === 0 || topicsWithCompetencies > 0,
                assessmentsValid: issues.every(i => i.entityType !== 'ASSESSMENT' || i.severity !== 'ERROR'),
            },
        };
    }
}

export default CourseValidationService;
