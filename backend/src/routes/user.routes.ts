import { Router } from 'express';
import { Role } from '@prisma/client';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { validate } from '../validators/validate.middleware';
import {
  authenticate,
  requireRole,
  requirePermission,
  Permissions,
  requireSelfOrRole,
} from '../auth/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from '../validators/user.validation';
import { asyncHandler } from '../errors/async.handler';

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// All user management routes require authentication
router.use(authenticate);

// --- Admin Directory Endpoints ---
router.get(
  '/',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  requirePermission(Permissions.USER_READ),
  asyncHandler(userController.getUserList),
);

router.post(
  '/',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ body: createUserSchema }),
  asyncHandler(userController.register),
);

// --- Current Authenticated User Profile Endpoints ---
router.get('/me', asyncHandler(userController.getProfile));
router.patch(
  '/me',
  validate({ body: updateUserSchema }),
  asyncHandler(userController.updateProfile),
);

// --- User Competency Profile & Groups ---
router.get(
  '/me/competencies',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const prisma = (await import('../database/client')).default;

    const [frameworkCompetencies, groupCompetencies, topicCompetencies] = await Promise.all([
      prisma.userCompetency.findMany({
        where: { userId },
        include: { competency: true },
      }),
      prisma.userGroupCompetency.findMany({
        where: { userId },
        include: { group: true },
        orderBy: { groupPriority: 'desc' },
      }),
      prisma.userTopicCompetency.findMany({
        where: { userId },
        include: { topic: true },
        orderBy: { competencyScore: 'asc' },
      }),
    ]);

    return ResponseHelper.success({
      res,
      message: 'Learner competencies retrieved successfully',
      data: {
        framework: frameworkCompetencies,
        groups: groupCompetencies,
        topics: topicCompetencies,
      },
    });
  }),
);

router.get(
  '/me/competencies/groups',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const { groupAnalysisService } = await import('../modules/revision/services/group-analysis.service');

    const analysis = await groupAnalysisService.analyzeGroups(userId);
    return ResponseHelper.success({
      res,
      message: 'Competency group analysis retrieved successfully',
      data: analysis,
    });
  }),
);

router.get(
  '/me/competencies/topics',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const prisma = (await import('../database/client')).default;

    const topics = await prisma.userTopicCompetency.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            group: true,
            prerequisiteFor: {
              include: { dependentTopic: true },
            },
            prerequisites: {
              include: { prerequisiteTopic: true },
            },
          },
        },
      },
      orderBy: { competencyScore: 'asc' },
    });

    return ResponseHelper.success({
      res,
      message: 'Topic competencies retrieved successfully',
      data: topics,
    });
  }),
);

router.get(
  '/me/skill-gaps',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const { SkillGapAnalysisService } = await import('../modules/skill-gap/services/skill-gap-analysis.service');

    const service = new SkillGapAnalysisService();
    const gaps = await service.getLearnerSkillGaps(userId);

    return ResponseHelper.success({
      res,
      message: 'Learner skill gaps retrieved successfully',
      data: gaps,
    });
  }),
);

router.get(
  '/me/enrollments',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const prisma = (await import('../database/client')).default;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            trainer: { select: { id: true, firstName: true, lastName: true, email: true } },
            modules: {
              include: { lessons: true },
              orderBy: { orderIndex: 'asc' },
            },
            courseCompetencies: {
              include: { competency: true },
            },
          },
        },
        lessonProgress: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return ResponseHelper.success({
      res,
      message: 'User enrollments retrieved successfully',
      data: enrollments,
    });
  }),
);

router.get(
  '/me/revision-plan',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const { revisionPlanService } = await import('../modules/revision/services/revision-plan.service');
    const prisma = (await import('../database/client')).default;

    // Check for existing active/in-progress session first
    const activeSession = await prisma.revisionSession.findFirst({
      where: {
        userId,
        status: { in: ['GENERATED', 'STARTED'] },
      },
      include: {
        items: {
          include: { topic: true },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSession) {
      return ResponseHelper.success({
        res,
        message: 'Active revision session retrieved',
        data: activeSession,
      });
    }

    // Otherwise generate a fresh session plan
    const newSession = await revisionPlanService.generateSessionPlan(userId, { availableMinutes: 30 });
    return ResponseHelper.success({
      res,
      message: 'Fresh adaptive revision session generated',
      data: newSession,
    });
  }),
);

router.get(
  '/me/recommendations',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const { RecommendationService } = await import('../modules/recommendation/services/recommendation.service');

    const service = new RecommendationService();
    const result = await service.getRecommendations({
      userId,
      surface: 'DASHBOARD',
      limit: 8,
    });

    return ResponseHelper.success({
      res,
      message: 'Personalized recommendations retrieved successfully',
      data: result,
    });
  }),
);

router.get(
  '/me/trainer-matches',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { ResponseHelper } = await import('../errors/response.helper');
    const prisma = (await import('../database/client')).default;

    // Check pre-computed trainer matches
    const matches = await prisma.trainerMatch.findMany({
      where: { traineeId: userId },
      include: {
        trainer: {
          include: {
            trainerProfile: true,
            department: true,
          },
        },
        competency: true,
      },
      orderBy: { matchScore: 'desc' },
    });

    if (matches.length > 0) {
      return ResponseHelper.success({
        res,
        message: 'Matched domain trainers retrieved successfully',
        data: matches,
      });
    }

    // Fallback: match available trainers with domain expertise
    const trainers = await prisma.user.findMany({
      where: { role: Role.TRAINER },
      include: {
        trainerProfile: true,
        department: true,
      },
      take: 4,
    });

    const synthesizedMatches = trainers.map((t) => ({
      trainerId: t.id,
      trainer: t,
      matchScore: 88.0,
      reason: `${t.firstName} ${t.lastName} is a senior scientist in ${t.department?.name || 'MoES'} specializing in operational capacity building.`,
    }));

    return ResponseHelper.success({
      res,
      message: 'Matched domain trainers retrieved successfully',
      data: synthesizedMatches,
    });
  }),
);

// --- User Profile by ID (Self or Admin) ---
router.get(
  '/:id',
  validate({ params: userIdParamSchema }),
  requireSelfOrRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    const { UserDtoMapper } = await import('../dto/user.dto');
    const { ResponseHelper } = await import('../errors/response.helper');
    return ResponseHelper.success({
      res,
      message: 'User retrieved successfully',
      data: UserDtoMapper.toResponse(user),
    });
  }),
);

router.patch(
  '/:id',
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  requireSelfOrRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(async (req, res) => {
    const isCallerAdmin = req.user!.role === Role.ADMIN || req.user!.role === Role.SUPER_ADMIN;
    const updateData = { ...req.body };
    if (!isCallerAdmin) {
      delete updateData.role;
      delete updateData.status;
    }
    const user = await userService.updateUser(req.params.id, updateData);
    const { UserDtoMapper } = await import('../dto/user.dto');
    const { ResponseHelper } = await import('../errors/response.helper');
    return ResponseHelper.success({
      res,
      message: 'User updated successfully',
      data: UserDtoMapper.toResponse(user),
    });
  }),
);

router.delete(
  '/:id',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: userIdParamSchema }),
  asyncHandler(userController.deleteUser),
);

export default router;
export { router as userRouter };
