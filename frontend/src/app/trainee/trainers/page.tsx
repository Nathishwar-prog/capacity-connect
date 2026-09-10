'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserCheck,
  Mail,
  Calendar,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Send,
  Building,
} from 'lucide-react';

interface TrainerItem {
  id: string;
  name: string;
  designation: string;
  organization: string;
  department: string;
  email: string;
  bio: string;
  specialties: string[];
  coursesTaught: string[];
  yearsExperience: number;
  isAssignedMentor?: boolean;
  officeHours?: string;
}

const INSTRUCTORS: TrainerItem[] = [
  {
    id: 'tr-1',
    name: 'Dr. Rameshwar V. Sen',
    designation: 'Scientist G & Head of Radar Operations',
    organization: 'India Meteorological Department (IMD)',
    department: 'Radar Meteorology Division',
    email: 'rv.sen@imd.gov.in',
    bio: 'Over 24 years leading Doppler Weather Radar network expansions across the Himalayan belt and Western Ghats. Specialized in polarimetric hydrometeor classification.',
    specialties: ['Doppler Radar', 'Mesoscale Convection', 'Signal Processing', 'Nowcasting'],
    coursesTaught: ['Doppler Radar Operational Meteorology (Level 1)', 'Advanced Radar Echo Interpretation'],
    yearsExperience: 24,
    isAssignedMentor: true,
    officeHours: 'Tuesdays & Thursdays, 14:00 - 16:00 IST',
  },
  {
    id: 'tr-2',
    name: 'Dr. Priya N. Bhattacharya',
    designation: 'Senior Scientist & NWP Lead',
    organization: 'National Centre for Medium Range Weather Forecasting (NCMRWF)',
    department: 'Atmospheric Modeling Division',
    email: 'priya.bhatt@ncmrwf.gov.in',
    bio: 'Specialist in 4D-Var data assimilation, ensemble prediction systems, and tropical cyclone track parameterization using coupled ocean-atmosphere models.',
    specialties: ['Numerical Weather Prediction', 'Data Assimilation', 'WRF Modeling', 'Ocean-Atmosphere Coupling'],
    coursesTaught: ['High-Resolution NWP Modeling & Data Assimilation', 'Monsoon Ensemble Forecasting'],
    yearsExperience: 18,
    isAssignedMentor: true,
    officeHours: 'Wednesdays, 10:00 - 12:00 IST',
  },
  {
    id: 'tr-3',
    name: 'Dr. Anand K. Mohapatra',
    designation: 'Director, Cyclone Warning Division',
    organization: 'India Meteorological Department (IMD)',
    department: 'Severe Weather Warning Centre',
    email: 'anand.mohap@imd.gov.in',
    bio: 'Lead author of IMD Cyclone Warning SOPs. Experienced in operational forecast delivery during major Bay of Bengal and Arabian Sea tropical cyclones.',
    specialties: ['Tropical Cyclones', 'Dvorak Technique', 'Storm Surge Modeling', 'Disaster Early Warning'],
    coursesTaught: ['Tropical Cyclone Warning Operations SOP', 'Coastal Hazards & Storm Surges'],
    yearsExperience: 22,
    isAssignedMentor: false,
    officeHours: 'Fridays, 15:00 - 17:00 IST',
  },
  {
    id: 'tr-4',
    name: 'Dr. K. G. Sundararaj',
    designation: 'Scientist F & Remote Sensing Lead',
    organization: 'Space Applications Centre (SAC / ISRO) / MoES',
    department: 'Satellite Meteorology Division',
    email: 'kg.sundar@isro.gov.in',
    bio: 'Specialist in INSAT-3D/3DR optical and sounder payload data processing, atmospheric motion vectors, and rapid-scan convective cloud tracking.',
    specialties: ['Satellite Meteorology', 'INSAT Payloads', 'Radiative Transfer', 'Atmospheric Motion Vectors'],
    coursesTaught: ['INSAT-3D Multi-Spectral Satellite Imagery Analysis'],
    yearsExperience: 16,
    isAssignedMentor: false,
    officeHours: 'Mondays, 11:00 - 13:00 IST',
  },
  {
    id: 'tr-5',
    name: 'Dr. Meenakshi S. Sundaram',
    designation: 'Senior Hydrologist & Flood Forecaster',
    organization: 'Central Water Commission (CWC) / MoES',
    department: 'Hydrometeorology Division',
    email: 'm.sundaram@cwc.gov.in',
    bio: 'Expert in river basin catchment rainfall-runoff modeling, urban flash flood guidance systems, and real-time telemetry sensor deployments.',
    specialties: ['Hydrology', 'Flash Flood Guidance', 'Catchment Modeling', 'Telemetry Networks'],
    coursesTaught: ['Flash Flood Guidance Systems (FFGS) in South Asia'],
    yearsExperience: 14,
    isAssignedMentor: false,
    officeHours: 'Thursdays, 11:00 - 12:30 IST',
  },
];

