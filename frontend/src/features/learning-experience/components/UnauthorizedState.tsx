'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Compass, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

export const UnauthorizedState: React.FC = () => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.unauthorizedTitle}</h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          {t.unauthorizedMessage}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/trainee/explore"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0B192C] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Compass className="w-4 h-4 text-blue-400" />
          <span>{t.browseCourses}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};
