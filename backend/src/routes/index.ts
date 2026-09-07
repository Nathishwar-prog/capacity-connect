import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { adminRouter } from './admin.routes';
import { dashboardRouter } from './dashboard.routes';
import { trainerRouter } from './trainer.routes';
import { traineeRouter } from './trainee.routes';

const router = Router();

// API index catalog
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Capacity Connect REST API Gateway v1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        signup: 'POST /api/v1/auth/signup',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout',
        verifyEmail: 'POST /api/v1/auth/verify-email',
        resendVerification: 'POST /api/v1/auth/resend-verification',
        me: 'GET /api/v1/auth/me',
        onboardingMeta: 'GET /api/v1/auth/onboarding-meta',
        onboarding: 'POST /api/v1/auth/onboarding',
      },
      users: {
        list: 'GET /api/v1/users',
        create: 'POST /api/v1/users',
        me: 'GET /api/v1/users/me',
        updateMe: 'PATCH /api/v1/users/me',
        getById: 'GET /api/v1/users/:id',
        updateById: 'PATCH /api/v1/users/:id',
        deleteById: 'DELETE /api/v1/users/:id',
      },
      admin: {
        listUsers: 'GET /api/v1/admin/users',
        getUser: 'GET /api/v1/admin/users/:id',
        approveUser: 'PATCH /api/v1/admin/users/:id/approve',
        rejectUser: 'PATCH /api/v1/admin/users/:id/reject',
        updateStatus: 'PATCH /api/v1/admin/users/:id/status',
        updateRole: 'PATCH /api/v1/admin/users/:id/role',
      },
      dashboard: {
        trainee: 'GET /api/v1/dashboard/trainee',
        trainer: 'GET /api/v1/dashboard/trainer',
        admin: 'GET /api/v1/dashboard/admin',
      },
    },
  });
});

// System health check
router.use('/health', healthRouter);

// Domain routers
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/dashboard', dashboardRouter);
router.use('/trainer', trainerRouter);
router.use('/trainee', traineeRouter);

export default router;
