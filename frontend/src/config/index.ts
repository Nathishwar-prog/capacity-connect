/**
 * FRONTEND APP ENVIRONMENT CONFIGURATIONS
 *
 * Centralize all constants mapped from Next.js NEXT_PUBLIC_ environmental variables.
 */
export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Enterprise Client',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  environment: process.env.NODE_ENV || 'development',
};

export default appConfig;
