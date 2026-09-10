'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface TodayLearningPlanProps {
  activeCourseTitle?: string;
  activeCourseId?: string;
  urgentRevisionTopic?: string;
}

export const TodayLearningPlan: React.FC<TodayLearningPlanProps> = ({
  activeCourseTitle = 'Seismological Data Processing',
  activeCourseId,
  urgentRevisionTopic = 'Doppler Radar Polarimetry Fundamentals',
}) => {
  const tasks = [
    {
      id: 1,
      title: `Continue: ${activeCourseTitle}`,
      duration: '12 min',
      type: 'Course Lesson',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      href: activeCourseId ? `/trainee/courses/${activeCourseId}` : '/trainee/my-learning',
      actionLabel: 'Resume',
      icon: Play,
    },
    {
      id: 2,
      title: `Adaptive Revision: ${urgentRevisionTopic}`,
      duration: '5 min',
      type: 'Retention Rebuild',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      href: '/trainee/revision',
      actionLabel: 'Revise',
      icon: RotateCcw,
    },
    {
      id: 3,
      title: 'Daily Diagnostic Retrieval Check',
      duration: '3 min',
      type: 'Micro-Quiz',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      href: '/trainee/assessments',
      actionLabel: 'Check',
      icon: Sparkles,
    },
  ];

  return (
    <Card className="bg-white border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Today&apos;s Learning Plan</span>
          </CardTitle>
          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            20 min daily target
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Curated daily pacing to maintain retention and steady competency progression
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-2.5">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <div
              key={task.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {task.id}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {task.duration}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">{task.type}</span>
                  </div>
                </div>
              </div>

              <Link href={task.href} className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold px-3 py-1 h-7 border-slate-200 hover:bg-white text-indigo-600 hover:text-indigo-700"
                >
                  <span>{task.actionLabel}</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          );
        })}

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            3-day study streak active
          </span>
          <Link href="/trainee/preferences" className="font-bold text-indigo-600 hover:underline">
            Adjust Daily Goal →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayLearningPlan;
