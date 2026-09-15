import { AssessmentRepository } from '../repositories/assessment.repository';
import { CourseRepository } from '../repositories/course.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import prisma from '../database/client';
import {
    CreateAssessmentInput,
    UpdateAssessmentInput,
    AssessmentQueryInput,
    CreateQuestionInput,
    UpdateQuestionInput,
    SubmitAnswersInput,
} from '../dto/assessment.dto';
import {
    NotFoundError,
    ForbiddenError,
    BadRequestError,
    ConflictError,
} from '../errors/app-error';
import { Role, AssessmentStatus, AttemptStatus } from '@prisma/client';

export class AssessmentService {
    private repository: AssessmentRepository;
    private courseRepo: CourseRepository;
    private enrollmentRepo: EnrollmentRepository;

    constructor(
        repository: AssessmentRepository = new AssessmentRepository(),
        courseRepo: CourseRepository = new CourseRepository(),
        enrollmentRepo: EnrollmentRepository = new EnrollmentRepository(prisma),
    ) {
        this.repository = repository;
        this.courseRepo = courseRepo;
        this.enrollmentRepo = enrollmentRepo;
    }

    // ==========================================
    // Security Helper: Correct Answer Sanitization
    // ==========================================

    private sanitizeAssessmentForTrainee(assessment: any) {
        if (!assessment) return null;
        const sanitized = JSON.parse(JSON.stringify(assessment));
        if (sanitized.questions && Array.isArray(sanitized.questions)) {
            sanitized.questions.forEach((q: any) => {
                delete q.explanation;
                if (q.options && Array.isArray(q.options)) {
                    q.options.forEach((opt: any) => {
                        delete opt.isCorrect;
                    });
                }
            });
        }
        return sanitized;
    }

    private sanitizeQuestionsForTrainee(questions: any[]) {
        if (!Array.isArray(questions)) return [];
        return questions.map((q) => {
            const copy = JSON.parse(JSON.stringify(q));
            delete copy.explanation;
            if (copy.options && Array.isArray(copy.options)) {
                copy.options.forEach((opt: any) => {
                    delete opt.isCorrect;
                });
            }
            return copy;
        });
    }

    // ==========================================
    // Section 9: Pre-Publish Validation
    // ==========================================

