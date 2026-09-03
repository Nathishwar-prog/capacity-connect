export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/login?tab=signup',
  TRAINEE_DASHBOARD: '/dashboard/trainee',
  TRAINER_DASHBOARD: '/dashboard/trainer',
  ADMIN_DASHBOARD: '/dashboard/admin',
  USERS: '/users',
  PROFILE: '/profile',
} as const;

export default ROUTES;
