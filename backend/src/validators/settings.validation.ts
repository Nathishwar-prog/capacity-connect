import { z } from 'zod';

export const updatePortalSettingsSchema = z
  .object({
    portalName: z.string().min(2, 'Portal name must be at least 2 characters').max(100),
    portalDescription: z.string().max(500).optional().nullable(),
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
    supportEmail: z.string().email('Invalid support email address'),
    supportPhone: z.string().max(30).optional().nullable(),
    supportWebsite: z.string().url('Invalid website URL').or(z.string().length(0)).optional().nullable(),
    logoUrl: z.string().min(1, 'Logo URL is required'),
    faviconUrl: z.string().min(1, 'Favicon URL is required'),
    loginLogoUrl: z.string().min(1, 'Login logo URL is required'),
    emailLogoUrl: z.string().min(1, 'Email logo URL is required'),
    primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color code'),
    defaultTheme: z.enum(['light', 'dark', 'system']),
    portalStatus: z.enum(['ACTIVE', 'MAINTENANCE']),
    maintenanceTitle: z.string().max(150).optional().nullable(),
    maintenanceMessage: z.string().max(1000).optional().nullable(),
    estimatedMaintenanceEnd: z.string().datetime().or(z.string().length(0)).optional().nullable(),
    technicalContact: z.string().email('Invalid technical contact email').or(z.string().length(0)).optional().nullable(),
    organizationAddress: z.string().max(250).optional().nullable(),
    helpCenterUrl: z.string().url('Invalid Help Center URL').or(z.string().length(0)).optional().nullable(),
    privacyPolicyUrl: z.string().url('Invalid Privacy Policy URL').or(z.string().length(0)).optional().nullable(),
    termsOfServiceUrl: z.string().url('Invalid Terms of Service URL').or(z.string().length(0)).optional().nullable(),
  })
  .partial();

export const updateLearningSettingsSchema = z
  .object({
    allowTrainerCourseCreation: z.boolean(),
    requireCourseApproval: z.boolean(),
    requireCoursePublishing: z.boolean(),
    allowCourseUnpublishing: z.boolean(),
    completionPercentage: z.number().int().min(1, 'Completion must be at least 1%').max(100, 'Completion cannot exceed 100%'),
    assessmentPassingScore: z.number().int().min(0, 'Passing score must be between 0 and 100').max(100),
    certificateEligibility: z.number().int().min(0, 'Certificate eligibility score must be between 0 and 100').max(100),
    allowSelfEnrollment: z.boolean(),
    allowTrainerEnrollment: z.boolean(),
    requireApprovalForEnrollment: z.boolean(),
    maxActiveCoursesPerTrainee: z.number().int().min(1, 'Must allow at least 1 course').max(50),
    allowReenrollment: z.boolean(),
    requireTrainerApproval: z.boolean(),
    requireTrainerProfileCompletion: z.boolean(),
    allowedResourceTypes: z.array(z.string()).min(1, 'At least one resource type must be allowed'),
    maxFileSizeMb: z.number().int().min(1, 'Maximum file size must be at least 1 MB').max(500),
    requireResourceReview: z.boolean(),
    allowExternalUrls: z.boolean(),
    assessmentDefaultPassingScore: z.number().int().min(0).max(100),
    assessmentMaxAttempts: z.number().int().min(1).max(20),
    assessmentAllowRetakes: z.boolean(),
    assessmentRandomizeQuestions: z.boolean(),
    assessmentShowCorrectAnswers: z.boolean(),
    assessmentShowExplanation: z.boolean(),
    assessmentTimeLimitMinutes: z.number().int().min(5).max(300),

    // Revision Engine Parameters
    revisionMasteryThreshold: z.number().min(50).max(100),
    revisionCooldownHours: z.number().int().min(1).max(168),
    revisionMaxTopicsPerSession: z.number().int().min(1).max(20),
    revisionDiagnosticConfidenceThreshold: z.number().min(0.05).max(0.95),
    topicWeaknessWeight: z.number().min(0).max(1),
    topicForgettingWeight: z.number().min(0).max(1),
    topicImportanceWeight: z.number().min(0).max(1),
    topicDependencyWeight: z.number().min(0).max(1),
    topicErrorWeight: z.number().min(0).max(1),
    topicUncertaintyWeight: z.number().min(0).max(1),
    topicRecencyWeight: z.number().min(0).max(1),
  })
  .partial()
  .refine(
    (data) => {
      const weights = [
        data.topicWeaknessWeight,
        data.topicForgettingWeight,
        data.topicImportanceWeight,
        data.topicDependencyWeight,
        data.topicErrorWeight,
        data.topicUncertaintyWeight,
        data.topicRecencyWeight,
      ];
      const passedWeights = weights.filter((w) => w !== undefined);
      if (passedWeights.length === 0) return true;

      const sum =
        (data.topicWeaknessWeight ?? 0.35) +
        (data.topicForgettingWeight ?? 0.18) +
        (data.topicImportanceWeight ?? 0.12) +
        (data.topicDependencyWeight ?? 0.12) +
        (data.topicErrorWeight ?? 0.10) +
        (data.topicUncertaintyWeight ?? 0.08) +
        (data.topicRecencyWeight ?? 0.05);
      return Math.abs(sum - 1.0) < 0.05;
    },
    {
      message: 'The sum of all revision algorithm weights must equal 1.0 (100%)',
      path: ['topicWeaknessWeight'],
    }
  );

