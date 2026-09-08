'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TrainerDashboardHeaderProps {
  trainerName: string;
  departmentName?: string;
  organizationName?: string;
}

export const TrainerDashboardHeader: React.FC<TrainerDashboardHeaderProps> = ({
  trainerName,
  departmentName = 'Meteorological Training Wing (IMD Pune)',
  organizationName: _organizationName,
}) => {
  // Determine greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
            Training Command Center
          </span>
          <span className="text-xs text-slate-400 font-medium">{departmentName}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {getGreeting()}, {trainerName}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Here is what is happening across your earth science curricula, trainee cohorts, and
          competency evaluations.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link href="/trainer/trainees">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <Users className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <span>View Trainees</span>
          </Button>
        </Link>

        <Link href="/trainer/courses/new">
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Create Course</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TrainerDashboardHeader;
