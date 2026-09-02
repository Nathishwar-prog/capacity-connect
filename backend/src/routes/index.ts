import { Router } from 'express';
import { healthRouter } from './health.routes';
import { userRouter } from './user.routes';

const router = Router();

// System health check
router.use('/health', healthRouter);

// Domain endpoints
router.use('/users', userRouter);
router.use('/auth', userRouter); // login, register, refresh, logout

export default router;