export const updateNotificationSettingsSchema = z
  .object({
    enableInAppNotifications: z.boolean(),
    enableEmailNotifications: z.boolean(),
    enableAnnouncementNotifications: z.boolean(),
    notifyTraineesOnAnnouncement: z.boolean(),
    notifyTrainersOnAnnouncement: z.boolean(),
    notifyCourseApproved: z.boolean(),
    notifyCourseRejected: z.boolean(),
    notifyCoursePublished: z.boolean(),
    notifyCourseUnpublished: z.boolean(),
    notifyCourseEnrollment: z.boolean(),
    notifyAssessmentResult: z.boolean(),
    notifyCourseCompletion: z.boolean(),
    notifyRevisionReminder: z.boolean(),
  })
  .partial();

export const updateAiSettingsSchema = z
  .object({
    enableAiFeatures: z.boolean(),
    enableAiSkillGapAnalyzer: z.boolean(),
    enableAiCourseRecommendations: z.boolean(),
    enableAiRevisionAssistant: z.boolean(),
    enableAiAnalyticsAssistant: z.boolean(),
    enableAiChatbot: z.boolean(),
    aiProvider: z.string().min(1),
    aiModel: z.string().min(1),
    aiTemperature: z.number().min(0).max(2),
    aiMaxTokens: z.number().int().min(256).max(8192),
    aiAnalyticsMaxQueryComplexity: z.enum(['BASIC', 'STANDARD', 'ADVANCED']),
    aiAnalyticsDateRangeLimitDays: z.number().int().min(7).max(1825),
    aiAnalyticsEnableChartGen: z.boolean(),
    aiAllowAggregatedAnalytics: z.boolean(),
    aiAllowCoursePerformance: z.boolean(),
    aiAllowTrainerPerformance: z.boolean(),
    aiAllowCompetencyAnalytics: z.boolean(),
    apiKeyUpdate: z.string().min(10).optional(),
  })
  .partial();

export const updateSecuritySettingsSchema = z
  .object({
    sessionTimeoutMinutes: z.number().int().min(5, 'Session timeout must be at least 5 minutes').max(1440),
    jwtAccessExpirationMinutes: z.number().int().min(5).max(1440),
    jwtRefreshExpirationDays: z.number().int().min(1).max(30),
    requireStrongPassword: z.boolean(),
    passwordMinLength: z.number().int().min(6, 'Minimum password length must be at least 6').max(32),
    maxLoginAttempts: z.number().int().min(3).max(15),
    lockoutDurationMinutes: z.number().int().min(1).max(1440),
    publicRegistrationPolicy: z.enum(['APPROVAL_REQUIRED', 'AUTO_ACTIVE']),
  })
  .partial();

export const updateLocalizationSettingsSchema = z
  .object({
    defaultLanguage: z.string().min(2).max(10),
    availableLanguages: z.array(z.string()).min(1, 'At least one language must be enabled'),
    defaultTimezone: z.string().min(2),
    dateFormat: z.string().min(4),
    timeFormat: z.enum(['12h', '24h']),
    currency: z.string().min(2).max(5),
  })
  .partial();

export const testConnectionSchema = z.object({
  target: z.enum(['DATABASE', 'AI_SERVICE', 'STORAGE']),
});

