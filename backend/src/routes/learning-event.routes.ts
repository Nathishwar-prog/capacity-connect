import { Router, Request, Response } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';
import { learningEventService } from '../modules/revision/services/learning-event.service';
import { ingestEventSchema } from '../modules/revision/validators/revision.validator';

const router = Router();

router.use(authenticate);

// POST /api/v1/learning-events - Ingest learning interaction event
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const validated = ingestEventSchema.parse(req.body);

    const result = await learningEventService.ingestEvent({
      ...validated,
      userId,
    });

    return ResponseHelper.created(res, result, 'Learning event ingested and processed successfully');
  })
);

export default router;
export { router as learningEventRouter };
