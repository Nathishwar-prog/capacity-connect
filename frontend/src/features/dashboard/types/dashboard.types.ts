export interface TraineeDashboardData {
  metrics: {
    inProgressCourses: number;
    completedCourses: number;
    pendingAssessments: number;
    competenciesTracked: number;
  };
  activeCourses: Array<{
    id: string;
    courseId: string;
    title: string;
    slug: string;
    category: string;
    difficulty: string;
    progressPercentage: number;
    enrolledAt: string;
  }>;
  assessments: Array<{
    id: string;
    assessmentId: string;
    title: string;
    type: string;
    status: string;
    score: number | null;
    passingScore: number;
    durationMinutes: number | null;
    startedAt: string;
  }>;
  competencies: Array<{
    id: string;
    name: string;
    code: string;
    category: string | null;
    currentLevel: number;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    reason: string | null;
    courseTitle: string | null;
    resourceTitle: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    timestamp: string;
  }>;
}

export interface TrainerDashboardData {
  metrics: {
    activeCourses: number;
    totalTrainees: number;
    pendingEvaluations: number;
    feedbackCount: number;
  };
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    difficulty: string;
  }>;
  recentFeedback: Array<{
    id: string;
    rating: number;
    comment: string | null;
    courseTitle: string | null;
    traineeName: string;
    createdAt: string;
  }>;
}

export interface AdminDashboardData {
  metrics: {
    totalUsers: number;
    trainees: number;
    trainers: number;
    administrators: number;
    pendingApprovals: number;
    totalCourses: number;
    publishedCourses: number;
    totalCompetencies: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    userName: string;
    userEmail: string | null;
    userRole: string | null;
    createdAt: string;
  }>;
}
