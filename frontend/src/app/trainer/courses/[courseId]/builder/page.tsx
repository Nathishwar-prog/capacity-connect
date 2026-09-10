'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { useTrainerCourse, trainerApi } from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Copy,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Layers,
  BookOpen,
  HelpCircle,
  Sparkles,
  Settings,
  Award,
  Activity,
  FileText,
  ListPlus,
  Heading,
  Code,
  Table,
  Quote,
  Minus,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'bullet_list' | 'numbered_list' | 'callout' | 'example' | 'table' | 'quote' | 'code' | 'divider';
  content: any;
  position: number;
  metadata?: Record<string, any>;
  sourceProvenance?: any;
}

interface LocalLesson {
  id: string;
  title: string;
  description?: string;
  contentType?: string;
  content?: string;
  contentBlocks: ContentBlock[];
  durationMinutes: number;
  orderIndex: number;
  isPreview?: boolean;
  learningObjectives: string[];
  keyTakeaways: string[];
  knowledgeChecks?: any[];
  sourceProvenance?: any;
}

interface LocalModule {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: LocalLesson[];
}

export default function AdvancedCourseBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <AdvancedCourseBuilderContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AdvancedCourseBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: rawCourse, isLoading: isCourseLoading, refetch } = useTrainerCourse(courseId);

  // Local Hierarchy State
  const [modules, setModules] = useState<LocalModule[]>([]);
  const [courseMetadata, setCourseMetadata] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'BEGINNER',
    durationMinutes: 120,
    status: 'DRAFT',
  });

  // Selection State
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'SETTINGS' | 'COMPETENCY' | 'VALIDATION'>('SETTINGS');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Autosave State
  const [autosaveStatus, setAutosaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'DIRTY'>('IDLE');
  const dirtyRef = useRef(false);

  // Validation State
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Topics & Competencies for the course
  const [courseTopics, setCourseTopics] = useState<any[]>([]);
  const [availableCompetencies, setAvailableCompetencies] = useState<any[]>([]);

  // Initialize data from API
  useEffect(() => {
    if (rawCourse) {
      setCourseMetadata({
        title: rawCourse.title,
        description: rawCourse.description,
        category: rawCourse.category,
        difficulty: rawCourse.difficulty,
        durationMinutes: rawCourse.durationMinutes || 120,
        status: rawCourse.status,
      });

      const parsedModules: LocalModule[] = (rawCourse.modules || []).map((m: any, mIdx: number) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        orderIndex: m.orderIndex || mIdx + 1,
        lessons: (m.lessons || []).map((l: any, lIdx: number) => {
          let blocks: ContentBlock[] = [];
          if (l.content) {
            try {
              const parsed = JSON.parse(l.content);
              if (Array.isArray(parsed)) blocks = parsed;
            } catch {
              if (typeof l.content === 'string' && l.content.length > 0) {
                blocks = [{
                  id: `block-${Date.now()}-0`,
                  type: 'paragraph',
                  content: l.content,
                  position: 1,
                }];
              }
            }
          }

          return {
            id: l.id,
            title: l.title,
            description: l.description || '',
            contentType: l.contentType || 'ARTICLE',
            content: l.content,
            contentBlocks: blocks,
            durationMinutes: l.durationMinutes || 20,
            orderIndex: l.orderIndex || lIdx + 1,
            isPreview: Boolean(l.isPreview),
            learningObjectives: Array.isArray(l.learningObjectives) ? l.learningObjectives : [],
            keyTakeaways: Array.isArray(l.keyTakeaways) ? l.keyTakeaways : [],
            knowledgeChecks: l.knowledgeChecks || [],
            sourceProvenance: l.sourceProvenance,
          };
        }),
      }));

      setModules(parsedModules);

      // Select first module and lesson by default
      if (parsedModules.length > 0) {
        setSelectedModuleId(parsedModules[0].id);
        if (parsedModules[0].lessons.length > 0) {
          setSelectedLessonId(parsedModules[0].lessons[0].id);
        }
      }
    }
  }, [rawCourse]);

  // Load Topics & Competencies
  const loadTopicsAndCompetencies = useCallback(async () => {
    try {
      const res = await trainerApi.getTopicsAndCompetencies(courseId);
      setCourseTopics(res.topics || []);
      setAvailableCompetencies(res.availableCompetencies || []);
    } catch {
      // Non-blocking
    }
  }, [courseId]);

  useEffect(() => {
    loadTopicsAndCompetencies();
  }, [loadTopicsAndCompetencies]);

  // Run validation
  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      const res = await trainerApi.validateCourse(courseId);
      setValidationResult(res);
    } catch {
      // Non-blocking
    } finally {
      setIsValidating(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      runValidation();
    }
  }, [courseId, runValidation]);

  // Save Draft function
  const handleSaveDraft = async () => {
    setAutosaveStatus('SAVING');
    try {
      await trainerApi.saveDraft(courseId, {
        ...courseMetadata,
        modules: modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            durationMinutes: l.durationMinutes,
            orderIndex: l.orderIndex,
            contentBlocks: l.contentBlocks,
            learningObjectives: l.learningObjectives,
            keyTakeaways: l.keyTakeaways,
          })),
        })),
      });

      dirtyRef.current = false;
      setAutosaveStatus('SAVED');
      runValidation();
    } catch {
      setAutosaveStatus('DIRTY');
    }
  };

  // Debounced Autosave (2.5s)
  useEffect(() => {
    if (!dirtyRef.current) return;

    setAutosaveStatus('DIRTY');
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 2500);

    return () => clearTimeout(timer);
  }, [modules, courseMetadata]);

  const markDirty = () => {
    dirtyRef.current = true;
    setAutosaveStatus('DIRTY');
  };

  // Publish Action
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishMessage(null);

    try {
      await trainerApi.publishCourse(courseId);
      setShowPublishModal(false);
      setCourseMetadata((prev) => ({ ...prev, status: 'PUBLISHED' }));
      refetch();
    } catch (err: any) {
      setPublishMessage(
        err?.response?.data?.message || 'Publication failed. Please resolve all blocking errors.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper getters for active selection
  const selectedModule = modules.find((m) => m.id === selectedModuleId) || modules[0] || null;
  const selectedLesson =
    selectedModule?.lessons.find((l) => l.id === selectedLessonId) ||
    selectedModule?.lessons[0] ||
    null;

  // Module Actions
  const handleAddModule = () => {
    const newMod: LocalModule = {
      id: `temp-mod-${Date.now()}`,
      title: `Module ${modules.length + 1}: New Module`,
      description: '',
      orderIndex: modules.length + 1,
      lessons: [],
    };
    setModules([...modules, newMod]);
    setSelectedModuleId(newMod.id);
    markDirty();
  };

  const handleMoveModule = (idx: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && idx === 0) || (direction === 'DOWN' && idx === modules.length - 1)) {
      return;
    }
    const newIdx = direction === 'UP' ? idx - 1 : idx + 1;
    const updated = [...modules];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    updated.forEach((m, i) => (m.orderIndex = i + 1));
    setModules(updated);
    markDirty();
  };

  const handleDeleteModule = (modId: string) => {
    if (modules.length <= 1) return;
    const updated = modules.filter((m) => m.id !== modId);
    setModules(updated);
    if (selectedModuleId === modId) {
      setSelectedModuleId(updated[0]?.id || null);
      setSelectedLessonId(updated[0]?.lessons[0]?.id || null);
    }
    markDirty();
  };

  // Lesson Actions
  const handleAddLesson = (modId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        const newLesson: LocalLesson = {
          id: `temp-les-${Date.now()}`,
          title: `Lesson ${m.lessons.length + 1}: New Lesson`,
          description: '',
          contentType: 'ARTICLE',
          contentBlocks: [
            {
              id: `block-${Date.now()}`,
              type: 'paragraph',
              content: 'Start typing educational lesson content here...',
              position: 1,
            },
          ],
          durationMinutes: 20,
          orderIndex: m.lessons.length + 1,
          learningObjectives: ['Explain key foundational principles.'],
          keyTakeaways: [],
        };
        setSelectedLessonId(newLesson.id);
        return { ...m, lessons: [...m.lessons, newLesson] };
      })
    );
    markDirty();
  };

  const handleMoveLesson = (modId: string, lIdx: number, direction: 'UP' | 'DOWN') => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        if ((direction === 'UP' && lIdx === 0) || (direction === 'DOWN' && lIdx === m.lessons.length - 1)) {
          return m;
        }
        const newIdx = direction === 'UP' ? lIdx - 1 : lIdx + 1;
        const updated = [...m.lessons];
        const temp = updated[lIdx];
        updated[lIdx] = updated[newIdx];
        updated[newIdx] = temp;
        updated.forEach((l, i) => (l.orderIndex = i + 1));
        return { ...m, lessons: updated };
      })
    );
    markDirty();
  };

  const handleDeleteLesson = (modId: string, lesId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        const updated = m.lessons.filter((l) => l.id !== lesId);
        return { ...m, lessons: updated };
      })
    );
    if (selectedLessonId === lesId) {
      const currentMod = modules.find((m) => m.id === modId);
      const nextLesson = currentMod?.lessons.find((l) => l.id !== lesId);
      setSelectedLessonId(nextLesson?.id || null);
    }
    markDirty();
  };

  // Content Block Actions
  const handleAddBlock = (type: ContentBlock['type']) => {
    if (!selectedLesson) return;

    let defaultContent: any = '';
    if (type === 'heading') defaultContent = 'New Section Heading';
    else if (type === 'callout') defaultContent = 'Important operational principle to note.';
    else if (type === 'example') defaultContent = 'Real-world meteorological case example.';
    else if (type === 'bullet_list') defaultContent = ['Key factor one', 'Key factor two'];
    else if (type === 'table') defaultContent = 'Parameter | Threshold | Action\nReflectivity | > 45 dBZ | Issue Hail Warning';
    else defaultContent = 'Enter content paragraph text...';

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${selectedLesson.contentBlocks.length}`,
      type,
      content: defaultContent,
      position: selectedLesson.contentBlocks.length + 1,
    };

    updateSelectedLesson({
      contentBlocks: [...selectedLesson.contentBlocks, newBlock],
    });
  };

  const updateBlockContent = (blockId: string, newContent: any) => {
    if (!selectedLesson) return;
    const updated = selectedLesson.contentBlocks.map((b) =>
      b.id === blockId ? { ...b, content: newContent } : b
    );
    updateSelectedLesson({ contentBlocks: updated });
  };

  const handleMoveBlock = (bIdx: number, direction: 'UP' | 'DOWN') => {
    if (!selectedLesson) return;
    const blocks = selectedLesson.contentBlocks;
    if ((direction === 'UP' && bIdx === 0) || (direction === 'DOWN' && bIdx === blocks.length - 1)) {
      return;
    }
    const newIdx = direction === 'UP' ? bIdx - 1 : bIdx + 1;
    const updated = [...blocks];
    const temp = updated[bIdx];
    updated[bIdx] = updated[newIdx];
    updated[newIdx] = temp;
    updated.forEach((b, i) => (b.position = i + 1));
    updateSelectedLesson({ contentBlocks: updated });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!selectedLesson) return;
    const updated = selectedLesson.contentBlocks.filter((b) => b.id !== blockId);
    updateSelectedLesson({ contentBlocks: updated });
  };

  const updateSelectedLesson = (partial: Partial<LocalLesson>) => {
    if (!selectedModule || !selectedLesson) return;
    setModules(
      modules.map((m) => {
        if (m.id !== selectedModule.id) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => (l.id === selectedLesson.id ? { ...l, ...partial } : l)),
        };
      })
    );
    markDirty();
  };

  if (isCourseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Filter modules/lessons by search
  const filteredModules = modules.map((m) => ({
    ...m,
    lessons: m.lessons.filter((l) =>
      !searchQuery
        ? true
        : l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden animate-in fade-in duration-300">
      {/* =========================================================================
          TOP ACTION BAR
          ========================================================================= */}
      <div className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/trainer/courses"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              {courseMetadata.title || 'Course Builder'}
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  courseMetadata.status === 'PUBLISHED'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-slate-300 text-slate-700 bg-slate-100'
                }`}
              >
                {courseMetadata.status}
              </Badge>
            </h1>
          </div>
        </div>

        {/* Autosave and Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 pr-2">
            {autosaveStatus === 'SAVING' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                <span>Saving draft...</span>
              </>
            )}
            {autosaveStatus === 'SAVED' && (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved just now</span>
              </>
            )}
            {autosaveStatus === 'DIRTY' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          <Link href={`/trainee/courses/${courseId}`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1 font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={autosaveStatus === 'SAVING'}
            className="text-xs h-8 gap-1.5 font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowPublishModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-bold shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Course</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          MAIN 3-COLUMN WORKSPACE
          ========================================================================= */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50/60">
        {/* =======================================================================
            LEFT COLUMN: COURSE STRUCTURE SIDEBAR (3 cols)
            ======================================================================= */}
        <div className="col-span-12 md:col-span-3 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
          {/* Sidebar Header & Search */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Curriculum Structure
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddModule}
                className="h-6 px-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
              >
                + Module
              </Button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, lessons..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Modules and Lessons Hierarchy List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredModules.map((mod, mIdx) => (
              <div
                key={mod.id}
                className={`rounded-xl border transition-all ${
                  selectedModuleId === mod.id
                    ? 'border-indigo-200 bg-indigo-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Module Header */}
                <div
                  onClick={() => setSelectedModuleId(mod.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate">{mod.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveModule(mIdx, 'UP');
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-700"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveModule(mIdx, 'DOWN');
                      }}
                      className="p-0.5 text-slate-400 hover:text-slate-700"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLesson(mod.id);
                      }}
                      title="Add Lesson"
                      className="p-0.5 text-indigo-600 hover:bg-indigo-100 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(mod.id);
                      }}
                      title="Delete Module"
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Lessons in Module */}
                <div className="pl-3 pr-2 pb-2 space-y-1">
                  {mod.lessons.map((lesson, lIdx) => {
                    const isSelected = selectedLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setSelectedModuleId(mod.id);
                          setSelectedLessonId(lesson.id);
                        }}
                        className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between group transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {lIdx + 1}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {lesson.sourceProvenance && (
                            <span
                              className={`text-[9px] px-1 rounded ${
                                isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                              }`}
                              title="Imported from document"
                            >
                              DOC
                            </span>
                          )}
                          <div className="hidden group-hover:flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lIdx, 'UP');
                              }}
                              className="p-0.5 hover:opacity-80"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lIdx, 'DOWN');
                              }}
                              className="p-0.5 hover:opacity-80"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(mod.id, lesson.id);
                              }}
                              className="p-0.5 hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =======================================================================
            CENTER COLUMN: RICH CONTENT EDITOR (6 cols)
            ======================================================================= */}
        <div className="col-span-12 md:col-span-6 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
          {selectedLesson ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Lesson Title & Header */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>
                    {selectedModule?.title} • Lesson {selectedLesson.orderIndex}
                  </span>
                  {selectedLesson.sourceProvenance && (
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                      Source: {selectedLesson.sourceProvenance.sourceSection || 'Document'}
                    </Badge>
                  )}
                </div>

                <input
                  type="text"
                  value={selectedLesson.title}
                  onChange={(e) => updateSelectedLesson({ title: e.target.value })}
                  placeholder="Lesson Title"
                  className="w-full text-lg font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded p-1"
                />

                <input
                  type="text"
                  value={selectedLesson.description || ''}
                  onChange={(e) => updateSelectedLesson({ description: e.target.value })}
                  placeholder="Short lesson summary or synopsis..."
                  className="w-full text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded p-1"
                />
              </div>

              {/* Learning Objectives Section */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Learning Objectives
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateSelectedLesson({
                        learningObjectives: [
                          ...selectedLesson.learningObjectives,
                          'Demonstrate operational understanding of...',
                        ],
                      })
                    }
                    className="h-6 px-2 text-[11px] font-bold text-indigo-600"
                  >
                    + Objective
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {selectedLesson.learningObjectives.map((obj, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => {
                          const updated = [...selectedLesson.learningObjectives];
                          updated[oIdx] = e.target.value;
                          updateSelectedLesson({ learningObjectives: updated });
                        }}
                        className="flex-1 text-xs text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = selectedLesson.learningObjectives.filter((_, idx) => idx !== oIdx);
                          updateSelectedLesson({ learningObjectives: updated });
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Blocks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Educational Content Blocks ({selectedLesson.contentBlocks.length})
                  </h4>
                </div>

                {selectedLesson.contentBlocks.map((block, bIdx) => (
                  <div
                    key={block.id || bIdx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all space-y-2 group shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold uppercase text-indigo-600 text-[10px]">
                        {block.type} block
                      </span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(bIdx, 'UP')}
                          className="p-1 hover:text-slate-700"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(bIdx, 'DOWN')}
                          className="p-1 hover:text-slate-700"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Editor depending on type */}
                    {block.type === 'heading' ? (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        className="w-full font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 focus:outline-none focus:border-indigo-500"
                      />
                    ) : block.type === 'callout' ? (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <textarea
                          rows={2}
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          className="w-full text-xs text-amber-900 bg-transparent focus:outline-none resize-none font-medium"
                        />
                      </div>
                    ) : block.type === 'example' ? (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          className="w-full text-xs text-blue-900 bg-transparent focus:outline-none resize-none font-medium"
                        />
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        className="w-full text-xs text-slate-700 focus:outline-none resize-y border border-slate-200 rounded p-2 focus:ring-1 focus:ring-indigo-500 font-normal leading-relaxed"
                      />
                    )}
                  </div>
                ))}

                {/* Add Block Toolbar */}
                <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 mr-2">+ Add Block:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('paragraph')}
                    className="text-[11px] h-7 px-2.5 gap-1"
                  >
                    <FileText className="w-3 h-3" /> Paragraph
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('heading')}
                    className="text-[11px] h-7 px-2.5 gap-1"
                  >
                    <Heading className="w-3 h-3" /> Heading
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('callout')}
                    className="text-[11px] h-7 px-2.5 gap-1"
                  >
                    <AlertCircle className="w-3 h-3" /> Callout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('example')}
                    className="text-[11px] h-7 px-2.5 gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlock('table')}
                    className="text-[11px] h-7 px-2.5 gap-1"
                  >
                    <Table className="w-3 h-3" /> Table
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6 text-slate-400">
              <div>
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No Lesson Selected</p>
                <p className="text-xs mt-1">Select a lesson from the left sidebar to edit content.</p>
              </div>
            </div>
          )}
        </div>

        {/* =======================================================================
            RIGHT COLUMN: CONTEXTUAL SETTINGS & VALIDATION (3 cols)
            ======================================================================= */}
        <div className="col-span-12 md:col-span-3 bg-white flex flex-col h-full overflow-hidden">
          {/* Tab Selector */}
          <div className="h-11 border-b border-slate-200 px-3 flex items-center justify-between shrink-0 bg-slate-50/50">
            <button
              onClick={() => setActiveRightTab('SETTINGS')}
              className={`text-xs font-bold px-2 py-1.5 rounded transition-all ${
                activeRightTab === 'SETTINGS'
                  ? 'text-indigo-600 bg-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveRightTab('COMPETENCY')}
              className={`text-xs font-bold px-2 py-1.5 rounded transition-all ${
                activeRightTab === 'COMPETENCY'
                  ? 'text-indigo-600 bg-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Competencies
            </button>
            <button
              onClick={() => setActiveRightTab('VALIDATION')}
              className={`text-xs font-bold px-2 py-1.5 rounded transition-all flex items-center gap-1 ${
                activeRightTab === 'VALIDATION'
                  ? 'text-indigo-600 bg-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Health
              {validationResult && (
                <span
                  className={`px-1 rounded text-[9px] ${
                    validationResult.healthScore >= 80
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {validationResult.healthScore}%
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB: SETTINGS */}
            {activeRightTab === 'SETTINGS' && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Lesson Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={selectedLesson?.durationMinutes || 20}
                    onChange={(e) =>
                      updateSelectedLesson({ durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Content Format
                  </label>
                  <select
                    value={selectedLesson?.contentType || 'ARTICLE'}
                    onChange={(e) => updateSelectedLesson({ contentType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ARTICLE">Article / Interactive Text</option>
                    <option value="VIDEO">Video Lecture</option>
                    <option value="DOCUMENT">Document / PDF</option>
                    <option value="QUIZ">Self-Paced Quiz</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Course Metadata
                  </p>
                  <div>
                    <span className="text-slate-500">Domain Category:</span>
                    <p className="font-bold text-slate-800">{courseMetadata.category}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Difficulty:</span>
                    <p className="font-bold text-slate-800">{courseMetadata.difficulty}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COMPETENCY MAPPING */}
            {activeRightTab === 'COMPETENCY' && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Topic & Competency Links
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Topics mapped for this curriculum support the AI Skill Gap and Revision engines.
                  </p>
                </div>

                <div className="space-y-2">
                  {courseTopics.map((top) => (
                    <div
                      key={top.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{top.name}</span>
                        <Badge variant="outline" className="text-[9px] bg-white text-emerald-700 border-emerald-300">
                          {top.importance >= 1 ? 'High Impact' : 'Standard'}
                        </Badge>
                      </div>

                      {top.competencyMappings && top.competencyMappings.length > 0 ? (
                        <div className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded">
                          {top.competencyMappings[0]?.competency?.name || 'Mapped Competency'}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 font-medium">
                          ⚠ Needs competency mapping
                        </p>
                      )}
                    </div>
                  ))}

                  {courseTopics.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No topics extracted for this course yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: COURSE HEALTH & VALIDATION */}
            {activeRightTab === 'VALIDATION' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Course Health Score
                  </span>
                  <p className="text-2xl font-black text-indigo-600">
                    {validationResult?.healthScore || 85}%
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {validationResult?.isPublishable
                      ? '✓ Ready to publish'
                      : 'Resolve critical errors to enable publishing'}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Validation Checklist
                  </p>

                  {validationResult?.issues?.map((issue: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        issue.severity === 'ERROR'
                          ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                          : 'border-amber-200 bg-amber-50/60 text-amber-900'
                      }`}
                    >
                      {issue.severity === 'ERROR' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-[11px]">{issue.message}</p>
                        {issue.path && (
                          <p className="text-[10px] opacity-80 mt-0.5">{issue.path}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {(!validationResult?.issues || validationResult.issues.length === 0) && (
                    <div className="p-3 text-center text-xs text-emerald-700 font-bold bg-emerald-50 rounded-lg">
                      ✓ No issues detected. Everything is in order!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PUBLISH PRE-FLIGHT CHECKLIST MODAL
          ========================================================================= */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border-slate-200 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Publish Course to Trainees
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {publishMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{publishMessage}</span>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Publishing will make <strong className="text-slate-900">{courseMetadata.title}</strong> visible in the trainee course catalog and available for enrollment.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Course details and metadata configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{modules.length} Modules ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All lessons contain substantive content blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Competencies aligned for skill gap tracking</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPublishing}
                  onClick={() => setShowPublishModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isPublishing}
                  onClick={handlePublish}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Confirm & Publish
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
