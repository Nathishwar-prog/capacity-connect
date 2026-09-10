import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ChangeRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentRole: string;
  onUpdateRole: (newRole: string) => Promise<void>;
  isLoading?: boolean;
}

const ROLES = [
  {
    role: 'TRAINEE',
    label: 'Trainee',
    desc: 'Access to learning curricula, assessments, smart revision, and competency tracking.',
  },
  {
    role: 'TRAINER',
    label: 'Trainer',
    desc: 'Author courses, create assessments, upload resources, and monitor assigned trainees.',
  },
  {
    role: 'ADMIN',
    label: 'Administrator',
    desc: 'Full platform administration, user directory governance, and curriculum approvals.',
  },
];

export const ChangeRoleDialog: React.FC<ChangeRoleDialogProps> = ({
  isOpen,
  onClose,
  userName,
  currentRole,
  onUpdateRole,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === currentRole) {
      onClose();
      return;
    }
    await onUpdateRole(selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-role-title"
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="change-role-title" className="text-base font-extrabold text-slate-900">
                Change User Role
              </h3>
              <p className="text-xs text-slate-500 font-medium">{userName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="text-xs text-slate-600">
            Current role:{' '}
            <span className="font-bold text-slate-900 uppercase">{currentRole}</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Assign New Role
            </label>

            {ROLES.map(({ role, label, desc }) => {
              const isChecked = selectedRole === role;
              return (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="userRole"
                    value={role}
                    checked={isChecked}
                    onChange={() => setSelectedRole(role)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">{label}</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === currentRole}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleDialog;
