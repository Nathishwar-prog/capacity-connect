/**
 * Model Registry Service
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Manages model lifecycle in PostgreSQL MLModelRegistry:
 *   TRAINING -> VALIDATING -> ACTIVE -> RETIRED (or FAILED)
 * 
 * Never silently replaces an active model. Model activation is explicit and auditable.
 */

import prisma from '../../../database/client';
import { ModelLoader } from '../ranking/model-loader';
import logger from '../../../logger/winston.logger';

export interface RegisterModelInput {
  modelVersion: string;
  algorithm?: string;
  featureVersion: string;
  trainingDatasetVersion: string;
  trainingStart: Date;
  trainingEnd: Date;
  metrics: {
    ndcgAt3: number;
    ndcgAt5: number;
    ndcgAt10: number;
    mapAt10: number;
    mrr: number;
    precisionAt5?: number;
    recallAt5?: number;
    baselineComparison?: {
      baselineNdcgAt10: number;
      mlNdcgAt10: number;
      improvementPercentage: number;
    };
  };
  hyperparameters?: Record<string, any>;
  artifactPath: string;
}

export class ModelRegistryService {
  /**
   * Registers a newly trained model in VALIDATING status
   */
  public static async registerModel(input: RegisterModelInput) {
    logger.info(`Registering model version ${input.modelVersion} with algorithm ${input.algorithm || 'LIGHTGBM_LAMBDAMART'}`);

    const existing = await prisma.mLModelRegistry.findUnique({
      where: { modelVersion: input.modelVersion },
    });

    if (existing) {
      return prisma.mLModelRegistry.update({
        where: { modelVersion: input.modelVersion },
        data: {
          metrics: input.metrics as any,
          hyperparameters: input.hyperparameters as any,
          artifactPath: input.artifactPath,
          trainingEnd: input.trainingEnd,
          status: 'VALIDATING',
        },
      });
    }

    return prisma.mLModelRegistry.create({
      data: {
        modelVersion: input.modelVersion,
        algorithm: input.algorithm || 'LIGHTGBM_LAMBDAMART',
        featureVersion: input.featureVersion,
        trainingDatasetVersion: input.trainingDatasetVersion,
        trainingStart: input.trainingStart,
        trainingEnd: input.trainingEnd,
        metrics: input.metrics as any,
        hyperparameters: input.hyperparameters as any,
        artifactPath: input.artifactPath,
        status: 'VALIDATING',
      },
    });
  }

  /**
   * Explicitly activates a validated model, retiring the previous active model
   */
  public static async activateModel(modelVersion: string) {
    logger.info(`Activating ML model version: ${modelVersion}`);

    const model = await prisma.mLModelRegistry.findUnique({
      where: { modelVersion },
    });

    if (!model) {
      throw new Error(`Model version ${modelVersion} not found in registry.`);
    }

    // Retire all currently active models
    await prisma.mLModelRegistry.updateMany({
      where: { status: 'ACTIVE' },
      data: {
        status: 'RETIRED',
        retiredAt: new Date(),
      },
    });

    // Activate selected model
    const activated = await prisma.mLModelRegistry.update({
      where: { modelVersion },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    // Invalidate in-memory ModelLoader cache so new requests use this model immediately
    ModelLoader.invalidateCache();

    logger.info(`Model version ${modelVersion} is now ACTIVE.`);
    return activated;
  }

  /**
   * Retires an active model (causing system to fall back to BaselineRanker)
   */
  public static async retireModel(modelVersion: string) {
    logger.info(`Retiring model version: ${modelVersion}`);

    const retired = await prisma.mLModelRegistry.update({
      where: { modelVersion },
      data: {
        status: 'RETIRED',
        retiredAt: new Date(),
      },
    });

    ModelLoader.invalidateCache();
    return retired;
  }

  /**
   * Retrieves the currently active model metadata
   */
  public static async getActiveModel() {
    return prisma.mLModelRegistry.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { activatedAt: 'desc' },
    });
  }

  /**
   * Lists all models with their offline evaluation metrics
   */
  public static async listModels() {
    return prisma.mLModelRegistry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves specific model details
   */
  public static async getModelDetails(modelVersion: string) {
    return prisma.mLModelRegistry.findUnique({
      where: { modelVersion },
    });
  }
}
