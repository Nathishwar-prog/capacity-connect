import { Router } from 'express';
import { Role } from '@prisma/client';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { validate } from '../validators/validate.middleware';
import { authenticate, requireRole, requireSelfOrRole } from '../auth/auth.middleware';
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
    const user = await userService.updateUser(req.params.id, req.body);
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
