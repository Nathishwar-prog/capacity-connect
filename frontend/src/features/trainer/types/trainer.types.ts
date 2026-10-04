export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type CourseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';
export type LessonContentType = 'VIDEO' | 'PDF' | 'ARTICLE' | 'QUIZ' | 'LINK' | 'DOCUMENT';

export interface TrainerSkillExpertise {
  id: string;
  skillId: string;
  proficiencyLevel: number;
  yearsExperience: number | null;
  skill: {
    id: string;
    name: string;
    code: string;
    category: string | null;
  };
}

export interface TrainerQualification {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface TrainerWorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export interface TrainerProfileData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
    organization: { id: string; name: string; code: string };
    department: { id: string; name: string; code: string } | null;
    trainerProfile: {
      id: string;
      designation: string;
      organizationName: string | null;
      bio: string;
      yearsExperience: number;
      expertise: TrainerSkillExpertise[];
    } | null;
    qualifications: TrainerQualification[];
    workExperiences: TrainerWorkExperience[];
  };
  stats: {
    totalCourses: number;
    publishedCourses: number;
    learnersTrained: number;
    avgCompletionRate: number;
    avgAssessmentScore: number;
    competenciesCovered: number;
  };
}

export interface TrainerDashboardKPIs {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingCourses: number;
  totalEnrollments: number;
  activeLearners: number;
  completedLearners: number;
  avgProgress: number;
  avgScore: number;
  competenciesCovered: number;
}

export interface TraineeHealthMetric {
  count: number;
  percentage: number;
}

export interface TraineeHealthDistribution {
  total: number;
  onTrack: TraineeHealthMetric;
  needsAttention: TraineeHealthMetric;
  atRisk: TraineeHealthMetric;
  completed: TraineeHealthMetric;
}

export interface PerformanceTrendPoint {
  label: string;
  activeLearners: number;
  avgProgress: number;
}

export interface TraineeAttentionItem {
  traineeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  courseTitle: string;
  progress: number;
  status: string;
}

export interface CompetencySnapshotData {
  coveredCount: number;
  competencies: Array<{
    id: string;
    name: string;
    targetAverage: number;
    attainmentRate: number;
  }>;
  gapsCount: number;
}

export interface TrainerDashboardData {
  kpis: TrainerDashboardKPIs;
  traineeHealth: TraineeHealthDistribution;
  performanceTrend: PerformanceTrendPoint[];
  traineesNeedingAttention: TraineeAttentionItem[];
  competencySnapshot: CompetencySnapshotData;
  profileCompletion: number;
  recentCourses: Array<{
    id: string;
    title: string;
    slug: string;
    status: CourseStatus;
    difficulty: CourseDifficulty;
    category?: string;
    moduleCount: number;
    enrolledCount: number;
    completionRate: number;
  }>;
  recentTrainees: Array<{
    enrollmentId: string;
    traineeId: string;
    name: string;
    email: string;
    designation: string;
    department: string;
    courseTitle: string;
    progress: number;
    status: string;
  }>;
  assessments: Array<{
    id: string;
    title: string;
    courseTitle: string;
    questionsCount: number;
    attemptsCount: number;
    passedCount?: number;
    passingScore?: number;
    status: string;
  }>;
  recentFeedback: Array<{
    id: string;
    rating: number;
    comment: string | null;
    courseTitle: string | null;
    traineeName: string;
    createdAt: string;
  }>;
  recentActivity?: Array<{
    id: string;
    action: string;
    entityType: string;
    timestamp: string;
  }>;
  actionRequired: Array<{
    id: string;
    priority?: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    message: string;
    link: string;
    actionLabel?: string;
  }>;
}

export interface LessonItem {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: LessonContentType;
  content: string | null;
  resourceUrl: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  isPreview: boolean;
}

export interface CourseModuleItem {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonItem[];
}

export interface CourseCompetencyItem {
  id: string;
  competencyId: string;
  targetLevel: number;
  competency: {
    id: string;
    name: string;
    code: string;
    category: string | null;
  };
}

export interface TrainerCourseDetail {
  id: string;
  organizationId: string;
  trainerId: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  category: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  status: CourseStatus;
  publishedAt: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  modules: CourseModuleItem[];
  courseCompetencies: CourseCompetencyItem[];
  prerequisites: Array<{
    prerequisiteCourse: {
      id: string;
      title: string;
      slug: string;
      difficulty: CourseDifficulty;
    };
  }>;
  assessments: Array<{
    id: string;
    title: string;
    subject: string;
    status: string;
    durationMinutes: number | null;
    passingScore: number;
  }>;
}

