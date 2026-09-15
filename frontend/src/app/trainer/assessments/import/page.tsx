'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { trainerApi } from '@/features/trainer/api/trainerApi';
import { TrainerCourseListItem, TrainerCourseDetail } from '@/features/trainer/types/trainer.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Info,
  ArrowLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  FileCode2,
  BookOpen,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  FolderTree,
  Compass,
  GraduationCap,
} from 'lucide-react';

type ImportState =
  | 'IDLE'
  | 'PARSING'
  | 'VALIDATING'
  | 'READY'
  | 'IMPORTING'
  | 'SUCCESS'
  | 'FAILED';

type PlacementType = 'COURSE' | 'MODULE' | 'LESSON' | 'STANDALONE';

export default function AssessmentImportPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <AssessmentImportContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AssessmentImportContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importState, setImportState] = useState<ImportState>('IDLE');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [rawPayload, setRawPayload] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [createdAssessmentId, setCreatedAssessmentId] = useState<string | null>(null);

  // Courses & Hierarchy Mapping State
  const [courses, setCourses] = useState<TrainerCourseListItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [placementType, setPlacementType] = useState<PlacementType>('COURSE');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<TrainerCourseDetail | null>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] = useState<boolean>(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [revalidating, setRevalidating] = useState<boolean>(false);

  // Pagination for large question previews
  const [currentPage, setCurrentPage] = useState<number>(1);
  const questionsPerPage = 10;

  // Load Trainer's Authorized Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const data = await trainerApi.getCourses({ pageSize: 100 });
        setCourses(data?.courses || []);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch full details (modules, lessons) for a selected course
  const loadCourseDetail = async (courseId: string): Promise<TrainerCourseDetail | null> => {
    try {
      setLoadingCourseDetail(true);
      const detail = await trainerApi.getCourseById(courseId);
      setSelectedCourseDetail(detail);
      return detail;
    } catch (err) {
      console.error('Failed to fetch course details', err);
      setSelectedCourseDetail(null);
      return null;
    } finally {
      setLoadingCourseDetail(false);
    }
  };

  // Re-run validation against backend when hierarchy mappings change
  const revalidateWithMapping = async (
    payload: any,
    pType: PlacementType,
    cId: string | null,
    mId: string | null,
    lId: string | null,
  ) => {
    if (!payload) return;
    try {
      setRevalidating(true);
      const override = {
        placementType: pType,
        courseId: pType === 'STANDALONE' ? null : cId,
        moduleId: pType === 'MODULE' || pType === 'LESSON' ? mId : null,
        lessonId: pType === 'LESSON' ? lId : null,
      };
      const res = await trainerApi.validateAssessmentImport(payload, override);
      setValidationResult(res);
    } catch (err: any) {
      console.error('Re-validation failed', err);
    } finally {
      setRevalidating(false);
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const templateData = await trainerApi.getAssessmentImportTemplate();
      const blob = new Blob([JSON.stringify(templateData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessment-template.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download template. Please try again.');
    }
  };

  // Process and validate JSON file
  const processJsonFile = async (file: File) => {
    setClientError(null);
    setCreatedAssessmentId(null);

    // 1. File Type & Extension Validation
    if (!file.name.toLowerCase().endsWith('.json')) {
      setClientError('Only .json files are supported. Please upload a valid JSON assessment file.');
      setImportState('IDLE');
      return;
    }

    // 2. File Size Validation (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setClientError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`);
      setImportState('IDLE');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setImportState('PARSING');

    try {
      const fileText = await file.text();
      let parsedJson: any;

      try {
        parsedJson = JSON.parse(fileText);
      } catch (jsonErr: any) {
        setClientError(`Malformed JSON syntax: ${jsonErr.message}. Ensure the file contains valid JSON.`);
        setImportState('IDLE');
        return;
      }

      setRawPayload(parsedJson);
      setImportState('VALIDATING');

      // Check course/module/lesson hierarchy in JSON and attempt auto-match with trainer's courses
      const rawCourse = parsedJson?.assessment?.course;
      const rawModule = parsedJson?.assessment?.module;
      const rawLesson = parsedJson?.assessment?.lesson;

      // 2. Ensure trainer's authorized courses are loaded before matching
      let availableCourses = courses;
      if (availableCourses.length === 0) {
        try {
          setLoadingCourses(true);
          const data = await trainerApi.getCourses({ pageSize: 100 });
          availableCourses = data?.courses || [];
          setCourses(availableCourses);
        } catch (fetchErr) {
          console.error('Failed to fetch courses during file processing', fetchErr);
        } finally {
          setLoadingCourses(false);
        }
      }

      // Hierarchy normalization helpers
      const cleanStr = (s?: string | null) => (s || '').trim().toLowerCase();
      const stripPrefix = (s?: string | null) =>
        (s || '')
          .replace(/^(course|module|lesson|unit|chapter|part)\s*[-:]*\s*\d*\s*[-:.]*\s*/i, '')
          .trim()
          .toLowerCase();
      const normalizeStr = (s?: string | null) =>
        (s || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      let matchedCourseId: string | null = null;
      let matchedModuleId: string | null = null;
      let matchedLessonId: string | null = null;

      // Robust Course Matching
      let foundCourse: TrainerCourseListItem | undefined;
      if (rawCourse && availableCourses.length > 0) {
        // Priority 1: Exact UUID match
        if (rawCourse.courseId) {
          foundCourse = availableCourses.find((c) => c.id === rawCourse.courseId);
        }
        // Priority 2: Title-based multi-tier matching
        if (!foundCourse && rawCourse.courseTitle) {
          const rawTitle = rawCourse.courseTitle;
          const cClean = cleanStr(rawTitle);
          const cStripped = stripPrefix(rawTitle);
          const cNorm = normalizeStr(rawTitle);

          // Tier 1: Exact clean match
          let candidates = availableCourses.filter((c) => cleanStr(c.title) === cClean);

          // Tier 2: Prefix-stripped match
          if (candidates.length === 0 && cStripped) {
            candidates = availableCourses.filter((c) => stripPrefix(c.title) === cStripped);
          }

          // Tier 3: Normalized tokens match
          if (candidates.length === 0 && cNorm) {
            candidates = availableCourses.filter((c) => normalizeStr(c.title) === cNorm);
          }

          // Tier 4: Substring containment match
          if (candidates.length === 0 && cNorm.length > 3) {
            candidates = availableCourses.filter((c) => {
              const candNorm = normalizeStr(c.title);
              return candNorm.length > 3 && (candNorm.includes(cNorm) || cNorm.includes(candNorm));
            });
          }

          if (candidates.length > 0) {
            foundCourse = candidates[0];
          }
        }
      }

      // Robust Module and Lesson Matching within the resolved course
      if (foundCourse) {
        matchedCourseId = foundCourse.id;
        const detail = await loadCourseDetail(foundCourse.id);
        if (detail && detail.modules && detail.modules.length > 0) {
          if (rawModule) {
            let matchedMod: any = undefined;
            // Priority 1: Exact Module UUID
            if (rawModule.moduleId) {
              matchedMod = detail.modules.find((m) => m.id === rawModule.moduleId);
            }
            // Priority 2: Multi-tier title matching
            if (!matchedMod && rawModule.moduleTitle) {
              const mClean = cleanStr(rawModule.moduleTitle);
              const mStripped = stripPrefix(rawModule.moduleTitle);
              const mNorm = normalizeStr(rawModule.moduleTitle);

              matchedMod =
                detail.modules.find((m) => cleanStr(m.title) === mClean) ||
                (mStripped ? detail.modules.find((m) => stripPrefix(m.title) === mStripped) : undefined) ||
                (mNorm ? detail.modules.find((m) => normalizeStr(m.title) === mNorm) : undefined) ||
                (mNorm.length > 3
                  ? detail.modules.find((m) => {
                      const candNorm = normalizeStr(m.title);
                      return candNorm.length > 3 && (candNorm.includes(mNorm) || mNorm.includes(candNorm));
                    })
                  : undefined);
            }

            if (matchedMod) {
              matchedModuleId = matchedMod.id;

              if (rawLesson && matchedMod.lessons && matchedMod.lessons.length > 0) {
                let matchedLes: any = undefined;
                // Priority 1: Exact Lesson UUID
                if (rawLesson.lessonId) {
                  matchedLes = matchedMod.lessons.find((l: any) => l.id === rawLesson.lessonId);
                }
                // Priority 2: Multi-tier title matching
                if (!matchedLes && rawLesson.lessonTitle) {
                  const lClean = cleanStr(rawLesson.lessonTitle);
                  const lStripped = stripPrefix(rawLesson.lessonTitle);
                  const lNorm = normalizeStr(rawLesson.lessonTitle);

                  matchedLes =
                    matchedMod.lessons.find((l: any) => cleanStr(l.title) === lClean) ||
                    (lStripped ? matchedMod.lessons.find((l: any) => stripPrefix(l.title) === lStripped) : undefined) ||
                    (lNorm ? matchedMod.lessons.find((l: any) => normalizeStr(l.title) === lNorm) : undefined) ||
                    (lNorm.length > 3
                      ? matchedMod.lessons.find((l: any) => {
                          const candNorm = normalizeStr(l.title);
                          return candNorm.length > 3 && (candNorm.includes(lNorm) || lNorm.includes(candNorm));
                        })
                      : undefined);
                }

                if (matchedLes) {
                  matchedLessonId = matchedLes.id;
                }
              }
            }
          }
        }
      }

      // Determine accurate placement type
      let initialPlacement: PlacementType = 'STANDALONE';
      if (matchedLessonId) {
        initialPlacement = 'LESSON';
      } else if (matchedModuleId) {
        initialPlacement = 'MODULE';
      } else if (matchedCourseId) {
        initialPlacement = 'COURSE';
      } else if (rawLesson) {
        initialPlacement = 'LESSON';
      } else if (rawModule) {
        initialPlacement = 'MODULE';
      } else if (rawCourse) {
        initialPlacement = 'COURSE';
      }

      setPlacementType(initialPlacement);
      setSelectedCourseId(matchedCourseId);
      setSelectedModuleId(matchedModuleId);
      setSelectedLessonId(matchedLessonId);

      // 3. Backend Schema & Business Validation (Stage 1)
      const mappingOverride = {
        placementType: initialPlacement,
        courseId: initialPlacement === 'STANDALONE' ? null : matchedCourseId,
        moduleId: initialPlacement === 'MODULE' || initialPlacement === 'LESSON' ? matchedModuleId : null,
        lessonId: initialPlacement === 'LESSON' ? matchedLessonId : null,
      };

      const res = await trainerApi.validateAssessmentImport(parsedJson, mappingOverride);
      setValidationResult(res);
      setCurrentPage(1);
      setImportState('READY');
    } catch (err: any) {
      setClientError(
        err?.response?.data?.message || err.message || 'Validation request failed. Please check network connectivity.',
      );
      setImportState('IDLE');
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processJsonFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processJsonFile(e.target.files[0]);
    }
  };

  // Placement Type Change Handler
  const handlePlacementChange = (newPlacement: PlacementType) => {
    setPlacementType(newPlacement);
    let newCourseId = selectedCourseId;
    let newModuleId = selectedModuleId;
    let newLessonId = selectedLessonId;

    if (newPlacement === 'STANDALONE') {
      newCourseId = null;
      newModuleId = null;
      newLessonId = null;
      setSelectedCourseId(null);
      setSelectedModuleId(null);
      setSelectedLessonId(null);
      setSelectedCourseDetail(null);
    } else if (newPlacement === 'COURSE') {
      newModuleId = null;
      newLessonId = null;
      setSelectedModuleId(null);
      setSelectedLessonId(null);
    } else if (newPlacement === 'MODULE') {
      newLessonId = null;
      setSelectedLessonId(null);
    }

    revalidateWithMapping(rawPayload, newPlacement, newCourseId, newModuleId, newLessonId);
  };

  // Course Dropdown Change Handler
  const handleCourseSelect = async (courseId: string) => {
    if (!courseId) {
      setSelectedCourseId(null);
      setSelectedModuleId(null);
      setSelectedLessonId(null);
      setSelectedCourseDetail(null);
      revalidateWithMapping(rawPayload, placementType, null, null, null);
      return;
    }

    setSelectedCourseId(courseId);
    setSelectedModuleId(null);
    setSelectedLessonId(null);
    await loadCourseDetail(courseId);
    revalidateWithMapping(rawPayload, placementType, courseId, null, null);
  };

  // Module Dropdown Change Handler
  const handleModuleSelect = (moduleId: string) => {
    const mId = moduleId || null;
    setSelectedModuleId(mId);
    setSelectedLessonId(null);
    revalidateWithMapping(rawPayload, placementType, selectedCourseId, mId, null);
  };

  // Lesson Dropdown Change Handler
  const handleLessonSelect = (lessonId: string) => {
    const lId = lessonId || null;
    setSelectedLessonId(lId);
    revalidateWithMapping(rawPayload, placementType, selectedCourseId, selectedModuleId, lId);
  };

  // Confirm Import (Stage 2: Atomic Transaction)
  const handleConfirmImport = async () => {
    if (!validationResult || !validationResult.valid || validationResult.errors.length > 0) {
      return;
    }

    if (placementType !== 'STANDALONE' && !selectedCourseId) {
      alert('Please select a target course before proceeding with the import.');
      return;
    }

    setImportState('IMPORTING');
    try {
      const res = await trainerApi.confirmAssessmentImport({
        payload: rawPayload,
        fileName,
        fileSize,
        mappingOverride: {
          placementType,
          courseId: placementType === 'STANDALONE' ? null : selectedCourseId,
          moduleId: placementType === 'MODULE' || placementType === 'LESSON' ? selectedModuleId : null,
          lessonId: placementType === 'LESSON' ? selectedLessonId : null,
        },
      });

      setCreatedAssessmentId(res.assessmentId);
      setImportState('SUCCESS');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to complete import. Any changes have been rolled back.');
      setImportState('READY');
    }
  };

  // Reset import
  const handleReset = () => {
    setImportState('IDLE');
    setFileName('');
    setFileSize(0);
    setRawPayload(null);
    setValidationResult(null);
    setClientError(null);
    setSelectedCourseId(null);
    setSelectedModuleId(null);
    setSelectedLessonId(null);
    setSelectedCourseDetail(null);
    setPlacementType('COURSE');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Active names for hierarchy display
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedCourseTitle = selectedCourse?.title || null;
  const selectedModule = selectedCourseDetail?.modules?.find((m) => m.id === selectedModuleId);
  const selectedModuleTitle = selectedModule?.title || null;
  const currentModuleLessons = selectedModule?.lessons || [];
  const selectedLesson = currentModuleLessons.find((l) => l.id === selectedLessonId);
  const selectedLessonTitle = selectedLesson?.title || null;

  // Pagination calculations
  const totalQuestions = validationResult?.assessmentData?.questions?.length || 0;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const displayedQuestions =
    validationResult?.assessmentData?.questions?.slice(
      (currentPage - 1) * questionsPerPage,
      currentPage * questionsPerPage,
    ) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => router.push('/trainer/assessments')}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Assessments
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Import Assessment from JSON
            </h1>
            <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 text-[10px] font-bold">
              v1.0 Schema
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ministry of Earth Sciences (MoES) / IMD Assessment Ingestion Platform
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Download JSON Template
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDocModal(true)}
            className="text-xs font-bold text-slate-600 hover:text-indigo-600"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            Schema Guide
          </Button>
        </div>
      </div>

      {/* SUCCESS SCREEN */}
      {importState === 'SUCCESS' && (
        <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white shadow-sm overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
                Import Successful
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {validationResult?.assessmentData?.title}
              </h2>
              <p className="text-xs text-slate-600">
                Assessment imported successfully into database in <strong>DRAFT</strong> status.
                It is now ready for editing, review, and publication in the Assessment Builder.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto py-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Questions</span>
                <span className="text-xl font-black text-slate-900">{validationResult?.summary?.totalQuestions}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Points</span>
                <span className="text-xl font-black text-indigo-600">{validationResult?.summary?.totalPoints}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Passing Score</span>
                <span className="text-xl font-black text-emerald-600">{validationResult?.summary?.passingPercentage}%</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duration</span>
                <span className="text-xl font-black text-slate-700">
                  {validationResult?.summary?.durationMinutes ? `${validationResult.summary.durationMinutes}m` : 'Untimed'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={() => router.push(`/trainer/assessments/${createdAssessmentId}/builder`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 shadow-sm"
              >
                <FileCode2 className="w-4 h-4 mr-1.5" />
                Open in Assessment Builder
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/trainer/assessments')}
                className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                View Assessments List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UPLOAD & VALIDATION FLOW */}
      {importState !== 'SUCCESS' && (
        <div className="space-y-6">
          {/* Client Error Banner */}
          {clientError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 animate-in fade-in">
              <XCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Upload Rejected</p>
                <p className="mt-0.5 text-red-600">{clientError}</p>
              </div>
            </div>
          )}

          {/* Upload Drop Zone (Show when IDLE or PARSING) */}
          {(importState === 'IDLE' || importState === 'PARSING') && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  {importState === 'PARSING' ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {importState === 'PARSING' ? 'Parsing JSON file...' : 'Upload JSON Assessment File'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag and drop your <code className="text-indigo-600 font-bold font-mono">.json</code> file here, or click to browse files
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Supports version 1.0 schema (Single Choice, Multiple Choice, True/False) • Max file size 5MB
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100/70 transition-colors">
                    Browse File
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VALIDATING SPINNER */}
          {importState === 'VALIDATING' && (
            <Card className="border-indigo-200 bg-indigo-50/30">
              <CardContent className="p-12 text-center space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">Validating Assessment Architecture</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Running schema validation, verifying option IDs, checking explanation quality, and inspecting learning hierarchy...
                </p>
              </CardContent>
            </Card>
          )}

          {/* VALIDATION RESULTS, PLACEMENT SELECTOR & PREVIEW CANVAS */}
          {(importState === 'READY' || importState === 'IMPORTING') && validationResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Active File Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{fileName}</span>
                    <span className="text-[10px] text-slate-400">
                      {(fileSize / 1024).toFixed(1)} KB • Schema v1.0
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  disabled={importState === 'IMPORTING'}
                  className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Upload Different File
                </Button>
              </div>

              {/* HIERARCHY & ASSESSMENT PLACEMENT SELECTOR */}
              <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-white shadow-xs">
                <CardHeader className="pb-3 border-b border-indigo-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Assessment Placement & Hierarchy Mapping
                        </CardTitle>
                        {revalidating && (
                          <span className="inline-flex items-center text-[10px] text-indigo-600 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Updating...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Choose whether this assessment attaches to a Course, Module, Lesson, or exists as Standalone.
                      </p>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold border ${
                          selectedCourseId
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : placementType === 'STANDALONE'
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <span className="mr-1 text-slate-400">Course:</span>
                        {selectedCourseTitle || (placementType === 'STANDALONE' ? 'Standalone' : 'Not selected')}
                      </span>

                      {(placementType === 'MODULE' || placementType === 'LESSON') && (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold border ${
                            selectedModuleId
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <span className="mr-1 text-slate-400">Module:</span>
                          {selectedModuleTitle || 'Not selected'}
                        </span>
                      )}

                      {placementType === 'LESSON' && (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold border ${
                            selectedLessonId
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <span className="mr-1 text-slate-400">Lesson:</span>
                          {selectedLessonTitle || 'Not selected'}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Placement Type Radio Group */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Select Assessment Placement
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* Option 1: Course Assessment */}
                      <label
                        onClick={() => handlePlacementChange('COURSE')}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          placementType === 'COURSE'
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-indigo-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                            Course Assessment
                          </span>
                          <input
                            type="radio"
                            name="placementType"
                            checked={placementType === 'COURSE'}
                            onChange={() => handlePlacementChange('COURSE')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Evaluates learners across the complete course curriculum.
                        </p>
                      </label>

                      {/* Option 2: Module Assessment */}
                      <label
                        onClick={() => handlePlacementChange('MODULE')}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          placementType === 'MODULE'
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-indigo-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Module Assessment
                          </span>
                          <input
                            type="radio"
                            name="placementType"
                            checked={placementType === 'MODULE'}
                            onChange={() => handlePlacementChange('MODULE')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Tests competency on a specific learning module.
                        </p>
                      </label>

                      {/* Option 3: Lesson Assessment */}
                      <label
                        onClick={() => handlePlacementChange('LESSON')}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          placementType === 'LESSON'
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-indigo-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                            Lesson Assessment
                          </span>
                          <input
                            type="radio"
                            name="placementType"
                            checked={placementType === 'LESSON'}
                            onChange={() => handlePlacementChange('LESSON')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Micro-quiz attached directly to an individual lesson.
                        </p>
                      </label>

                      {/* Option 4: Standalone Assessment */}
                      <label
                        onClick={() => handlePlacementChange('STANDALONE')}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                          placementType === 'STANDALONE'
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-indigo-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            Standalone Assessment
                          </span>
                          <input
                            type="radio"
                            name="placementType"
                            checked={placementType === 'STANDALONE'}
                            onChange={() => handlePlacementChange('STANDALONE')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Independent assessment not tied to any course.
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Interactive Course / Module / Lesson Dropdowns (when not Standalone) */}
                  {placementType !== 'STANDALONE' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      {/* Course Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Authorized Course <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedCourseId || ''}
                          disabled={loadingCourses}
                          onChange={(e) => handleCourseSelect(e.target.value)}
                          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                        >
                          <option value="">
                            {loadingCourses
                              ? 'Loading your courses...'
                              : courses.length === 0
                              ? '-- No courses found for your account --'
                              : '-- Select Target Course --'}
                          </option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        {!selectedCourseId && (
                          <p className="text-[11px] text-amber-600 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Please select an authorized course to attach.
                          </p>
                        )}
                      </div>

                      {/* Module Dropdown (for Module or Lesson Assessment) */}
                      {(placementType === 'MODULE' || placementType === 'LESSON') && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Target Module <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedModuleId || ''}
                            disabled={!selectedCourseId || loadingCourseDetail}
                            onChange={(e) => handleModuleSelect(e.target.value)}
                            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">
                              {loadingCourseDetail
                                ? 'Loading modules...'
                                : !selectedCourseId
                                ? '-- Select a course first --'
                                : selectedCourseDetail?.modules?.length
                                ? '-- Select Target Module --'
                                : '-- No modules found in course --'}
                            </option>
                            {selectedCourseDetail?.modules?.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title}
                              </option>
                            ))}
                          </select>
                          {selectedCourseId && !selectedModuleId && (
                            <p className="text-[11px] text-amber-600 mt-1 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Select a module to link.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Lesson Dropdown (for Lesson Assessment) */}
                      {placementType === 'LESSON' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Target Lesson <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedLessonId || ''}
                            disabled={!selectedModuleId}
                            onChange={(e) => handleLessonSelect(e.target.value)}
                            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">
                              {!selectedModuleId
                                ? '-- Select a module first --'
                                : currentModuleLessons.length
                                ? '-- Select Target Lesson --'
                                : '-- No lessons found in module --'}
                            </option>
                            {currentModuleLessons.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.title}
                              </option>
                            ))}
                          </select>
                          {selectedModuleId && !selectedLessonId && (
                            <p className="text-[11px] text-amber-600 mt-1 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Select a lesson to link.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Banner */}
              <Card
                className={`overflow-hidden border ${
                  validationResult.errors.length > 0
                    ? 'border-red-200 bg-red-50/20'
                    : validationResult.warnings.length > 0
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-emerald-200 bg-emerald-50/20'
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {validationResult.errors.length > 0 ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : validationResult.warnings.length > 0 ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                      <CardTitle className="text-sm font-bold text-slate-900">
                        {validationResult.errors.length > 0
                          ? `Validation Failed: ${validationResult.errors.length} Error(s) Detected`
                          : validationResult.warnings.length > 0
                          ? `Assessment Valid with ${validationResult.warnings.length} Advisory Warning(s)`
                          : 'Assessment Structure Valid & Ready for Import'}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 mr-1" />
                        {validationResult.summary.validQuestions} Valid Questions
                      </span>
                      {validationResult.warnings.length > 0 && (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {validationResult.warnings.length} Warnings
                        </span>
                      )}
                      {validationResult.errors.length > 0 && (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          {validationResult.errors.length} Errors
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Questions</span>
                      <span className="text-base font-black text-slate-900">
                        {validationResult.summary.totalQuestions}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Single Choice</span>
                      <span className="text-base font-black text-slate-900">
                        {validationResult.summary.questionTypes['SINGLE_CHOICE'] || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Multiple Choice</span>
                      <span className="text-base font-black text-slate-900">
                        {validationResult.summary.questionTypes['MULTIPLE_CHOICE'] || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">True / False</span>
                      <span className="text-base font-black text-slate-900">
                        {validationResult.summary.questionTypes['TRUE_FALSE'] || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                      <span className="text-base font-black text-indigo-600">
                        {validationResult.summary.totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* ERRORS REPORT SECTION */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-red-200/60">
                      <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        Required Fixes ({validationResult.errors.length})
                      </span>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {validationResult.errors.map((err: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white border border-red-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-red-900">
                                  {err.questionIndex !== undefined ? `Question ${err.questionIndex + 1}` : 'Root Schema'}
                                </span>
                                <code className="text-[10px] font-mono bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                                  {err.code}
                                </code>
                              </div>
                              <p className="text-slate-700 text-xs">{err.message}</p>
                            </div>

                            <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded max-w-xs break-all self-start">
                              {err.path}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WARNINGS REPORT SECTION */}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Advisories & Hierarchy Notices ({validationResult.warnings.length})
                      </span>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {validationResult.warnings.map((warn: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2 shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-900">
                                  {warn.questionIndex !== undefined ? `Question ${warn.questionIndex + 1}` : 'Hierarchy Mapping'}
                                </span>
                                <code className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100">
                                  {warn.code}
                                </code>
                              </div>
                              <p className="text-slate-700 text-xs">{warn.message}</p>
                            </div>

                            <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded max-w-xs break-all self-start">
                              {warn.path}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ASSESSMENT PREVIEW SECTION */}
              <div className="space-y-4">
                {/* Metadata Header Card */}
                <Card className="bg-white border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Assessment Preview
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {validationResult.assessmentData.subject}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-black text-slate-900">
                      {validationResult.assessmentData.title}
                    </CardTitle>
                    {validationResult.assessmentData.description && (
                      <p className="text-xs text-slate-600 mt-1">
                        {validationResult.assessmentData.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-slate-100 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">DURATION</span>
                        <span>
                          {validationResult.assessmentData.durationMinutes
                            ? `${validationResult.assessmentData.durationMinutes} mins`
                            : 'Untimed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">PASSING SCORE</span>
                        <span className="font-bold text-emerald-600">
                          {validationResult.assessmentData.passingPercentage}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">TARGET COURSE</span>
                        <span className={selectedCourseId ? 'font-semibold text-slate-900' : 'italic text-amber-600'}>
                          {selectedCourseTitle || (placementType === 'STANDALONE' ? 'None (Standalone)' : 'Not selected')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">PLACEMENT</span>
                        <span className="font-semibold text-indigo-700">
                          {placementType === 'COURSE'
                            ? 'Course Assessment'
                            : placementType === 'MODULE'
                            ? `Module: ${selectedModuleTitle || 'Not selected'}`
                            : placementType === 'LESSON'
                            ? `Lesson: ${selectedLessonTitle || 'Not selected'}`
                            : 'Standalone Assessment'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Cards List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-slate-800">
                      Questions ({totalQuestions})
                    </h4>
                    {totalPages > 1 && (
                      <span className="text-slate-500 text-[11px]">
                        Showing questions {(currentPage - 1) * questionsPerPage + 1} to{' '}
                        {Math.min(currentPage * questionsPerPage, totalQuestions)} of {totalQuestions}
                      </span>
                    )}
                  </div>

                  {displayedQuestions.map((q: any, qIdx: number) => {
                    const globalIdx = (currentPage - 1) * questionsPerPage + qIdx;
                    return (
                      <Card
                        key={globalIdx}
                        className="bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200 transition-all"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center">
                                {globalIdx + 1}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {q.questionType.replace('_', ' ')}
                              </Badge>
                              {q.externalId && (
                                <code className="text-[10px] font-mono text-slate-400">
                                  {q.externalId}
                                </code>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded">
                                {q.points} {q.points === 1 ? 'pt' : 'pts'}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {q.difficulty}
                              </Badge>
                            </div>
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 mt-2 leading-snug">
                            {q.question}
                          </h5>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0">
                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: any, oIdx: number) => (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'border border-slate-300 text-slate-400'
                                  }`}
                                >
                                  {opt.isCorrect ? <Check className="w-3 h-3" /> : opt.id}
                                </span>
                                <span className="flex-1 leading-tight">{opt.text}</span>
                              </div>
                            ))}
                          </div>

                          {/* Explanation Box */}
                          <div className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Explanation
                            </span>
                            <p className="text-slate-700 text-xs leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="text-xs"
                      >
                        Previous Page
                      </Button>
                      <span className="text-xs font-semibold text-slate-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="text-xs"
                      >
                        Next Page
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  {validationResult.errors.length > 0 ? (
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Import blocked: Please resolve the {validationResult.errors.length} error(s) above in your JSON file.
                    </span>
                  ) : placementType !== 'STANDALONE' && !selectedCourseId ? (
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Course selection required: Please choose a target course above before importing.
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      All checks passed. Ready to import {validationResult.summary.totalQuestions} questions into database.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={importState === 'IMPORTING'}
                    onClick={handleReset}
                    className="text-xs font-bold"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      validationResult.errors.length > 0 ||
                      (placementType !== 'STANDALONE' && !selectedCourseId) ||
                      importState === 'IMPORTING'
                    }
                    onClick={handleConfirmImport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importState === 'IMPORTING' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Persisting Assessment...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Import Assessment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCHEMA GUIDE MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assessment JSON Format Guide (v1.0)</h3>
                <p className="text-xs text-slate-500">Ministry of Earth Sciences / IMD Specification</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowDocModal(false)}>
                &times;
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">1. Root Structure</h4>
                <p>
                  The JSON file must have a root object with <code className="font-mono bg-slate-100 px-1">schemaVersion: &quot;1.0&quot;</code> and an <code className="font-mono bg-slate-100 px-1">assessment</code> object.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">2. Supported Question Types</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <strong className="text-slate-800">SINGLE_CHOICE</strong>: Requires at least 2 options and a single <code className="font-mono bg-slate-100 px-1">{`{ "type": "OPTION", "value": "A" }`}</code> matching an option ID.
                  </li>
                  <li>
                    <strong className="text-slate-800">MULTIPLE_CHOICE</strong>: Requires at least 2 options and <code className="font-mono bg-slate-100 px-1">{`{ "type": "OPTIONS", "value": ["A", "C"] }`}</code> referencing valid option IDs.
                  </li>
                  <li>
                    <strong className="text-slate-800">TRUE_FALSE</strong>: Requires <code className="font-mono bg-slate-100 px-1">{`{ "type": "BOOLEAN", "value": true }`}</code> (strict boolean, not string).
                  </li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Explanations (Mandatory)</h4>
                <p>
                  Every question must include an <code className="font-mono bg-slate-100 px-1">explanation</code> string (&ge; 5 characters). Placeholder words like &quot;TODO&quot;, &quot;N/A&quot;, &quot;TBD&quot; are strictly rejected.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">4. Hierarchy Mapping & Placement</h4>
                <p>
                  Trainers can choose placement (Course, Module, Lesson, or Standalone) directly in the UI. If a course title in the JSON doesn&apos;t match, you can simply choose the course from the dropdown without blocking your import.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-3xl">
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="text-xs font-bold">
                <Download className="w-3.5 h-3.5 mr-1" />
                Download Template
              </Button>
              <Button size="sm" onClick={() => setShowDocModal(false)} className="bg-indigo-600 text-white text-xs font-bold">
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
