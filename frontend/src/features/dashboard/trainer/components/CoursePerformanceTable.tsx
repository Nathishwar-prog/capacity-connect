'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FileEdit,
  CircleX,
  FileCode,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { CourseStatus, CourseDifficulty } from '@/features/trainer';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  difficulty: CourseDifficulty;
  category?: string;
  moduleCount: number;
  enrolledCount: number;
  completionRate: number;
}

interface CoursePerformanceTableProps {
  courses: CourseItem[];
}

export const CoursePerformanceTable: React.FC<CoursePerformanceTableProps> = ({ courses }) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredCourses =
    filter === 'ALL' ? courses : courses.filter((c) => c.status === filter);

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge variant="success" className="text-[10px] gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Published</span>
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge variant="warning" className="text-[10px] gap-1 font-bold">
            <Clock3 className="w-3 h-3 text-amber-700" />
            <span>In Review</span>
          </Badge>
        );
      case 'DRAFT':
        return (
          <Badge variant="secondary" className="text-[10px] gap-1 font-bold">
            <FileEdit className="w-3 h-3 text-slate-500" />
            <span>Draft</span>
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="text-[10px] gap-1 font-bold">
            <CircleX className="w-3 h-3 text-rose-700" />
            <span>Revision Needed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Curriculum Performance</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Instructional earth science modules and trainee progress velocity
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'PUBLISHED', 'DRAFT', 'PENDING_APPROVAL'].map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilter(statusKey)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap ${
                  filter === statusKey
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {statusKey === 'ALL'
                  ? 'All'
                  : statusKey === 'PENDING_APPROVAL'
                  ? 'In Review'
                  : statusKey.charAt(0) + statusKey.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredCourses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No courses match the selected status filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Modules</th>
                  <th className="py-2.5 px-3">Trainees</th>
                  <th className="py-2.5 px-3">Completion</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.difficulty} • {c.category || 'Atmospheric Sciences'}
                      </div>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(c.status)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {c.moduleCount} modules
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {c.enrolledCount} learners
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                          <span>{c.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${c.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/trainer/courses/${c.id}/builder`}>
                        <Button size="sm" variant="ghost" className="text-xs text-indigo-600 font-bold hover:bg-indigo-50">
                          <span>Builder</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Showing {filteredCourses.length} of {courses.length} courses
          </span>
          <Link href="/trainer/courses">
            <Button size="sm" variant="ghost" className="text-xs font-bold text-slate-700 hover:text-indigo-600">
              <span>View All Courses</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursePerformanceTable;
