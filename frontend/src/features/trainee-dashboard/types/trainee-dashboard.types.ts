export interface TraineeProfileCompletion {
  percentage: number;
  statusText: string;
  completedFieldsCount: number;
  totalFieldsCount: number;
  missingFields: string[];
}

export interface ActiveCourseItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  trainerName: string;
  trainerDesignation: string;
  progressPercentage: number;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
  currentModuleTitle: string;
  currentLessonTitle: string;
  lastActivityDate: string;
}

export interface CourseProgressItem {
  courseId: string;
  courseTitle: string;
  category: string;
  progressPercentage: number;
  totalLessons: number;
  completedLessons: number;
}

export interface UpcomingAssessmentItem {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  dueDate: string;
  durationMinutes: number;
  passingScore: number;
  status: 'PENDING' | 'SCHEDULED' | 'UPCOMING';
  assessmentType: 'QUIZ' | 'SIMULATION' | 'PRACTICAL_EXAM';
}

export interface CompetencyBreakdownItem {
  id: string;
  name: string;
  category: string;
  score: number;
  targetScore: number;
  level: string;
}

export interface TraineeCompetencyOverview {
  overallPercentage: number;
  levelLabel: string;
  statusText: string;
  breakdown: CompetencyBreakdownItem[];
}

export interface SkillGapItem {
  id: string;
  skillName: string;
  competencyArea: string;
  currentLevel: number;
  targetLevel: number;
  gapPercentage: number;
  priority: 'HIGH' | 'MEDIUM' | 'MODERATE';
  recommendedCourse: string;
}

export interface CourseRecommendationItem {
  id: string;
  courseId: string;
  courseTitle: string;
  slug: string;
  category: string;
  reason: string;
  targetSkill: string;
  difficulty: 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedHours: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  category: string;
  dateEarned: string;
  credentialCode: string;
}

export interface TraineeAchievementsOverview {
  coursesCompletedCount: number;
  certificatesEarnedCount: number;
  assessmentsPassedCount: number;
  totalLearningHours: number;
  topScorePercentage: number;
  badges: AchievementBadge[];
}

export interface TraineeDashboardState {
  traineeName: string;
  designation: string;
  department: string;
  organization: string;
  profileCompletion: TraineeProfileCompletion;
  activeCourses: ActiveCourseItem[];
  courseProgress: {
    overallPercentage: number;
    courses: CourseProgressItem[];
  };
  upcomingAssessments: UpcomingAssessmentItem[];
  competency: TraineeCompetencyOverview;
  skillGaps: SkillGapItem[];
  recommendations: CourseRecommendationItem[];
  achievements: TraineeAchievementsOverview;
}
