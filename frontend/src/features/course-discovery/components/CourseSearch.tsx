'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  onClear: () => void;
}

export const CourseSearch: React.FC<Props> = ({ search, onSearchChange, onClear }) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-all shadow-2xs"
      />
      {search && (
        <button
          type="button"
          onClick={onClear}
          title={t.clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
