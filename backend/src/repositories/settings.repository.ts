import { prisma } from '../database/client';
import { SystemSettingsData, PublicPortalSettings } from '../types/settings.types';

export class SettingsRepository {
  private defaultId = 'default';

  private defaultData: SystemSettingsData = {
    id: 'default',
    portalName: 'Capacity Connect',
    portalDescription: 'Digital Capacity Building and Learning Management Portal',
    organizationName: 'Capacity Connect Consortium',
    supportEmail: 'support@capacityconnect.io',
    supportPhone: '+91 11 2461 8200',
    supportWebsite: 'https://capacityconnect.io',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
    loginLogoUrl: '/images/logo.png',
    emailLogoUrl: '/images/logo.png',
    primaryColor: '#4f46e5',
    defaultTheme: 'light',
    portalStatus: 'ACTIVE',
    maintenanceTitle: 'Capacity Connect is temporarily unavailable',
    maintenanceMessage: 'We are performing scheduled maintenance. Please try again later.',
    estimatedMaintenanceEnd: null,
    technicalContact: 'tech@capacityconnect.io',
    organizationAddress: 'Mausam Bhawan, Lodhi Road, New Delhi, India',
    helpCenterUrl: 'https://capacityconnect.io/help',
    privacyPolicyUrl: 'https://capacityconnect.io/privacy',
    termsOfServiceUrl: 'https://capacityconnect.io/terms',

    allowTrainerCourseCreation: true,
    requireCourseApproval: true,
    requireCoursePublishing: true,
    allowCourseUnpublishing: true,
    completionPercentage: 80,
    assessmentPassingScore: 60,
    certificateEligibility: 75,
    allowSelfEnrollment: true,
    allowTrainerEnrollment: true,
    requireApprovalForEnrollment: false,
    maxActiveCoursesPerTrainee: 5,
    allowReenrollment: true,
    requireTrainerApproval: true,
    requireTrainerProfileCompletion: true,
    allowedResourceTypes: ['VIDEO', 'PDF', 'DOCUMENT', 'PRESENTATION', 'LINK', 'IMAGE'],
    maxFileSizeMb: 50,
    requireResourceReview: false,
    allowExternalUrls: true,
    assessmentDefaultPassingScore: 60,
    assessmentMaxAttempts: 3,
    assessmentAllowRetakes: true,
    assessmentRandomizeQuestions: true,
    assessmentShowCorrectAnswers: true,
    assessmentShowExplanation: true,
    assessmentTimeLimitMinutes: 60,

    revisionMasteryThreshold: 85.0,
    revisionCooldownHours: 24,
    revisionMaxTopicsPerSession: 6,
    revisionDiagnosticConfidenceThreshold: 0.40,
    topicWeaknessWeight: 0.35,
    topicForgettingWeight: 0.18,
    topicImportanceWeight: 0.12,
    topicDependencyWeight: 0.12,
    topicErrorWeight: 0.10,
    topicUncertaintyWeight: 0.08,
    topicRecencyWeight: 0.05,

    enableInAppNotifications: true,
    enableEmailNotifications: false,
    enableAnnouncementNotifications: true,
    notifyTraineesOnAnnouncement: true,
    notifyTrainersOnAnnouncement: true,
    notifyCourseApproved: true,
    notifyCourseRejected: true,
    notifyCoursePublished: true,
    notifyCourseUnpublished: true,
    notifyCourseEnrollment: true,
    notifyAssessmentResult: true,
    notifyCourseCompletion: true,
    notifyRevisionReminder: true,

    enableAiFeatures: true,
    enableAiSkillGapAnalyzer: true,
    enableAiCourseRecommendations: true,
    enableAiRevisionAssistant: true,
    enableAiAnalyticsAssistant: true,
    enableAiChatbot: true,
    aiProvider: 'Google Gemini',
    aiModel: 'gemini-1.5-pro',
    aiTemperature: 0.7,
    aiMaxTokens: 2048,
    aiAnalyticsMaxQueryComplexity: 'STANDARD',
    aiAnalyticsDateRangeLimitDays: 365,
    aiAnalyticsEnableChartGen: true,
    aiAllowAggregatedAnalytics: true,
    aiAllowCoursePerformance: true,
    aiAllowTrainerPerformance: true,
    aiAllowCompetencyAnalytics: true,
    aiApiKeyMasked: '••••••••••••••••',

    sessionTimeoutMinutes: 30,
    jwtAccessExpirationMinutes: 15,
    jwtRefreshExpirationDays: 7,
    requireStrongPassword: true,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    publicRegistrationPolicy: 'APPROVAL_REQUIRED',

    defaultLanguage: 'en',
    availableLanguages: ['en', 'hi', 'ta'],
    defaultTimezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'INR',

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  /**
   * Retrieves current platform settings or initializes them if absent
   */
  public async getSettings(): Promise<SystemSettingsData> {
    try {
      const record = await prisma.systemSettings.findUnique({
        where: { id: this.defaultId },
      });

      if (record) {
        return this.mapFromDb(record);
      }

      // Initialize default row if not present
      await this.initDefaults();
      return this.defaultData;
    } catch (error) {
      console.error('Failed to load system settings from DB:', error);
      return this.defaultData;
    }
  }

  /**
   * Update one or more settings fields
   */
  public async updateSettings(patch: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    const { id, createdAt, updatedAt, ...allowedFields } = patch as any;

    // Sanitize estimatedMaintenanceEnd date field
    if ('estimatedMaintenanceEnd' in allowedFields) {
      if (allowedFields.estimatedMaintenanceEnd && typeof allowedFields.estimatedMaintenanceEnd === 'string') {
        const parsedDate = new Date(allowedFields.estimatedMaintenanceEnd);
        allowedFields.estimatedMaintenanceEnd = isNaN(parsedDate.getTime()) ? null : parsedDate;
      } else if (!allowedFields.estimatedMaintenanceEnd) {
        allowedFields.estimatedMaintenanceEnd = null;
      }
    }

    try {
      const updated = await prisma.systemSettings.upsert({
        where: { id: this.defaultId },
        update: allowedFields,
        create: {
          ...this.defaultData,
          ...allowedFields,
        },
      });

      return this.mapFromDb(updated);
    } catch (err) {
      console.error('Failed to update system settings in DB via Prisma:', err);
      throw err;
    }
  }

  /**
   * Safe public settings (no secrets, exposed for landing/login/layout)
   */
  public async getPublicSettings(): Promise<PublicPortalSettings> {
    const full = await this.getSettings();
    return {
      portalName: full.portalName,
      portalDescription: full.portalDescription,
      organizationName: full.organizationName,
      supportEmail: full.supportEmail,
      supportPhone: full.supportPhone,
      supportWebsite: full.supportWebsite,
      logoUrl: full.logoUrl,
      faviconUrl: full.faviconUrl,
      loginLogoUrl: full.loginLogoUrl,
      primaryColor: full.primaryColor,
      defaultTheme: full.defaultTheme,
      portalStatus: full.portalStatus,
      maintenanceTitle: full.maintenanceTitle,
      maintenanceMessage: full.maintenanceMessage,
      estimatedMaintenanceEnd: full.estimatedMaintenanceEnd,
      helpCenterUrl: full.helpCenterUrl,
      privacyPolicyUrl: full.privacyPolicyUrl,
      termsOfServiceUrl: full.termsOfServiceUrl,
      defaultLanguage: full.defaultLanguage,
      availableLanguages: full.availableLanguages,
      defaultTimezone: full.defaultTimezone,
      dateFormat: full.dateFormat,
      timeFormat: full.timeFormat,
      currency: full.currency,
    };
  }

  private async initDefaults(): Promise<void> {
    try {
      const { id, createdAt, updatedAt, ...defaults } = this.defaultData as any;
      await prisma.systemSettings.upsert({
        where: { id: this.defaultId },
        update: {},
        create: {
          id: this.defaultId,
          ...defaults,
          estimatedMaintenanceEnd: null,
        },
      });
    } catch (err) {
      console.error('Failed to init default system settings:', err);
    }
  }

  private mapFromDb(row: any): SystemSettingsData {
    return {
      id: row.id,
      portalName: row.portalName ?? this.defaultData.portalName,
      portalDescription: row.portalDescription ?? this.defaultData.portalDescription,
      organizationName: row.organizationName ?? this.defaultData.organizationName,
      supportEmail: row.supportEmail ?? this.defaultData.supportEmail,
      supportPhone: row.supportPhone ?? this.defaultData.supportPhone,
      supportWebsite: row.supportWebsite ?? this.defaultData.supportWebsite,
      logoUrl: row.logoUrl ?? this.defaultData.logoUrl,
      faviconUrl: row.faviconUrl ?? this.defaultData.faviconUrl,
      loginLogoUrl: row.loginLogoUrl ?? this.defaultData.loginLogoUrl,
      emailLogoUrl: row.emailLogoUrl ?? this.defaultData.emailLogoUrl,
      primaryColor: row.primaryColor ?? this.defaultData.primaryColor,
      defaultTheme: row.defaultTheme ?? this.defaultData.defaultTheme,
      portalStatus: row.portalStatus ?? this.defaultData.portalStatus,
      maintenanceTitle: row.maintenanceTitle ?? this.defaultData.maintenanceTitle,
      maintenanceMessage: row.maintenanceMessage ?? this.defaultData.maintenanceMessage,
      estimatedMaintenanceEnd: row.estimatedMaintenanceEnd ? new Date(row.estimatedMaintenanceEnd).toISOString() : null,
      technicalContact: row.technicalContact ?? this.defaultData.technicalContact,
      organizationAddress: row.organizationAddress ?? this.defaultData.organizationAddress,
      helpCenterUrl: row.helpCenterUrl ?? this.defaultData.helpCenterUrl,
      privacyPolicyUrl: row.privacyPolicyUrl ?? this.defaultData.privacyPolicyUrl,
      termsOfServiceUrl: row.termsOfServiceUrl ?? this.defaultData.termsOfServiceUrl,

      allowTrainerCourseCreation: Boolean(row.allowTrainerCourseCreation ?? this.defaultData.allowTrainerCourseCreation),
      requireCourseApproval: Boolean(row.requireCourseApproval ?? this.defaultData.requireCourseApproval),
      requireCoursePublishing: Boolean(row.requireCoursePublishing ?? this.defaultData.requireCoursePublishing),
      allowCourseUnpublishing: Boolean(row.allowCourseUnpublishing ?? this.defaultData.allowCourseUnpublishing),
      completionPercentage: Number(row.completionPercentage ?? this.defaultData.completionPercentage),
      assessmentPassingScore: Number(row.assessmentPassingScore ?? this.defaultData.assessmentPassingScore),
      certificateEligibility: Number(row.certificateEligibility ?? this.defaultData.certificateEligibility),
      allowSelfEnrollment: Boolean(row.allowSelfEnrollment ?? this.defaultData.allowSelfEnrollment),
      allowTrainerEnrollment: Boolean(row.allowTrainerEnrollment ?? this.defaultData.allowTrainerEnrollment),
      requireApprovalForEnrollment: Boolean(row.requireApprovalForEnrollment ?? this.defaultData.requireApprovalForEnrollment),
      maxActiveCoursesPerTrainee: Number(row.maxActiveCoursesPerTrainee ?? this.defaultData.maxActiveCoursesPerTrainee),
      allowReenrollment: Boolean(row.allowReenrollment ?? this.defaultData.allowReenrollment),
      requireTrainerApproval: Boolean(row.requireTrainerApproval ?? this.defaultData.requireTrainerApproval),
      requireTrainerProfileCompletion: Boolean(row.requireTrainerProfileCompletion ?? this.defaultData.requireTrainerProfileCompletion),
      allowedResourceTypes: Array.isArray(row.allowedResourceTypes) ? row.allowedResourceTypes : this.defaultData.allowedResourceTypes,
      maxFileSizeMb: Number(row.maxFileSizeMb ?? this.defaultData.maxFileSizeMb),
      requireResourceReview: Boolean(row.requireResourceReview ?? this.defaultData.requireResourceReview),
      allowExternalUrls: Boolean(row.allowExternalUrls ?? this.defaultData.allowExternalUrls),
      assessmentDefaultPassingScore: Number(row.assessmentDefaultPassingScore ?? this.defaultData.assessmentDefaultPassingScore),
      assessmentMaxAttempts: Number(row.assessmentMaxAttempts ?? this.defaultData.assessmentMaxAttempts),
      assessmentAllowRetakes: Boolean(row.assessmentAllowRetakes ?? this.defaultData.assessmentAllowRetakes),
      assessmentRandomizeQuestions: Boolean(row.assessmentRandomizeQuestions ?? this.defaultData.assessmentRandomizeQuestions),
      assessmentShowCorrectAnswers: Boolean(row.assessmentShowCorrectAnswers ?? this.defaultData.assessmentShowCorrectAnswers),
      assessmentShowExplanation: Boolean(row.assessmentShowExplanation ?? this.defaultData.assessmentShowExplanation),
      assessmentTimeLimitMinutes: Number(row.assessmentTimeLimitMinutes ?? this.defaultData.assessmentTimeLimitMinutes),

      revisionMasteryThreshold: Number(row.revisionMasteryThreshold ?? this.defaultData.revisionMasteryThreshold),
      revisionCooldownHours: Number(row.revisionCooldownHours ?? this.defaultData.revisionCooldownHours),
      revisionMaxTopicsPerSession: Number(row.revisionMaxTopicsPerSession ?? this.defaultData.revisionMaxTopicsPerSession),
      revisionDiagnosticConfidenceThreshold: Number(row.revisionDiagnosticConfidenceThreshold ?? this.defaultData.revisionDiagnosticConfidenceThreshold),
      topicWeaknessWeight: Number(row.topicWeaknessWeight ?? this.defaultData.topicWeaknessWeight),
      topicForgettingWeight: Number(row.topicForgettingWeight ?? this.defaultData.topicForgettingWeight),
      topicImportanceWeight: Number(row.topicImportanceWeight ?? this.defaultData.topicImportanceWeight),
      topicDependencyWeight: Number(row.topicDependencyWeight ?? this.defaultData.topicDependencyWeight),
      topicErrorWeight: Number(row.topicErrorWeight ?? this.defaultData.topicErrorWeight),
      topicUncertaintyWeight: Number(row.topicUncertaintyWeight ?? this.defaultData.topicUncertaintyWeight),
      topicRecencyWeight: Number(row.topicRecencyWeight ?? this.defaultData.topicRecencyWeight),

      enableInAppNotifications: Boolean(row.enableInAppNotifications ?? this.defaultData.enableInAppNotifications),
      enableEmailNotifications: Boolean(row.enableEmailNotifications ?? this.defaultData.enableEmailNotifications),
      enableAnnouncementNotifications: Boolean(row.enableAnnouncementNotifications ?? this.defaultData.enableAnnouncementNotifications),
      notifyTraineesOnAnnouncement: Boolean(row.notifyTraineesOnAnnouncement ?? this.defaultData.notifyTraineesOnAnnouncement),
      notifyTrainersOnAnnouncement: Boolean(row.notifyTrainersOnAnnouncement ?? this.defaultData.notifyTrainersOnAnnouncement),
      notifyCourseApproved: Boolean(row.notifyCourseApproved ?? this.defaultData.notifyCourseApproved),
      notifyCourseRejected: Boolean(row.notifyCourseRejected ?? this.defaultData.notifyCourseRejected),
      notifyCoursePublished: Boolean(row.notifyCoursePublished ?? this.defaultData.notifyCoursePublished),
      notifyCourseUnpublished: Boolean(row.notifyCourseUnpublished ?? this.defaultData.notifyCourseUnpublished),
      notifyCourseEnrollment: Boolean(row.notifyCourseEnrollment ?? this.defaultData.notifyCourseEnrollment),
      notifyAssessmentResult: Boolean(row.notifyAssessmentResult ?? this.defaultData.notifyAssessmentResult),
      notifyCourseCompletion: Boolean(row.notifyCourseCompletion ?? this.defaultData.notifyCourseCompletion),
      notifyRevisionReminder: Boolean(row.notifyRevisionReminder ?? this.defaultData.notifyRevisionReminder),

      enableAiFeatures: Boolean(row.enableAiFeatures ?? this.defaultData.enableAiFeatures),
      enableAiSkillGapAnalyzer: Boolean(row.enableAiSkillGapAnalyzer ?? this.defaultData.enableAiSkillGapAnalyzer),
      enableAiCourseRecommendations: Boolean(row.enableAiCourseRecommendations ?? this.defaultData.enableAiCourseRecommendations),
      enableAiRevisionAssistant: Boolean(row.enableAiRevisionAssistant ?? this.defaultData.enableAiRevisionAssistant),
      enableAiAnalyticsAssistant: Boolean(row.enableAiAnalyticsAssistant ?? this.defaultData.enableAiAnalyticsAssistant),
      enableAiChatbot: Boolean(row.enableAiChatbot ?? this.defaultData.enableAiChatbot),
      aiProvider: row.aiProvider ?? this.defaultData.aiProvider,
      aiModel: row.aiModel ?? this.defaultData.aiModel,
      aiTemperature: Number(row.aiTemperature ?? this.defaultData.aiTemperature),
      aiMaxTokens: Number(row.aiMaxTokens ?? this.defaultData.aiMaxTokens),
      aiAnalyticsMaxQueryComplexity: row.aiAnalyticsMaxQueryComplexity ?? this.defaultData.aiAnalyticsMaxQueryComplexity,
      aiAnalyticsDateRangeLimitDays: Number(row.aiAnalyticsDateRangeLimitDays ?? this.defaultData.aiAnalyticsDateRangeLimitDays),
      aiAnalyticsEnableChartGen: Boolean(row.aiAnalyticsEnableChartGen ?? this.defaultData.aiAnalyticsEnableChartGen),
      aiAllowAggregatedAnalytics: Boolean(row.aiAllowAggregatedAnalytics ?? this.defaultData.aiAllowAggregatedAnalytics),
      aiAllowCoursePerformance: Boolean(row.aiAllowCoursePerformance ?? this.defaultData.aiAllowCoursePerformance),
      aiAllowTrainerPerformance: Boolean(row.aiAllowTrainerPerformance ?? this.defaultData.aiAllowTrainerPerformance),
      aiAllowCompetencyAnalytics: Boolean(row.aiAllowCompetencyAnalytics ?? this.defaultData.aiAllowCompetencyAnalytics),
      aiApiKeyMasked: '••••••••••••••••',

      sessionTimeoutMinutes: Number(row.sessionTimeoutMinutes ?? this.defaultData.sessionTimeoutMinutes),
      jwtAccessExpirationMinutes: Number(row.jwtAccessExpirationMinutes ?? this.defaultData.jwtAccessExpirationMinutes),
      jwtRefreshExpirationDays: Number(row.jwtRefreshExpirationDays ?? this.defaultData.jwtRefreshExpirationDays),
      requireStrongPassword: Boolean(row.requireStrongPassword ?? this.defaultData.requireStrongPassword),
      passwordMinLength: Number(row.passwordMinLength ?? this.defaultData.passwordMinLength),
      maxLoginAttempts: Number(row.maxLoginAttempts ?? this.defaultData.maxLoginAttempts),
      lockoutDurationMinutes: Number(row.lockoutDurationMinutes ?? this.defaultData.lockoutDurationMinutes),
      publicRegistrationPolicy: row.publicRegistrationPolicy ?? this.defaultData.publicRegistrationPolicy,

      defaultLanguage: row.defaultLanguage ?? this.defaultData.defaultLanguage,
      availableLanguages: Array.isArray(row.availableLanguages) ? row.availableLanguages : this.defaultData.availableLanguages,
      defaultTimezone: row.defaultTimezone ?? this.defaultData.defaultTimezone,
      dateFormat: row.dateFormat ?? this.defaultData.dateFormat,
      timeFormat: row.timeFormat ?? this.defaultData.timeFormat,
      currency: row.currency ?? this.defaultData.currency,

      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : this.defaultData.createdAt,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : this.defaultData.updatedAt,
    };
  }
}
