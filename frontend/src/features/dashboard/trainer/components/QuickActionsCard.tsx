'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Users, ClipboardList, BarChart3, Upload, Zap } from 'lucide-react';

export const QuickActionsCard: React.FC = () => {
  const actions = [
    { label: 'Create New Course', href: '/trainer/courses/new', icon: PlusCircle, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'Monitor Trainees', href: '/trainer/trainees', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Create Assessment', href: '/trainer/assessments', icon: ClipboardList, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'View Analytics', href: '/trainer/analytics', icon: BarChart3, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>Operational Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <Link
                key={idx}
                href={act.href}
                className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center gap-2.5 group"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${act.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {act.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
