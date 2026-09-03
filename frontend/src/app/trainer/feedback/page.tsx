'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useTrainerFeedback } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquareQuote, Star, Loader2, User } from 'lucide-react';

export default function TrainerFeedbackPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerFeedbackContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerFeedbackContent() {
  const { data: feedbackList, isLoading } = useTrainerFeedback();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const items = feedbackList || [];
  const avgRating =
    items.length > 0
      ? (items.reduce((acc, f) => acc + f.rating, 0) / items.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Trainee Feedback & Evaluations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Participant commentary, pedagogy ratings, and course reviews
          </p>
        </div>

        {/* Overall Rating Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <div>
            <span className="text-base font-black text-amber-900 leading-none">{avgRating} / 5</span>
            <span className="text-[10px] text-amber-700 font-semibold block">Average Instruction Rating</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
            <span>Submitted Reviews ({items.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No trainee feedback received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {fb.traineeName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{fb.traineeName}</h4>
                        <span className="text-[10px] text-slate-400">{fb.traineeEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{fb.rating} / 5</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-indigo-700">{fb.courseTitle}</div>

                  {fb.comment && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      &ldquo;{fb.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
