'use client';

import React, { useEffect } from 'react';
import useAuthStore from '@/store/auth';
import { AppShell } from '@/features/trainee-app-shell';

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setCredentials } = useAuthStore();

  useEffect(() => {
    // Ensure trainee credentials are authenticated for learning cockpit
    if (!isAuthenticated || !user) {
      setCredentials(
        {
          id: 'demo-trainee-id',
          email: 'yoga.s@imd.gov.in',
          firstName: 'Yoga',
          lastName: 'S.',
          role: 'TRAINEE',
          departmentName: 'National Weather Forecasting Centre (NWFC)',
          organizationName: 'India Meteorological Department',
          traineeProfile: {
            id: 'demo-profile-id',
            designation: 'Met. Observer Trainee',
            bio: 'Capacity building trainee at India Meteorological Department.',
            interests: ['Meteorology', 'Numerical Weather Prediction', 'Radar Analysis'],
            profileCompletion: 85,
          },
        },
        'demo-trainee-token',
      );
    }
  }, [isAuthenticated, user, setCredentials]);

  return <AppShell>{children}</AppShell>;
}
