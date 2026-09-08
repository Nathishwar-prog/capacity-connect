import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { validate } from '../validators/validate.middleware';
import { authenticate } from '../auth/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../validators/auth.validation';
import { asyncHandler } from '../errors/async.handler';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

// --- Public Authentication Endpoints (Rate Limited) ---

// Public Registration / Signup (Supports both /register and /signup aliases)
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

router.post(
  '/signup',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

// User Login
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);

// Refresh Access Token
router.post(
  '/refresh',
  authRateLimiter,
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh),
);

// Email Verification
router.post(
  '/verify-email',
  authRateLimiter,
  validate({ body: verifyEmailSchema }),
  asyncHandler(authController.verifyEmail),
);

// Resend Email Verification
router.post(
  '/resend-verification',
  authRateLimiter,
  validate({ body: resendVerificationSchema }),
  asyncHandler(authController.resendVerification),
);

// Logout Session
router.post('/logout', asyncHandler(authController.logout));

// --- Protected Authentication Endpoints ---

// Current Authenticated User Profile
router.get('/me', authenticate, asyncHandler(authController.getMe));

// Onboarding Metadata (Protected)
router.get('/onboarding-meta', authenticate, asyncHandler(authController.getOnboardingMeta));

// Submit Trainee Onboarding (Protected)
router.post('/onboarding', authenticate, asyncHandler(authController.submitTraineeOnboarding));

export default router;
export { router as authRouter };