export interface TrainerCourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  status: CourseStatus;
  publishedAt: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  moduleCount: number;
  lessonCount: number;
  enrolledCount: number;
  competencies: string[];
  completionRate: number;
}

export interface TrainerTraineeListItem {
  enrollmentId: string;
  traineeId: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string;
  department: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  status: string;
  enrolledAt: string;
  skills: Array<{ name: string; level: number }>;
  competencies: Array<{ name: string; level: number }>;
  skillGapsCount: number;
}

export interface TraineeDetailData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    designation: string;
    bio: string;
    department: string;
    organization: string;
    profileCompletion: number;
    interests: string[];
  };
  enrolledCourses: Array<{
    courseId: string;
    title: string;
    slug: string;
    progressPercentage: number;
    status: string;
    enrolledAt: string;
    completedAt: string | null;
    modules: Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        completed: boolean;
      }>;
    }>;
  }>;
  competencies: Array<{
    id: string;
    name: string;
    category: string | null;
    currentLevel: number;
    confidenceScore: number;
    source: string;
  }>;
  skillGaps: Array<{
    id: string;
    competencyName: string;
    currentLevel: number;
    requiredLevel: number;
    gapLevel: number;
    priority: string;
    status: string;
  }>;
  assessments: Array<{
    id: string;
    assessmentTitle: string;
    subject: string;
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
    status: string;
    submittedAt: string | null;
  }>;
  topicCompetencies?: Array<{
    topicId: string;
    topicTitle: string;
    courseId: string;
    competencyScore: number;
    confidenceScore: number;
    forgettingRisk: number;
    priorityScore: number;
    stability: number;
    retention: number;
    lastReviewedAt: string | null;
  }>;
  learningEvents?: Array<{
    id: string;
    topicTitle: string;
    eventType: string;
    correct: boolean | null;
    occurredAt: string;
  }>;
  revisionActivity?: Array<{
    id: string;
    status: string;
    itemCount: number;
    correctCount: number;
    score: number | null;
    startedAt: string;
    completedAt: string | null;
  }>;
}

export interface CourseAnalyticsData {
  course: {
    id: string;
    title: string;
    slug: string;
    status: CourseStatus;
    difficulty: CourseDifficulty;
    category?: string;
    durationMinutes: number;
    publishedAt: string | null;
    updatedAt: string;
  };
  kpis: {
    totalEnrollments: number;
    activeLearners: number;
    completedLearners: number;
    completionRate: number;
    averageProgress: number;
    totalAttempts: number;
    passRate: number;
    averageScore: number;
    competencyAttainment: number;
    averageForgettingRisk: number;
  };
  moduleBreakdown: Array<{
    id: string;
    title: string;
    orderIndex: number;
    lessonCount: number;
    completionRate: number;
  }>;
  competencies: Array<{
    id: string;
    name: string;
    targetLevel: number;
  }>;
  priorityTopics: Array<{
    topicId: string;
    title: string;
    competencyScore: number;
    forgettingRisk: number;
    priorityScore: number;
  }>;
  enrolledTrainees: Array<{
    enrollmentId: string;
    traineeId: string;
    name: string;
    email: string;
    department: string;
    progress: number;
    status: string;
    enrolledAt: string;
    lastAccessedAt: string | null;
  }>;
}

export interface TrainerAssessmentItem {
  id: string;
  title: string;
  subject: string;
  courseId: string | null;
  courseTitle: string;
  durationMinutes: number | null;
  passingScore: number;
  status: string;
  questionCount: number;
  attemptCount: number;
  passedCount: number;
  createdAt: string;
}

export interface TrainerAnalyticsData {
  kpis: TrainerDashboardKPIs;
  coursePerformance: Array<{
    id: string;
    title: string;
    slug: string;
    status: CourseStatus;
    difficulty: CourseDifficulty;
    enrolledCount: number;
    completionRate: number;
    averageProgress: number;
  }>;
  competenciesCovered: Array<{
    id: string;
    name: string;
  }>;
}

export interface TrainerFeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  courseTitle: string;
  traineeName: string;
  traineeEmail: string;
  createdAt: string;
}
