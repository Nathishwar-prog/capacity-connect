'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, Clock, BookOpenCheck } from 'lucide-react';

interface RecommendationItem {
  id: string;
  type: string;
  reason: string | null;
  courseTitle: string;
  slug: string;
  difficulty: string;
  category: string;
}

interface RecommendedCoursesListProps {
  recommendations: RecommendationItem[];
}

export const RecommendedCoursesList: React.FC<RecommendedCoursesListProps> = ({
  recommendations,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Recommended For You</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Suggested courses based on your departmental profile and competency progression
            </p>
          </div>
          <Link href="/trainee/courses">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {recommendations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No personalized recommendations queued yet. Explore the course catalog.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {rec.difficulty}
                    </Badge>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                      {rec.category}
                    </span>
                  </div>

                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                    {rec.courseTitle}
                  </h5>

                  {rec.reason && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">{rec.reason}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link href={`/trainee/courses`}>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      <span>View Course</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedCoursesList;
