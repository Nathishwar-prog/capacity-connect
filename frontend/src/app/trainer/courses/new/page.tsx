'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useCreateCourse, trainerApi } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FileUp,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Layers,
  HelpCircle,
  FileType,
  ArrowRight,
} from 'lucide-react';

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

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

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

  // Tab State: 'IMPORT' or 'MANUAL'
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'MANUAL'>('IMPORT');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DOMAIN_CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [manualError, setManualError] = useState<string | null>(null);

  // File Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.docx', '.pdf', '.doc'].includes(ext)) {
      setUploadError('Invalid format. Only Microsoft Word (.docx) and Adobe PDF (.pdf) documents are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 50MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Ingestion Upload
  const handleStartImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev >= 85 ? prev : prev + 15));
      }, 300);

      const res = await trainerApi.uploadCourseDocument(selectedFile);
      clearInterval(progressTimer);
      setUploadProgress(100);

      // Transition smoothly to review screen
      setTimeout(() => {
        router.push(`/trainer/courses/import/${res.jobId}/review`);
      }, 500);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(
        err?.response?.data?.message || 'Failed to upload document. Please check your network or try another file.'
      );
    }
  };

  // Manual Creation Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    try {
      const created = await createCourseMutation.mutateAsync({
        title,
        slug: slug || undefined,
        description,
        category,
        difficulty,
        durationMinutes: Number(durationMinutes),
      });

      router.push(`/trainer/courses/${created.id}/builder`);
    } catch (err: any) {
      setManualError(
        err?.response?.data?.message || 'Failed to create course. Please review the inputs.'
      );
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Course Management</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Create Training Course
            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 font-semibold text-[11px]">
              Course Builder
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build your curriculum using deterministic document parsing or start with a custom manual framework.
          </p>
        </div>

        {/* Workflow Segmented Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('IMPORT')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'IMPORT'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import from Document</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-100 text-emerald-700 font-black rounded uppercase">
              AI Hybrid
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'MANUAL'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Create Manually</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DOCUMENT INGESTION WORKFLOW
          ========================================================================= */}
      {activeTab === 'IMPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Dropzone Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-indigo-600" />
                  Document Ingestion Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {uploadError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Upload Notice</p>
                      <p className="mt-0.5 text-rose-700">{uploadError}</p>
                    </div>
                    <button
                      onClick={() => setUploadError(null)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Drag and drop box */}
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.pdf,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />

                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                      <UploadCloud className="w-8 h-8 animate-bounce" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-800">
                      Drag & drop course document here
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Supports Microsoft Word (<span className="font-semibold text-slate-700">.docx</span>) and Adobe PDF (<span className="font-semibold text-slate-700">.pdf</span>).
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
                      >
                        Browse Files
                      </Button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-400 font-medium">
                      <span>Max file size: 50MB</span>
                      <span>•</span>
                      <span>Source of Truth Integrity</span>
                      <span>•</span>
                      <span>TOC Deduplication</span>
                    </div>
                  </div>
                ) : (
                  /* File Prepared for Ingestion Card */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <FileType className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 break-all">{selectedFile.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for hybrid parsing
                          </p>
                        </div>
                      </div>

                      {!isUploading && (
                        <button
                          type="button"
                          onClick={handleCancelFile}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isUploading && (
                      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                            Uploading & Initializing Parser...
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={handleCancelFile}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUploading}
                        onClick={handleStartImport}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Ingesting Document...
                          </>
                        ) : (
                          <>
                            Analyze & Preview Structure
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Info Cards */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-indigo-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hybrid Parsing Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Deterministic Document Truth:</strong> Headings, paragraphs, and tables are extracted verbatim without LLM hallucination.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-800">TOC Deduplication:</strong> Table of Contents is detected and retained purely as navigation metadata to prevent duplicated modules.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-800">MoES/IMD Competency Linking:</strong> Topics are mapped directly to official atmospheric science competencies with confidence indicators.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-800">Source Provenance:</strong> Every content block tracks its original section, paragraph, and page for review.
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-slate-50/50">
              <CardContent className="p-4 space-y-2 text-[11px] text-slate-500">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  Recommended Document Structure
                </p>
                <p>
                  For optimal parsing, structure your document with clear Course Title, Course Overview, Module headings (e.g. <em>Module 1: Atmospheric Dynamics</em>), and numbered lessons with objectives.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MANUAL COURSE CREATION
          ========================================================================= */}
      {activeTab === 'MANUAL' && (
        <Card className="border-slate-200 shadow-sm max-w-3xl">
          <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Manual Course Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {manualError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Advanced Doppler Weather Radar Applications"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Slug (URL Identifier)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-slug"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Domain Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                >
                  {DOMAIN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Overview & Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the curriculum, goals, and target operational audience..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm"
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Creating Course...
                    </>
                  ) : (
                    <>
                      Create & Open Course Builder
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
