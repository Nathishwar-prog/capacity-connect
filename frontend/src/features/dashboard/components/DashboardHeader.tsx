import React from 'react';
import { CloudSun, Calendar } from 'lucide-react';
import { ROLE_METADATA, CanonicalRole } from '@/constants/roles';

interface DashboardHeaderProps {
  userName: string;
  role: string;
  departmentName?: string | null;
  portalSubtitle?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  role,
  departmentName,
  portalSubtitle = 'Atmospheric & Meteorological Capacity Building Portal',
}) => {
  const roleMeta = ROLE_METADATA[role as CanonicalRole] || {
    title: role,
    badgeLabel: role,
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-indigo-600" />
            Ministry of Earth Sciences • IMD
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-medium">
            {departmentName || 'National Meteorological Centre'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Welcome, {userName}
          </h1>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${roleMeta.badgeClass}`}
          >
            {roleMeta.badgeLabel}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{portalSubtitle}</p>
      </div>

      <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-600 font-semibold self-start md:self-auto">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>{currentDate}</span>
      </div>
    </div>
  );
};

export default DashboardHeader;
