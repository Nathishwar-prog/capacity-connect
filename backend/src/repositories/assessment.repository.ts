import { PrismaClient, Assessment, AssessmentQuestion, QuestionOption, AssessmentAttempt, AssessmentAnswer, Prisma, AssessmentStatus, AttemptStatus } from '@prisma/client';
import prisma from '../database/client';

export class AssessmentRepository {
    private db: PrismaClient;

    constructor(client: PrismaClient = prisma) {
        this.db = client;
    }

    // ==========================================
    // Assessment Operations
    // ==========================================

    async create(data: Prisma.AssessmentUncheckedCreateInput): Promise<Assessment> {
        return this.db.assessment.create({
            data,
            include: {
                course: {
                    select: { id: true, title: true, trainerId: true },
                },
                trainer: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async findById(id: string): Promise<(Assessment & { questions: (AssessmentQuestion & { options: QuestionOption[] })[] }) | null> {
        return this.db.assessment.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, title: true, trainerId: true, status: true },
                },
                trainer: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                questions: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        options: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
            },
        });
    }

    async update(id: string, data: Prisma.AssessmentUncheckedUpdateInput): Promise<Assessment> {
        return this.db.assessment.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Assessment> {
        return this.db.assessment.delete({
            where: { id },
        });
    }

    async findMany(params: {
        courseId?: string;
        trainerId?: string;
        status?: AssessmentStatus;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{ data: Assessment[]; total: number; page: number; limit: number; totalPages: number }> {
        const { courseId, trainerId, status, search, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.AssessmentWhereInput = {};

        if (courseId) where.courseId = courseId;
        if (trainerId) where.trainerId = trainerId;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.db.assessment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    course: {
                        select: { id: true, title: true },
                    },
                    trainer: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { questions: true, attempts: true },
                    },
                },
            }),
            this.db.assessment.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ==========================================
    // Question & Option Operations
    // ==========================================

    async createQuestion(
        assessmentId: string,
        questionData: {
            questionText: string;
            questionType: any;
            marks: number;
            orderIndex?: number;
            explanation?: string | null;
            options: { optionText: string; isCorrect: boolean; orderIndex?: number }[];
        },
    ): Promise<AssessmentQuestion & { options: QuestionOption[] }> {
        return this.db.assessmentQuestion.create({
            data: {
                assessmentId,
                questionText: questionData.questionText,
                questionType: questionData.questionType,
                marks: questionData.marks,
                orderIndex: questionData.orderIndex ?? 0,
                explanation: questionData.explanation,
                options: {
                    create: questionData.options.map((opt, idx) => ({
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect,
                        orderIndex: opt.orderIndex ?? idx,
                    })),
                },
            },
            include: {
                options: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
    }

    async findQuestionById(questionId: string): Promise<(AssessmentQuestion & { options: QuestionOption[] }) | null> {
        return this.db.assessmentQuestion.findUnique({
            where: { id: questionId },
            include: {
                options: {
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
    }

    async updateQuestion(
        questionId: string,
        data: {
            questionText?: string;
            marks?: number;
            orderIndex?: number;
            explanation?: string | null;
            options?: { optionText: string; isCorrect: boolean; orderIndex?: number }[];
        },
    ): Promise<AssessmentQuestion & { options: QuestionOption[] }> {
        return this.db.$transaction(async (tx) => {
            if (data.options) {
                // Delete existing options and recreate
                await tx.questionOption.deleteMany({
                    where: { questionId },
                });

                await tx.questionOption.createMany({
                    data: data.options.map((opt, idx) => ({
                        questionId,
                        optionText: opt.optionText,
                        isCorrect: opt.isCorrect,
                        orderIndex: opt.orderIndex ?? idx,
                    })),
                });
            }

            return tx.assessmentQuestion.update({
                where: { id: questionId },
                data: {
                    ...(data.questionText && { questionText: data.questionText }),
                    ...(data.marks !== undefined && { marks: data.marks }),
                    ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
                    ...(data.explanation !== undefined && { explanation: data.explanation }),
                },
                include: {
                    options: {
                        orderBy: { orderIndex: 'asc' },
                    },
                },
            });
        });
    }

    async deleteQuestion(questionId: string): Promise<AssessmentQuestion> {
        return this.db.assessmentQuestion.delete({
            where: { id: questionId },
        });
    }

    // ==========================================
    // Attempt & Answer Operations
    // ==========================================

    async findActiveAttempt(userId: string, assessmentId: string): Promise<AssessmentAttempt | null> {
        return this.db.assessmentAttempt.findFirst({
            where: {
                userId,
                assessmentId,
                status: AttemptStatus.IN_PROGRESS,
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    async createAttempt(assessmentId: string, userId: string): Promise<AssessmentAttempt> {
        return this.db.assessmentAttempt.create({
            data: {
                assessmentId,
                userId,
                startedAt: new Date(),
                status: AttemptStatus.IN_PROGRESS,
            },
        });
    }

    async findAttemptById(attemptId: string): Promise<(AssessmentAttempt & {
        assessment: Assessment & { questions: (AssessmentQuestion & { options: QuestionOption[] })[] };
        answers: (AssessmentAnswer & { selectedOption: QuestionOption | null })[];
    }) | null> {
        return this.db.assessmentAttempt.findUnique({
            where: { id: attemptId },
            include: {
                assessment: {
                    include: {
                        questions: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                options: {
                                    orderBy: { orderIndex: 'asc' },
                                },
                            },
                        },
                    },
                },
                answers: {
                    include: {
                        selectedOption: true,
                    },
                },
            },
        });
    }

    async finalizeAttemptSubmission(
        attemptId: string,
        submissionData: {
            submittedAt: Date;
            score: number;
            percentage: number;
            passed: boolean;
            timeTakenSeconds: number;
            answers: {
                questionId: string;
                selectedOptionId: string | null;
                isCorrect: boolean;
                marksObtained: number;
            }[];
        },
    ): Promise<AssessmentAttempt & { answers: AssessmentAnswer[] }> {
        return this.db.$transaction(async (tx) => {
            // Delete existing answers if any (to support idempotent submissions or updates)
            await tx.assessmentAnswer.deleteMany({
                where: { attemptId },
            });

            // Create new answer records
            await tx.assessmentAnswer.createMany({
                data: submissionData.answers.map((ans) => ({
                    attemptId,
                    questionId: ans.questionId,
                    selectedOptionId: ans.selectedOptionId,
                    isCorrect: ans.isCorrect,
                    marksObtained: ans.marksObtained,
                    answeredAt: submissionData.submittedAt,
                })),
            });

            // Update attempt status and scoring results
            return tx.assessmentAttempt.update({
                where: { id: attemptId },
                data: {
                    submittedAt: submissionData.submittedAt,
                    score: submissionData.score,
                    percentage: submissionData.percentage,
                    passed: submissionData.passed,
                    timeTakenSeconds: submissionData.timeTakenSeconds,
                    status: AttemptStatus.SUBMITTED,
                },
                include: {
                    answers: true,
                },
            });
        });
    }
}
