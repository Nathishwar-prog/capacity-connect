'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, CheckCircle2, ArrowRight, FileQuestion, PlusCircle } from 'lucide-react';

interface AssessmentItem {
  id: string;
  title: string;
  courseTitle: string;
  questionsCount: number;
  attemptsCount: number;
  passedCount?: number;
  passingScore?: number;
  status: string;
}

interface AssessmentOverviewCardProps {
  assessments: AssessmentItem[];
}

export const AssessmentOverviewCard: React.FC<AssessmentOverviewCardProps> = ({ assessments }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-600" />
            <span>Assessment Overview</span>
          </CardTitle>
          <Link href="/trainer/assessments">
            <Button size="sm" variant="ghost" className="text-xs text-indigo-600 font-bold hover:bg-indigo-50">
              <span>View All</span>
            </Button>
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Standardized test submissions and trainee pass thresholds
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {assessments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <p>No assessments created yet.</p>
            <Link href="/trainer/assessments">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                <span>Create Assessment</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{a.title}</h4>
                  <Badge variant="outline" className="text-[10px]">
                    {a.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium">{a.courseTitle}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>{a.questionsCount} questions • {a.attemptsCount} attempts</span>
                  <span className="font-bold text-emerald-600">
                    {a.passedCount || 0} passed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainer/assessments">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>Manage Quizzes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentOverviewCard;
