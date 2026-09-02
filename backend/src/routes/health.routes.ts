import { Router, Request, Response } from 'express';
import { prisma } from '../database/client';
import { ResponseHelper } from '../errors/response.helper';
import config from '../config';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'UP';
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (error) {
    dbStatus = 'DOWN';
  }

  const isHealthy = dbStatus === 'UP';

  return ResponseHelper.success({
    res,
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy ? 'Capacity Connect API service is healthy' : 'Service degraded',
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      environment: config.NODE_ENV,
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    },
  });
});

export default router;
export { router as healthRouter };
