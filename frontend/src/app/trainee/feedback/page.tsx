'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface FeedbackEntry {
  id: string;
  courseTitle: string;
  instructorName: string;
  rating: number;
  categories: {
    contentDepth: number;
    practicalRelevance: number;
    instructorClarity: number;
  };
  comments: string;
  submittedAt: string;
  status: 'ACKNOWLEDGED' | 'UNDER_REVIEW';
}

const INITIAL_FEEDBACKS: FeedbackEntry[] = [
  {
    id: 'fb-1',
    courseTitle: 'Doppler Radar Operational Meteorology (Level 1)',
    instructorName: 'Dr. Rameshwar V. Sen',
    rating: 5,
    categories: {
      contentDepth: 5,
      practicalRelevance: 5,
      instructorClarity: 4,
    },
    comments:
      'The hands-on radar echo classification exercises for supercell storms were exceptionally rigorous and directly relevant to our coastal DWR duty shifts.',
    submittedAt: '2026-02-19',
    status: 'ACKNOWLEDGED',
  },
  {
    id: 'fb-2',
    courseTitle: 'Tropical Cyclone Warning Operations SOP',
    instructorName: 'Dr. Anand K. Mohapatra',
    rating: 4,
    categories: {
      contentDepth: 5,
      practicalRelevance: 4,
      instructorClarity: 4,
    },
    comments:
      'Comprehensive coverage of the Dvorak satellite intensity estimation method. Would appreciate more real-time radar case studies from Arabian Sea depressions.',
    submittedAt: '2026-02-12',
    status: 'ACKNOWLEDGED',
  },
];

export default function TraineeFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>(INITIAL_FEEDBACKS);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState('High-Resolution NWP Modeling & Data Assimilation');
  const [instructor, setInstructor] = useState('Dr. Priya N. Bhattacharya');
  const [overallRating, setOverallRating] = useState(5);
  const [contentDepth, setContentDepth] = useState(5);
  const [practicalRelevance, setPracticalRelevance] = useState(4);
  const [instructorClarity, setInstructorClarity] = useState(5);
  const [recommend, setRecommend] = useState<'YES' | 'NO'>('YES');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newEntry: FeedbackEntry = {
        id: `fb-${Date.now()}`,
        courseTitle: selectedCourse,
        instructorName: instructor,
        rating: overallRating,
        categories: {
          contentDepth,
          practicalRelevance,
          instructorClarity,
        },
        comments,
        submittedAt: new Date().toISOString().split('T')[0],
        status: 'UNDER_REVIEW',
      };

      setFeedbacks([newEntry, ...feedbacks]);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setComments('');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3500);
    }, 600);
  };

  const StarRatingSelector: React.FC<{
    value: number;
    onChange: (val: number) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Quality & Accreditation Survey
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Course Evaluation & Training Feedback
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Share your operational experience to refine curriculum rigor, laboratory training, and faculty instruction.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 sm:p-7 bg-white border-slate-200 rounded-3xl shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Submit Course Feedback</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Confidential Evaluation
                  </span>
                </div>

                {submitSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thank you! Your feedback has been submitted to the academic board.</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Select Course for Evaluation *
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        if (e.target.value.includes('NWP')) setInstructor('Dr. Priya N. Bhattacharya');
                        else if (e.target.value.includes('Radar')) setInstructor('Dr. Rameshwar V. Sen');
                        else setInstructor('Dr. Anand K. Mohapatra');
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="High-Resolution NWP Modeling & Data Assimilation">
                        High-Resolution NWP Modeling & Data Assimilation
                      </option>
                      <option value="Doppler Radar Operational Meteorology (Level 1)">
                        Doppler Radar Operational Meteorology (Level 1)
                      </option>
                      <option value="Tropical Cyclone Warning Operations SOP">
                        Tropical Cyclone Warning Operations SOP
                      </option>
                      <option value="INSAT-3D Multi-Spectral Satellite Imagery Analysis">
                        INSAT-3D Multi-Spectral Satellite Imagery Analysis
                      </option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <StarRatingSelector
                      label="Overall Course Experience"
                      value={overallRating}
                      onChange={setOverallRating}
                    />
                    <StarRatingSelector
                      label="Scientific Depth & Theory"
                      value={contentDepth}
                      onChange={setContentDepth}
                    />
                    <StarRatingSelector
                      label="Practical Operational Relevance"
                      value={practicalRelevance}
                      onChange={setPracticalRelevance}
                    />
                    <StarRatingSelector
                      label="Instructor Clarity & Guidance"
                      value={instructorClarity}
                      onChange={setInstructorClarity}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Would you recommend this course to peer officers?
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRecommend('YES')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          recommend === 'YES'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Yes, Highly Recommended
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecommend('NO')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          recommend === 'NO'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Needs Improvement
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Detailed Review & Laboratory Suggestions *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Comment on specific exercises, software tools (e.g. GRADS, WRF, Python MetPy), laboratory setups, or conceptual topics where more depth is needed..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 rounded-xl shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Official Evaluation'}</span>
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Sidebar / History Column */}
            <div className="space-y-4">
              <Card className="p-5 bg-white border-slate-200 rounded-3xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Evaluation Guidelines
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluations directly shape curriculum revisions at the India Meteorological Training Institute (Pune) and NCMRWF modeling symposia.
                </p>
                <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 font-medium space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Impact of Feedback:
                  </p>
                  <p>Reviews identify emerging skill gaps and help calibrate adaptive revision session algorithms.</p>
                </div>
              </Card>

              {/* Submission History */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 px-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Your Past Evaluations</span>
                </h3>

                {feedbacks.map((fb) => (
                  <Card key={fb.id} className="p-4 bg-white border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {fb.courseTitle}
                        </h4>
                        <p className="text-[11px] text-slate-400">{fb.instructorName}</p>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {fb.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= fb.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-[10px] font-bold text-slate-500 ml-1">
                        {fb.rating}.0 / 5.0
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">
                      &ldquo;{fb.comments}&rdquo;
                    </p>

                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                      <span>Submitted on</span>
                      <span>{fb.submittedAt}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
