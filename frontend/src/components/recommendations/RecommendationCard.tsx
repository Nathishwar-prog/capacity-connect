'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RecommendationFeedbackModal } from './RecommendationFeedbackModal';
import { apiClient } from '../../api/client';

export interface RecommendationItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  courseLevel: string;
  instructorName?: string;
  rankPosition: number;
  score: number;
  candidateSource: string;
  reasonCodes: string[];
  explanation: {
    headline: string;
    whyRecommended: string;
    competencyOutcome: string;
    pedagogicalAdvice: string;
  };
}

interface RecommendationCardProps {
  item: RecommendationItem;
  surface: string;
  onDismiss?: (courseId: string) => void;
}

const REASON_BADGES: Record<string, { label: string; color: string }> = {
  CLOSES_CRITICAL_GAP: { label: 'Closes Critical Gap', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400' },
  CLOSES_SKILL_GAP: { label: 'Targeted Skill Gap', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400' },
  CONTINUES_LEARNING_PATH: { label: 'Next in Learning Path', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400' },
  PREREQUISITE_COMPLETED: { label: 'Prerequisite Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' },
  RECOMMENDED_FOR_EXPLORATION: { label: 'Horizon Discovery', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400' },
  POPULAR_IN_DEPARTMENT: { label: 'Department Spotlight', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400' },
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  surface,
  onDismiss,
}) => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleCardClick = async () => {
    try {
      await apiClient.post('/recommendations/events', {
        recommendationId: item.id,
        eventType: 'CLICK',
        position: item.rankPosition,
        surface,
        courseId: item.courseId,
      });
    } catch (e) {
      // Non-blocking telemetry
    }
  };

  const primaryBadgeKey = item.reasonCodes.find((rc) => REASON_BADGES[rc]) || 'POPULAR_IN_DEPARTMENT';
  const badge = REASON_BADGES[primaryBadgeKey] || { label: 'Recommended', color: 'bg-gray-100 text-gray-700' };

  return (
    <>
      <div className="group relative rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/90 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {item.courseLevel}
              </span>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                title="Feedback / Not Interested"
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Title & Category */}
          <Link
            href={`/courses/${item.courseId}`}
            onClick={handleCardClick}
            className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 mb-1">
              {item.courseTitle}
            </h4>
          </Link>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {item.courseCategory.replace(/_/g, ' ')}
            {item.instructorName && ` • ${item.instructorName}`}
          </p>

          {/* Pedagogical Explanation Narrative */}
          <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 p-3 mb-2">
            <p className="text-xs text-blue-950 dark:text-blue-200 line-clamp-2">
              💡 {item.explanation.whyRecommended}
            </p>
            {item.explanation.competencyOutcome && (
              <p className="text-[11px] text-blue-700/90 dark:text-blue-300/80 mt-1 font-medium">
                🎯 {item.explanation.competencyOutcome}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Relevance Fit: <span className="font-semibold text-gray-700 dark:text-gray-300">High</span>
          </span>
          <Link
            href={`/courses/${item.courseId}`}
            onClick={handleCardClick}
            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white dark:hover:text-gray-900 transition-all shadow-sm"
          >
            Start Learning →
          </Link>
        </div>
      </div>

      <RecommendationFeedbackModal
        isOpen={feedbackOpen}
        recommendationId={item.id}
        courseTitle={item.courseTitle}
        onClose={() => setFeedbackOpen(false)}
        onSubmitted={() => {
          if (onDismiss) onDismiss(item.courseId);
        }}
      />
    </>
  );
};
