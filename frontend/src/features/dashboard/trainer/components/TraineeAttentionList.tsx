'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { TraineeAttentionItem } from '@/features/trainer';
import { UserX, ArrowRight, AlertTriangle } from 'lucide-react';

interface TraineeAttentionListProps {
  trainees: TraineeAttentionItem[];
}

export const TraineeAttentionList: React.FC<TraineeAttentionListProps> = ({ trainees }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Trainees Needing Attention</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
            {trainees.length} Flagged
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Trainees lagging below completion benchmarks or with identified scientific skill gaps
        </p>
      </CardHeader>

      <CardContent>
        {trainees.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            All supervised trainees are currently progressing above threshold benchmarks.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trainees.map((t) => {
              const isAtRisk = t.progress < 30 || t.status === 'At Risk';
              return (
                <div
                  key={t.traineeId}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{t.name}</span>
                        <Badge
                          variant={isAtRisk ? 'destructive' : 'warning'}
                          className="text-[9px] uppercase font-extrabold"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.designation} • {t.department}
                      </div>
                      <div className="text-[10px] text-indigo-700 font-medium">{t.courseTitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="w-24 text-right sm:text-left">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.progress}% Progress
                      </span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            isAtRisk ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link href={`/trainer/trainees/${t.traineeId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-slate-200"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Link href="/trainer/trainees">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View All Trainees</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TraineeAttentionList;
