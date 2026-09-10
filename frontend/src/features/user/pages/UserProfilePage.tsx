import React, { useState } from 'react';
import useUser from '../hooks/useUser';
import UserForm from '../components/UserForm';
import { UserFormValues } from '../validation/user.validation';
import {
  Shield,
  Key,
  User as UserIcon,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  Clock,
  Laptop,
  Check,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface PermissionCategory {
  title: string;
  code: string;
  description: string;
  permissions: Array<{ name: string; key: string; enabled: boolean }>;
}

export const UserProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const { profile, isLoadingProfile, profileError, updateProfile, isUpdatingProfile } = useUser();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions' | 'activity'>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Accordion state for collapsible permission groups
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    users: true,
    courses: true,
    assessments: false,
    competencies: false,
    revision: false,
    trainers: false,
    resources: false,
  });

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

  const handleUpdate = async (values: UserFormValues) => {
    setSuccessMessage(null);
    try {
      await updateProfile({
        email: values.email,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        ...(isAdmin ? { role: values.role } : {}),
        password: values.password || undefined,
      });
      setSuccessMessage('Institutional profile credentials updated successfully.');
      showToast('Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-xs font-semibold">
        <span>Loading institutional profile settings...</span>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-white border border-rose-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-900">Profile Unavailable</h4>
        <p className="text-xs text-slate-500">
          {profileError?.message || 'Could not fetch your institutional profile details.'}
        </p>
      </div>
    );
  }

  // Institutional grouped permissions tree
  const permissionCategories: PermissionCategory[] = [
    {
      title: 'User Management',
      code: 'users',
      description: 'Account provisioning, identity verification and role allocation',
      permissions: [
        { name: 'View personnel directory', key: 'user:read', enabled: true },
        { name: 'Create personnel accounts', key: 'users:create', enabled: true },
        { name: 'Update user profiles & credentials', key: 'users:update', enabled: true },
        { name: 'Delete user accounts', key: 'users:delete', enabled: isAdmin },
        { name: 'Approve new staff registrations', key: 'user:approve', enabled: true },
        { name: 'Manage and promote system roles', key: 'user:role:update', enabled: true },
      ],
    },
    {
      title: 'Course & Curriculum Governance',
      code: 'courses',
      description: 'Instructional modules, syllabus approval, and publication status',
      permissions: [
        { name: 'Create training curricula', key: 'course:create', enabled: true },
        { name: 'Update course structures & modules', key: 'course:update', enabled: true },
        { name: 'Approve submitted courses', key: 'course:approve', enabled: true },
        { name: 'Publish courses to national portal', key: 'courses:publish', enabled: true },
        { name: 'Archive obsolete curriculum versions', key: 'courses:archive', enabled: true },
      ],
    },
    {
      title: 'Assessments & Quizzes',
      code: 'assessments',
      description: 'Competency tests, questionnaires, and grading evaluations',
      permissions: [
        { name: 'Create competency assessments', key: 'assessment:create', enabled: true },
        { name: 'Evaluate learner submissions', key: 'assessments:evaluate', enabled: true },
        { name: 'Grade practical evaluations', key: 'assessments:grade', enabled: true },
        { name: 'Inspect assessment analytics', key: 'analytics:view', enabled: true },
      ],
    },
    {
      title: 'Competency Framework',
      code: 'competencies',
      description: 'WMO & IMD operational meteorology competency models',
      permissions: [
        { name: 'View competency standards', key: 'competencies:read', enabled: true },
        { name: 'Manage competency thresholds & weights', key: 'competencies:manage', enabled: true },
        { name: 'Track organizational skill gaps', key: 'skill-gaps:read', enabled: true },
      ],
    },
    {
      title: 'Adaptive Revision Engine',
      code: 'revision',
      description: 'Spaced repetition cycles and forgetting risk calculations',
      permissions: [
        { name: 'Inspect forgetting risk analytics', key: 'revision:read', enabled: true },
        { name: 'Trigger algorithmic revision cycles', key: 'revision:generate', enabled: true },
      ],
    },
    {
      title: 'Domain Trainers',
      code: 'trainers',
      description: 'Instructor accreditation, matching, and monitoring',
      permissions: [
        { name: 'View trainer roster', key: 'trainer:read', enabled: true },
        { name: 'Manage trainer assignments', key: 'trainer:manage', enabled: true },
      ],
    },
    {
      title: 'Learning Resources Repository',
      code: 'resources',
      description: 'Institutional document library, videos, and scientific papers',
      permissions: [
        { name: 'View resources library', key: 'resources:read', enabled: true },
        { name: 'Upload learning resources', key: 'resource:upload', enabled: true },
        { name: 'Approve & publish resources', key: 'resources:approve', enabled: true },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Ministry of Earth Sciences / IMD • Institutional Administration</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrator Profile & Governance Credentials
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal credentials, institutional affiliation, session security, and access privileges.
            </p>
          </div>
          <RoleBadge role={profile.role} />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Profile Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Security & Sessions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'permissions'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Access Privileges & RBAC
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Activity Trail
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TAB 1: PROFILE INFORMATION */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                  <UserIcon className="w-4 h-4" />
                  <span>Personal & Contact Credentials</span>
                </div>
                <CardTitle className="text-base font-extrabold text-slate-900">
                  Institutional Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <UserForm
                  initialValues={profile}
                  onSubmit={handleUpdate}
                  isLoading={isUpdatingProfile}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Institutional Affiliation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Organization / Ministry
                  </span>
                  <p className="font-bold text-slate-900">Ministry of Earth Sciences (MoES)</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Operational Agency
                  </span>
                  <p className="font-bold text-slate-900">India Meteorological Department (IMD)</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Department Division
                  </span>
                  <p className="font-bold text-slate-900">
                    {profile.department?.name || 'Institutional Administration & Governance'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Authentication & Credentials</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 block">Password</span>
                  <span className="text-[11px] text-slate-500">••••••••••••••</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                  className="text-xs"
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 block">Last Password Update</span>
                  <span className="text-[11px] text-slate-500">12 Aug 2026</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Compliant
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Two-Factor Authentication</span>
                  <span className="text-[11px] text-slate-500">
                    Hardware key / OTP second factor
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  Not configured
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Active Portal Sessions</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Current Workstation</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded">
                      This Device
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Windows • Chrome 152 • Localhost (::1)</p>
                  <span className="text-[10px] text-slate-400 block">Active now</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">IMD Operations Terminal</span>
                  <p className="text-[11px] text-slate-500">New Delhi HQ • Verified Static IP</p>
                  <span className="text-[10px] text-slate-400 block">Yesterday, 18:30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: ACCESS PRIVILEGES & RBAC (COLLAPSIBLE GROUPS) */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950">
                  Assigned Authority Role: {profile.role}
                </h4>
                <p className="text-[11px] text-indigo-800/80">
                  Full institutional governance access across personnel, courses, and platform intelligence.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">
              Root Authority
            </span>
          </div>

          <div className="space-y-3">
            {permissionCategories.map((cat) => {
              const isExpanded = expandedCategories[cat.code];
              return (
                <div
                  key={cat.code}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.code)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {cat.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {cat.description}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {cat.permissions.length} actions
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.permissions.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/70 text-xs"
                          >
                            <div className="w-4 h-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-slate-800 block truncate">
                                {perm.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {perm.key}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY TRAIL */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Recent Administrator Operations</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">
                    Institutional Profile Settings Checked
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Governance credentials and active permissions verified.
                  </p>
                  <span className="text-[10px] text-slate-400 block">Today, 07:23 AM</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">Authenticated SSO Session</span>
                  <p className="text-[11px] text-slate-500">
                    Short-lived JWT issued with administrative security claims.
                  </p>
                  <span className="text-[10px] text-slate-400 block">Today, 07:15 AM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProfilePage;
