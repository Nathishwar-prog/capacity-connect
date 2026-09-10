'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RecommendationCard, RecommendationItem } from './RecommendationCard';
import { RecommendationSkeleton } from './RecommendationSkeleton';
import { apiClient } from '../../api/client';

interface RecommendationBatchResponse {
  batchId: string;
  algorithmVersion: string;
  surface: string;
  summaryRationale: string;
  targetedMilestone: string;
  learningPathSequence: string[];
  items: RecommendationItem[];
}

interface RecommendationSectionProps {
  surface?: 'HOME' | 'DASHBOARD' | 'CLOSE_SKILL_GAPS' | 'CONTINUE_LEARNING' | 'COURSE_DETAIL';
  title?: string;
  subtitle?: string;
  limit?: number;
  activeCourseId?: string;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  surface = 'DASHBOARD',
  title = 'Intelligent Recommendations',
  subtitle = 'Curated for your competency development and career progression in MoES / IMD',
  limit = 3,
  activeCourseId,
}) => {
  const [data, setData] = useState<RecommendationBatchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: RecommendationBatchResponse }>('/recommendations', {
        params: {
          surface,
          limit,
          activeCourseId,
        },
      });

      const batch = res.data?.data;
      setData(batch || null);

      // Track batch impression telemetry
      if (batch?.items?.length) {
        apiClient.post('/recommendations/events/impressions', {
          batchId: batch.batchId,
          surface,
          items: batch.items.map((it) => ({
            recommendationId: it.id,
            courseId: it.courseId,
            position: it.rankPosition,
          })),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err?.response?.data?.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, [surface, limit, activeCourseId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleDismiss = (courseId: string) => {
    if (!data) return;
    setData({
      ...data,
      items: data.items.filter((i) => i.courseId !== courseId),
    });
  };

  return (
    <section className="my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              AI Powered
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRecommendations()}
          disabled={loading}
          className="inline-flex items-center self-start sm:self-auto gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Suggestions
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <RecommendationSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs text-rose-700 dark:text-rose-400">
          {error}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-800 p-8 text-center">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            No recommendations currently available for this surface.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Complete active assessments to unlock competency-targeted courses.
          </p>
        </div>
      ) : (
        <>
          {data.summaryRationale && (
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 italic">
              ✨ {data.summaryRationale}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                surface={surface}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
