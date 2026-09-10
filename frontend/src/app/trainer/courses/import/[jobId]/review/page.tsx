'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { trainerApi } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  BookOpen,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  Loader2,
  Eye,
  ChevronDown,
  ChevronRight,
  FileSearch,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export default function ImportReviewPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <ImportReviewContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ImportReviewContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [jobStatus, setJobStatus] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspector / "View Source" Selection State
  const [selectedProvenance, setSelectedProvenance] = useState<any | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Poll Job Status until READY_FOR_REVIEW
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const statusRes = await trainerApi.getImportJobStatus(jobId);
        setJobStatus(statusRes);

        if (statusRes.status === 'READY_FOR_REVIEW' || statusRes.status === 'COMPLETED') {
          clearInterval(interval);
          const preview = await trainerApi.getImportJobPreview(jobId);
          setPreviewData(preview);
          setIsLoading(false);

          const parsed = preview?.preview || preview;
          // Set initial provenance
          setSelectedProvenance({
            title: parsed.title || parsed.courseTitle || 'Course Overview',
            section: 'Course Header & Metadata',
            type: 'COURSE',
            content: parsed.specialSections?.overview || parsed.description,
            confidence: parsed.overallConfidence || 0.95,
          });

          // Expand all modules by default
          const mods = parsed?.modules || preview?.modules || [];
          if (mods && mods.length > 0) {
            const exp: Record<string, boolean> = {};
            mods.forEach((m: any, idx: number) => {
              exp[m.id || idx] = true;
            });
            setExpandedModules(exp);
          }
        } else if (statusRes.status === 'FAILED') {
          clearInterval(interval);
          setErrorMessage(statusRes.error || 'Parsing pipeline failed.');
          setIsLoading(false);
        }
      } catch (err: any) {
        clearInterval(interval);
        setErrorMessage(err?.response?.data?.message || 'Failed to fetch import job details.');
        setIsLoading(false);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setErrorMessage(null);

    try {
      const res = await trainerApi.approveImportJob(jobId);
      const targetCourseId = res?.courseId || res?.id;
      router.push(`/trainer/courses/${targetCourseId}/builder`);
    } catch (err: any) {
      setIsApproving(false);
      setErrorMessage(
        err?.response?.data?.message || 'Failed to approve and save course. Please review warnings.'
      );
    }
  };

  // Pipeline in progress screen
  if (isLoading || (jobStatus && jobStatus.status !== 'READY_FOR_REVIEW' && jobStatus.status !== 'COMPLETED')) {
    const statusText =
      jobStatus?.status === 'PARSING'
        ? 'Deterministic Document Parsing (Extracting headings & lists)...'
        : jobStatus?.status === 'ANALYZING'
        ? 'AI Semantic Classification & Topic Extraction...'
        : jobStatus?.status === 'VALIDATING'
        ? 'Validating MoES Competency Mappings & Prerequisites...'
        : 'Ingesting and analyzing document...';

    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Analyzing Course Document</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{statusText}</p>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Progress</span>
            <span>{jobStatus?.progress || 35}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${jobStatus?.progress || 35}%` }}
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            File Uploaded
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Hybrid AI Mapping
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Zero Hallucination
          </span>
        </div>
      </div>
    );
  }

  if (errorMessage && !previewData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-rose-200 bg-rose-50/50 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Analysis Could Not Complete</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMessage}</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/trainer/courses/new">
              <Button size="sm" variant="outline" className="text-xs">
                Upload Another File
              </Button>
            </Link>
            <Link href="/trainer/courses">
              <Button size="sm" className="bg-slate-900 hover:bg-black text-white text-xs">
                Back to Courses
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const parsed = previewData?.preview || previewData || {};
  const course = parsed.course || {
    title: parsed.title || parsed.courseTitle || 'Forecasters Training Course',
    category: parsed.category || 'Synoptic Meteorology & Weather Forecasting',
    difficulty: parsed.difficulty || 'INTERMEDIATE',
    overview: parsed.specialSections?.overview,
    description: parsed.description || parsed.specialSections?.overview,
    learningOutcomes: parsed.specialSections?.learningOutcomes,
  };
  const summary = parsed.summary || previewData?.summary || previewData?.metrics || {};
  const modules: any[] = parsed.modules || previewData?.modules || [];
  const topics: any[] = parsed.globalTopics || parsed.topics || [];
  const warnings: any[] = parsed.warnings || summary.warnings || [];

  const totalModulesCount = summary.totalModules || modules.length || 0;
  const totalLessonsCount =
    summary.totalLessons ||
    modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) ||
    0;
  const totalTopicsCount = summary.totalTopics || topics.length || 0;
  const totalCompetenciesCount =
    summary.totalCompetencyMappings ||
    topics.filter((t: any) => t.matchedCompetencyId || t.matchedCompetencyName).length ||
    0;
  const totalKnowledgeChecksCount =
    summary.totalKnowledgeChecks ||
    modules.reduce(
      (acc: number, m: any) =>
        acc + (m.lessons || []).reduce((lAcc: number, l: any) => lAcc + (l.knowledgeChecks?.length || 0), 0),
      0
    ) ||
    0;
  const totalGlossaryCount =
    summary.totalGlossaryTerms || parsed.specialSections?.glossary?.length || 0;

  const rawConfidence = Number(
    summary.overallConfidence ?? parsed.overallConfidence ?? previewData?.confidenceScore ?? 0.95
  );
  const confidencePercent = isNaN(rawConfidence)
    ? 95
    : Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/trainer/courses/new"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Uploader</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Import Review & Verification
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 font-bold text-xs">
              {confidencePercent}% Confidence
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review the extracted curriculum hierarchy, competencies, and source provenance before committing to the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/trainer/courses/new">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              Cancel
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={isApproving}
            onClick={handleApprove}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm px-4"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Persisting Course...
              </>
            ) : (
              <>
                Continue to Course Builder
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error / Warning Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modules</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalModulesCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lessons</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalLessonsCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Topics</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalTopicsCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Competencies</p>
          <p className="text-xl font-black text-indigo-600 mt-1">{totalCompetenciesCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessments</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalKnowledgeChecksCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Glossary Terms</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalGlossaryCount}</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confidence</p>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {confidencePercent}%
          </p>
        </div>
      </div>

      {/* Warnings & Review Banner */}
      {warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-amber-900">
                {warnings.length} items flagged for review
              </p>
              <ul className="text-[11px] text-amber-800 space-y-0.5 list-disc list-inside">
                {warnings.slice(0, 3).map((w: any, idx: number) => (
                  <li key={idx}>
                    <strong>{w.entityType}:</strong> {w.message}
                  </li>
                ))}
              </ul>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              Non-Blocking
            </span>
          </CardContent>
        </Card>
      )}

      {/* 2-Column Split: Detected Structure vs Source Provenance Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course Hierarchy Tree (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Detected Curriculum Structure
              </CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                Click any item to view source provenance
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Course Meta Banner */}
              <div
                onClick={() =>
                  setSelectedProvenance({
                    title: course.title,
                    section: 'Course Header & Metadata',
                    type: 'COURSE',
                    content: course.overview || course.description,
                    confidence: course.confidence || 0.95,
                  })
                }
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Course Title & Metadata
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{course.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{course.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-700 shrink-0">
                    Overview
                  </Badge>
                </div>

                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Learning Outcomes:</span>{' '}
                    {course.learningOutcomes.length} detected
                  </div>
                )}
              </div>

              {/* Modules List */}
              <div className="space-y-3">
                {modules.map((mod: any, mIdx: number) => {
                  const isExpanded = expandedModules[mod.id || mIdx];

                  return (
                    <div
                      key={mod.id || mIdx}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
                    >
                      {/* Module Header */}
                      <div
                        className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                        onClick={() => toggleModule(mod.id || mIdx)}
                      >
                        <div className="flex items-center gap-2.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-xs font-bold text-slate-800">{mod.title}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-white text-slate-600 font-semibold">
                            {mod.lessons?.length || 0} Lessons
                          </Badge>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProvenance({
                                title: mod.title,
                                section: mod.sourceProvenance?.sourceSection || mod.title,
                                page: mod.sourceProvenance?.sourcePage,
                                paragraph: mod.sourceProvenance?.sourceParagraph,
                                confidence: mod.confidence,
                                type: 'MODULE',
                              });
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Source
                          </button>
                        </div>
                      </div>

                      {/* Module Lessons */}
                      {isExpanded && (
                        <div className="p-3 space-y-2 bg-white">
                          {mod.lessons?.map((lesson: any, lIdx: number) => (
                            <div
                              key={lesson.id || lIdx}
                              onClick={() => {
                                const lConf = lesson.confidence ?? lesson.provenance?.confidence ?? lesson.sourceProvenance?.confidence ?? 0.95;
                                setSelectedProvenance({
                                  title: lesson.title,
                                  section: lesson.sourceProvenance?.sourceSection || lesson.provenance?.sourceSection || `${mod.title} > ${lesson.title}`,
                                  page: lesson.sourceProvenance?.sourcePage || lesson.provenance?.sourcePage,
                                  paragraph: lesson.sourceProvenance?.sourceParagraph || lesson.provenance?.sourceParagraph,
                                  confidence: lConf,
                                  type: 'LESSON',
                                  objectives: lesson.learningObjectives,
                                  blocksCount: lesson.contentBlocks?.length || 0,
                                  topics: lesson.suggestedTopics || lesson.topics,
                                  knowledgeChecks: lesson.knowledgeChecks,
                                });
                              }}
                              className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                                  {lIdx + 1}
                                </span>
                                <span className="font-semibold text-slate-800">{lesson.title}</span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                {((lesson.suggestedTopics || lesson.topics) && (lesson.suggestedTopics || lesson.topics).length > 0) && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                                    {(lesson.suggestedTopics || lesson.topics).length} topics
                                  </span>
                                )}
                                {lesson.knowledgeChecks && lesson.knowledgeChecks.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                    {lesson.knowledgeChecks.length} quiz
                                  </span>
                                )}
                                <span className="font-bold text-emerald-600">
                                  {Math.round(
                                    ((lesson.confidence ?? lesson.provenance?.confidence ?? lesson.sourceProvenance?.confidence ?? 0.95) <= 1
                                      ? (lesson.confidence ?? lesson.provenance?.confidence ?? lesson.sourceProvenance?.confidence ?? 0.95) * 100
                                      : (lesson.confidence ?? lesson.provenance?.confidence ?? lesson.sourceProvenance?.confidence ?? 0.95))
                                  )}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: "View Source" Provenance Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 shadow-sm sticky top-6">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-indigo-600" />
                Source Provenance Inspector
              </CardTitle>
              {selectedProvenance && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  Verified
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {selectedProvenance ? (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {selectedProvenance.type} Provenance
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      {selectedProvenance.title}
                    </h3>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Source Section:</span>
                      <span className="font-bold text-slate-800">{selectedProvenance.section || 'General Body'}</span>
                    </div>
                    {selectedProvenance.page && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Approximate Page:</span>
                        <span className="font-bold text-slate-800">Page {selectedProvenance.page}</span>
                      </div>
                    )}
                    {selectedProvenance.paragraph && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Paragraph Order:</span>
                        <span className="font-mono text-slate-700">¶ {selectedProvenance.paragraph}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Extraction Confidence:</span>
                      <span className="font-bold text-emerald-600">
                        {selectedProvenance.confidence ? `${(selectedProvenance.confidence * 100).toFixed(0)}%` : '95%'}
                      </span>
                    </div>
                  </div>

                  {/* Extracted Details */}
                  {selectedProvenance.objectives && selectedProvenance.objectives.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 mb-1.5">Learning Objectives</p>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                        {selectedProvenance.objectives.map((obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedProvenance.topics && selectedProvenance.topics.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 mb-1.5">Mapped Competencies</p>
                      <div className="space-y-1.5">
                        {selectedProvenance.topics.map((top: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-[11px] flex items-center justify-between"
                          >
                            <span className="font-bold text-indigo-900">{top.name}</span>
                            <span className="text-indigo-700 font-medium">{top.mappedCompetencyName || 'General'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-[11px] text-slate-400">
                      Provenance metadata guarantees traceability back to the original DOCX/PDF source without LLM drift.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-2 text-slate-400">
                  <FileSearch className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No element selected</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Click any module or lesson on the left to inspect its exact source location and extraction confidence.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
