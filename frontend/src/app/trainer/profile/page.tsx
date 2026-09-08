'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  useTrainerProfile,
  useUpdateTrainerProfile,
  useAddExpertise,
  useRemoveExpertise,
} from '@/features/trainer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building2,
  Mail,
  Phone,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Save,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Loader2,
} from 'lucide-react';

export default function TrainerProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function TrainerProfileContent() {
  const { data, isLoading } = useTrainerProfile();
  const updateProfileMutation = useUpdateTrainerProfile();
  const addExpertiseMutation = useAddExpertise();
  const removeExpertiseMutation = useRemoveExpertise();

  const [activeTab, setActiveTab] = useState<'profile' | 'expertise' | 'qualifications'>('profile');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New skill input
  const [newSkillId, setNewSkillId] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<number>(3);

  // Sync initial state from backend
  if (data?.user?.trainerProfile && !isInitialized) {
    setDesignation(data.user.trainerProfile.designation || '');
    setBio(data.user.trainerProfile.bio || '');
    setYearsExperience(data.user.trainerProfile.yearsExperience || 0);
    setIsInitialized(true);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        designation,
        bio,
        yearsExperience: Number(yearsExperience),
      });
      setStatusMessage('Profile updated successfully.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage('Failed to update profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const user = data?.user;
  const stats = data?.stats;
  const expertise = user?.trainerProfile?.expertise || [];
  const qualifications = user?.qualifications || [];
  const experiences = user?.workExperiences || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-100 bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-white text-xl font-black">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0) || ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {user?.firstName} {user?.lastName || ''}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                  {user?.role}
                </Badge>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                {user?.trainerProfile?.designation || 'Senior Scientific Instructor'} •{' '}
                {user?.department?.name || 'Department of Earth Sciences'}
              </p>
              <p className="text-[11px] text-indigo-300/80">
                {user?.organization?.name || 'Ministry of Earth Sciences'}
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
            <div className="text-center">
              <span className="block text-lg font-black text-white">
                {stats?.totalCourses || 0}
              </span>
              <span className="text-[10px] text-indigo-200 font-medium uppercase">Courses</span>
            </div>
            <div className="text-center border-x border-white/10 px-3">
              <span className="block text-lg font-black text-emerald-400">
                {stats?.learnersTrained || 0}
              </span>
              <span className="text-[10px] text-indigo-200 font-medium uppercase">Trainees</span>
            </div>
            <div className="text-center">
              <span className="block text-lg font-black text-amber-400">
                {stats?.avgAssessmentScore || 0}%
              </span>
              <span className="text-[10px] text-indigo-200 font-medium uppercase">Avg Score</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            Personal & Bio
          </button>
          <button
            onClick={() => setActiveTab('expertise')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'expertise'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            Domain Expertise ({expertise.length})
          </button>
          <button
            onClick={() => setActiveTab('qualifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'qualifications'
                ? 'bg-white text-indigo-950 shadow-sm'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            Academic & Experience
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Professional Details</CardTitle>
              <p className="text-xs text-slate-500">
                Update your official designation and curriculum biography
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="e.g. Scientist 'G' & Head of Numerical Modeling"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Scientific Experience
                  </label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                    min={0}
                    max={60}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instructional Biography
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="Describe your domain specializations, research publications, and instructional methodology..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  <span>Save Changes</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Institutional Affiliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Organization
                  </span>
                  <p className="text-xs font-bold text-slate-900">{user?.organization?.name}</p>
                  <span className="text-[10px] text-slate-500">
                    Code: {user?.organization?.code}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Department / Division
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {user?.department?.name || 'General Faculty'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Official Email
                  </span>
                  <p className="text-xs font-semibold text-slate-900">{user?.email}</p>
                </div>
              </div>

              {user?.phone && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Contact Number
                    </span>
                    <p className="text-xs font-semibold text-slate-900">{user?.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Domain Expertise */}
      {activeTab === 'expertise' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Scientific Skills & Competencies</CardTitle>
                <p className="text-xs text-slate-500">
                  Domain skills mapped to your instructional portfolio
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {expertise.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No domain skills attached to profile yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertise.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{exp.skill.name}</h4>
                          <button
                            onClick={() => removeExpertiseMutation.mutate(exp.skill.id)}
                            disabled={removeExpertiseMutation.isPending}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {exp.skill.code}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Proficiency Level</span>
                          <span className="text-indigo-600 font-bold">
                            Level {exp.proficiencyLevel} / 5
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${(exp.proficiencyLevel / 5) * 100}%` }}
                          />
                        </div>
                        {exp.yearsExperience && (
                          <span className="text-[10px] text-slate-500 block">
                            {exp.yearsExperience} years teaching this domain
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Qualifications & Experience */}
      {activeTab === 'qualifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Academic Qualifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qualifications.length === 0 ? (
                <p className="text-xs text-slate-500">No qualifications recorded.</p>
              ) : (
                <div className="space-y-4">
                  {qualifications.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <h4 className="text-xs font-bold text-slate-900">
                        {q.degree} in {q.fieldOfStudy}
                      </h4>
                      <p className="text-[11px] text-slate-600">{q.institution}</p>
                      {q.description && (
                        <p className="text-[11px] text-slate-500 mt-1">{q.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Scientific & Faculty History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {experiences.length === 0 ? (
                <p className="text-xs text-slate-500">No past scientific positions recorded.</p>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{exp.jobTitle}</h4>
                        {exp.isCurrent && (
                          <Badge variant="success" className="text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">{exp.companyName}</p>
                      {exp.description && (
                        <p className="text-[11px] text-slate-500 mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
