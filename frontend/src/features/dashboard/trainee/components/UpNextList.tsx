'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Clock, FileQuestion, ArrowRight, ListOrdered } from 'lucide-react';

interface UpNextItem {
  id: string;
  title: string;
  type: string;
  durationMinutes: number;
  courseTitle: string;
  courseId: string;
}

interface UpNextListProps {
  items: UpNextItem[];
}

export const UpNextList: React.FC<UpNextListProps> = ({ items }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-indigo-600" />
            <span>Up Next</span>
          </CardTitle>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Recommended Sequence
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Sequential lessons and quizzes to advance your competencies
        </p>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No upcoming lessons queued. Enroll in courses to populate your study path.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isQuiz = item.type === 'Quiz' || item.type === 'QUIZ';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{item.title}</h5>
                        <Badge
                          variant={isQuiz ? 'warning' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {item.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate max-w-[140px] text-indigo-700 font-medium">
                          {item.courseTitle}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {item.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/trainee/courses/${item.courseId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-bold shrink-0 border-slate-200 hover:bg-white text-indigo-600"
                    >
                      <span>{isQuiz ? 'Take Quiz' : 'Start'}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpNextList;
