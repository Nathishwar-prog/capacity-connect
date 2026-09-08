/**
 * Recommendation Background Jobs
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Scheduled tasks for:
 * 1. Course popularity and quality score updates
 * 2. Training dataset generation
 * 3. Model performance tracking
 */

import prisma from '../../../database/client';
import { TrainingDatasetService } from '../ml/training-dataset.service';
import logger from '../../../logger/winston.logger';

export class RecommendationJobs {
  /**
   * Updates popularity, completion rate, and quality metrics on CourseRecommendationProfile
   */
  public static async updateCoursePopularityScores(): Promise<void> {
    logger.info('Starting background job: updateCoursePopularityScores');

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        enrollments: { select: { status: true } },
        feedbacks: { select: { rating: true } },
      },
    });

    for (const course of courses) {
      const totalEnrollments = course.enrollments.length;
      const completedCount = course.enrollments.filter(e => e.status === 'COMPLETED').length;
      const completionRate = totalEnrollments > 0 ? completedCount / totalEnrollments : 0;

      const totalRating = course.feedbacks.reduce((acc, f) => acc + f.rating, 0);
      const averageRating = course.feedbacks.length > 0 ? totalRating / course.feedbacks.length : 4.5;
      const ratingCount = course.feedbacks.length;

      // Bayesian smoothed popularity score [0, 100]
      const popularityScore = Math.min(100, Math.round(Math.log1p(totalEnrollments) * 15));

      // Quality score [0, 100]
      const qualityScore = Math.min(100, Math.round((averageRating / 5.0) * 60 + completionRate * 40));

      await prisma.courseRecommendationProfile.upsert({
        where: { courseId: course.id },
        update: {
          popularityScore,
          qualityScore,
          completionRate,
          averageRating,
          ratingCount,
          updatedAt: new Date(),
        },
        create: {
          courseId: course.id,
          popularityScore,
          qualityScore,
          completionRate,
          averageRating,
          ratingCount,
          updatedAt: new Date(),
        },
      });
    }

    logger.info(`Completed background job: updated profiles for ${courses.length} courses.`);
  }

  /**
   * Periodically builds and exports fresh training dataset
   */
  public static async refreshTrainingDataset(): Promise<void> {
    logger.info('Starting background job: refreshTrainingDataset');
    try {
      const dataset = await TrainingDatasetService.generateDataset();
      await TrainingDatasetService.exportDatasetToJson(dataset);
      logger.info('Completed background job: refreshTrainingDataset successfully exported.');
    } catch (err: any) {
      logger.error(`Error in refreshTrainingDataset job: ${err.message}`);
    }
  }
}
