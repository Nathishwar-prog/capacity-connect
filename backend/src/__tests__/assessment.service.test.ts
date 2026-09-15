import { AssessmentService } from '../services/assessment.service';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { CourseRepository } from '../repositories/course.repository';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import {
  Role,
  AssessmentStatus,
  AttemptStatus,
  QuestionType,
  AssessmentType,
} from '@prisma/client';
import { ForbiddenError, BadRequestError, ConflictError } from '../errors/app-error';

describe('AssessmentService Unit & Integration Test Suite', () => {
  let service: AssessmentService;
  let mockAssessmentRepo: jest.Mocked<AssessmentRepository>;
  let mockCourseRepo: jest.Mocked<CourseRepository>;
  let mockEnrollmentRepo: jest.Mocked<EnrollmentRepository>;

  const trainerUserId = '11111111-1111-4111-a111-111111111111';
  const otherTrainerUserId = '22222222-2222-4222-a222-222222222222';
  const traineeUserId = '33333333-3333-4333-a333-333333333333';
  const otherTraineeUserId = '44444444-4444-4444-a444-444444444444';
  const adminUserId = '55555555-5555-4555-a555-555555555555';
  const courseId = '66666666-6666-4666-a666-666666666666';
  const assessmentId = '77777777-7777-4777-a777-777777777777';
  const questionId1 = '88888888-8888-4888-a888-888888888888';
  const questionId2 = '99999999-9999-4999-a999-999999999999';
  const optionId1A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'; // correct
  const optionId1B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'; // incorrect
  const optionId2A = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'; // correct
  const optionId2B = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'; // incorrect
  const attemptId = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';

  const sampleCourse: any = {
    id: courseId,
    title: 'Advanced Meteorology & Atmospheric Physics',
    trainerId: trainerUserId,
    status: 'PUBLISHED',
  };

  const sampleQuestions: any[] = [
    {
      id: questionId1,
      assessmentId,
      questionText: 'What is the primary gas in Earth atmosphere?',
      questionType: QuestionType.SINGLE_CHOICE,
      marks: 5.0,
      orderIndex: 0,
      explanation: 'Nitrogen makes up approximately 78% of Earth atmosphere.',
      options: [
        {
          id: optionId1A,
          questionId: questionId1,
          optionText: 'Nitrogen',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          id: optionId1B,
          questionId: questionId1,
          optionText: 'Oxygen',
          isCorrect: false,
          orderIndex: 1,
        },
      ],
    },
    {
      id: questionId2,
      assessmentId,
      questionText: 'Which layer of the atmosphere contains the ozone layer?',
      questionType: QuestionType.SINGLE_CHOICE,
      marks: 5.0,
      orderIndex: 1,
      explanation: 'The stratosphere contains the ozone layer.',
      options: [
        {
          id: optionId2A,
          questionId: questionId2,
          optionText: 'Stratosphere',
          isCorrect: true,
          orderIndex: 0,
        },
        {
          id: optionId2B,
          questionId: questionId2,
          optionText: 'Troposphere',
          isCorrect: false,
          orderIndex: 1,
        },
      ],
    },
  ];

  const sampleAssessment: any = {
    id: assessmentId,
    courseId,
    trainerId: trainerUserId,
    title: 'Atmospheric Physics Mid-Term Assessment',
    description: 'Comprehensive test on atmospheric structure',
    subject: 'Meteorology',
    assessmentType: AssessmentType.MCQ,
    durationMinutes: 30,
    passingScore: 6.0,
    startAt: new Date(Date.now() - 3600000),
    deadline: new Date(Date.now() + 86400000),
    status: AssessmentStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
    course: sampleCourse,
    questions: sampleQuestions,
  };

  beforeEach(() => {
    mockAssessmentRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      createQuestion: jest.fn(),
      findQuestionById: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
      findActiveAttempt: jest.fn(),
      createAttempt: jest.fn(),
      findAttemptById: jest.fn(),
      finalizeAttemptSubmission: jest.fn(),
    } as unknown as jest.Mocked<AssessmentRepository>;

    mockCourseRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CourseRepository>;

    mockEnrollmentRepo = {
      findByUserAndCourse: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    service = new AssessmentService(mockAssessmentRepo, mockCourseRepo, mockEnrollmentRepo);
  });

  describe('1. Assessment CRUD & RBAC Authorization', () => {
    it('allows a trainer to create an assessment for a course they own', async () => {
      mockCourseRepo.findById.mockResolvedValue(sampleCourse);
      mockAssessmentRepo.create.mockResolvedValue(sampleAssessment);

      const result = await service.createAssessment(trainerUserId, Role.TRAINER, {
        courseId,
        title: 'Atmospheric Physics Mid-Term Assessment',
        subject: 'Meteorology',
        assessmentType: AssessmentType.MCQ,
        durationMinutes: 30,
        passingScore: 6.0,
        status: AssessmentStatus.DRAFT,
      } as any);

      expect(mockCourseRepo.findById).toHaveBeenCalledWith(courseId);
      expect(mockAssessmentRepo.create).toHaveBeenCalled();
      expect(result.id).toBe(assessmentId);
    });

    it('blocks a trainer from creating an assessment for a course owned by another trainer', async () => {
      mockCourseRepo.findById.mockResolvedValue({
        ...sampleCourse,
        trainerId: otherTrainerUserId,
      });

      await expect(
        service.createAssessment(trainerUserId, Role.TRAINER, {
          courseId,
          title: 'Unauthorized Assessment',
          subject: 'Meteorology',
          passingScore: 60,
          status: AssessmentStatus.DRAFT,
        } as any),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows an admin to create an assessment for any course', async () => {
      mockCourseRepo.findById.mockResolvedValue(sampleCourse);
      mockAssessmentRepo.create.mockResolvedValue(sampleAssessment);

      const result = await service.createAssessment(adminUserId, Role.ADMIN, {
        courseId,
        title: 'Admin Created Assessment',
        subject: 'Meteorology',
        passingScore: 50,
        status: AssessmentStatus.DRAFT,
      } as any);

      expect(result.id).toBe(assessmentId);
    });

    it('blocks a trainee from creating an assessment', async () => {
      await expect(
        service.createAssessment(traineeUserId, Role.TRAINEE, {
          title: 'Trainee Created Assessment',
          subject: 'Meteorology',
          passingScore: 50,
          status: AssessmentStatus.DRAFT,
        } as any),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('2. Correct Answer Protection (Sanitization)', () => {
    it('strips isCorrect flags and explanations when fetched by a trainee', async () => {
      mockAssessmentRepo.findById.mockResolvedValue(sampleAssessment);
      mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'enr-1' } as any);

      const result = await service.getAssessmentById(assessmentId, traineeUserId, Role.TRAINEE);

      expect(result.questions[0].options[0].isCorrect).toBeUndefined();
      expect(result.questions[0].explanation).toBeUndefined();
      expect(result.questions[0].options[0].optionText).toBe('Nitrogen');
    });

    it('preserves isCorrect flags when fetched by the authoring trainer', async () => {
      mockAssessmentRepo.findById.mockResolvedValue(sampleAssessment);

      const result = await service.getAssessmentById(assessmentId, trainerUserId, Role.TRAINER);

      expect(result.questions[0].options[0].isCorrect).toBe(true);
      expect(result.questions[0].explanation).toBeDefined();
    });
  });

  describe('3. Trainee Attempt Lifecycle', () => {
    it('blocks attempt if trainee is not enrolled in the course', async () => {
      mockAssessmentRepo.findById.mockResolvedValue(sampleAssessment);
      mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue(null);

      await expect(service.startAttempt(assessmentId, traineeUserId, Role.TRAINEE)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('allows attempt for enrolled trainee and returns sanitized questions', async () => {
      mockAssessmentRepo.findById.mockResolvedValue(sampleAssessment);
      mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue({
        id: '11111111-2222-3333-4444-555555555555',
      } as any);
      mockAssessmentRepo.findActiveAttempt.mockResolvedValue(null);
      mockAssessmentRepo.createAttempt.mockResolvedValue({
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt: new Date(),
        status: AttemptStatus.IN_PROGRESS,
        createdAt: new Date(),
        submittedAt: null,
        score: null,
        percentage: null,
        passed: null,
        timeTakenSeconds: null,
      });

      const result = await service.startAttempt(assessmentId, traineeUserId, Role.TRAINEE);

      expect(result.attempt.id).toBe(attemptId);
      expect(result.questions[0].options[0].isCorrect).toBeUndefined();
      expect(result.isResumed).toBe(false);
    });

    it('prevents starting attempt if assessment deadline has passed', async () => {
      const expiredAssessment = {
        ...sampleAssessment,
        deadline: new Date(Date.now() - 10000), // 10s ago
      };
      mockAssessmentRepo.findById.mockResolvedValue(expiredAssessment);
      mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue({
        id: '11111111-2222-3333-4444-555555555555',
      } as any);

      await expect(service.startAttempt(assessmentId, traineeUserId, Role.TRAINEE)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('4. Automated Scoring Engine & Submission', () => {
    it('scores 100% correct answers accurately and marks as PASSED', async () => {
      const startedAt = new Date(Date.now() - 300000);
      const activeAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt,
        status: AttemptStatus.IN_PROGRESS,
        assessment: sampleAssessment,
        answers: [],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(activeAttempt);
      mockAssessmentRepo.finalizeAttemptSubmission.mockImplementation((_id: string, data: any) => {
        return Promise.resolve({
          ...activeAttempt,
          submittedAt: data.submittedAt,
          score: data.score,
          percentage: data.percentage,
          passed: data.passed,
          timeTakenSeconds: data.timeTakenSeconds,
          status: AttemptStatus.SUBMITTED,
          answers: data.answers,
        });
      });

      const submissionPayload = {
        answers: [
          { questionId: questionId1, selectedOptionId: optionId1A },
          { questionId: questionId2, selectedOptionId: optionId2A },
        ],
      };

      const res = await service.submitAttempt(
        assessmentId,
        attemptId,
        traineeUserId,
        Role.TRAINEE,
        submissionPayload,
      );

      expect(res.result.score).toBe(10.0);
      expect(res.result.totalPossibleMarks).toBe(10.0);
      expect(res.result.percentage).toBe(100);
      expect(res.result.passed).toBe(true);
    });

    it('scores partial/incorrect answers accurately and marks as FAILED if below passingScore', async () => {
      const startedAt = new Date(Date.now() - 300000);
      const activeAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt,
        status: AttemptStatus.IN_PROGRESS,
        assessment: sampleAssessment,
        answers: [],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(activeAttempt);
      mockAssessmentRepo.finalizeAttemptSubmission.mockImplementation((_id: string, data: any) => {
        return Promise.resolve({
          ...activeAttempt,
          submittedAt: data.submittedAt,
          score: data.score,
          percentage: data.percentage,
          passed: data.passed,
          timeTakenSeconds: data.timeTakenSeconds,
          status: AttemptStatus.SUBMITTED,
          answers: data.answers,
        });
      });

      const submissionPayload = {
        answers: [
          { questionId: questionId1, selectedOptionId: optionId1A },
          { questionId: questionId2, selectedOptionId: optionId2B },
        ],
      };

      const res = await service.submitAttempt(
        assessmentId,
        attemptId,
        traineeUserId,
        Role.TRAINEE,
        submissionPayload,
      );

      expect(res.result.score).toBe(5.0);
      expect(res.result.totalPossibleMarks).toBe(10.0);
      expect(res.result.percentage).toBe(50);
      expect(res.result.passed).toBe(false);
    });

    it('rejects attempt submission if attempt duration has expired', async () => {
      const startedAt = new Date(Date.now() - 2500000); // 41 mins ago (duration limit 30 mins)
      const expiredAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt,
        status: AttemptStatus.IN_PROGRESS,
        assessment: sampleAssessment,
        answers: [],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(expiredAttempt);

      await expect(
        service.submitAttempt(assessmentId, attemptId, traineeUserId, Role.TRAINEE, {
          answers: [{ questionId: questionId1, selectedOptionId: optionId1A }],
        }),
      ).rejects.toThrow(BadRequestError);
    });

    it('rejects submission if attempt is already SUBMITTED (idempotency guard)', async () => {
      const submittedAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt: new Date(Date.now() - 600000),
        submittedAt: new Date(Date.now() - 300000),
        status: AttemptStatus.SUBMITTED,
        assessment: sampleAssessment,
        answers: [],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(submittedAttempt);

      await expect(
        service.submitAttempt(assessmentId, attemptId, traineeUserId, Role.TRAINEE, {
          answers: [{ questionId: questionId1, selectedOptionId: optionId1A }],
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('5. Results & IDOR Protection', () => {
    it('allows a trainee to view their own submitted assessment result', async () => {
      const submittedAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: traineeUserId,
        startedAt: new Date(Date.now() - 600000),
        submittedAt: new Date(Date.now() - 300000),
        score: 10.0,
        percentage: 100,
        passed: true,
        timeTakenSeconds: 300,
        status: AttemptStatus.SUBMITTED,
        assessment: sampleAssessment,
        answers: [
          {
            questionId: questionId1,
            selectedOptionId: optionId1A,
            isCorrect: true,
            marksObtained: 5.0,
          },
          {
            questionId: questionId2,
            selectedOptionId: optionId2A,
            isCorrect: true,
            marksObtained: 5.0,
          },
        ],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(submittedAttempt);

      const result = await service.getResult(assessmentId, attemptId, traineeUserId, Role.TRAINEE);

      expect(result.score).toBe(10.0);
      expect(result.passed).toBe(true);
      expect(result.answersSummary).toHaveLength(2);
    });

    it('blocks a trainee from viewing another trainee result (IDOR Protection)', async () => {
      const submittedAttempt: any = {
        id: attemptId,
        assessmentId,
        userId: otherTraineeUserId,
        status: AttemptStatus.SUBMITTED,
        assessment: sampleAssessment,
        answers: [],
      };

      mockAssessmentRepo.findAttemptById.mockResolvedValue(submittedAttempt);

      await expect(
        service.getResult(assessmentId, attemptId, traineeUserId, Role.TRAINEE),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
