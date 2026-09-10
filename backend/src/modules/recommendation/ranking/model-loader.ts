/**
 * Model Loader & In-Memory Registry Cache
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Fetches the active ML model from PostgreSQL MLModelRegistry or local disk.
 * Returns an instantiated MLRanker or null (triggering automatic baseline fallback).
 */

import fs from 'fs';
import path from 'path';
import prisma from '../../../database/client';
import { MLRanker, LightGBMBoosterModel } from './ml-ranker';
import logger from '../../../logger/winston.logger';

export class ModelLoader {
  private static cachedRanker: MLRanker | null = null;
  private static cachedModelVersion: string | null = null;
  private static lastCheckedAt: number = 0;
  private static readonly CACHE_TTL_MS = 60 * 1000; // Check DB every 60 seconds

  /**
   * Clears in-memory cache to force reload on next call
   */
  public static invalidateCache(): void {
    this.cachedRanker = null;
    this.cachedModelVersion = null;
    this.lastCheckedAt = 0;
    logger.info('Recommendation model cache invalidated.');
  }

  /**
   * Loads the active MLRanker or returns null if no active model exists
   */
  public static async getActiveRanker(): Promise<MLRanker | null> {
    const now = Date.now();
    if (this.cachedRanker && now - this.lastCheckedAt < this.CACHE_TTL_MS) {
      return this.cachedRanker;
    }

    try {
      this.lastCheckedAt = now;

      // 1. Query PostgreSQL MLModelRegistry for status = 'ACTIVE'
      let activeRecord = null;
      try {
        activeRecord = await prisma.mLModelRegistry.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { activatedAt: 'desc' },
        });
      } catch (dbErr: any) {
        logger.warn(`ModelLoader DB query failed (${dbErr.message}), checking local filesystem fallback.`);
      }

      if (!activeRecord) {
        // Check if there is an offline exported default model in ml/models/active_model.json
        const fallbackPath = path.resolve(process.cwd(), 'ml/models/active_model.json');
        if (fs.existsSync(fallbackPath)) {
          const raw = fs.readFileSync(fallbackPath, 'utf-8');
          const booster = JSON.parse(raw) as LightGBMBoosterModel;
          this.cachedModelVersion = 'lgbm-local-default';
          this.cachedRanker = new MLRanker('lgbm-local-default', booster);
          logger.info('Loaded active model from local filesystem fallback.');
          return this.cachedRanker;
        }

        this.cachedRanker = null;
        this.cachedModelVersion = null;
        return null;
      }

      // If already cached with same version, keep it
      if (this.cachedRanker && this.cachedModelVersion === activeRecord.modelVersion) {
        return this.cachedRanker;
      }

      // Load model artifact from artifactPath or file
      let boosterData: LightGBMBoosterModel;
      const artifactPath = path.isAbsolute(activeRecord.artifactPath)
        ? activeRecord.artifactPath
        : path.resolve(process.cwd(), activeRecord.artifactPath);

      if (fs.existsSync(artifactPath)) {
        const fileContent = fs.readFileSync(artifactPath, 'utf-8');
        boosterData = JSON.parse(fileContent);
      } else {
        logger.error(`Active model artifact not found on disk at: ${artifactPath}`);
        return null;
      }

      this.cachedRanker = new MLRanker(activeRecord.modelVersion, boosterData);
      this.cachedModelVersion = activeRecord.modelVersion;
      logger.info(`Successfully loaded and activated MLRanker version: ${activeRecord.modelVersion}`);
      return this.cachedRanker;
    } catch (err: any) {
      logger.error(`Failed to load active ML ranker: ${err.message}`);
      return null;
    }
  }
}
