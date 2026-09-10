'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  User,
  Building,
  Target,
  FileCheck,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function TraineeSetupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Step state
  const [name, setName] = useState('Kavita Nair');
  const [designation, setDesignation] = useState('Meteorologist Grade-I');
  const [division, setDivision] = useState('Hydrology & Flash Flood Meteorological Division');
  const [station, setStation] = useState('Mausam Bhawan, Lodhi Road, New Delhi');
  const [primaryDomain, setPrimaryDomain] = useState('Doppler Weather Radar');
  const [targetLevel, setTargetLevel] = useState('Operational / Intermediate (Level 3)');
  const [hoursPerWeek, setHoursPerWeek] = useState(4);

  // Diagnostic question answers
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Profile' },
    { number: 2, title: 'Institution' },
    { number: 3, title: 'Role & Domain' },
    { number: 4, title: 'Learning Goals' },
    { number: 5, title: 'Diagnostic Check' },
    { number: 6, title: 'Pathway' },
  ];

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleCompleteSetup = () => {
    setSubmitting(true);
    showToast('Trainee capacity onboarding complete. Launching your personalized dashboard.', 'success');
    setTimeout(() => {
      router.push('/dashboard/trainee');
    }, 600);
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              MoES / IMD Capacity Setup
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personalized Trainee Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Configure your institutional division, operational cadre profile, baseline competencies, and learning pathway.
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
          <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-sm min-h-[380px] flex flex-col justify-between">
            {/* STEP 1: Profile Confirmation */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 1: Verify Trainee Identity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confirm your government registration details and official designation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Full Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Current Cadre Designation</label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Institutional SSO Email</label>
                    <Input
                      value="kavita.nair@imd.gov.in"
                      disabled
                      className="rounded-xl text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Institution & Division */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 2: Departmental Affiliation</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your operational division and primary meteorological duty station.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Assigned Division</label>
                    <select
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option>Hydrology & Flash Flood Meteorological Division</option>
                      <option>Radar & Severe Weather Meteorology</option>
                      <option>Numerical Weather Prediction (NWP) Modeling</option>
                      <option>Satellite Meteorology Division (INSAT)</option>
                      <option>Cyclone Warning Division (CWD)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Operating Centre / HQ</label>
                    <Input
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Role & Scientific Domain */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 3: Primary Scientific Discipline</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select the operational core area you wish to build capacity in first.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      title: 'Doppler Weather Radar',
                      desc: 'Signal processing, dual-polarization moments, echo classification.',
                    },
                    {
                      title: 'Numerical Weather Prediction (NWP)',
                      desc: '4D-Var data assimilation, WRF parameterization, ensemble systems.',
                    },
                    {
                      title: 'Satellite Meteorology',
                      desc: 'INSAT-3D/3DR multispectral imagery, water vapor and rapid scan analysis.',
                    },
                    {
                      title: 'Hydrology & Flash Flood Modeling',
                      desc: 'Catchment thresholds, precipitation estimation, runoff telemetry.',
                    },
                  ].map((dom) => (
                    <button
                      key={dom.title}
                      type="button"
                      onClick={() => setPrimaryDomain(dom.title)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        primaryDomain === dom.title
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{dom.title}</span>
                      <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{dom.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Learning Goals */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 4: Target Proficiency Benchmarks</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set your target WMO competency certification level and weekly learning commitment.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Target Competency Benchmark</label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option>Operational / Intermediate (Level 3)</option>
                      <option>Advanced Forecaster (Level 4)</option>
                      <option>Lead Specialist / Expert (Level 5)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Weekly Pacing</label>
                    <select
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value={2}>2 hours / week (~15 min daily)</option>
                      <option value={4}>4 hours / week (~30 min daily) [Recommended]</option>
                      <option value={6}>6 hours / week (Intensive)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Diagnostic Assessment */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 5: Baseline Diagnostic Check</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quick two-question calibration to personalize your initial syllabus.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      1. In polarimetric Doppler radar, differential reflectivity (Z_DR) values significantly greater than zero typically indicate:
                    </span>
                    <div className="space-y-1.5">
                      {[
                        'Spherical hail stones tumbling in the downdraft',
                        'Oblate raindrops flattened horizontally by air resistance',
                        'Ground clutter echo reflections',
                      ].map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQ1(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                            q1 === idx
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">
                      2. What is the minimum Sea Surface Temperature (SST) threshold generally required for tropical cyclogenesis in the Bay of Bengal?
                    </span>
                    <div className="space-y-1.5">
                      {['24°C', '26.5°C to 28°C', '32°C and above'].map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQ2(idx)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all ${
                            q2 === idx
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Recommended Pathway */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 6: Recommended Capacity Pathway</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your baseline profile has generated a customized capacity development curriculum.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                      Recommended Pathway
                    </span>
                    <span className="text-xs font-bold text-indigo-900">
                      Operational Doppler Radar & Hydrometeorological Telemetry
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Designed to take you from foundational polarimetric moments to operational quantitative precipitation estimation (QPE) and flash flood warning protocols.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-indigo-800 font-semibold">
                    <span>✓ 3 Core Modules</span>
                    <span>•</span>
                    <span>✓ 8 Interactive Lessons</span>
                    <span>•</span>
                    <span>✓ WMO Level 3 Target Certified</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="text-xs font-bold border-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Back</span>
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={submitting}
                  onClick={handleCompleteSetup}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>{submitting ? 'Activating...' : 'Activate Pathway & Open Dashboard'}</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
