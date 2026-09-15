'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { trainerApi } from '@/features/trainer/api/trainerApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  BookOpen,
  HelpCircle,
  FileQuestion,
  Clock,
  Award,
  Loader2,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';

export default function AssessmentBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <AssessmentBuilderContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AssessmentBuilderContent() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.assessmentId as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewActiveQuestion, setPreviewActiveQuestion] = useState<number>(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<number, string | string[]>>({});

  // Editable Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [passingScore, setPassingScore] = useState<number>(70);
  const [status, setStatus] = useState<string>('DRAFT');
  const [questions, setQuestions] = useState<any[]>([]);

  // Load assessment
  useEffect(() => {
    async function loadAssessment() {
      if (!assessmentId) return;
      try {
        setLoading(true);
        const data = await trainerApi.getAssessmentById(assessmentId);
        setAssessment(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSubject(data.subject || 'Meteorology');
        setDurationMinutes(data.durationMinutes || 45);
        setPassingScore(data.passingScore || 70);
        setStatus(data.status || 'DRAFT');

        if (Array.isArray(data.questions)) {
          setQuestions(
            data.questions.map((q: any) => ({
              id: q.id,
              questionText: q.questionText || '',
              questionType: q.questionType || 'SINGLE_CHOICE',
              marks: q.marks || 1,
              explanation: q.explanation || '',
              options: Array.isArray(q.options)
                ? q.options.map((o: any) => ({
                    id: o.id,
                    optionText: o.optionText || '',
                    isCorrect: Boolean(o.isCorrect),
                  }))
                : [],
            })),
          );
        }
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to load assessment details');
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [assessmentId]);

  // Question manipulation
  const handleAddQuestion = () => {
    const newQ = {
      questionText: '',
      questionType: 'SINGLE_CHOICE',
      marks: 1,
      explanation: '',
      options: [
        { optionText: 'Option A', isCorrect: true },
        { optionText: 'Option B', isCorrect: false },
        { optionText: 'Option C', isCorrect: false },
        { optionText: 'Option D', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('An assessment must have at least one question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
  };

  const handleMoveQuestion = (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  // Option manipulation
  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({
      optionText: `New Option`,
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const handleDeleteOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) {
      alert('A question must have at least two options.');
      return;
    }
    updated[qIdx].options = updated[qIdx].options.filter((_: any, i: number) => i !== optIdx);
    setQuestions(updated);
  };

  // Toggle single vs multi choice option correctness
  const handleOptionCorrectToggle = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
      q.options.forEach((o: any, i: number) => {
        o.isCorrect = i === optIdx;
      });
    } else {
      q.options[optIdx].isCorrect = !q.options[optIdx].isCorrect;
    }
    setQuestions(updated);
  };

  // Save changes
  const handleSave = async (publish: boolean = false) => {
    // Validate required fields
    if (!title.trim()) {
      alert('Assessment title is required.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question ${i + 1} prompt cannot be empty.`);
        return;
      }
      if (!q.explanation.trim()) {
        alert(`Question ${i + 1} must include an explanation.`);
        return;
      }
      const hasCorrect = q.options.some((o: any) => o.isCorrect);
      if (!hasCorrect) {
        alert(`Question ${i + 1} must have at least one correct option selected.`);
        return;
      }
    }

    try {
      setSaving(true);
      const newStatus = publish ? 'PUBLISHED' : status;

      await trainerApi.updateAssessment(assessmentId, {
        title,
        description,
        subject,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        status: newStatus,
        questions: questions.map((q, idx) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          marks: Number(q.marks) || 1,
          orderIndex: idx + 1,
          explanation: q.explanation || null,
          options: (q.options || []).map((opt: any, optIdx: number) => ({
            id: opt.id,
            optionText: opt.optionText,
            isCorrect: Boolean(opt.isCorrect),
            orderIndex: optIdx + 1,
          })),
        })),
      });

      setStatus(newStatus);
      alert(publish ? '✓ Assessment published successfully!' : '✓ Assessment saved successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Assessment Builder
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-bold ${
                status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}
            >
              {status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Author and calibrate institutional competency tests, scoring rules, and explanations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {previewMode ? 'Exit Preview' : 'Trainee Simulation'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Draft
          </Button>

          {status !== 'PUBLISHED' && (
            <Button
              size="sm"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Publish Assessment
            </Button>
          )}
        </div>
      </div>

      {/* PREVIEW SIMULATION VIEW */}
      {previewMode ? (
        <Card className="bg-slate-900 text-white border-slate-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/50 p-6">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-indigo-400 uppercase tracking-wider">Trainee Exam Simulation Mode</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {durationMinutes} mins remaining
                </span>
                <span>Passing: {passingScore}%</span>
              </div>
            </div>
            <CardTitle className="text-xl font-black text-white mt-1">{title}</CardTitle>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-300">
                    Question {previewActiveQuestion + 1} of {questions.length}
                  </span>
                  <span className="font-bold text-indigo-400">
                    {questions[previewActiveQuestion]?.marks || 1} mark(s)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {questions[previewActiveQuestion]?.questionText}
                  </h4>

                  <div className="space-y-2 pt-2">
                    {questions[previewActiveQuestion]?.options?.map((opt: any, oIdx: number) => (
                      <div
                        key={oIdx}
                        onClick={() => {
                          setPreviewAnswers({
                            ...previewAnswers,
                            [previewActiveQuestion]: String(oIdx),
                          });
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center gap-3 transition-all ${
                          previewAnswers[previewActiveQuestion] === String(oIdx)
                            ? 'bg-indigo-600/30 border-indigo-400 text-white'
                            : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt.optionText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Reveal in Simulation */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Trainer Explanation Check
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {questions[previewActiveQuestion]?.explanation || 'No explanation configured.'}
                  </p>
                </div>

                {/* Pagination in Preview */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewActiveQuestion === 0}
                    onClick={() => setPreviewActiveQuestion((prev) => Math.max(0, prev - 1))}
                    className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
                  >
                    Previous Question
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewActiveQuestion === questions.length - 1}
                    onClick={() => setPreviewActiveQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
                  >
                    Next Question
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* NORMAL BUILDER EDITING VIEW */
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Assessment Metadata & Grading Benchmark
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Area *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the assessment..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Points</label>
                  <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-indigo-600">
                    {totalPoints} Marks Total
                  </div>
                </div>
              </div>

              {/* Hierarchy Context Display (Section 7) */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-600">Mapped Hierarchy:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  Course: <strong className="text-slate-900">{assessment?.course?.title || 'Standalone'}</strong>
                </span>
                {assessment?.module && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-medium">
                    Module: <strong className="text-indigo-950">{assessment.module.title}</strong>
                  </span>
                )}
                {assessment?.lesson && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                    Lesson: <strong className="text-emerald-950">{assessment.lesson.title}</strong>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Questions Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Questions ({questions.length})</h3>
                <span className="text-xs text-slate-500">• Reorder, modify choices, and update explanations</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddQuestion}
                className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <Card key={qIdx} className="border-slate-200 shadow-xs bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <select
                        value={q.questionType}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].questionType = e.target.value;
                          setQuestions(updated);
                        }}
                        className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800"
                      >
                        <option value="SINGLE_CHOICE">Single Choice</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="TRUE_FALSE">True / False</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Marks:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="100"
                          value={q.marks}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIdx].marks = Number(e.target.value);
                            setQuestions(updated);
                          }}
                          className="w-14 px-1.5 py-0.5 text-xs font-bold rounded border border-slate-200 text-center"
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={qIdx === 0}
                        onClick={() => handleMoveQuestion(qIdx, 'UP')}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={qIdx === questions.length - 1}
                        onClick={() => handleMoveQuestion(qIdx, 'DOWN')}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Prompt input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Question Prompt</label>
                      <textarea
                        rows={2}
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].questionText = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Enter the question prompt..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    {/* Options list */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                          Options & Correct Answer Selection
                        </label>
                        {q.questionType !== 'TRUE_FALSE' && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                              opt.isCorrect
                                ? 'border-emerald-300 bg-emerald-50/50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <input
                              type={q.questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                              name={`q_${qIdx}_correct`}
                              checked={Boolean(opt.isCorrect)}
                              onChange={() => handleOptionCorrectToggle(qIdx, oIdx)}
                              className="accent-emerald-600 w-4 h-4 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt.optionText}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIdx].options[oIdx].optionText = e.target.value;
                                setQuestions(updated);
                              }}
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                            />
                            {q.questionType !== 'TRUE_FALSE' && q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(qIdx, oIdx)}
                                className="text-slate-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Explanation textarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Explanation (Required)
                      </label>
                      <textarea
                        rows={2}
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Explain why the answer is correct..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
