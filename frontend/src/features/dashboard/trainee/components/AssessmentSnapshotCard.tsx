'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, CheckCircle2, Clock, ArrowRight, PlayCircle } from 'lucide-react';

interface AssessmentItem {
  id: string;
  assessmentId: string;
  title: string;
  type: string;
  status: string;
  score: number | null;
  passingScore: number;
  durationMinutes: number | null;
  startedAt: string;
}

interface AssessmentSnapshotCardProps {
  assessments: AssessmentItem[];
}

export const AssessmentSnapshotCard: React.FC<AssessmentSnapshotCardProps> = ({
  assessments,
}) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
            <span>My Assessments</span>
          </CardTitle>
          <Link href="/trainee/assessments">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Practical test evaluations, scheduled exams, and scored results
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {assessments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No active assessments assigned at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => {
              const isCompleted = a.status === 'COMPLETED' || a.status === 'EVALUATED';
              const isPassed = isCompleted && a.score !== null && a.score >= a.passingScore;
              return (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {a.title}
                      </h5>
                      <Badge
                        variant={
                          isPassed
                            ? 'success'
                            : a.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[9px] uppercase font-bold"
                      >
                        {isPassed ? 'Passed' : a.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Pass benchmark: {a.passingScore}%</span>
                      {a.score !== null && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-slate-700">
                            Score: {Math.round(a.score)}%
                          </span>
                        </>
                      )}
                      {a.durationMinutes && (
                        <>
                          <span>•</span>
                          <span>{a.durationMinutes} min</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link href={`/trainee/assessments/${a.assessmentId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold shrink-0 border-slate-200 hover:bg-white text-indigo-600"
                    >
                      <span>{isCompleted ? 'Review' : 'Start'}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainee/assessments">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>Assessment History</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentSnapshotCard;
