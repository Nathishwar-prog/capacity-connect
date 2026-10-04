'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Megaphone,
  Send,
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  UserCheck,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useAnnouncements } from '@/features/announcements/hooks/useAnnouncements';
import {
  AnnouncementItem,
  CreateAnnouncementPayload,
} from '@/features/announcements/api/announcementApi';

export default function AdminAnnouncementsPage() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'TRAINEES' | 'TRAINERS' | 'ANY'>('ANY');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'ALL' | 'TRAINEES' | 'TRAINERS'>('ALL');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [type, setType] = useState<'GENERAL' | 'COURSE' | 'ACHIEVEMENT' | 'LEARNING_CONTENT' | 'SYSTEM'>('GENERAL');
  const [formError, setFormError] = useState('');

  const {
    announcements,
    isLoading,
    refetch,
    isRefetching,
    createAnnouncement,
    isCreating,
  } = useAnnouncements();

  // Filter announcements
  const filtered = announcements.filter((item) => {
    const matchesSearch =
      !searchTerm.trim() ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = audienceFilter === 'ANY' || item.targetAudience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  // Calculate statistics
  const totalCount = announcements.length;
  const allCount = announcements.filter((a) => a.targetAudience === 'ALL').length;
  const traineesCount = announcements.filter((a) => a.targetAudience === 'TRAINEES').length;
  const trainersCount = announcements.filter((a) => a.targetAudience === 'TRAINERS').length;

  const handleOpenCreate = () => {
    setTitle('');
    setContent('');
    setAudience('ALL');
    setPriority('NORMAL');
    setType('GENERAL');
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Announcement title is required.');
      return;
    }
    if (!content.trim()) {
      setFormError('Announcement message / content is required.');
      return;
    }

    try {
      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        content: content.trim(),
        audience,
        priority,
        type,
      };

      const result = await createAnnouncement(payload);
      showToast(
        `Announcement dispatched successfully to ${result.recipientCount} recipient(s).`,
        'success',
      );
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to dispatch announcement.';
      setFormError(msg);
      showToast(msg, 'error');
    }
  };

  const getAudienceBadge = (target: string) => {
    switch (target) {
      case 'ALL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Users className="w-3 h-3" />
            All Personnel
          </span>
        );
      case 'TRAINEES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <GraduationCap className="w-3 h-3" />
            Trainees Only
          </span>
        );
      case 'TRAINERS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3 h-3" />
            Trainers Only
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {target}
          </span>
        );
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
            High
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600">
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-blue-700">
            Normal
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Megaphone className="w-4 h-4" />
                <span>Governance & Institutional Communications</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Announcements Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Broadcast institutional notices, operational bulletins, and policy directives to
                approved trainees, faculty trainers, or all accredited personnel.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Refresh announcements list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Announcement</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  Total Dispatched
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Broadcasts recorded in portal history
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  All-Personnel Bulletins
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-purple-700">{allCount}</div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Delivered across all cadres
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  Trainee Notices
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-sky-700">{traineesCount}</div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Course & curriculum advisories
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  Trainer Notices
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">{trainersCount}</div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Faculty directives & scheduling
              </span>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search announcements by title or content..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium bg-slate-50/50"
                />
              </div>

              {/* Audience Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Audience:
                </span>
                {(
                  [
                    { key: 'ANY', label: 'All Dispatches' },
                    { key: 'ALL', label: 'All Personnel' },
                    { key: 'TRAINEES', label: 'Trainees Only' },
                    { key: 'TRAINERS', label: 'Trainers Only' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAudienceFilter(tab.key)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      audienceFilter === tab.key
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Announcements Listing */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-xs">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse space-y-2.5 pb-4 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-5 bg-slate-100 rounded-md" />
                    <div className="w-48 h-5 bg-slate-100 rounded-md" />
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-md" />
                  <div className="w-2/3 h-4 bg-slate-100 rounded-md" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No announcements found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || audienceFilter !== 'ANY'
                  ? 'No announcements match your filter or search query. Try resetting filters.'
                  : 'No administrative announcements have been dispatched yet. Click "Create Announcement" to send your first broadcast.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Announcement</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all shadow-xs space-y-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getAudienceBadge(item.targetAudience)}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.type || 'GENERAL'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Dispatched
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>Dispatched by:</span>
                      <strong className="text-slate-700 font-semibold">
                        {item.author
                          ? `${item.author.firstName} ${item.author.lastName || ''}`.trim() || item.author.email
                          : 'Administrative Authority'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <Bell className="w-3 h-3 text-indigo-500" />
                      <span>In-app notifications dispatched to targeted personnel</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Creation Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Create & Dispatch Announcement
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Generates persisted notification records for all matching accredited users
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
                  {/* Audience Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Audience <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <label
                        className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                          audience === 'ALL'
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            All
                          </span>
                          <input
                            type="radio"
                            name="audience"
                            checked={audience === 'ALL'}
                            onChange={() => setAudience('ALL')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          All approved Trainees + Trainers
                        </span>
                      </label>

                      <label
                        className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                          audience === 'TRAINEES'
                            ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                            Trainees
                          </span>
                          <input
                            type="radio"
                            name="audience"
                            checked={audience === 'TRAINEES'}
                            onChange={() => setAudience('TRAINEES')}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Approved operational learners
                        </span>
                      </label>

                      <label
                        className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                          audience === 'TRAINERS'
                            ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Trainers
                          </span>
                          <input
                            type="radio"
                            name="audience"
                            checked={audience === 'TRAINERS'}
                            onChange={() => setAudience('TRAINERS')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">
                          Approved faculty instructors
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Announcement Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Schedule Update: Doppler Weather Radar Operations Workshop"
                      maxLength={200}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
                      required
                    />
                  </div>

                  {/* Message Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Message / Bulletin Content <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your announcement details, instructions, venue details, or operational guidance here..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium leading-relaxed resize-none"
                      required
                    />
                  </div>

                  {/* Priority & Category Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Priority Level</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="LOW">Low (Informational)</option>
                        <option value="NORMAL">Normal (Default)</option>
                        <option value="HIGH">High (Important)</option>
                        <option value="URGENT">Urgent (Immediate Attention)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Category</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="GENERAL">General Notice</option>
                        <option value="COURSE">Course & Curriculum</option>
                        <option value="LEARNING_CONTENT">Learning Material</option>
                        <option value="ACHIEVEMENT">Recognition & Awards</option>
                        <option value="SYSTEM">System & Maintenance</option>
                      </select>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isCreating}
                      className="text-xs"
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={isCreating}
                      className="text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      {isCreating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Notifications...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Announcement</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {selectedAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {getAudienceBadge(selectedAnnouncement.targetAudience)}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedAnnouncement.type || 'GENERAL'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedAnnouncement.title}
                  </h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Dispatched on{' '}
                      {new Date(selectedAnnouncement.createdAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto font-medium">
                  {selectedAnnouncement.content}
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Delivered as in-app notification to all approved users in the target cadre.
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAnnouncement(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