export default function TraineeTrainersPage() {
  const [trainers] = useState<TrainerItem[]>(INSTRUCTORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');

  // Contact modal
  const [contactModalTrainer, setContactModalTrainer] = useState<TrainerItem | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const specialties = [
    'ALL',
    'Doppler Radar',
    'Numerical Weather Prediction',
    'Tropical Cyclones',
    'Satellite Meteorology',
    'Hydrology',
  ];

  const filteredTrainers = trainers.filter((t) => {
    const matchesSpecialty =
      selectedSpecialty === 'ALL' || t.specialties.some((s) => s.includes(selectedSpecialty));
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSpecialty && matchesSearch;
  });

  const assignedMentors = trainers.filter((t) => t.isAssignedMentor);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject || !messageBody) return;
    setSending(true);

    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setContactModalTrainer(null);
        setMessageSubject('');
        setMessageBody('');
      }, 1500);
    }, 600);
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Academic Mentorship
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Faculty Mentors & Senior Instructors
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Connect directly with Ministry of Earth Sciences and IMD scientists supervising your training curriculum.
              </p>
            </div>
          </div>

          {/* Section 1: Assigned Mentors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Your Assigned Faculty Mentors</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Linked to your active courses</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedMentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="p-6 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 border-indigo-100 rounded-3xl shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                        {mentor.name.charAt(4) || mentor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{mentor.name}</h3>
                        <p className="text-xs text-indigo-700 font-semibold">{mentor.designation}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {mentor.department}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Active Mentor
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">
                    &ldquo;{mentor.bio}&rdquo;
                  </p>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Office Hours:</span>
                      <span className="font-normal text-slate-600">{mentor.officeHours}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Course:</span>
                      <span className="font-normal text-slate-600 truncate max-w-xs">
                        {mentor.coursesTaught[0]}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {mentor.yearsExperience} yrs research experience
                    </span>

                    <Button
                      size="sm"
                      onClick={() => setContactModalTrainer(mentor)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 rounded-xl shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      <span>Contact Mentor</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Section 2: Full Faculty Directory */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>All Meteorological Faculty & Scientists</span>
              </h2>
            </div>

            {/* Filter & Search */}
            <Card className="p-4 bg-white border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search by instructor name, division, or technical specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {specialties.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                        selectedSpecialty === spec
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Directory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrainers.map((trainer) => (
                <Card
                  key={trainer.id}
                  className="p-5 bg-white border-slate-200 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {trainer.name.charAt(4) || trainer.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {trainer.name}
                        </h3>
                        <p className="text-[11px] text-indigo-700 font-semibold truncate">
                          {trainer.designation}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{trainer.organization}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {trainer.bio}
                    </p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1">
                      {trainer.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {trainer.yearsExperience} yrs exp
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setContactModalTrainer(trainer)}
                      className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 h-8"
                    >
                      <Mail className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      <span>Inquire</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Trainer Modal */}
          {contactModalTrainer && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900">
                      Send Inquiry to {contactModalTrainer.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {contactModalTrainer.designation} • {contactModalTrainer.department}
                    </p>
                  </div>
                  <button
                    onClick={() => setContactModalTrainer(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    ✕
                  </button>
                </div>

                {sentSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-800">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-sm">Message Sent Successfully!</p>
                    <p className="text-xs text-emerald-700">
                      Your query has been routed to {contactModalTrainer.name}&apos;s official desk.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Subject *</label>
                      <Input
                        required
                        placeholder="e.g. Question on Polarimetric Radar ZDR calibration"
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Inquiry / Topic *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Describe your meteorological question, conceptual difficulty, or request for guidance during office hours..."
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">Office Hours Schedule:</p>
                      <p>{contactModalTrainer.officeHours || 'By appointment via portal dispatch'}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactModalTrainer(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={sending}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        <span>{sending ? 'Sending...' : 'Send Message'}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
