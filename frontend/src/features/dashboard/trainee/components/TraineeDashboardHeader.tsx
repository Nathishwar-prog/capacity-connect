'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Compass, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TraineeDashboardHeaderProps {
  traineeName: string;
  departmentName?: string;
  designation?: string;
  onContinueClick?: () => void;
}

export const TraineeDashboardHeader: React.FC<TraineeDashboardHeaderProps> = ({
  traineeName,
  departmentName = 'Observational Meteorology',
  designation = 'Scientific Officer',
  onContinueClick,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            Learning Workspace
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            {designation} • {departmentName}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {getGreeting()}, {traineeName}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Continue your learning journey and build your meteorological and earth science
          competencies.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link href="/trainee/courses">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>Explore Courses</span>
          </Button>
        </Link>

        {onContinueClick ? (
          <Button
            size="sm"
            onClick={onContinueClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            <span>Continue Learning</span>
          </Button>
        ) : (
          <Link href="#continue-learning">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              <span>Continue Learning</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TraineeDashboardHeader;
