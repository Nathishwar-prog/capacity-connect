export interface TraineeDashboardData {
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    profileCompletion: number;
  };
  continueLearning: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    slug: string;
    category: string;
    difficulty: string;
    progressPercentage: number;
    currentModuleTitle: string;
    currentLessonTitle: string;
    currentLessonType: string;
    lastActivityDate: string;
  } | null;
  metrics: {
    enrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    overallProgress: number;
    pendingAssessments: number;
    competenciesTracked: number;
    skillGapsCount: number;
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
    trainerName: string;
    moduleCount: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
  }>;
  upNext: Array<{
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    courseTitle: string;
    courseId: string;
  }>;
  competencies: Array<{
    id: string;
    name: string;
    code: string;
    category: string | null;
    currentLevel: number;
    requiredLevel: number;
    progressPercentage: number;
  }>;
  skillGaps: Array<{
    id: string;
    competencyName: string;
    category: string | null;
    currentLevel: number;
    requiredLevel: number;
    gapLevel: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
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
  resources: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    url: string;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    reason: string | null;
    courseTitle: string;
    slug: string;
    difficulty: string;
    category: string;
  }>;
  trainer: {
    id: string;
    name: string;
    designation: string;
    bio: string;
  } | null;
  achievements: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    awardedAt: string;
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
