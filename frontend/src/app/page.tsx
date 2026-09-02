'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  ShieldCheck,
  Activity,
  Server,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { TraineeOnboardingModal } from '@/features/auth';

export default function HomePage() {
  const { user } = useAuthStore();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const isTrainee = user?.role === 'TRAINEE';
  const profileCompletion = user?.traineeProfile?.profileCompletion || 0;
  const isProfileIncomplete = isTrainee && profileCompletion < 80;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                  {user?.role || 'MEMBER'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Welcome back, {user?.firstName || 'Learner'}!
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Capacity Building & Learning Portal
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Continuous competency development, assessment tracking, and trainer matching.
              </p>
            </div>

            {isTrainee && (
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.99] self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isProfileIncomplete ? 'Complete Trainee Profile' : 'Update Profile & Skills'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Trainee Onboarding Prompt Banner if Incomplete */}
          {isProfileIncomplete && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-indigo-50/40 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5 sm:mt-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Your Trainee Profile is Not Finished ({profileCompletion}%)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Set your department, designation, and skills so we can provide personalized
                    course suggestions and match you with trainers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs rounded-xl transition-colors shadow-2xs shrink-0"
              >
                Setup Now
              </button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Backend API</p>
                  <h3 className="text-base font-bold text-slate-900">Express + Prisma</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                Live at{' '}
                <code className="text-indigo-600 font-mono">http://localhost:5000/api/v1</code>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Security & RBAC</p>
                  <h3 className="text-base font-bold text-slate-900">JWT & Token Rotation</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                HttpOnly cookies & 256-bit SHA token hashes
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Frontend Engine</p>
                  <h3 className="text-base font-bold text-slate-900">Next.js App Router</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-medium">
                React Hook Form, Zod & TanStack Query v5
              </p>
            </div>
          </div>

          {/* User Details & Organization Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Profile & Mapping Status</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {user?.traineeProfile ? 'Trainee Enrolled' : 'Member Active'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-800">
                    {user?.firstName} {user?.lastName || ''}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Work Email</span>
                  <span className="font-bold text-slate-800">{user?.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Assigned Role</span>
                  <span className="font-bold text-indigo-700">{user?.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Designation</span>
                  <span className="font-bold text-slate-800">
                    {user?.traineeProfile?.designation ||
                      user?.trainerProfile?.designation ||
                      'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Learning Interests</span>
                  <span className="font-bold text-slate-800">
                    {user?.traineeProfile?.interests?.length
                      ? user.traineeProfile.interests.join(', ')
                      : 'None configured'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Enterprise Capabilities Active</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Public registration restricted to <strong>Trainee</strong> and{' '}
                    <strong>Trainer</strong> roles.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Automated Trainee details & skills collection onboarding workflow.</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Professional White theme design system with subtle contrast and soft elevation.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Protected routes with role-based navigation view isolation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Trainee Onboarding Modal */}
      <TraineeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </ProtectedRoute>
  );
}
