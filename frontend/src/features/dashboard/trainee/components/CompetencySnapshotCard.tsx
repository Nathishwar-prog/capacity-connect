'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Target, ArrowRight, Award } from 'lucide-react';

interface CompetencyItem {
  id: string;
  name: string;
  code: string;
  category: string | null;
  currentLevel: number;
  requiredLevel: number;
  progressPercentage: number;
}

interface CompetencySnapshotProps {
  competencies: CompetencyItem[];
}

export const CompetencySnapshotCard: React.FC<CompetencySnapshotProps> = ({ competencies }) => {
  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return 'Novice';
      case 1:
        return 'Fundamental';
      case 2:
        return 'Developing';
      case 3:
        return 'Operational / Intermediate';
      case 4:
        return 'Advanced Forecaster';
      case 5:
        return 'Expert / Lead Specialist';
      default:
        return `Level ${level}`;
    }
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <span>My Competencies</span>
          </CardTitle>
          <Link href="/trainee/competencies">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>View Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          WMO & IMD verified operational scientific capabilities
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {competencies.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No competency information recorded yet. Complete assessments to evaluate proficiency levels.
          </div>
        ) : (
          <div className="space-y-3.5">
            {competencies.map((comp) => (
              <div key={comp.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">
                    {comp.name}
                  </span>
                  <span className="text-indigo-700 font-bold text-[11px]">
                    {getLevelLabel(comp.currentLevel)} (L{comp.currentLevel}/L{comp.requiredLevel})
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.max(8, comp.progressPercentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{comp.category || 'Atmospheric Science'}</span>
                  <span>Target: Level {comp.requiredLevel}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            {competencies.length} framework capabilities tracked
          </span>
          <Link href="/trainee/competencies">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>Full Profile</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetencySnapshotCard;
