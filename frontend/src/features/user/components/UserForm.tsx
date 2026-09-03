import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { userFormSchema, UserFormValues } from '../validation/user.validation';
import { User } from '../types/user.types';
import { ShieldCheck, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserFormProps {
  initialValues?: User;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  isAdmin = false,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { register, handleSubmit } = useForm<UserFormValues>({
    defaultValues: {
      email: initialValues?.email || '',
      firstName: initialValues?.firstName || '',
      lastName: initialValues?.lastName || '',
      role: initialValues?.role || 'TRAINEE',
      password: '',
    },
  });

  const handleFormSubmit = async (data: UserFormValues) => {
    setValidationErrors({});

    // Validate values using Zod schema
    const result = userFormSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      if (!isAdmin) {
        const withoutRole: Record<string, unknown> = { ...data };
        delete withoutRole.role;
        await onSubmit(withoutRole as unknown as UserFormValues);
      } else {
        await onSubmit(data);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setValidationErrors({
        form:
          error.response?.data?.message || error.message || 'An error occurred during submission.',
      });
    }
  };

  const userRole = initialValues?.role || 'TRAINEE';

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5 animate-in fade-in duration-200"
    >
      {validationErrors.form && (
        <Alert variant="destructive">
          <AlertDescription>{validationErrors.form}</AlertDescription>
        </Alert>
      )}

      {/* First & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="firstName" className="block text-xs font-bold text-slate-700">
            First Name
          </label>
          <Input
            id="firstName"
            type="text"
            {...register('firstName')}
            placeholder="Jane"
            error={!!validationErrors.firstName}
          />
          {validationErrors.firstName && (
            <span className="text-[11px] text-rose-600 font-medium block">
              {validationErrors.firstName}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="lastName" className="block text-xs font-bold text-slate-700">
            Last Name
          </label>
          <Input
            id="lastName"
            type="text"
            {...register('lastName')}
            placeholder="Doe"
            error={!!validationErrors.lastName}
          />
          {validationErrors.lastName && (
            <span className="text-[11px] text-rose-600 font-medium block">
              {validationErrors.lastName}
            </span>
          )}
        </div>
      </div>

      {/* Official Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs font-bold text-slate-700">
          Official Email Address
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="official@moes.gov.in / imd.gov.in"
          error={!!validationErrors.email}
        />
        {validationErrors.email && (
          <span className="text-[11px] text-rose-600 font-medium block">
            {validationErrors.email}
          </span>
        )}
      </div>

      {/* Role Display / Control */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">Capacity Building Role</label>

        {isAdmin ? (
          <div className="space-y-1">
            <select
              id="role"
              {...register('role')}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="TRAINEE">Trainee (Capacity Learner)</option>
              <option value="TRAINER">Trainer (Domain Instructor)</option>
              <option value="ADMIN">Administrator (Directory Governance)</option>
              <option value="SUPER_ADMIN">Super Administrator (Root Platform)</option>
            </select>
            <p className="text-[11px] text-indigo-700 font-medium">
              Administrative privilege: you can modify workspace roles.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Assigned Role</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border bg-indigo-50 border-indigo-200 text-indigo-700">
                {userRole === 'TRAINER' ? 'Trainer' : 'Trainee'}
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-medium leading-relaxed">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                You are currently registered as a{' '}
                <strong className="text-slate-700">
                  {userRole === 'TRAINER' ? 'Trainer (Instructor)' : 'Trainee (Learner)'}
                </strong>
                . For security governance, roles can only be updated by authorized MoES / IMD Portal
                Administrators.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Password (Optional) */}
      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs font-bold text-slate-700">
          New Password {initialValues && '(leave empty to keep unchanged)'}
        </label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder="••••••••"
          error={!!validationErrors.password}
        />
        {validationErrors.password && (
          <span className="text-[11px] text-rose-600 font-medium block">
            {validationErrors.password}
          </span>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          className="w-full text-xs font-bold tracking-wide"
        >
          Save Profile Settings
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
