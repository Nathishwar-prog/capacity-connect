'use client';

import React, { useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Info,
  Code,
  Quote,
  Table as TableIcon,
} from 'lucide-react';
import { ContentBlock } from '../types/viewer.types';

interface LessonContentRendererProps {
  content?: string | null;
}

export const LessonContentRenderer = React.memo(function LessonContentRenderer({
  content,
}: LessonContentRendererProps) {
  // Parse content into ContentBlock[]
  const blocks = useMemo<ContentBlock[]>(() => {
    if (!content) return [];

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.blocks)) {
        return parsed.blocks;
      }
    } catch {
      // Content is plain text / markdown
    }

    if (typeof content === 'string') {
      // Split by double newlines into paragraphs
      const paragraphs = content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      return paragraphs.map((text, idx) => {
        if (text.startsWith('# ')) {
          return { id: `block-${idx}`, type: 'heading', content: text.replace(/^#\s*/, '') };
        }
        if (text.startsWith('## ')) {
          return { id: `block-${idx}`, type: 'heading', content: text.replace(/^##\s*/, '') };
        }
        if (text.startsWith('> ')) {
          return { id: `block-${idx}`, type: 'quote', content: text.replace(/^>\s*/, '') };
        }
        return { id: `block-${idx}`, type: 'paragraph', content: text };
      });
    }

    return [];
  }, [content]);

  if (blocks.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs italic">
        No additional written material provided for this lesson.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-200 text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        const key = block.id || `content-block-${idx}`;

        switch (block.type) {
          case 'heading':
            return (
              <h2
                key={key}
                className="text-lg sm:text-xl font-bold text-white tracking-tight pt-4 pb-2 border-b border-slate-800/80"
              >
                {block.content}
              </h2>
            );

          case 'callout':
            return (
              <div
                key={key}
                className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs shadow-sm space-y-1.5"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{block.metadata?.title || 'Operational Advisory'}</span>
                </div>
                <p className="leading-relaxed text-amber-100/90">{block.content}</p>
              </div>
            );

          case 'example':
            return (
              <div
                key={key}
                className="p-4 sm:p-5 rounded-2xl bg-blue-950/30 border border-blue-800/60 text-blue-200 text-xs shadow-sm space-y-1.5"
              >
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{block.metadata?.title || 'Real-World Application'}</span>
                </div>
                <p className="leading-relaxed text-blue-100/90">{block.content}</p>
              </div>
            );

          case 'quote':
            return (
              <blockquote
                key={key}
                className="p-4 rounded-xl border-l-4 border-indigo-500 bg-slate-900/60 text-slate-300 italic text-xs leading-relaxed my-2"
              >
                <Quote className="w-4 h-4 text-indigo-400 mb-1 opacity-70" />
                <p>{block.content}</p>
              </blockquote>
            );

          case 'code':
            return (
              <div key={key} className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3 h-3 text-indigo-400" />
                    {block.metadata?.language || 'Code Example / Algorithm'}
                  </span>
                </div>
                <pre className="p-4 font-mono text-slate-300 overflow-x-auto text-xs leading-relaxed">
                  <code>{block.content}</code>
                </pre>
              </div>
            );

          case 'table':
            return (
              <div
                key={key}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto font-mono text-xs text-slate-300 whitespace-pre shadow-sm leading-relaxed"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 font-sans">
                  <TableIcon className="w-3.5 h-3.5 text-indigo-400" /> Reference Matrix
                </div>
                {block.content}
              </div>
            );

          case 'bullet_list':
            return (
              <ul key={key} className="space-y-1.5 list-disc list-inside text-slate-300 text-xs pl-2">
                {Array.isArray(block.content) ? (
                  block.content.map((item: string, i: number) => <li key={i}>{item}</li>)
                ) : (
                  <li>{block.content}</li>
                )}
              </ul>
            );

          case 'numbered_list':
            return (
              <ol key={key} className="space-y-1.5 list-decimal list-inside text-slate-300 text-xs pl-2">
                {Array.isArray(block.content) ? (
                  block.content.map((item: string, i: number) => <li key={i}>{item}</li>)
                ) : (
                  <li>{block.content}</li>
                )}
              </ol>
            );

          case 'divider':
            return <hr key={key} className="border-slate-800/80 my-4" />;

          case 'paragraph':
          default:
            return (
              <p key={key} className="text-slate-300 leading-relaxed">
                {block.content}
              </p>
            );
        }
      })}
    </div>
  );
});
