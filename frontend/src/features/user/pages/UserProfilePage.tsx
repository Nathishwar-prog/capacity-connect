import React, { useState } from 'react';
import useUser from '../hooks/useUser';
import UserForm from '../components/UserForm';
import { UserFormValues } from '../validation/user.validation';
import { Shield, Key, User as UserIcon, Building2, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const UserProfilePage: React.FC = () => {
  const { profile, isLoadingProfile, profileError, updateProfile, isUpdatingProfile } = useUser();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

  const handleUpdate = async (values: UserFormValues) => {
    setSuccessMessage(null);
    await updateProfile({
      email: values.email,
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
      ...(isAdmin ? { role: values.role } : {}),
      password: values.password || undefined,
    });
    setSuccessMessage('Profile details updated successfully.');
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
      <div className="max-w-md mx-auto my-12">
        <Alert variant="destructive">
          <AlertDescription>
            {profileError?.message || 'Could not fetch your profile details.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Ministry of Earth Sciences / IMD</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          User Account & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your official profile, contact details, and institutional credentials.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                <UserIcon className="w-4 h-4" />
                <span>Personal & Authentication Details</span>
              </div>
              <CardTitle className="text-lg font-extrabold text-slate-900">
                Institutional Profile
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

        {/* Permissions & Security Sidebar */}
        <div className="space-y-6">
          {/* Access Control Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Access Privileges</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Assigned Authority Role
                </span>
                <div className="mt-1">
                  <Badge variant="purple">{profile.role}</Badge>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                  Granted System Permissions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.permissions || []).length > 0 ? (
                    profile.permissions!.map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-md font-semibold"
                      >
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Default role permissions
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Security Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Authentication Integrity</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Your portal session is safeguarded with short-lived JWT access tokens and
                cryptographically hashed refresh cookies conforming to Ministry security guidelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
