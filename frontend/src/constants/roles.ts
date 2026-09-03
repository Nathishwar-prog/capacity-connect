export type CanonicalRole = 'SUPER_ADMIN' | 'ADMIN' | 'TRAINER' | 'TRAINEE';

export interface RoleMetadata {
  title: string;
  badgeLabel: string;
  description: string;
  dashboardRoute: string;
  badgeClass: string;
}

export const ROLE_METADATA: Record<CanonicalRole, RoleMetadata> = {
  SUPER_ADMIN: {
    title: 'Super Administrator',
    badgeLabel: 'Super Admin',
    description: 'Platform Oversight & Institutional System Governance',
    dashboardRoute: '/dashboard/admin',
    badgeClass: 'border-purple-200 bg-purple-50 text-purple-700',
  },
  ADMIN: {
    title: 'Organization Administrator',
    badgeLabel: 'Administrator',
    description: 'Capacity Enabling & Institutional Directory Control',
    dashboardRoute: '/dashboard/admin',
    badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  },
  TRAINER: {
    title: 'Domain Instructor / Scientist',
    badgeLabel: 'Trainer',
    description: 'Earth Sciences & Meteorology Specialist & Instructor',
    dashboardRoute: '/dashboard/trainer',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  TRAINEE: {
    title: 'Capacity Learner / Trainee',
    badgeLabel: 'Trainee',
    description: 'MoES / IMD Professional Capacity Building Trainee',
    dashboardRoute: '/dashboard/trainee',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
  },
};

export const getRoleDashboardRoute = (role?: string | null): string => {
  switch (role) {
    case 'TRAINEE':
      return '/dashboard/trainee';
    case 'TRAINER':
      return '/dashboard/trainer';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/dashboard/admin';
    default:
      return '/login';
  }
};

export default ROLE_METADATA;
