export interface SystemSettingsData {
  id: string;

  // Portal Information & Branding
  portalName: string;
  portalDescription: string;
  organizationName: string;
  supportEmail: string;
  supportPhone: string;
  supportWebsite: string;
  logoUrl: string;
  faviconUrl: string;
  loginLogoUrl: string;
  emailLogoUrl: string;
  primaryColor: string;
  defaultTheme: 'light' | 'dark' | 'system';

  // Portal Status & Maintenance
  portalStatus: 'ACTIVE' | 'MAINTENANCE';
  maintenanceTitle: string;
  maintenanceMessage: string;
  estimatedMaintenanceEnd: string | null;
  technicalContact: string;
  organizationAddress: string;
  helpCenterUrl: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;

  // Learning Policies
  allowTrainerCourseCreation: boolean;
  requireCourseApproval: boolean;
  requireCoursePublishing: boolean;
  allowCourseUnpublishing: boolean;
  completionPercentage: number;
  assessmentPassingScore: number;
  certificateEligibility: number;
  allowSelfEnrollment: boolean;
  allowTrainerEnrollment: boolean;
  requireApprovalForEnrollment: boolean;
  maxActiveCoursesPerTrainee: number;
  allowReenrollment: boolean;
  requireTrainerApproval: boolean;
  requireTrainerProfileCompletion: boolean;
  allowedResourceTypes: string[];
  maxFileSizeMb: number;
  requireResourceReview: boolean;
  allowExternalUrls: boolean;
  assessmentDefaultPassingScore: number;
  assessmentMaxAttempts: number;
  assessmentAllowRetakes: boolean;
  assessmentRandomizeQuestions: boolean;
  assessmentShowCorrectAnswers: boolean;
  assessmentShowExplanation: boolean;
  assessmentTimeLimitMinutes: number;

  // Revision Engine Settings
  revisionMasteryThreshold: number;
  revisionCooldownHours: number;
  revisionMaxTopicsPerSession: number;
  revisionDiagnosticConfidenceThreshold: number;
  topicWeaknessWeight: number;
  topicForgettingWeight: number;
  topicImportanceWeight: number;
  topicDependencyWeight: number;
  topicErrorWeight: number;
  topicUncertaintyWeight: number;
  topicRecencyWeight: number;

  // Notification Policies
  enableInAppNotifications: boolean;
  enableEmailNotifications: boolean;
  enableAnnouncementNotifications: boolean;
  notifyTraineesOnAnnouncement: boolean;
  notifyTrainersOnAnnouncement: boolean;
  notifyCourseApproved: boolean;
  notifyCourseRejected: boolean;
  notifyCoursePublished: boolean;
  notifyCourseUnpublished: boolean;
  notifyCourseEnrollment: boolean;
  notifyAssessmentResult: boolean;
  notifyCourseCompletion: boolean;
  notifyRevisionReminder: boolean;

  // AI & Analytics Settings
  enableAiFeatures: boolean;
  enableAiSkillGapAnalyzer: boolean;
  enableAiCourseRecommendations: boolean;
  enableAiRevisionAssistant: boolean;
  enableAiAnalyticsAssistant: boolean;
  enableAiChatbot: boolean;
  aiProvider: string;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  aiAnalyticsMaxQueryComplexity: 'BASIC' | 'STANDARD' | 'ADVANCED';
  aiAnalyticsDateRangeLimitDays: number;
  aiAnalyticsEnableChartGen: boolean;
  aiAllowAggregatedAnalytics: boolean;
  aiAllowCoursePerformance: boolean;
  aiAllowTrainerPerformance: boolean;
  aiAllowCompetencyAnalytics: boolean;
  aiApiKeyMasked?: string | null;

  // Security Policies
  sessionTimeoutMinutes: number;
  jwtAccessExpirationMinutes: number;
  jwtRefreshExpirationDays: number;
  requireStrongPassword: boolean;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  publicRegistrationPolicy: 'APPROVAL_REQUIRED' | 'AUTO_ACTIVE';

  // Localization
  defaultLanguage: string;
  availableLanguages: string[];
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;

  createdAt: string;
  updatedAt: string;
}

export type PublicPortalSettings = Pick<
  SystemSettingsData,
  | 'portalName'
  | 'portalDescription'
  | 'organizationName'
  | 'supportEmail'
  | 'supportPhone'
  | 'supportWebsite'
  | 'logoUrl'
  | 'faviconUrl'
  | 'loginLogoUrl'
  | 'primaryColor'
  | 'defaultTheme'
  | 'portalStatus'
  | 'maintenanceTitle'
  | 'maintenanceMessage'
  | 'estimatedMaintenanceEnd'
  | 'helpCenterUrl'
  | 'privacyPolicyUrl'
  | 'termsOfServiceUrl'
  | 'defaultLanguage'
  | 'availableLanguages'
  | 'defaultTimezone'
  | 'dateFormat'
  | 'timeFormat'
  | 'currency'
>;

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  services: {
    database: { status: 'UP' | 'DOWN'; latencyMs: number };
    aiService: { status: 'OPERATIONAL' | 'DISABLED'; provider: string };
    storage: { status: 'HEALTHY' | 'WARNING'; writable: boolean };
    cache: { status: 'ACTIVE' | 'IDLE'; type: string };
  };
  version: string;
  environment: string;
  timestamp: string;
}

export interface ConnectionTestResult {
  target: string;
  connected: boolean;
  latencyMs: number;
  message: string;
  details?: any;
}

export interface SettingsAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, { previous: any; current: any }> | null;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    role: string;
  } | null;
}
