'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  Heart,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import useAuthStore from '@/store/auth';
import { useOnboardingMeta, useSubmitOnboarding } from '../hooks/useOnboarding';

interface TraineeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TraineeOnboardingModal: React.FC<TraineeOnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { data: meta, isLoading: isMetaLoading } = useOnboardingMeta();
  const { mutate: submitOnboarding, isPending: isSubmitting } = useSubmitOnboarding({
    onSuccess: () => {
      onClose();
    },
  });

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [departmentId, setDepartmentId] = useState(user?.departmentId || '');
  const [designation, setDesignation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Python', 'SQL & PostgreSQL']);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Backend Development',
    'Cloud Architecture',
  ]);
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync initial user details when modal opens
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.departmentId) setDepartmentId(user.departmentId);
    }
  }, [user]);

  // Set default department if available
  useEffect(() => {
    if (meta?.departments && meta.departments.length > 0 && !departmentId) {
      setDepartmentId(meta.departments[0].id);
    }
  }, [meta, departmentId]);

  if (!isOpen) return null;

  // Calculate live completion percentage
  let completedPoints = 0;
  if (firstName.trim()) completedPoints += 20;
  if (departmentId) completedPoints += 20;
  if (designation.trim()) completedPoints += 20;
  if (selectedSkills.length > 0) completedPoints += 20;
  if (selectedInterests.length > 0 || bio.trim()) completedPoints += 20;

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
      setCustomSkill('');
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      setError('Please select your organizational department.');
      return;
    }
    if (!designation.trim()) {
      setError('Please enter your current designation or job title.');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill to kickstart your competency mapping.');
      return;
    }

    setError(null);
    submitOnboarding({
      firstName,
      lastName,
      departmentId,
      designation,
      skills: selectedSkills,
      interests: selectedInterests,
      bio,
    });
  };

  const standardInterests = [
    'Backend Development',
    'Cloud Architecture',
    'Machine Learning & AI',
    'Data Engineering',
    'DevOps & Automation',
    'System Design',
    'Security Engineering',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider">
                Step 2 of 2
              </span>
              <span className="text-xs font-semibold text-slate-500">Trainee Onboarding</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Personalize Your Learning Journey
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete your profile details to unlock skill-gap analysis and trainer
              recommendations.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Completion Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Profile Readiness</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completedPoints}%` }}
              />
            </div>
            <span className="font-bold text-indigo-700">{completedPoints}%</span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Mapped Identity Details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verified Account Identity
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Member</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  First Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>
                  Department <span className="text-indigo-600">*</span>
                </span>
              </label>
              {isMetaLoading ? (
                <div className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400">
                  Loading departments...
                </div>
              ) : (
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="">Select your department...</option>
                  {meta?.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>
                  Designation / Role Title <span className="text-indigo-600">*</span>
                </span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Junior Software Engineer, Data Analyst"
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Skills Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>
                  Current Skills & Strengths <span className="text-indigo-600">*</span>
                </span>
              </label>
              <span className="text-[11px] text-slate-500">{selectedSkills.length} selected</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Select the technologies and skills you currently work with or are learning:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {(meta?.skills && meta.skills.length > 0
                ? meta.skills.map((s) => s.name)
                : [
                    'Python',
                    'SQL & PostgreSQL',
                    'Java',
                    'Machine Learning',
                    'Cloud Computing',
                    'Communication',
                  ]
              ).map((skillName) => {
                const isSelected = selectedSkills.includes(skillName);
                return (
                  <button
                    key={skillName}
                    type="button"
                    onClick={() => toggleSkill(skillName)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {skillName}
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add other skill (e.g. React, Docker, TypeScript)..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Learning Interests */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-indigo-600" />
              <span>Target Learning Interests</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Topics you would like Capacity Connect to recommend courses and trainers for:
            </p>
            <div className="flex flex-wrap gap-2">
              {standardInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Short Bio / Career Goals</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Tell us briefly about your current focus and learning goals..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Save & Launch Dashboard</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraineeOnboardingModal;
