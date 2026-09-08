'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Layers,
  PlayCircle,
  FileCheck2,
  Award,
  ChevronRight,
  Compass,
} from 'lucide-react';

export const LearningJourneyCard: React.FC = () => {
  const steps = [
    { label: 'Enrolled Course', icon: BookOpen, status: 'complete' },
    { label: 'Modules', icon: Layers, status: 'complete' },
    { label: 'Lessons', icon: PlayCircle, status: 'active' },
    { label: 'Practical Testing', icon: FileCheck2, status: 'pending' },
    { label: 'Competency Certified', icon: Award, status: 'pending' },
  ];

  return (
    <Card className="bg-slate-50/50 border-dashed border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>My Capacity Building Journey</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between overflow-x-auto gap-2 py-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isComplete = step.status === 'complete';
            const isActive = step.status === 'active';
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : isActive
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isActive
                        ? 'text-indigo-900 font-extrabold'
                        : isComplete
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningJourneyCard;
