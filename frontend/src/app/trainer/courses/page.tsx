'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  useTrainerCourses,
  useDeleteCourse,
  useSubmitCourseForApproval,
  CourseStatus,
} from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpenCheck,
  PlusCircle,
  Search,
  FileEdit,
  Send,
  Trash2,
  Users,
  Layers,
  Award,
  Loader2,
  Clock,
} from 'lucide-react';

export default function TrainerCoursesPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerCoursesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerCoursesContent() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const statusParam = selectedStatus === 'ALL' ? undefined : (selectedStatus as CourseStatus);

  const { data, isLoading } = useTrainerCourses({
    status: statusParam,
    search: searchQuery || undefined,
  });

  const deleteCourseMutation = useDeleteCourse();
  const submitCourseMutation = useSubmitCourseForApproval('');

  const courses = data?.courses || [];

  const handleQuickSubmit = async (courseId: string) => {
    if (confirm('Are you sure you want to submit this course for institutional review? Ensure it has modules, lessons, and competencies.')) {
      try {
        await submitCourseMutation.mutateAsync();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to submit course for review');
      }
    }
  };

  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course draft? This action cannot be undone.')) {
      try {
        await deleteCourseMutation.mutateAsync(courseId);
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to delete course');
      }
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All Courses' },
    { key: 'PUBLISHED', label: 'Published' },
    { key: 'DRAFT', label: 'Drafts' },
    { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { key: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Curriculum Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Author, structure, and submit atmospheric science and meteorological training courses
          </p>
        </div>

        <Link href="/trainer/courses/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Create New Course</span>
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === tab.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Courses Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No training modules match the selected filter. Create a new curriculum module to begin.
          </p>
          <Link href="/trainer/courses/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold mt-2">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create Course</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => (
            <Card key={course.id} className="hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                        {course.difficulty}
                      </Badge>
                      <Badge
                        variant={
                          course.status === 'PUBLISHED'
                            ? 'success'
                            : course.status === 'PENDING_APPROVAL'
                            ? 'warning'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {course.status}
                      </Badge>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {course.category}
                      </span>
                    </div>
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {course.title}
                    </CardTitle>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                  {course.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Meta stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-slate-600 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{course.moduleCount} modules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{course.lessonCount} lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{course.enrolledCount} enrolled</span>
                  </div>
                </div>

                {/* Competencies Badges */}
                {course.competencies.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {course.competencies.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/trainer/courses/${course.id}/builder`}>
                      <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        <span>Course Builder</span>
                      </Button>
                    </Link>

                    {course.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickSubmit(course.id)}
                        className="text-xs font-semibold text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        <span>Submit</span>
                      </Button>
                    )}
                  </div>

                  {course.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
