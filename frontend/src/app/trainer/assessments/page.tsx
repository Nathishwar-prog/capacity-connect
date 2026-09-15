'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  useTrainerAssessments,
  useTrainerCourses,
  useCreateAssessment,
} from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  PlusCircle,
  Clock,
  Award,
  Users,
  CheckCircle2,
  FileQuestion,
  Loader2,
  FileUp,
  Edit3,
} from 'lucide-react';

export default function TrainerAssessmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerAssessmentsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerAssessmentsContent() {
  const router = useRouter();
  const { data: assessments, isLoading, refetch } = useTrainerAssessments();
  const { data: coursesData } = useTrainerCourses();
  const createAssessmentMutation = useCreateAssessment();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [courseId, setCourseId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(70);

  // Question builder state
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      marks: 1,
      options: [
        { optionText: '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ],
    },
  ]);

  const courses = coursesData?.courses || [];

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        marks: 1,
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
      },
    ]);
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that questions and options are filled
    for (const q of questions) {
      if (!q.questionText.trim()) {
        alert('Please fill all question texts.');
        return;
      }
      for (const opt of q.options) {
        if (!opt.optionText.trim()) {
          alert('Please fill all option texts for question: ' + q.questionText);
          return;
        }
      }
    }

    try {
      await createAssessmentMutation.mutateAsync({
        title,
        subject,
        courseId: courseId || null,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        questions: questions.map((q, idx) => ({
          questionText: q.questionText,
          marks: q.marks,
          orderIndex: idx + 1,
          options: q.options.map((o, oIdx) => ({
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            orderIndex: oIdx + 1,
          })),
        })),
      });

      setShowCreateModal(false);
      setTitle('');
      setSubject('');
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create assessment');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assessments & Examinations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Author multiple choice tests, practical evaluations, and review trainee scores
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowCreateModal((prev) => !prev)}
            variant={showCreateModal ? "secondary" : "default"}
            className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Create Manually</span>
          </Button>

          <Button
            onClick={() => router.push('/trainer/assessments/import')}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50/80 bg-white text-xs font-bold shadow-sm"
          >
            <FileUp className="w-4 h-4 mr-1.5" />
            <span>Import from JSON</span>
          </Button>
        </div>
      </div>

      {/* Create Assessment Form / Modal */}
      {showCreateModal && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Create New Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssessment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Synoptic Chart Analysis & Frontal Systems Test"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Area *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="e.g. Synoptic Meteorology"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Linked Course (Optional)</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Standalone Test</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Questions ({questions.length})</h4>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion} className="text-xs">
                    + Add Question
                  </Button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Question {qIdx + 1}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter question prompt..."
                      value={q.questionText}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[qIdx].questionText = e.target.value;
                        setQuestions(copy);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q_${qIdx}_correct`}
                            checked={opt.isCorrect}
                            onChange={() => {
                              const copy = [...questions];
                              copy[qIdx].options.forEach((o, i) => {
                                o.isCorrect = i === oIdx;
                              });
                              setQuestions(copy);
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt.optionText}
                            onChange={(e) => {
                              const copy = [...questions];
                              copy[qIdx].options[oIdx].optionText = e.target.value;
                              setQuestions(copy);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createAssessmentMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
                  Save Assessment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assessments Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : assessments?.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Assessments Created</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Build standardized tests and questionnaires to evaluate trainee competency benchmarks.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              Create Manually
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/trainer/assessments/import')} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold">
              <FileUp className="w-3.5 h-3.5 mr-1" />
              Import from JSON
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assessments?.map((a) => (
            <Card key={a.id} className="hover:border-indigo-200 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {a.status}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                  {a.title}
                </CardTitle>
                <p className="text-[11px] text-indigo-700 font-semibold">{a.subject}</p>
                <p className="text-[10px] text-slate-500">{a.courseTitle}</p>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1">
                    <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{a.questionCount} Qs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{a.durationMinutes}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{a.passingScore}% pass</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>{a.attemptCount} total submissions</span>
                  <span className="font-bold text-emerald-600">{a.passedCount} passed</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {a.status === 'DRAFT' ? 'Draft • Unpublished' : 'Published • Active'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/trainer/assessments/${a.id}/builder`)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-7 px-2.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    <span>Open in Builder</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
