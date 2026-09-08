import { EventEmitter } from 'events';
import cacheService from '../cache';
import { ModelLoader } from '../modules/recommendation/ranking/model-loader';
import logger from '../logger/winston.logger';

/**
 * APPLICATION-WIDE EVENT EMITTER
 *
 * Used for raising asynchronous, non-blocking internal events.
 */
export const appEventEmitter = new EventEmitter();

// Invalidate recommendation cache on competency changes
appEventEmitter.on('competency.updated', async (data: { userId: string }) => {
  if (data?.userId) {
    await cacheService.delPrefix(`rec:user:${data.userId}`);
    logger.debug(`Invalidated recommendation cache for user ${data.userId} on competency update`);
  }
});

// Invalidate recommendation cache on skill gap updates
appEventEmitter.on('skillgap.updated', async (data: { userId: string }) => {
  if (data?.userId) {
    await cacheService.delPrefix(`rec:user:${data.userId}`);
    logger.debug(`Invalidated recommendation cache for user ${data.userId} on skill gap update`);
  }
});

// Invalidate recommendation cache on course completion
appEventEmitter.on('course.completed', async (data: { userId: string; courseId: string }) => {
  if (data?.userId) {
    await cacheService.delPrefix(`rec:user:${data.userId}`);
    logger.debug(`Invalidated recommendation cache for user ${data.userId} on course completion`);
  }
});

// Invalidate model cache when a new ML model is activated
appEventEmitter.on('model.activated', () => {
  ModelLoader.invalidateCache();
  logger.info('Invalidated ML ranker cache on model activation event.');
});

export default appEventEmitter;
