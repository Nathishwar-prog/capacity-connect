'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/api/client';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Database,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export interface VisualChartData {
  type: 'bar' | 'line' | 'donut' | 'table' | 'kpi';
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: Array<any>;
}

export interface AiAnalyticsResponse {
  intent: string;
  answer: string;
  keyInsight?: string;
  visualization?: VisualChartData;
  queryPlan?: {
    model: string;
    action: string;
    filters?: Record<string, any>;
  };
  suggestions?: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  insight?: string;
  visualization?: VisualChartData;
  queryPlan?: any;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Which courses have the lowest completion rates?',
  'List trainees inactive for more than 14 days',
  'Compare trainer workloads and completion metrics',
  'What are our most critical competency skill gaps?',
  'Show the assessment score distribution',
  'Give me an executive platform health summary',
];

export const FloatingAiAssistant: React.FC = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Greetings Administrator! I am your Executive AI Analyst. I examine real-time database records across enrollments, trainee progress, competency mastery, trainer workloads, and assessments. How may I assist your institutional evaluation today?',
      timestamp: new Date(),
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Check URL query param ?askAi=true
  useEffect(() => {
    if (searchParams.get('askAi') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  // Listen for custom window event 'open-ai-analyst'
  useEffect(() => {
    const handleOpenEvent = (e: CustomEvent) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    };

    window.addEventListener('open-ai-analyst' as any, handleOpenEvent as any);
    return () => {
      window.removeEventListener('open-ai-analyst' as any, handleOpenEvent as any);
    };
  }, []);

  const handleSend = async (customPrompt?: string) => {
    const queryText = (customPrompt || prompt).trim();
    if (!queryText || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: queryText,
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    if (!customPrompt) setPrompt('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/admin/analytics/ai/query', {
        prompt: queryText,
      });

      const aiData: AiAnalyticsResponse = res.data.data;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: aiData.answer,
          timestamp: new Date(),
          insight: aiData.keyInsight,
          visualization: aiData.visualization,
          queryPlan: aiData.queryPlan,
          suggestions: aiData.suggestions || [
            'Compare trainer workloads',
            'Show skill gap bottlenecks',
            'Assessment score distribution',
          ],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text:
            err.response?.data?.message ||
            'Unable to process query at this time. Please ensure the backend analytics service is reachable.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic Chart Renderer
  const renderVisualization = (vis: VisualChartData) => {
    if (!vis || !vis.data || vis.data.length === 0) return null;

    if (vis.type === 'kpi') {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {vis.data.map((item, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                {item.label || item.metric}
              </span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {item.value}
                {item.unit ? <span className="text-xs font-semibold text-slate-500 ml-1">{item.unit}</span> : ''}
              </div>
              {item.trend !== undefined && (
                <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${item.trend >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {item.trend >= 0 ? '↑ +' : '↓ '}{item.trend}% vs prior period
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (vis.type === 'bar') {
      const maxVal = Math.max(...vis.data.map((d) => Number(d.value ?? d.count ?? d.rate ?? 0)), 1);

      return (
        <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-200/60 pb-1.5">
            <span>{vis.title || 'Distribution Metrics'}</span>
            <span className="text-[10px] text-slate-400 font-medium">PostgreSQL Aggregation</span>
          </div>
          <div className="space-y-2 pt-1">
            {vis.data.map((item, idx) => {
              const label = item.label || item.name || item.range || item.title || `Item ${idx + 1}`;
              const val = Number(item.value ?? item.count ?? item.rate ?? 0);
              const pct = Math.round((val / maxVal) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium truncate max-w-[240px]">{label}</span>
                    <span className="font-bold text-indigo-700 ml-2">
                      {val} {item.unit || ''}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (vis.type === 'table') {
      const keys = Object.keys(vis.data[0] || {}).slice(0, 4);

      return (
        <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 overflow-hidden">
          <div className="text-[11px] font-bold text-slate-700 mb-2">{vis.title || 'Tabular Summary'}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  {keys.map((k) => (
                    <th key={k} className="pb-1.5 pr-2 font-bold">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {vis.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-100/50">
                    {keys.map((k) => (
                      <td key={k} className="py-1.5 pr-2 text-slate-700 font-medium whitespace-nowrap">
                        {String(row[k] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (vis.type === 'donut') {
      const total = vis.data.reduce((acc, d) => acc + Number(d.value ?? d.count ?? 1), 0) || 1;
      const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

      return (
        <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="text-[11px] font-bold text-slate-700">{vis.title || 'Proportional Composition'}</div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {vis.data.map((item, idx) => {
              const val = Number(item.value ?? item.count ?? 0);
              const pct = Math.round((val / total) * 100);
              const color = colors[idx % colors.length];

              return (
                <div key={idx} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/60 rounded-lg">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-slate-800 truncate">
                      {item.label || item.type || item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      {val} ({pct}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Persistent Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-white/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer group"
          title="Open AI Analytics Analyst"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse" />
          </div>
          <span className="tracking-tight pr-1">Ask AI Analyst</span>
        </button>
      )}

      {/* Floating AI Assistant Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 ${
            isExpanded
              ? 'w-[92vw] sm:w-[680px] h-[82vh] max-h-[780px]'
              : 'w-[92vw] sm:w-[460px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between border-b border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight text-white">Executive AI Analyst</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Data
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Direct PostgreSQL Aggregations & Query Planner
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-2xs font-medium'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed text-xs">{m.text}</div>

                  {/* Highlight takeaway insight if present */}
                  {m.insight && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-semibold text-[11px] mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>{m.insight}</span>
                    </div>
                  )}

                  {/* Chart or table visualization */}
                  {m.visualization && renderVisualization(m.visualization)}

                  {/* Query Execution Plan Accordion */}
                  {m.queryPlan && (
                    <div className="border-t border-slate-100 pt-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlanId(expandedPlanId === m.id ? null : m.id)
                        }
                        className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Database className="w-3 h-3 text-slate-400" />
                        <span>Query Execution Plan</span>
                        {expandedPlanId === m.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {expandedPlanId === m.id && (
                        <div className="mt-2 p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto">
                          <pre>{JSON.stringify(m.queryPlan, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action row (Copy text) */}
                  {m.sender === 'assistant' && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => copyAnswer(m.id, m.text)}
                        className="flex items-center gap-1 hover:text-slate-700 cursor-pointer transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Suggested Queries
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSend(sug)}
                            className="text-left text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/70 transition-colors cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 items-center text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-2 text-xs shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Aggregating institutional metrics...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask an analytical question (e.g., 'courses with low completion')..."
              disabled={isLoading}
              className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