    private async validateForPublishing(assessment: any, updateInput?: any) {
        const title = updateInput?.title !== undefined ? updateInput.title : assessment.title;
        if (!title || title.trim().length < 3) {
            throw new BadRequestError('Assessment title must be at least 3 characters long to publish');
        }

        const courseId = updateInput?.courseId !== undefined ? updateInput.courseId : assessment.courseId;
        const moduleId = updateInput?.moduleId !== undefined ? updateInput.moduleId : assessment.moduleId;
        const lessonId = updateInput?.lessonId !== undefined ? updateInput.lessonId : assessment.lessonId;

        if (courseId) {
            const course = await prisma.course.findUnique({ where: { id: courseId } });
            if (!course) {
                throw new BadRequestError(`Referenced Course with ID ${courseId} does not exist`);
            }
        }

        if (moduleId) {
            const moduleRecord = await prisma.courseModule.findUnique({ where: { id: moduleId } });
            if (!moduleRecord) {
                throw new BadRequestError(`Referenced Module with ID ${moduleId} does not exist`);
            }
            if (courseId && moduleRecord.courseId !== courseId) {
                throw new BadRequestError(`Referenced Module ${moduleId} does not belong to Course ${courseId}`);
            }
        }

        if (lessonId) {
            const lessonRecord = await prisma.lesson.findUnique({ where: { id: lessonId } });
            if (!lessonRecord) {
                throw new BadRequestError(`Referenced Lesson with ID ${lessonId} does not exist`);
            }
            if (moduleId && lessonRecord.moduleId !== moduleId) {
                throw new BadRequestError(`Referenced Lesson ${lessonId} does not belong to Module ${moduleId}`);
            }
        }

        const questions = assessment.questions;
        if (!questions || questions.length === 0) {
            throw new BadRequestError('Cannot publish an assessment with no questions');
        }

        const validTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'];
        const placeholderRegex = /^(n\/?a|todo|tbd|none|null|nil|undefined|fixme|pending|placeholder|test|na|\s*)$/i;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qNum = i + 1;

            if (!q.questionText || q.questionText.trim().length === 0) {
                throw new BadRequestError(`Question ${qNum}: prompt cannot be empty`);
            }

            if (!validTypes.includes(q.questionType)) {
                throw new BadRequestError(`Question ${qNum}: invalid question type "${q.questionType}"`);
            }

            if (!q.marks || q.marks <= 0) {
                throw new BadRequestError(`Question ${qNum}: points/marks must be greater than 0`);
            }

            if (!q.options || q.options.length < 2) {
                throw new BadRequestError(`Question ${qNum}: must have at least 2 options`);
            }

            const hasCorrectOption = q.options.some((opt: any) => opt.isCorrect === true);
            if (!hasCorrectOption) {
                throw new BadRequestError(`Question ${qNum}: must have at least one correct option selected`);
            }

            if (!q.explanation || placeholderRegex.test(q.explanation.trim())) {
                throw new BadRequestError(`Question ${qNum}: must provide a substantive explanation for post-submission feedback`);
            }
        }
    }

    // ==========================================
    // Assessment CRUD Operations
    // ==========================================

    async createAssessment(userId: string, userRole: Role, input: CreateAssessmentInput) {
        if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && userRole !== Role.TRAINER) {
            throw new ForbiddenError('Only Trainers and Admins can create assessments');
        }

        if (input.courseId) {
            const course = await this.courseRepo.findById(input.courseId);
            if (!course) {
                throw new NotFoundError(`Course with ID ${input.courseId} not found`);
            }
            if (userRole === Role.TRAINER && course.trainerId !== userId) {
                throw new ForbiddenError('You can only create assessments for your own courses');
            }
        }

        return this.repository.create({
            trainerId: userId,
            courseId: input.courseId || null,
            moduleId: input.moduleId || null,
            lessonId: input.lessonId || null,
            title: input.title,
            description: input.description || null,
            subject: input.subject,
            assessmentType: input.assessmentType,
            durationMinutes: input.durationMinutes || null,
            passingScore: input.passingScore,
            startAt: input.startAt ? new Date(input.startAt) : null,
            deadline: input.deadline ? new Date(input.deadline) : null,
            status: input.status,
        });
    }

    async getAssessmentById(id: string, userId: string, userRole: Role) {
        const assessment = await this.repository.findById(id);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${id} not found`);
        }

        // Trainees can only see PUBLISHED assessments
        if (userRole === Role.TRAINEE) {
            if (assessment.status !== AssessmentStatus.PUBLISHED) {
                throw new ForbiddenError('Assessment is not published');
            }
            // Enforce course enrollment authorization (Section 24)
            if (assessment.courseId) {
                const enrollment = await this.enrollmentRepo.findByUserAndCourse(userId, assessment.courseId);
                if (!enrollment) {
                    throw new ForbiddenError('You must be enrolled in the course to access this assessment');
                }
            }
            return this.sanitizeAssessmentForTrainee(assessment);
        }

        // IDOR Check for Trainers
        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            // Check if trainer owns the associated course
            const assocCourse = (assessment as any).course;
            if (assocCourse && assocCourse.trainerId !== userId) {
                throw new ForbiddenError('Access denied. You are not authorized to view this assessment');
            }
        }

        return assessment;
    }

    async updateAssessment(id: string, userId: string, userRole: Role, input: UpdateAssessmentInput) {
        let assessment = await this.repository.findById(id);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${id} not found`);
        }

        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            throw new ForbiddenError('You are not authorized to update this assessment');
        }

        // Sync questions if provided from the builder
        if (Array.isArray(input.questions)) {
            await this.repository.syncQuestions(id, input.questions as any);
            // Refresh assessment with updated questions
            assessment = await this.repository.findById(id);
        }

        // Section 9: Validate requirements before publishing
        if (input.status === AssessmentStatus.PUBLISHED) {
            await this.validateForPublishing(assessment, input);
        }

        const updateData: any = { ...input };
        delete updateData.questions; // Remove questions array from assessment table update
        if (input.startAt) updateData.startAt = new Date(input.startAt);
        if (input.deadline) updateData.deadline = new Date(input.deadline);

        return this.repository.update(id, updateData);
    }

    async deleteAssessment(id: string, userId: string, userRole: Role) {
        const assessment = await this.repository.findById(id);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${id} not found`);
        }

        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            throw new ForbiddenError('You are not authorized to delete this assessment');
        }

        return this.repository.delete(id);
    }

    async listAssessments(userId: string, userRole: Role, query: AssessmentQueryInput) {
        const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
        const trainerId = (!isAdmin && userRole === Role.TRAINER) ? userId : undefined;

        // Trainees only see PUBLISHED assessments
        const status = (userRole === Role.TRAINEE) ? AssessmentStatus.PUBLISHED : query.status;

        const result = await this.repository.findMany({
            courseId: query.courseId,
            moduleId: query.moduleId,
            lessonId: query.lessonId,
            trainerId,
            status,
            search: query.search,
            page: query.page,
            limit: query.limit,
        });

        if (userRole === Role.TRAINEE) {
            result.data = result.data.map((item) => this.sanitizeAssessmentForTrainee(item));
        }

        return result;
    }

    // ==========================================
    // Question & Option Management
    // ==========================================

    async addQuestion(assessmentId: string, userId: string, userRole: Role, input: CreateQuestionInput) {
        const assessment = await this.repository.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${assessmentId} not found`);
        }

        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            throw new ForbiddenError('You are not authorized to manage questions for this assessment');
        }

        return this.repository.createQuestion(assessmentId, input);
    }

    async updateQuestion(assessmentId: string, questionId: string, userId: string, userRole: Role, input: UpdateQuestionInput) {
        const assessment = await this.repository.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${assessmentId} not found`);
        }

        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            throw new ForbiddenError('You are not authorized to manage questions for this assessment');
        }

        const question = await this.repository.findQuestionById(questionId);
        if (!question || question.assessmentId !== assessmentId) {
            throw new NotFoundError(`Question with ID ${questionId} not found under this assessment`);
        }

        return this.repository.updateQuestion(questionId, input);
    }

    async deleteQuestion(assessmentId: string, questionId: string, userId: string, userRole: Role) {
        const assessment = await this.repository.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${assessmentId} not found`);
        }

        if (userRole === Role.TRAINER && assessment.trainerId !== userId) {
            throw new ForbiddenError('You are not authorized to delete questions from this assessment');
        }

        const question = await this.repository.findQuestionById(questionId);
        if (!question || question.assessmentId !== assessmentId) {
            throw new NotFoundError(`Question with ID ${questionId} not found under this assessment`);
        }

        return this.repository.deleteQuestion(questionId);
    }

    // ==========================================
    // Trainee Attempt Lifecycle & Scoring Engine
    // ==========================================

    async startAttempt(assessmentId: string, userId: string, userRole: Role) {
        if (userRole !== Role.TRAINEE && userRole !== Role.SUPER_ADMIN && userRole !== Role.ADMIN) {
            throw new ForbiddenError('Only trainees can attempt assessments');
        }

        const assessment = await this.repository.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError(`Assessment with ID ${assessmentId} not found`);
        }

        if (assessment.status !== AssessmentStatus.PUBLISHED) {
            throw new BadRequestError('Assessment is not available for attempts');
        }

        // Course Enrollment check
        if (assessment.courseId) {
            const enrollment = await this.enrollmentRepo.findByUserAndCourse(userId, assessment.courseId);
            if (!enrollment) {
                throw new ForbiddenError('You must be enrolled in the course to attempt this assessment');
            }
        }

        // Deadline check
        const now = new Date();
        if (assessment.deadline && now > assessment.deadline) {
            throw new BadRequestError('Assessment deadline has passed');
        }

        // Single active attempt check
        const existingActive = await this.repository.findActiveAttempt(userId, assessmentId);
        if (existingActive) {
            // Check if active attempt has timed out
            if (assessment.durationMinutes) {
                const expiresAt = new Date(existingActive.startedAt.getTime() + assessment.durationMinutes * 60 * 1000);
                if (now > expiresAt) {
                    // Auto-expire previous attempt
                    await this.repository.finalizeAttemptSubmission(existingActive.id, {
                        submittedAt: now,
                        score: 0,
                        percentage: 0,
                        passed: false,
                        timeTakenSeconds: Math.floor((now.getTime() - existingActive.startedAt.getTime()) / 1000),
                        answers: [],
                    });
                } else {
                    return {
                        attempt: existingActive,
                        questions: this.sanitizeQuestionsForTrainee(assessment.questions),
                        isResumed: true,
                    };
                }
            } else {
                return {
                    attempt: existingActive,
                    questions: this.sanitizeQuestionsForTrainee(assessment.questions),
                    isResumed: true,
                };
            }
        }

        if (!assessment.questions || assessment.questions.length === 0) {
            throw new BadRequestError('Cannot start attempt on an assessment with no questions');
        }

        const newAttempt = await this.repository.createAttempt(assessmentId, userId);

        return {
            attempt: newAttempt,
            questions: this.sanitizeQuestionsForTrainee(assessment.questions),
            isResumed: false,
        };
    }

    async getAttempt(attemptId: string, userId: string, userRole: Role) {
        const attempt = await this.repository.findAttemptById(attemptId);
        if (!attempt) {
            throw new NotFoundError(`Attempt with ID ${attemptId} not found`);
        }

        // Trainee ownership verification
        if (userRole === Role.TRAINEE && attempt.userId !== userId) {
            throw new ForbiddenError('You are not authorized to access another trainee\'s attempt');
        }

        const sanitizedQuestions = this.sanitizeQuestionsForTrainee(attempt.assessment.questions);

        return {
            attempt: {
                id: attempt.id,
                assessmentId: attempt.assessmentId,
                userId: attempt.userId,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                score: attempt.score,
                percentage: attempt.percentage,
                passed: attempt.passed,
                status: attempt.status,
            },
            assessment: {
                id: attempt.assessment.id,
                title: attempt.assessment.title,
                durationMinutes: attempt.assessment.durationMinutes,
                passingScore: attempt.assessment.passingScore,
            },
            questions: sanitizedQuestions,
            answers: attempt.answers.map((ans) => ({
                questionId: ans.questionId,
                selectedOptionId: ans.selectedOptionId,
            })),
        };
    }

    async submitAttempt(assessmentId: string, attemptId: string, userId: string, userRole: Role, input: SubmitAnswersInput) {
        const attempt = await this.repository.findAttemptById(attemptId);
        if (!attempt) {
            throw new NotFoundError(`Attempt with ID ${attemptId} not found`);
        }

        if (attempt.assessmentId !== assessmentId) {
            throw new BadRequestError('Attempt does not belong to the specified assessment');
        }

        if (userRole === Role.TRAINEE && attempt.userId !== userId) {
            throw new ForbiddenError('You can only submit your own assessment attempts');
        }

        if (attempt.status === AttemptStatus.SUBMITTED) {
            throw new ConflictError('This attempt has already been submitted');
        }

        const now = new Date();
        const assessment = attempt.assessment;

        // Duration limit check (server-side time)
        if (assessment.durationMinutes) {
            const allowedEndTime = new Date(attempt.startedAt.getTime() + (assessment.durationMinutes * 60 * 1000) + (30 * 1000)); // 30s grace period for latency
            if (now > allowedEndTime) {
                // Expired attempt submission: auto score 0 or fail
                await this.repository.finalizeAttemptSubmission(attemptId, {
                    submittedAt: now,
                    score: 0,
                    percentage: 0,
                    passed: false,
                    timeTakenSeconds: Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
                    answers: [],
                });
                throw new BadRequestError('Submission rejected: Time limit for this assessment attempt has expired');
            }
        }

        // Deadline check
        if (assessment.deadline && now > new Date(assessment.deadline.getTime() + 30000)) {
            throw new BadRequestError('Submission rejected: Assessment deadline has passed');
        }

        // ==========================================
        // Authoritative Scoring Engine
        // ==========================================
        let totalScore = 0;
        let totalPossibleMarks = 0;

        const processedAnswers: {
            questionId: string;
            selectedOptionId: string | null;
            isCorrect: boolean;
            marksObtained: number;
        }[] = [];

        const questionMap = new Map<string, typeof assessment.questions[0]>();
        assessment.questions.forEach((q) => {
            questionMap.set(q.id, q);
            totalPossibleMarks += q.marks;
        });

        const submittedQuestionIds = new Set<string>();

        for (const ansInput of input.answers) {
            const question = questionMap.get(ansInput.questionId);
            if (!question) {
                throw new BadRequestError(`Question ID ${ansInput.questionId} does not belong to assessment ${assessmentId}`);
            }

            if (submittedQuestionIds.has(ansInput.questionId)) {
                throw new BadRequestError(`Duplicate answer submitted for question ${ansInput.questionId}`);
            }
            submittedQuestionIds.add(ansInput.questionId);

            let isCorrect = false;
            let marksObtained = 0;
            let selectedOption: any = null;

            if (ansInput.selectedOptionId) {
                selectedOption = question.options.find((opt) => opt.id === ansInput.selectedOptionId);
                if (!selectedOption) {
                    throw new BadRequestError(`Option ID ${ansInput.selectedOptionId} does not belong to question ${ansInput.questionId}`);
                }

                if (selectedOption.isCorrect) {
                    isCorrect = true;
                    marksObtained = question.marks;
                    totalScore += question.marks;
                }
            }

            processedAnswers.push({
                questionId: question.id,
                selectedOptionId: ansInput.selectedOptionId || null,
                isCorrect,
                marksObtained,
            });
        }

        // Calculate percentage and pass/fail state
        const percentage = totalPossibleMarks > 0 ? parseFloat(((totalScore / totalPossibleMarks) * 100).toFixed(2)) : 0;
        // Determine whether passingScore represents a percentage (e.g. 70%) or raw marks (e.g. 6.0 out of 10)
        const isPercentageThreshold = assessment.passingScore > totalPossibleMarks;
        const passingThresholdMarks = isPercentageThreshold
            ? (assessment.passingScore / 100) * totalPossibleMarks
            : assessment.passingScore;
        const passed = totalPossibleMarks > 0 && totalScore >= passingThresholdMarks;
        const timeTakenSeconds = Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000);

        const finalizedAttempt = await this.repository.finalizeAttemptSubmission(attemptId, {
            submittedAt: now,
            score: totalScore,
            percentage,
            passed,
            timeTakenSeconds,
            answers: processedAnswers,
        });

        // Trigger Learning Intelligence Pipeline asynchronously in background:
        // AssessmentAttempt -> LearningEvents -> TopicCompetency -> MemoryStability ->
        // ErrorPatterns -> GroupAggregation -> CompetencyResults -> SkillGapUpdate
        import('./learning-pipeline.service')
            .then(({ learningPipelineService }) => {
                learningPipelineService.processAssessmentSubmission(finalizedAttempt.id, userId).catch(async (pipelineErr) => {
                    const logger = (await import('../logger/winston.logger')).default;
                    logger.error(`Error in learning intelligence pipeline for attempt ${attemptId}:`, pipelineErr);
                });
            })
            .catch(() => {});

        return {
            result: {
                attemptId: finalizedAttempt.id,
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                score: finalizedAttempt.score,
                totalPossibleMarks,
                passingScore: assessment.passingScore,
                percentage: finalizedAttempt.percentage,
                passed: finalizedAttempt.passed,
                timeTakenSeconds: finalizedAttempt.timeTakenSeconds,
                submittedAt: finalizedAttempt.submittedAt,
            },
        };
    }

    async getResult(assessmentId: string, attemptId: string, userId: string, userRole: Role) {
        const attempt = await this.repository.findAttemptById(attemptId);
        if (!attempt) {
            throw new NotFoundError(`Attempt with ID ${attemptId} not found`);
        }

        if (attempt.assessmentId !== assessmentId) {
            throw new BadRequestError('Attempt does not belong to the specified assessment');
        }

        if (userRole === Role.TRAINEE && attempt.userId !== userId) {
            throw new ForbiddenError('You can only view your own assessment results');
        }

        if (attempt.status !== AttemptStatus.SUBMITTED) {
            throw new BadRequestError('Result is not available until the attempt is submitted');
        }

        let totalPossibleMarks = 0;
        attempt.assessment.questions.forEach((q) => {
            totalPossibleMarks += q.marks;
        });

        return {
            attemptId: attempt.id,
            assessmentId: attempt.assessment.id,
            assessmentTitle: attempt.assessment.title,
            userId: attempt.userId,
            score: attempt.score,
            totalPossibleMarks,
            passingScore: attempt.assessment.passingScore,
            percentage: attempt.percentage,
            passed: attempt.passed,
            timeTakenSeconds: attempt.timeTakenSeconds,
            submittedAt: attempt.submittedAt,
            answersSummary: attempt.answers.map((ans) => ({
                questionId: ans.questionId,
                selectedOptionId: ans.selectedOptionId,
                isCorrect: ans.isCorrect,
                marksObtained: ans.marksObtained,
            })),
        };
    }
}
