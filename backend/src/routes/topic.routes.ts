import { Router, Request, Response } from 'express';
import prisma from '../database/client';
import { authenticate } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';
import { NotFoundError } from '../errors/app-error';
import { revisionRepository } from '../modules/revision/repositories/revision.repository';

const router = Router();
router.use(authenticate);

/**
 * GET /api/v1/topics/:id
 * Retrieve specific topic details with parent group and direct prerequisites
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const topic = await prisma.learningTopic.findUnique({
      where: { id },
      include: {
        group: true,
        prerequisites: {
          include: {
            prerequisiteTopic: true,
          },
        },
        prerequisiteFor: {
          include: {
            dependentTopic: true,
          },
        },
        competencyMappings: {
          include: {
            competency: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError(`Topic with ID ${id} not found.`);
    }

    return ResponseHelper.success({
      res,
      message: 'Topic details retrieved successfully',
      data: topic,
    });
  })
);

/**
 * GET /api/v1/topics/:id/dependencies
 * Retrieve direct prerequisite topics and downstream dependent topics
 */
router.get(
  '/:id/dependencies',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const topic = await prisma.learningTopic.findUnique({
      where: { id },
      include: {
        prerequisites: {
          include: {
            prerequisiteTopic: {
              include: { group: true },
            },
          },
        },
        prerequisiteFor: {
          include: {
            dependentTopic: {
              include: { group: true },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundError(`Topic with ID ${id} not found.`);
    }

    return ResponseHelper.success({
      res,
      message: 'Topic dependency graph retrieved successfully',
      data: {
        topicId: topic.id,
        topicName: topic.name,
        topicCode: topic.code,
        prerequisites: topic.prerequisites.map((p) => ({
          id: p.prerequisiteTopic.id,
          name: p.prerequisiteTopic.name,
          code: p.prerequisiteTopic.code,
          edgeWeight: p.edgeWeight,
          dependencyType: p.dependencyType,
          group: p.prerequisiteTopic.group.name,
        })),
        dependents: topic.prerequisiteFor.map((p) => ({
          id: p.dependentTopic.id,
          name: p.dependentTopic.name,
          code: p.dependentTopic.code,
          edgeWeight: p.edgeWeight,
          dependencyType: p.dependencyType,
          group: p.dependentTopic.group.name,
        })),
      },
    });
  })
);

/**
 * GET /api/v1/topics/:id/path
 * Multi-hop topological prerequisite trace to this topic
 */
router.get(
  '/:id/path',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const allTopics = await revisionRepository.getAllTopicsWithPrerequisites();
    const targetTopic = allTopics.find((t: any) => t.id === id);

    if (!targetTopic) {
      throw new NotFoundError(`Topic with ID ${id} not found.`);
    }

    // Traverse ancestors via BFS/DFS
    const visited = new Set<string>();
    const path: any[] = [];
    const queue = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const topicNode = allTopics.find((t: any) => t.id === currentId);
      if (!topicNode) continue;

      if (currentId !== id) {
        path.unshift({
          id: topicNode.id,
          name: topicNode.name,
          code: topicNode.code,
          group: topicNode.group?.name,
          importance: topicNode.importance,
        });
      }

      for (const prereq of topicNode.prerequisites) {
        queue.push(prereq.prerequisiteTopicId);
      }
    }

    // Add target topic at the end
    path.push({
      id: targetTopic.id,
      name: targetTopic.name,
      code: targetTopic.code,
      group: targetTopic.group?.name,
      importance: targetTopic.importance,
      isTarget: true,
    });

    return ResponseHelper.success({
      res,
      message: 'Prerequisite learning path retrieved successfully',
      data: {
        targetTopicId: targetTopic.id,
        pathLength: path.length,
        path,
      },
    });
  })
);

export default router;
export { router as topicRouter };
