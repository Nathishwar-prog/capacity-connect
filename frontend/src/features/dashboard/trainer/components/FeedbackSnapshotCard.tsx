'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { MessageSquareQuote, Star, ArrowRight } from 'lucide-react';

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  courseTitle: string | null;
  traineeName: string;
  createdAt: string;
}

interface FeedbackSnapshotCardProps {
  feedback: FeedbackItem[];
}

export const FeedbackSnapshotCard: React.FC<FeedbackSnapshotCardProps> = ({ feedback }) => {
  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : '0.0';

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
            <span>Learner Feedback</span>
          </CardTitle>
          <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{avgRating} / 5</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Evaluation ratings and pedagogical comments from course participants
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {feedback.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No learner feedback submitted yet.
          </div>
        ) : (
          feedback.slice(0, 3).map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{f.traineeName}</span>
                <div className="flex items-center text-amber-500 text-[11px] font-bold gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{f.rating}/5</span>
                </div>
              </div>
              {f.courseTitle && (
                <span className="text-[10px] text-indigo-700 font-semibold block truncate">
                  {f.courseTitle}
                </span>
              )}
              {f.comment && (
                <p className="text-xs text-slate-600 italic line-clamp-2">
                  &ldquo;{f.comment}&rdquo;
                </p>
              )}
            </div>
          ))
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Link href="/trainer/feedback">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
              <span>View All Feedback</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackSnapshotCard;
