'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { TraineeHealthDistribution } from '@/features/trainer';
import { ShieldCheck, ArrowRight, HeartPulse } from 'lucide-react';

interface TraineeHealthCardProps {
  distribution?: TraineeHealthDistribution;
}

export const TraineeHealthCard: React.FC<TraineeHealthCardProps> = ({ distribution }) => {
  const health = distribution || {
    total: 0,
    onTrack: { count: 0, percentage: 0 },
    needsAttention: { count: 0, percentage: 0 },
    atRisk: { count: 0, percentage: 0 },
    completed: { count: 0, percentage: 0 },
  };

  const segments = [
    { label: 'On Track (≥70%)', count: health.onTrack.count, pct: health.onTrack.percentage, color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
    { label: 'Needs Attention (30-69%)', count: health.needsAttention.count, pct: health.needsAttention.percentage, color: 'bg-amber-500', barBg: 'bg-amber-100' },
    { label: 'At Risk (<30%)', count: health.atRisk.count, pct: health.atRisk.percentage, color: 'bg-rose-500', barBg: 'bg-rose-100' },
    { label: 'Completed', count: health.completed.count, pct: health.completed.percentage, color: 'bg-indigo-600', barBg: 'bg-indigo-100' },
  ];

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Trainee Health</span>
          </CardTitle>
          <span className="text-[11px] font-bold text-slate-500">
            {health.total} Total Learners
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Cohort distribution based on completion pace and attendance
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Composite horizontal distribution bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
          {health.onTrack.percentage > 0 && (
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${health.onTrack.percentage}%` }}
              title={`On Track: ${health.onTrack.percentage}%`}
            />
          )}
          {health.needsAttention.percentage > 0 && (
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${health.needsAttention.percentage}%` }}
              title={`Needs Attention: ${health.needsAttention.percentage}%`}
            />
          )}
          {health.atRisk.percentage > 0 && (
            <div
              className="bg-rose-500 h-full transition-all"
              style={{ width: `${health.atRisk.percentage}%` }}
              title={`At Risk: ${health.atRisk.percentage}%`}
            />
          )}
          {health.completed.percentage > 0 && (
            <div
              className="bg-indigo-600 h-full transition-all"
              style={{ width: `${health.completed.percentage}%` }}
              title={`Completed: ${health.completed.percentage}%`}
            />
          )}
        </div>

        {/* Breakdown Items */}
        <div className="space-y-2.5 pt-1">
          {segments.map((seg, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                <span className="text-slate-600 font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-bold">{seg.pct}%</span>
                <span className="text-[11px] text-slate-400">({seg.count})</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Link href="/trainer/trainees">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>View All Trainees</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TraineeHealthCard;
