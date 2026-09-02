import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';

const router = Router();

// System health check
router.use('/health', healthRouter);

// Domain routers
router.use('/auth', authRouter);
router.use('/users', userRouter);

export default router;
