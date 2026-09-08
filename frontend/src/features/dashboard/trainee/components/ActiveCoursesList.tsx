'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface ActiveCourseItem {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  progressPercentage: number;
  enrolledAt: string;
  trainerName: string;
  moduleCount: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
}

interface ActiveCoursesListProps {
  courses: ActiveCourseItem[];
}

export const ActiveCoursesList: React.FC<ActiveCoursesListProps> = ({ courses }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>My Active Courses</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled capacity building modules and lesson completion status
            </p>
          </div>
          <Link href="/trainee/courses">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {courses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <p>You have no active courses in progress.</p>
            <Link href="/trainee/courses">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                Explore Course Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => {
              const isCompleted = c.progressPercentage >= 100;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {c.difficulty}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium">{c.category}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {c.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>
                        Instructor: <strong className="text-slate-700">{c.trainerName}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-[240px]">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>{Math.round(c.progressPercentage)}% Progress</span>
                        <span className="text-slate-400 font-medium">
                          {c.completedLessonsCount}/{c.totalLessonsCount} Lessons
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.max(4, c.progressPercentage)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {c.moduleCount} modules total
                      </span>
                    </div>

                    <Link href={`/trainee/courses/${c.courseId}`}>
                      <Button
                        size="sm"
                        className={`text-xs font-bold shrink-0 ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <span>{isCompleted ? 'Review' : 'Continue'}</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveCoursesList;
