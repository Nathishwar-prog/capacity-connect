'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  pdfUrl: string | null;
  content: string | null;
  title: string;
}

export const PdfViewer: React.FC<Props> = ({ pdfUrl, content, title }) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4; // Standard technical operational document pages

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 175));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 70));
  const handleResetZoom = () => setZoom(100);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg flex flex-col h-[580px] sm:h-[650px]">
      {/* Top Document Action Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
        </div>

        {/* Toolbar: Zoom & Page navigation */}
        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:text-white transition-colors"
              title={t.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-300">{zoom}%</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:text-white transition-colors"
              title={t.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 hover:text-white transition-colors border-l border-slate-700/60"
              title={t.resetZoom}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="p-1.5 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-300">
              {currentPage} {t.pageOf} {totalPages}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* External Open / Download Link */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.openExternal}</span>
            </a>
          )}
        </div>
      </div>

      {/* Document Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-900/60 flex justify-center items-start custom-scrollbar">
        <div
          className="bg-white text-slate-900 shadow-2xl rounded-xl p-6 sm:p-10 max-w-2xl w-full transition-transform origin-top duration-150"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {content ? (
            <div className="prose prose-slate prose-sm max-w-none space-y-4">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-mono">
                  <span>Capacity Connect • MoES / IMD</span>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">{title}</h2>
              </div>
              <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {content}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-mono">
                  <span>WMO-258 Operational Meteorological Guide</span>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">{title}</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                This technical guidance note details the standard operating procedures and
                calibration curves prescribed by the Ministry of Earth Sciences and the India
                Meteorological Department for forecaster capacity building.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Operational Competencies Addressed:
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Sensor radiance threshold calculation and limb corrections.</li>
                  <li>Multi-spectral false-color RGB composition interpretation.</li>
                  <li>Nowcasting severe weather hazards using rapid updates.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
