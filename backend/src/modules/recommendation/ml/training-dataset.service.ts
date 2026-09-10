/**
 * Training Dataset Service
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Generates offline Learning-to-Rank training datasets from historical recommendation batches,
 * user interactions, and educational outcomes.
 * 
 * Outcome-Based Graded Relevance Hierarchy:
 *   5 - COMPETENCY_IMPROVEMENT (Highest educational signal)
 *   4 - COURSE_COMPLETION (Strong educational outcome)
 *   3 - COURSE_START / ENROLLMENT (Active commitment)
 *   2 - SAVE / CLICK (Engagement signal)
 *   1 - IMPRESSION / VIEW (Neutral display)
 *   0 - DISMISS / ABANDON (Negative feedback)
 * 
 * Enforces temporal splitting (Train: 70%, Val: 15%, Test: 15% by timestamp) to prevent future leakage.
 */

import fs from 'fs';
import path from 'path';
import prisma from '../../../database/client';
import { FeatureBuilder } from '../features/feature-builder';
import { FEATURE_NAMES, CURRENT_FEATURE_VERSION } from '../features/feature.types';
import logger from '../../../logger/winston.logger';

export interface TrainingRow {
  queryId: string;       // Recommendation batchId (or session group)
  userId: string;
  courseId: string;
  timestamp: Date;
  label: number;         // 0 to 5 graded relevance
  featureVector: number[]; // Length matching FEATURE_NAMES
  outcomeType: string;
}

export interface DatasetSplit {
  train: TrainingRow[];
  validation: TrainingRow[];
  test: TrainingRow[];
  metadata: {
    totalRows: number;
    trainCount: number;
    valCount: number;
    testCount: number;
    datasetVersion: string;
    featureVersion: string;
    featureNames: string[];
  };
}

export class TrainingDatasetService {
  /**
   * Assigns graded relevance label based on events and outcomes
   */
  public static computeGradedLabel(events: Array<{ eventType: string }>, hasCompetencyGain: boolean, hasCompleted: boolean): { label: number; outcomeType: string } {
    if (hasCompetencyGain) {
      return { label: 5, outcomeType: 'COMPETENCY_IMPROVEMENT' };
    }
    if (hasCompleted) {
      return { label: 4, outcomeType: 'COURSE_COMPLETED' };
    }

    const eventTypes = new Set(events.map(e => e.eventType));

    if (eventTypes.has('ENROLL') || eventTypes.has('START')) {
      return { label: 3, outcomeType: 'COURSE_STARTED' };
    }
    if (eventTypes.has('SAVE') || eventTypes.has('CLICK')) {
      return { label: 2, outcomeType: 'CLICK_OR_SAVE' };
    }
    if (eventTypes.has('ABANDON') || eventTypes.has('DISMISS')) {
      return { label: 0, outcomeType: 'DISMISSED_OR_ABANDONED' };
    }
    return { label: 1, outcomeType: 'IMPRESSION' };
  }

