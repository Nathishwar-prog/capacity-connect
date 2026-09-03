'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Compass, BookCheck, ShieldAlert } from 'lucide-react';

export const AIInsightsPlaceholder: React.FC = () => {
  return (
    <Card className="border-indigo-200/80 bg-linear-to-br from-indigo-50/70 via-white to-slate-50/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>AI-Powered Training Insights</span>
          </CardTitle>
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-extrabold uppercase">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Planned predictive analytics and intelligent curriculum diagnostics for MoES / IMD instructors
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          Future capability upgrades will deliver automated pedagogical recommendations to optimize meteorological learning outcomes:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <Brain className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Predictive Skill-Gap Analysis</span>
              <span className="text-[11px] text-slate-500">Early identification of trainee competency deficiencies before examinations</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <Compass className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Personalized Interventions</span>
              <span className="text-[11px] text-slate-500">Automated remedial study plans for lagging observational cadres</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <BookCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Curriculum Optimization</span>
              <span className="text-[11px] text-slate-500">Lesson clarity scoring based on trainee assessment drop-off points</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Trainer Tech Radar</span>
              <span className="text-[11px] text-slate-500">Emerging atmospheric modeling frameworks recommended for inclusion</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPlaceholder;
