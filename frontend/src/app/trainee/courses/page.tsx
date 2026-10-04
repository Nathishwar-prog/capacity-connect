'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Compass,
  Clock,
  Award,
  CheckCircle2,
  BookOpen,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  Search,
} from 'lucide-react';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationMinutes: number;
  status: string;
  trainer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  courseCompetencies?: Array<{
    targetLevel: number;
    competency: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export default function TraineeCoursesCatalogPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, []);

  const fetchCoursesAndEnrollments = async () => {
    setLoading(true);
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/enrollments').catch(() => ({ data: { data: [] } })),
      ]);

      setCourses(coursesRes.data.data?.courses || coursesRes.data.data || []);

      const enrollments = enrollmentsRes.data.data?.enrollments || enrollmentsRes.data.data || [];
      const idSet = new Set<string>(enrollments.map((e: any) => e.courseId || e.course?.id));
      setEnrolledCourseIds(idSet);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await apiClient.post('/enrollments', { courseId });
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrollingId(null);
    }
  };

  // Distinct categories
  const categories = ['ALL', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))];

  const filteredCourses = courses.filter((c) => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const isPublished = c.status === 'PUBLISHED';
    return isPublished && matchesCat && matchesSearch;
  });

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  MoES / IMD Curriculum Catalog
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Official Earth Sciences & Meteorology Courses
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Specialized operational training aligned to the MoES Competency Development Framework.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domain topics..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <Card className="p-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading course offerings...</p>
            </Card>
          )}

          {!loading && filteredCourses.length === 0 && (
            <Card className="p-10 text-center text-slate-500 text-xs">
              No courses found matching your criteria.
            </Card>
          )}

          {/* Courses Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const isEnrolling = enrollingId === course.id;

                return (
                  <Card
                    key={course.id}
                    className="p-5 border-slate-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                          {course.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            course.difficulty === 'ADVANCED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : course.difficulty === 'INTERMEDIATE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {course.difficulty}
                        </span>
                      </div>

                      <Link href={`/trainee/courses/${course.id}`}>
                        <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {course.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Instructor & Duration */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 border-t border-slate-100">
                        {course.trainer && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Dr. {course.trainer.lastName || course.trainer.firstName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {Math.round(course.durationMinutes / 60)} Hours
                        </span>
                      </div>

                      {/* Developed Competencies */}
                      {course.courseCompetencies && course.courseCompetencies.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {course.courseCompetencies.map((cc, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700"
                            >
                              Develops: {cc.competency.name} (Lvl {cc.targetLevel})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link href={`/trainee/courses/${course.id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <span>View Syllabus</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      {isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enrolled</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrolling}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-sm"
                        >
                          {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
