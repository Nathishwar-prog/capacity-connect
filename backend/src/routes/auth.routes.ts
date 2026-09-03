import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { validate } from '../validators/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validation';
import { asyncHandler } from '../errors/async.handler';

import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

// Public Authentication Endpoints (Rate Limited)
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

router.post(
  '/refresh',
  authRateLimiter,
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh),
);

router.post(
  '/logout',
  asyncHandler(authController.logout),
);

// Protected Authentication Endpoints
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getMe),
);

router.get(
  '/onboarding-meta',
  authenticate,
  asyncHandler(authController.getOnboardingMeta),
);

router.post(
  '/onboarding',
  authenticate,
  asyncHandler(authController.submitTraineeOnboarding),
);

export default router;
export { router as authRouter };
