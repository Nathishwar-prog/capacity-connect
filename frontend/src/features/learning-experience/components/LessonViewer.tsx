'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LessonDetail } from '../types/learning-experience.types';
import { VideoPlayer } from './VideoPlayer';
import { PdfViewer } from './PdfViewer';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  lesson: LessonDetail;
  onLessonEnded?: () => void;
}

export const LessonViewer: React.FC<Props> = ({ lesson, onLessonEnded }) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="space-y-6">
      {/* Lesson Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            {lesson.moduleTitle}
          </span>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            {lesson.durationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {lesson.durationMinutes} {t.durationMinutes}
                </span>
              </span>
            )}
            {lesson.completed && (
              <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.completedBadge}</span>
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {lesson.title}
        </h2>

        {lesson.description && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
            {lesson.description}
          </p>
        )}
      </div>

      {/* Dynamic Resource Content Viewport */}
      <div className="w-full">
        {lesson.contentType === 'VIDEO' ? (
          <VideoPlayer
            videoUrl={
              lesson.resourceUrl ||
              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            }
            title={lesson.title}
            onEnded={onLessonEnded}
          />
        ) : (
          <PdfViewer pdfUrl={lesson.resourceUrl} content={lesson.content} title={lesson.title} />
        )}
      </div>

      {/* Operational Key Takeaways & Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Takeaways */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-700">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t.keyTakeaways}
            </h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 ? (
              lesson.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Master technical sensor capabilities and operational calibration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    Cross-reference satellite and radar data for high-confidence nowcasting.
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Forecaster Checklist */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <ListChecks className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t.operationalChecklist}
            </h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            {lesson.operationalChecklist && lesson.operationalChecklist.length > 0 ? (
              lesson.operationalChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Verify observational flags and signal-to-noise thresholds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Complete end-of-module assessment checkpoint.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Optional Audio/Video Transcript */}
      {lesson.transcript && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{t.transcript}</span>
            </div>
            {showTranscript ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showTranscript && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 font-mono whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
              {lesson.transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
