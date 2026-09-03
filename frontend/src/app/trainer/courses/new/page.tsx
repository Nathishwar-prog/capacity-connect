'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useCreateCourse } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Loader2, Sparkles, BookOpen } from 'lucide-react';

const DOMAIN_CATEGORIES = [
  'Synoptic Meteorology & Weather Forecasting',
  'Numerical Weather Prediction (NWP)',
  'Radar Meteorology & Nowcasting',
  'Satellite Meteorology & Remote Sensing',
  'Climate Science & Long-Range Forecasting',
  'Ocean Sciences & Coastal Hazards (INCOIS)',
  'Seismology & Earthquake Monitoring (NCS)',
  'Meteorological Instrumentation & Surface Observation',
  'Hydrometeorology & Flood Assessment',
];

export default function NewCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <NewCourseContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function NewCourseContent() {
  const router = useRouter();
  const createCourseMutation = useCreateCourse();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DOMAIN_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const created = await createCourseMutation.mutateAsync({
        title,
        slug: slug || undefined,
        description,
        category,
        difficulty,
        durationMinutes: Number(durationMinutes),
        thumbnailUrl: thumbnailUrl || null,
      });

      router.push(`/trainer/courses/${created.id}/builder`);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to create course. Please review the inputs.',
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create Training Course
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure curriculum metadata. Modules, lessons, and competency frameworks will be added in the Course Builder.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Course Metadata</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Advanced Radar Doppler Analysis & Severe Storm Detection"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Identifier (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. advanced-radar-doppler-analysis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Earth Science Discipline <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {DOMAIN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="BEGINNER">BEGINNER (Foundation / Cadre Induction)</option>
                  <option value="INTERMEDIATE">INTERMEDIATE (Scientific Officer)</option>
                  <option value="ADVANCED">ADVANCED (Meteorologist / Specialist)</option>
                  <option value="EXPERT">EXPERT (Lead Forecaster / Scientist)</option>
                </select>
              </div>
            </div>

            {/* Estimated Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimated Total Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={6000}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thumbnail / Banner URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Course Description & Learning Outcomes <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                placeholder="Detail the course curriculum, target meteorological competencies, scientific prerequisites, and instructional objectives..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/trainer/courses">
                <Button variant="outline" type="button" className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createCourseMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
              >
                {createCourseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                <span>Save & Continue to Builder</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
