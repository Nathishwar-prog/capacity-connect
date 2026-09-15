'use client';

import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

interface LessonObjectivesCardProps {
  objectives: string[];
}

export const LessonObjectivesCard = React.memo(function LessonObjectivesCard({
  objectives,
}: LessonObjectivesCardProps) {
  if (!objectives || objectives.length === 0) return null;

  // Clean objectives: remove duplicated prefixes if present
  const cleanedObjectives = objectives.map((obj) =>
    obj.replace(/^•\s*/, '').replace(/^-\s*/, '').trim()
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-900/50 space-y-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-indigo-300">
        <div className="w-6 h-6 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Learning Objectives
        </h3>
      </div>

      <p className="text-xs text-indigo-200/90 font-medium">
        By the end of this operational session, you will be equipped to:
      </p>

      <ul className="space-y-2 pt-1">
        {cleanedObjectives.map((obj, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-indigo-100 leading-relaxed">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