  /**
   * Generates training dataset from historical batches with temporal train/val/test splitting
   */
  public static async generateDataset(options: {
    startDate?: Date;
    endDate?: Date;
    maxBatches?: number;
  } = {}): Promise<DatasetSplit> {
    const {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      endDate = new Date(),
      maxBatches = 1000,
    } = options;

    logger.info(`Extracting historical recommendation batches between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // 1. Fetch historical batches ordered chronologically by createdAt (strict temporal ordering)
    const batches = await prisma.recommendationBatch.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        recommendations: true,
        events: true,
      },
      orderBy: { createdAt: 'asc' },
      take: maxBatches,
    });

    logger.info(`Found ${batches.length} historical batches for dataset generation.`);

    const allRows: TrainingRow[] = [];

    // Group batches by user for efficient feature extraction
    const userBatchMap = new Map<string, typeof batches>();
    for (const b of batches) {
      if (!userBatchMap.has(b.userId)) userBatchMap.set(b.userId, []);
      userBatchMap.get(b.userId)!.push(b);
    }

    for (const [userId, userBatches] of userBatchMap.entries()) {
      // Fetch user's enrollments and competency assessments for outcome attribution
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        select: { courseId: true, status: true, completedAt: true },
      });
      const completedSet = new Set(
        enrollments.filter(e => e.status === 'COMPLETED').map(e => e.courseId)
      );

      // User competencies with evidence indicating improvement
      const userComps = await prisma.userCompetency.findMany({
        where: { userId, currentLevel: { gte: 2 } },
        select: { competencyId: true },
      });
      const improvedCompIds = new Set(userComps.map(c => c.competencyId));

      for (const batch of userBatches) {
        const candidateCourseIds = batch.recommendations
          .map(r => r.courseId)
          .filter((id): id is string => Boolean(id));

        if (candidateCourseIds.length === 0) continue;

        // Build feature vectors at inference time
        const featuresMap = await FeatureBuilder.buildCandidateFeatures(userId, candidateCourseIds);

        // Group batch events by courseId
        const courseEventsMap = new Map<string, Array<{ eventType: string }>>();
        for (const ev of batch.events) {
          if (!ev.courseId) continue;
          if (!courseEventsMap.has(ev.courseId)) courseEventsMap.set(ev.courseId, []);
          courseEventsMap.get(ev.courseId)!.push({ eventType: ev.eventType });
        }

        // Fetch course competencies to evaluate competency improvement
        const courseComps = await prisma.courseCompetency.findMany({
          where: { courseId: { in: candidateCourseIds } },
          select: { courseId: true, competencyId: true },
        });
        const courseToCompMap = new Map<string, string[]>();
        for (const cc of courseComps) {
          if (!courseToCompMap.has(cc.courseId)) courseToCompMap.set(cc.courseId, []);
          courseToCompMap.get(cc.courseId)!.push(cc.competencyId);
        }

        for (const rec of batch.recommendations) {
          if (!rec.courseId) continue;
          const feat = featuresMap.get(rec.courseId);
          if (!feat || !feat.features) continue;

          const events = courseEventsMap.get(rec.courseId) || [];
          const isCompleted = completedSet.has(rec.courseId);
          const compIds = courseToCompMap.get(rec.courseId) || [];
          const hasCompetencyGain = isCompleted && compIds.some(cid => improvedCompIds.has(cid));

          const { label, outcomeType } = this.computeGradedLabel(events, hasCompetencyGain, isCompleted);

          allRows.push({
            queryId: batch.id,
            userId,
            courseId: rec.courseId,
            timestamp: batch.createdAt,
            label,
            featureVector: feat.features,
            outcomeType,
          });
        }
      }
    }

    // 2. Temporal train/val/test split (70% train, 15% val, 15% test by timestamp)
    allRows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Filter to retain only query groups that have at least 2 items
    const queryGroupCounts = new Map<string, number>();
    for (const r of allRows) {
      queryGroupCounts.set(r.queryId, (queryGroupCounts.get(r.queryId) || 0) + 1);
    }
    const validRows = allRows.filter(r => (queryGroupCounts.get(r.queryId) || 0) >= 2);

    // Get unique queries in chronological order
    const uniqueQueries = Array.from(new Set(validRows.map(r => r.queryId)));
    const totalQueries = uniqueQueries.length;
    const trainEndIdx = Math.floor(totalQueries * 0.70);
    const valEndIdx = Math.floor(totalQueries * 0.85);

    const trainQueries = new Set(uniqueQueries.slice(0, trainEndIdx));
    const valQueries = new Set(uniqueQueries.slice(trainEndIdx, valEndIdx));
    const testQueries = new Set(uniqueQueries.slice(valEndIdx));

    const train = validRows.filter(r => trainQueries.has(r.queryId));
    const validation = validRows.filter(r => valQueries.has(r.queryId));
    const test = validRows.filter(r => testQueries.has(r.queryId));

    const datasetVersion = `ds-${Date.now()}`;

    logger.info(`Dataset generated: ${validRows.length} total rows across ${totalQueries} query groups.`);
    logger.info(`Train: ${train.length} rows, Val: ${validation.length} rows, Test: ${test.length} rows.`);

    return {
      train,
      validation,
      test,
      metadata: {
        totalRows: validRows.length,
        trainCount: train.length,
        valCount: validation.length,
        testCount: test.length,
        datasetVersion,
        featureVersion: CURRENT_FEATURE_VERSION,
        featureNames: FEATURE_NAMES,
      },
    };
  }

  /**
   * Exports dataset split to JSON for Python LightGBM training
   */
  public static async exportDatasetToJson(
    dataset: DatasetSplit,
    outputDir: string = 'ml/data'
  ): Promise<{ dataPath: string }> {
    const resolvedDir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }

    const filePath = path.join(resolvedDir, `dataset_${dataset.metadata.datasetVersion}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf-8');

    // Also write current latest pointer
    const latestPath = path.join(resolvedDir, 'latest_dataset.json');
    fs.writeFileSync(latestPath, JSON.stringify(dataset, null, 2), 'utf-8');

    logger.info(`Saved dataset artifact to: ${filePath}`);
    return { dataPath: filePath };
  }
}
