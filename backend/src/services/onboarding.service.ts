import prisma from '../database/client';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import { SkillSource, CompetencySource } from '@prisma/client';

export interface TraineeSkillInput {
  name: string;
  proficiencyLevel?: number; // 1-5
  yearsExperience?: number;
}

export interface TraineeOnboardingPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  targetRoleId?: string;
  designation: string;
  yearsExperience?: number;
  bio?: string;
  skills: (string | TraineeSkillInput)[];
  interests?: string[];
  learningGoals?: string[];
  preferredLearningMode?: string; // ONLINE, HYBRID, SELF_PACED
  preferredLanguage?: string;
  availableHoursPerWeek?: number;
  preferredTrainerMode?: string; // ONE_ON_ONE, GROUP, ASYNCHRONOUS
}

export interface OnboardingStatusDto {
  profileCompleted: boolean;
  initialAssessmentCompleted: boolean;
  competencyProfileInitialized: boolean;
  profileCompletion: number;
  targetRole: {
    id: string;
    name: string;
    code: string;
    department: string | null;
  } | null;
  currentSkillsCount: number;
  learningGoals: string[];
}

export class OnboardingService {
  /**
   * Retrieves current onboarding completeness status for a trainee
   */
  public async getOnboardingStatus(userId: string): Promise<OnboardingStatusDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        traineeProfile: {
          include: {
            targetRole: true,
          },
        },
        userSkills: true,
      },
    });

    if (!user) {
      throw new NotFoundError(`User '${userId}' not found.`);
    }

    const profile = user.traineeProfile;

    return {
      profileCompleted: profile?.profileCompleted ?? false,
      initialAssessmentCompleted: profile?.initialAssessmentCompleted ?? false,
      competencyProfileInitialized: profile?.competencyProfileInitialized ?? false,
      profileCompletion: profile?.profileCompletion ?? 0,
      targetRole: profile?.targetRole
        ? {
            id: profile.targetRole.id,
            name: profile.targetRole.name,
            code: profile.targetRole.code,
            department: profile.targetRole.department,
          }
        : null,
      currentSkillsCount: user.userSkills.length,
      learningGoals: profile?.learningGoals || [],
    };
  }

  /**
   * Submits structured onboarding profile data
   */
  public async submitOnboarding(userId: string, data: TraineeOnboardingPayload) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { traineeProfile: true },
    });

    if (!user) {
      throw new NotFoundError(`User '${userId}' not found.`);
    }

    if (!data.designation || data.designation.trim().length === 0) {
      throw new BadRequestError('Designation is required for cadre onboarding.');
    }

    // Validate target role if provided
    let resolvedRoleId: string | null = null;
    if (data.targetRoleId) {
      const role = await prisma.roleProfile.findFirst({
        where: {
          OR: [{ id: data.targetRoleId }, { code: data.targetRoleId }],
        },
      });
      if (role) {
        resolvedRoleId = role.id;
      }
    }

    // 1. Update basic user details
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
      },
    });

    // 2. Upsert TraineeProfile
    const profile = await prisma.traineeProfile.upsert({
      where: { userId },
      update: {
        designation: data.designation,
        bio: data.bio || null,
        targetRoleId: resolvedRoleId,
        profileCompleted: true,
        profileCompletion: 100,
        interests: data.interests || [],
        learningGoals: data.learningGoals || [],
        preferredLearningMode: data.preferredLearningMode || 'HYBRID',
        preferredLanguage: data.preferredLanguage || 'English / Hindi',
        availableHoursPerWeek: data.availableHoursPerWeek || 5,
        preferredTrainerMode: data.preferredTrainerMode || 'ONE_ON_ONE',
        competencyProfileInitialized: true,
      },
      create: {
        userId,
        designation: data.designation,
        bio: data.bio || null,
        targetRoleId: resolvedRoleId,
        profileCompleted: true,
        profileCompletion: 100,
        interests: data.interests || [],
        learningGoals: data.learningGoals || [],
        preferredLearningMode: data.preferredLearningMode || 'HYBRID',
        preferredLanguage: data.preferredLanguage || 'English / Hindi',
        availableHoursPerWeek: data.availableHoursPerWeek || 5,
        preferredTrainerMode: data.preferredTrainerMode || 'ONE_ON_ONE',
        competencyProfileInitialized: true,
      },
      include: {
        targetRole: {
          include: {
            roleCompetencies: {
              include: { competency: true },
            },
          },
        },
      },
    });

    // 3. Process and persist User Skills
    const normalizedSkills: TraineeSkillInput[] = [];
    if (data.skills && Array.isArray(data.skills)) {
      for (const item of data.skills) {
        if (typeof item === 'string') {
          if (item.trim().length > 0) {
            normalizedSkills.push({ name: item.trim(), proficiencyLevel: 3 });
          }
        } else if (item && item.name) {
          normalizedSkills.push({
            name: item.name.trim(),
            proficiencyLevel: Math.max(1, Math.min(5, item.proficiencyLevel || 3)),
            yearsExperience: item.yearsExperience,
          });
        }
      }
    }

    for (const skillItem of normalizedSkills) {
      // Find or create skill
      const code = skillItem.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const skill = await prisma.skill.upsert({
        where: { code },
        update: { name: skillItem.name },
        create: {
          name: skillItem.name,
          code,
          category: 'Domain & Technical',
        },
      });

      await prisma.userSkill.upsert({
        where: {
          userId_skillId: {
            userId,
            skillId: skill.id,
          },
        },
        update: {
          proficiencyLevel: skillItem.proficiencyLevel || 3,
          yearsExperience: skillItem.yearsExperience || 1,
          source: SkillSource.PROFILE,
        },
        create: {
          userId,
          skillId: skill.id,
          proficiencyLevel: skillItem.proficiencyLevel || 3,
          yearsExperience: skillItem.yearsExperience || 1,
          source: SkillSource.PROFILE,
        },
      });
    }

    // 4. Initialize Learner Competency Model from Target Role Requirements
    // With cold-start priors: low confidence (0.40 - 0.50)
    if (profile.targetRole && profile.targetRole.roleCompetencies) {
      for (const rc of profile.targetRole.roleCompetencies) {
        const matchingSkill = normalizedSkills.find((s) =>
          rc.competency.name.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(rc.competency.name.toLowerCase()),
        );

        const currentLevel = matchingSkill ? matchingSkill.proficiencyLevel || 2 : 1;
        const baselineScore = matchingSkill ? (currentLevel / 5.0) * 100 : 35.0;

        await prisma.userCompetency.upsert({
          where: {
            userId_competencyId: {
              userId,
              competencyId: rc.competencyId,
            },
          },
          update: {
            currentLevel,
            competencyScore: baselineScore,
            confidenceScore: matchingSkill ? 0.50 : 0.40,
            source: CompetencySource.PROFILE,
          },
          create: {
            userId,
            competencyId: rc.competencyId,
            currentLevel,
            competencyScore: baselineScore,
            confidenceScore: matchingSkill ? 0.50 : 0.40,
            source: CompetencySource.PROFILE,
          },
        });
      }
    }

    return this.getOnboardingStatus(userId);
  }
}

export const onboardingService = new OnboardingService();
