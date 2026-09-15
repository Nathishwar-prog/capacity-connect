'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  User,
  Building,
  Target,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  ShieldCheck,
  Check,
  Award,
  Layers,
  Clock,
  BookOpen,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface RoleProfile {
  id: string;
  name: string;
  code: string;
  department: string | null;
  description: string | null;
  competencyCount: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function TraineeOnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Metadata from backend
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form State
  // Step 1: Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('Indian Meteorological Department (IMD)');

  // Step 2: Cadre & Target Role
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(2);

  // Step 3: Self-Reported Skills
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<Array<{ name: string; proficiencyLevel: number }>>([
    { name: 'Synoptic Meteorology', proficiencyLevel: 3 },
    { name: 'Radar Meteorology', proficiencyLevel: 2 },
  ]);

  // Step 4: Learning Goals & Preferences
  const [learningGoals, setLearningGoals] = useState<string[]>([
    'Severe Convective Weather Nowcasting',
    'Doppler Radar Velocity Interpretation',
  ]);
  const [goalInput, setGoalInput] = useState('');
  const [preferredLearningMode, setPreferredLearningMode] = useState('HYBRID');
  const [preferredLanguage, setPreferredLanguage] = useState('English / Hindi');
  const [availableHoursPerWeek, setAvailableHoursPerWeek] = useState(5);
  const [preferredTrainerMode, setPreferredTrainerMode] = useState('ONE_ON_ONE');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoadingMeta(true);
    try {
      const [rolesRes, userRes] = await Promise.all([
        apiClient.get('/roles').catch(() => ({ data: { data: [] } })),
        apiClient.get('/auth/me').catch(() => ({ data: { data: null } })),
      ]);

      const fetchedRoles = rolesRes.data?.data || [];
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(fetchedRoles[0].id);
      }

      const userData = userRes.data?.data;
      if (userData) {
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setDesignation(userData.traineeProfile?.designation || 'Meteorologist Grade-I');
        if (userData.departmentId) setDepartmentId(userData.departmentId);
      }
    } catch (err) {
      console.error('Failed to load onboarding metadata:', err);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.some((s) => s.name.toLowerCase() === skillInput.trim().toLowerCase())) {
      setSkills([...skills, { name: skillInput.trim(), proficiencyLevel: 3 }]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const handleUpdateProficiency = (name: string, level: number) => {
    setSkills(
      skills.map((s) => (s.name === name ? { ...s, proficiencyLevel: level } : s)),
    );
  };

  const handleAddGoal = () => {
    if (!goalInput.trim()) return;
    if (!learningGoals.includes(goalInput.trim())) {
      setLearningGoals([...learningGoals, goalInput.trim()]);
    }
    setGoalInput('');
  };

  const handleRemoveGoal = (goal: string) => {
    setLearningGoals(learningGoals.filter((g) => g !== goal));
  };

  const steps = [
    { number: 1, title: 'Personal' },
    { number: 2, title: 'Target Role' },
    { number: 3, title: 'Current Skills' },
    { number: 4, title: 'Preferences' },
    { number: 5, title: 'Review & Finish' },
  ];

  const handleNext = () => {
    if (currentStep === 1 && (!firstName.trim() || !designation.trim())) {
      showToast('Please provide your name and cadre designation.', 'error');
      return;
    }
    if (currentStep === 2 && !selectedRoleId) {
      showToast('Please select your target operational role.', 'error');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmitOnboarding = async (takeDiagnosticCheck: boolean) => {
    setSubmitting(true);
    try {
      await apiClient.post('/trainee/onboarding', {
        firstName,
        lastName,
        phone,
        designation,
        departmentId: departmentId || undefined,
        targetRoleId: selectedRoleId,
        yearsExperience,
        skills,
        learningGoals,
        preferredLearningMode,
        preferredLanguage,
        availableHoursPerWeek,
        preferredTrainerMode,
      });

      showToast('Cadre capacity onboarding saved successfully!', 'success');

      if (takeDiagnosticCheck) {
        router.push('/trainee/diagnostic');
      } else {
        router.push('/trainee/recommendations');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit onboarding profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              MoES / IMD Cadre Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trainee Capacity Building Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Configure your operational cadre role, baseline competencies, and learning pathway to receive authoritative, explainable course recommendations.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-0" />
              {steps.map((step) => {
                const isPassed = currentStep > step.number;
                const isCurrent = currentStep === step.number;
                return (
                  <div key={step.number} className="relative z-10 flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : step.number}
                    </div>
                    <span
                      className={`text-[10px] font-bold hidden sm:block ${
                        isCurrent ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Body */}
          <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-sm min-h-[420px] flex flex-col justify-between">
            {/* STEP 1: Personal & Identity */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Step 1: Personal & Institutional Identity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm your registration credentials and cadre designation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      First Name <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-slate-400 font-normal">(REQUIRED)</span>
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Kavita"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Last Name
                      <span className="text-[10px] text-slate-400 font-normal">(RECOMMENDED)</span>
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Nair"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Cadre Designation <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-slate-400 font-normal">(REQUIRED)</span>
                    </label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Meteorologist Grade-I"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      Contact Mobile / CUG
                      <span className="text-[10px] text-slate-400 font-normal">(OPTIONAL)</span>
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Organization</label>
                    <Input
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      disabled
                      className="rounded-xl text-xs bg-slate-50 text-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Target Cadre Role */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    Step 2: Operational Cadre & Target Role
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your official IMD/MoES role. Competency requirements are resolved strictly from the institutional catalogue.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              {role.name}
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                              {role.description || 'Operational meteorological capacity building.'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700 shrink-0">
                            {role.competencyCount} Comps
                          </span>
                        </div>
                        {role.department && (
                          <div className="text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100">
                            🏢 {role.department}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Years of Operational Experience</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 5, 8, 12].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYearsExperience(yr)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                            yearsExperience === yr
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {yr}+ yrs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Current Skills & Baseline Proficiency */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Step 3: Self-Reported Skills & Current Proficiency
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specify current technical proficiencies to assist the AI gap analyzer. Self-reported scores form cold-start priors.
                  </p>
                </div>

                {/* Add skill input */}
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. Python for Meteorology, Doppler Radar, WRF Modeling"
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSkill}
                    variant="outline"
                    className="rounded-xl text-xs shrink-0 font-bold"
                  >
                    + Add Skill
                  </Button>
                </div>

                {/* List of skills with level selectors */}
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {skills.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 space-y-1">
                      <div className="font-bold">No skills entered yet</div>
                      <p className="text-[11px] text-amber-700">
                        Adding current skills improves recommendation accuracy. If left blank, you can establish your baseline via a 10-minute diagnostic assessment.
                      </p>
                    </div>
                  ) : (
                    skills.map((s) => (
                      <div
                        key={s.name}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Current Level: {s.proficiencyLevel}/5 •{' '}
                            {s.proficiencyLevel <= 1
                              ? 'Novice'
                              : s.proficiencyLevel === 2
                              ? 'Developing'
                              : s.proficiencyLevel === 3
                              ? 'Competent / Operational'
                              : s.proficiencyLevel === 4
                              ? 'Proficient'
                              : 'Expert'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleUpdateProficiency(s.name, lvl)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                                s.proficiencyLevel === lvl
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s.name)}
                            className="ml-2 text-xs text-rose-500 hover:text-rose-700 font-bold p-1"
                            title="Remove Skill"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Learning Preferences */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    Step 4: Learning Goals & Modality Preferences
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tailor curriculum formats and pacing to your institutional roster.
                  </p>
                </div>

                {/* Goals */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Primary Learning Goals</label>
                  <div className="flex gap-2">
                    <Input
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGoal();
                        }
                      }}
                      placeholder="e.g. Master Dual-Polarization Radar signatures"
                      className="rounded-xl text-xs"
                    />
                    <Button
                      type="button"
                      onClick={handleAddGoal}
                      variant="outline"
                      className="rounded-xl text-xs shrink-0 font-bold"
                    >
                      + Add Goal
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {learningGoals.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold flex items-center gap-1.5"
                      >
                        <span>{g}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(g)}
                          className="hover:text-indigo-950 font-black"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modality & Pacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Preferred Learning Modality</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['HYBRID', 'ONLINE', 'SELF_PACED'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPreferredLearningMode(mode)}
                          className={`p-2 rounded-xl text-xs font-bold border text-center transition-colors ${
                            preferredLearningMode === mode
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mode === 'HYBRID' ? 'Hybrid' : mode === 'ONLINE' ? 'Online' : 'Self-Paced'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Available Learning Pacing</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[3, 5, 10].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setAvailableHoursPerWeek(hrs)}
                          className={`p-2 rounded-xl text-xs font-bold border text-center transition-colors ${
                            availableHoursPerWeek === hrs
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {hrs} hrs/wk
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Next Action */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Step 5: Review Profile & Choose Next Step
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your profile data will initialize the learner model. Choose how to proceed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Summary card */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Profile Summary
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <div>
                        <strong>Name:</strong> {firstName} {lastName}
                      </div>
                      <div>
                        <strong>Designation:</strong> {designation}
                      </div>
                      <div>
                        <strong>Target Cadre:</strong> {selectedRole?.name || 'Selected'}
                      </div>
                      <div>
                        <strong>Current Skills:</strong> {skills.length} skills added
                      </div>
                      <div>
                        <strong>Learning Mode:</strong> {preferredLearningMode} ({availableHoursPerWeek} hrs/wk)
                      </div>
                    </div>
                  </div>

                  {/* Cold-Start Diagnostic Callout */}
                  <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        Recommended Cold-Start Action
                      </div>
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        Take a quick 10-minute diagnostic check to calibrate your objective competency scores across Atmospheric Dynamics, Radar, and NWP.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitOnboarding(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Take 10-Min Diagnostic Check</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
                className="rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitOnboarding(false)}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete & View Recommendations</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
