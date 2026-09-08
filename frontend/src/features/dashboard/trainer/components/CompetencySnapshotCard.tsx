'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CompetencySnapshotData } from '@/features/trainer';
import { Award, ArrowRight, AlertCircle, Target } from 'lucide-react';

interface CompetencySnapshotCardProps {
  snapshot?: CompetencySnapshotData;
}

export const CompetencySnapshotCard: React.FC<CompetencySnapshotCardProps> = ({ snapshot }) => {
  const compData = snapshot || {
    coveredCount: 0,
    competencies: [],
    gapsCount: 0,
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span>Competency Snapshot</span>
          </CardTitle>
          <span className="text-[11px] font-bold text-slate-500">
            {compData.coveredCount} Frameworks Active
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Earth science and meteorological competency attainment rates
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {compData.competencies.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No competency data mapped to active courses yet.
          </div>
        ) : (
          <div className="space-y-3">
            {compData.competencies.map((c) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{c.name}</span>
                  <span className="text-indigo-600 font-bold">{c.attainmentRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${c.attainmentRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {compData.gapsCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{compData.gapsCount} competency areas need attention</span>
            </div>
            <Link href="/trainer/trainees?progressMax=30">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-bold text-amber-800 hover:bg-amber-100/60 p-1 h-auto"
              >
                Review Gaps
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainer/analytics">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetencySnapshotCard;
