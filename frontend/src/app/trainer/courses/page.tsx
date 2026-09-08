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
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseManagement } from '@/features/trainer/ui/courses/CourseManagement';
import { Course } from '@/features/trainer/ui/types/trainer';

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

  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const mappedCourses: Course[] = courses.map(course => ({
    id: course.id,
    title: course.title,
    code: course.slug?.slice(0, 8).toUpperCase() || 'CRS',
    description: course.description,
    category: course.category || 'General',
    department: 'General Dept',
    difficulty: course.difficulty?.toLowerCase(),
    status: (course.status === 'PUBLISHED' ? 'Published' : course.status === 'DRAFT' ? 'Draft' : 'Active') as any,
    durationWeeks: 4,
    traineesCount: course.enrolledCount,
    progressPercent: course.completionRate || 0,
    completionRate: course.completionRate || 0,
    lastUpdated: 'Recently',
    mappedCompetencies: course.competencies || [],
    modules: [],
    resources: [],
    assessmentStatus: 'Pending',
    trainerFeedbackCount: 0,
    targetCompetencyLevel: 2,
    objectives: []
  }));

  return (
    <CourseManagement
      courses={mappedCourses}
      onOpenCourseBuilder={(id) => id ? router.push(`/trainer/courses/${id}/builder`) : router.push('/trainer/courses/new')}
      onDuplicateCourse={() => { }}
      onTogglePublishStatus={async (id) => {
        const c = courses.find(x => x.id === id);
        if (c?.status === 'DRAFT') await handleQuickSubmit(id);
      }}
      onArchiveCourse={async (id) => await handleDelete(id)}
      onViewCourseDetails={(c) => router.push(`/trainer/courses/${c.id}`)}
      onNavigateToMaterials={() => router.push('/trainer/materials')}
    />
  );
}
