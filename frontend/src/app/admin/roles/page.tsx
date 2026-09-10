'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { ShieldCheck, Check, X, Shield, Users, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/RoleBadge';

export default function AdminRolesPage() {
  const permissionsMatrix = [
    {
      category: 'User Management',
      actions: [
        { name: 'View User Directory', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Create User Accounts', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Approve User Registrations', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Update System Roles', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Delete User Accounts', trainee: false, trainer: false, admin: false, superAdmin: true },
      ],
    },
    {
      category: 'Curriculum & Courses',
      actions: [
        { name: 'Browse Course Catalog', trainee: true, trainer: true, admin: true, superAdmin: true },
        { name: 'Author New Courses', trainee: false, trainer: true, admin: true, superAdmin: true },
        { name: 'Publish Curricula', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Archive Courses', trainee: false, trainer: false, admin: true, superAdmin: true },
      ],
    },
    {
      category: 'Assessments & Quizzes',
      actions: [
        { name: 'Attempt Assessments', trainee: true, trainer: false, admin: false, superAdmin: true },
        { name: 'Create Questionnaires', trainee: false, trainer: true, admin: true, superAdmin: true },
        { name: 'Evaluate & Grade Attempts', trainee: false, trainer: true, admin: true, superAdmin: true },
      ],
    },
    {
      category: 'Competencies & Revision',
      actions: [
        { name: 'View Competency Profile', trainee: true, trainer: true, admin: true, superAdmin: true },
        { name: 'Manage Competency Models', trainee: false, trainer: false, admin: true, superAdmin: true },
        { name: 'Generate Revision Cycles', trainee: true, trainer: true, admin: true, superAdmin: true },
        { name: 'View Platform Audit Trail', trainee: false, trainer: false, admin: true, superAdmin: true },
      ],
    },
  ];

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Access Control & Security</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Roles & Permissions Matrix (RBAC)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Hierarchical role authorization matrix mapping capabilities across Trainees, Trainers, Admins, and Super Admins.
              </p>
            </div>
          </div>

          {/* Role Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <RoleBadge role="SUPER_ADMIN" size="sm" />
              <p className="text-xs text-slate-600 font-medium pt-1">
                Unrestricted platform root access and system security governance.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <RoleBadge role="ADMIN" size="sm" />
              <p className="text-xs text-slate-600 font-medium pt-1">
                Administrative directory governance, curriculum publishing, and institutional monitoring.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <RoleBadge role="TRAINER" size="sm" />
              <p className="text-xs text-slate-600 font-medium pt-1">
                Course authoring, resource management, assessment creation, and learner feedback.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <RoleBadge role="TRAINEE" size="sm" />
              <p className="text-xs text-slate-600 font-medium pt-1">
                Curriculum enrollment, assessment taking, competency tracking, and smart revision.
              </p>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Functional Area & Permission</th>
                    <th className="py-3 px-4 text-center w-28">Trainee</th>
                    <th className="py-3 px-4 text-center w-28">Trainer</th>
                    <th className="py-3 px-4 text-center w-28">Admin</th>
                    <th className="py-3 px-4 text-center w-28">Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {permissionsMatrix.map((group) => (
                    <React.Fragment key={group.category}>
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={5}
                          className="py-2.5 px-4 font-bold text-indigo-900 uppercase text-[10px] tracking-wider"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.actions.map((act) => (
                        <tr key={act.name} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-800">{act.name}</td>
                          <td className="py-2.5 px-4 text-center">
                            {act.trainee ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {act.trainer ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {act.admin ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {act.superAdmin ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
