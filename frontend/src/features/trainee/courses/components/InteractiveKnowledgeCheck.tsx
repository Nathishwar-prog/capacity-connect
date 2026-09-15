'use client';

import React, { useState } from 'react';
import { HelpCircle, Check, X, Award, AlertCircle } from 'lucide-react';
import { KnowledgeCheckQuestion } from '../types/viewer.types';
import { courseViewerApi } from '../api/courseViewerApi';

interface InteractiveKnowledgeCheckProps {
  courseId: string;
  lessonId: string;
  questions?: KnowledgeCheckQuestion[];
}

export const InteractiveKnowledgeCheck = React.memo(function InteractiveKnowledgeCheck({
  courseId,
  lessonId,
  questions,
}: InteractiveKnowledgeCheckProps) {
  // State: questionId -> { selectedOpt: string, isSubmitted: boolean, isCorrect: boolean }
  const [quizState, setQuizState] = useState<
    Record<string, { selectedOpt: string; isSubmitted: boolean; isCorrect: boolean }>
  >({});

  if (!questions || questions.length === 0) return null;

  const handleOptionSelect = async (
    qId: string,
    opt: { id?: string; text: string; isCorrect: boolean }
  ) => {
    const isCorrect = Boolean(opt.isCorrect);

    setQuizState((prev) => ({
      ...prev,
      [qId]: {
        selectedOpt: opt.id || opt.text,
        isSubmitted: true,
        isCorrect,
      },
    }));

    // Record interaction in Adaptive Revision Engine asynchronously
    await courseViewerApi.submitKnowledgeCheck({
      courseId,
      lessonId,
      questionId: qId,
      isCorrect,
      responseTimeMs: 2500,
      confidenceRating: isCorrect ? 0.95 : 0.4,
    });
  };

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Interactive Knowledge Check
          </h3>
          <p className="text-[11px] text-slate-400">
            Reinforce key meteorological concepts from this lesson
          </p>
        </div>
      </div>

      <div className="space-y-6 divide-y divide-slate-800/80">
        {questions.map((qc, qIdx) => {
          const state = quizState[qc.id];

          return (
            <div key={qc.id || qIdx} className={`space-y-3.5 ${qIdx > 0 ? 'pt-5' : ''}`}>
              <p className="text-xs font-bold text-slate-200 leading-snug">
                {qIdx + 1}. {qc.question}
              </p>

              <div className="space-y-2">
                {(qc.options || []).map((opt, oIdx) => {
                  const optKey = opt.id || opt.text;
                  const isSelected = state?.selectedOpt === optKey;

                  let optionClass =
                    'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900';
                  if (state?.isSubmitted) {
                    if (opt.isCorrect) {
                      optionClass =
                        'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 font-semibold';
                    } else if (isSelected && !opt.isCorrect) {
                      optionClass = 'border-rose-500/80 bg-rose-950/40 text-rose-200';
                    }
                  } else if (isSelected) {
                    optionClass = 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-semibold';
                  }

                  return (
                    <button
                      key={optKey || oIdx}
                      disabled={state?.isSubmitted}
                      onClick={() => handleOptionSelect(qc.id, opt)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-3 ${optionClass}`}
                    >
                      <span className="leading-relaxed">{opt.text}</span>
                      {state?.isSubmitted && opt.isCorrect && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {state?.isSubmitted && isSelected && !opt.isCorrect && (
                        <X className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {state?.isSubmitted && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-1 ${
                    state.isCorrect
                      ? 'bg-emerald-950/30 text-emerald-200 border border-emerald-900/60'
                      : 'bg-rose-950/30 text-rose-200 border border-rose-900/60'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {state.isCorrect ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Correct! Excellent operational mastery.
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        Incorrect. Review the lesson concepts above.
                      </>
                    )}
                  </p>
                  {qc.explanation && (
                    <p className="text-[11px] opacity-90 leading-relaxed pt-0.5">
                      {qc.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
