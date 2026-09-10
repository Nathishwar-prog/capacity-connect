'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, TrendingUp, Layers, Target, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LearningOverviewGridProps {
  metrics: {
    enrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    overallProgress: number;
    competenciesTracked?: number;
    skillGapsCount?: number;
  };
}

export const LearningOverviewGrid: React.FC<LearningOverviewGridProps> = ({ metrics }) => {
  // Calculate competency coverage indicator
  const competencyCoverage = metrics.competenciesTracked && metrics.competenciesTracked > 0
    ? Math.min(100, Math.round((metrics.competenciesTracked / Math.max(1, metrics.competenciesTracked + (metrics.skillGapsCount || 0))) * 100))
    : 78;

  const items = [
    {
      label: 'Courses Enrolled',
      value: metrics.enrolledCourses,
      unit: 'curricula',
      sub: 'MoES & IMD pathways',
      href: '/trainee/my-learning',
      icon: Layers,
      iconColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
      borderHover: 'hover:border-slate-300',
    },
    {
      label: 'In Progress',
      value: metrics.inProgressCourses,
      unit: 'active',
      sub: 'Active learning modules',
      href: '/trainee/my-learning',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      borderHover: 'hover:border-indigo-300',
    },
    {
      label: 'Completed Pathways',
      value: metrics.completedCourses,
      unit: 'certified',
      sub: 'Certified qualifications',
      href: '/trainee/my-learning',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderHover: 'hover:border-emerald-300',
    },
    {
      label: 'Overall Progress',
      value: `${metrics.overallProgress}%`,
      unit: '',
      sub: 'Average syllabus velocity',
      href: '/trainee/my-learning',
      icon: TrendingUp,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderHover: 'hover:border-amber-300',
    },
    {
      label: 'Competency Coverage',
      value: `${competencyCoverage}%`,
      unit: '',
      sub: 'WMO proficiency benchmark',
      href: '/trainee/competencies',
      icon: Target,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      borderHover: 'hover:border-cyan-300',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Priority 2 • Learning Progress Summary
        </h2>
        <span className="text-[11px] text-slate-400 font-medium">Click any metric to view details</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href} className="group block">
              <Card
                className={`p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-all duration-200 ${item.borderHover} hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between h-full cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-7 h-7 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} transition-transform group-hover:scale-105`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {item.value}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium truncate">
                    {item.sub}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LearningOverviewGrid;
