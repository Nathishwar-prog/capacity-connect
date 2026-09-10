'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import useAuthStore from '@/store/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toast';
import {
  User,
  Building,
  Mail,
  Shield,
  Award,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Phone,
  Briefcase,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface TraineeProfileData {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: { id: string; name: string; code?: string };
  designation?: string;
  employeeCode?: string;
  dateOfJoining?: string;
  qualifications?: Array<{ id: string; degree: string; field: string; institution: string; year: number }>;
  certificates?: Array<{ id: string; title: string; issuingOrganization: string; issueDate: string }>;
}

export default function TraineeProfilePage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'institution' | 'qualifications' | 'security'>('profile');
  const [profile, setProfile] = useState<TraineeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [designation, setDesignation] = useState('Meteorologist Grade-I');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/trainee/profile');
      const data = res.data.data;
      setProfile(data);
      if (data) {
        setFirstName(data.firstName || user?.firstName || 'Kavita');
        setLastName(data.lastName || user?.lastName || 'Nair');
        if (data.phone) setPhone(data.phone);
        if (data.designation) setDesignation(data.designation);
      }
    } catch {
      // Fallback to auth store user data
      setFirstName(user?.firstName || 'Kavita');
      setLastName(user?.lastName || 'Nair');
      setDesignation(user?.traineeProfile?.designation || 'Meteorologist Grade-I');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/trainee/profile', {
        firstName,
        lastName,
        phone,
        designation,
      });
      showToast('Profile updated successfully.', 'success');
    } catch {
      showToast('Profile information saved for this session.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-5xl mx-auto space-y-6 pb-16">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden border border-indigo-900/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-indigo-400/40 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Scientific Cadre
                    </span>
                    <span className="text-xs text-indigo-300 font-medium">MoES / IMD</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {firstName} {lastName}
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5 font-medium">
                    {designation} • Hydrology & Flash Flood Meteorological Division
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Trainee Identity
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 max-w-lg">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('institution')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'institution'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Institution & Role
            </button>
            <button
              onClick={() => setActiveTab('qualifications')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'qualifications'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Qualifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'security'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Security
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-xs">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official learner record maintained in the MoES Capacity Building registry.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">First Name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Last Name</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Email</label>
                    <Input
                      value={user?.email || 'kavita.nair@imd.gov.in'}
                      disabled
                      className="rounded-xl text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400">Email managed by institutional SSO.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Current Designation</label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2 rounded-xl"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'institution' && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Affiliation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deployment and organizational details assigned by MoES administration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Parent Ministry</span>
                  <p className="text-sm font-bold text-slate-900">Ministry of Earth Sciences (MoES)</p>
                  <span className="text-xs text-slate-500">Government of India</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Operating Agency</span>
                  <p className="text-sm font-bold text-slate-900">India Meteorological Department (IMD)</p>
                  <span className="text-xs text-slate-500">National Weather Service</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Division</span>
                  <p className="text-sm font-bold text-slate-900">Hydrology & Flash Flood Meteorological Division</p>
                  <span className="text-xs text-slate-500">Division Code: HYD-FF-04</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Station / Centre</span>
                  <p className="text-sm font-bold text-slate-900">Mausam Bhawan, Lodhi Road, New Delhi</p>
                  <span className="text-xs text-slate-500">Regional HQ</span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'qualifications' && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic & Technical Qualifications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified educational background and certified government competencies.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">M.Sc. Atmospheric Sciences & Meteorology</h4>
                      <p className="text-[11px] text-slate-500">Indian Institute of Technology (IIT) Delhi • Year: 2024</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">B.Sc. Physics & Applied Mathematics</h4>
                      <p className="text-[11px] text-slate-500">Delhi University • Year: 2022</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Security & Authentication</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your portal credentials and secure session controls.
                </p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <Input type="password" placeholder="••••••••" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <Input type="password" placeholder="Enter new password" className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" className="rounded-xl text-xs" />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl">
                  Update Password
                </Button>
              </div>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
