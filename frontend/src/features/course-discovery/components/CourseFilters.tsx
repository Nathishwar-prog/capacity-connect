'use client';

import React from 'react';
import { Filter, X, RotateCcw, ArrowUpDown } from 'lucide-react';
import { CourseDifficulty, CourseFiltersMetadata } from '../types/course-discovery.types';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  category: string;
  onCategoryChange: (val: string) => void;
  difficulty: CourseDifficulty | 'ALL';
  onDifficultyChange: (val: CourseDifficulty | 'ALL') => void;
  trainerId: string;
  onTrainerChange: (val: string) => void;
  sortBy: 'newest' | 'title' | 'duration';
  onSortByChange: (val: 'newest' | 'title' | 'duration') => void;
  onClearAll: () => void;
  activeCount: number;
  totalResults: number;
  metadata: CourseFiltersMetadata;
}

export const CourseFilters: React.FC<Props> = ({
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  trainerId,
  onTrainerChange,
  sortBy,
  onSortByChange,
  onClearAll,
  activeCount,
  totalResults,
  metadata,
}) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  const formatCategoryName = (cat: string) => {
    return cat.replace(/_/g, ' ');
  };

  const selectedTrainer = metadata.trainers.find((tr) => tr.id === trainerId);

  return (
    <div className="space-y-3">
      {/* Filter Control Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Category / Domain */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            {t.categoryLabel}
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">{t.allCategories}</option>
            {metadata.categories.map((cat) => (
              <option key={cat} value={cat}>
                {formatCategoryName(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Difficulty Level */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            {t.difficultyLabel}
          </label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as CourseDifficulty | 'ALL')}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">{t.allDifficulties}</option>
            {metadata.difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Instructor / Trainer */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
            {t.trainerLabel}
          </label>
          <select
            value={trainerId}
            onChange={(e) => onTrainerChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">{t.allTrainers}</option>
            {metadata.trainers.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name} ({tr.designation || 'Faculty'})
              </option>
            ))}
          </select>
        </div>

        {/* 4. Sort By */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>{t.sortByLabel}</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'newest' | 'title' | 'duration')}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="newest">{t.sortNewest}</option>
            <option value="title">{t.sortTitle}</option>
            <option value="duration">{t.sortDuration}</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips & Clear Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700">
            {totalResults} {t.resultsCount}
          </span>

          {category !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span>{formatCategoryName(category)}</span>
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {difficulty !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <span>{difficulty}</span>
              <button
                type="button"
                onClick={() => onDifficultyChange('ALL')}
                className="hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {trainerId !== 'ALL' && selectedTrainer && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span>{selectedTrainer.name}</span>
              <button
                type="button"
                onClick={() => onTrainerChange('ALL')}
                className="hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearAllFilters}</span>
          </button>
        )}
      </div>
    </div>
  );
};
