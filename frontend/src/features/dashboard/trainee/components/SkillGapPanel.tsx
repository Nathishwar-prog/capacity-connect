'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SkillGapItem {
  id: string;
  competencyName: string;
  category: string | null;
  currentLevel: number;
  requiredLevel: number;
  gapLevel: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SkillGapPanelProps {
  gaps: SkillGapItem[];
}

export const SkillGapPanel: React.FC<SkillGapPanelProps> = ({ gaps }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Identified Skill Gaps</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
            {gaps.length} Actionable
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Priority improvement areas to meet departmental operational benchmarks
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {gaps.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="font-bold text-slate-900">No Open Skill Gaps</p>
            <p className="text-[11px] text-slate-400">
              Your assessed competencies meet current deployment standards.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap) => {
              const isHigh = gap.priority === 'HIGH';
              return (
                <div
                  key={gap.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {gap.competencyName}
                    </h5>
                    <Badge
                      variant={isHigh ? 'destructive' : 'warning'}
                      className="text-[9px] uppercase font-bold"
                    >
                      {gap.priority} Priority
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Current: <strong>Level {gap.currentLevel}</strong> • Required:{' '}
                      <strong>Level {gap.requiredLevel}</strong>
                    </span>
                    <span className="text-amber-700 font-bold">
                      Gap: {gap.gapLevel} {gap.gapLevel === 1 ? 'level' : 'levels'}
                    </span>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Link href="/trainee/courses">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-slate-200"
                      >
                        <span>View Recommended Learning</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainee/skill-gaps">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View All Skill Gaps</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillGapPanel;
