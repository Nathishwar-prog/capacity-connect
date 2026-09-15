import prisma from '../database/client';
import { NotFoundError } from '../errors/app-error';
import { CompetencySource, AttemptStatus } from '@prisma/client';

export type SufficiencyStatus = 'READY' | 'LIMITED' | 'NEEDS_MORE_DATA' | 'BLOCKED';

export type SufficiencyCode =
  | 'READY'
  | 'RECOMMENDATION_ENGINE_ERROR'
  | 'INSUFFICIENT_PROFILE_DATA'
  | 'ROLE_COMPETENCY_DATA_UNAVAILABLE'
  | 'NO_COURSE_MATCH'
  | 'NO_TRAINER_MATCH';

export type NextActionType =
  | 'VIEW_RECOMMENDATIONS'
  | 'COMPLETE_PROFILE'
  | 'ADD_SKILLS'
  | 'DIAGNOSTIC_ASSESSMENT';

export interface DataSufficiencyResult {
  status: SufficiencyStatus;
  score: number; // 0 - 100
  code: SufficiencyCode;
  headline: string;
  message: string;
  nextAction: NextActionType;
  breakdown: {
    validRole: { score: number; max: number; passed: boolean; details: string };
    roleCompetencyMapping: { score: number; max: number; passed: boolean; details: string };
    currentSkills: { score: number; max: number; passed: boolean; count: number };
    skillEvidence: { score: number; max: number; passed: boolean; details: string };
    assessmentEvidence: { score: number; max: number; passed: boolean; count: number };
    learningGoals: { score: number; max: number; passed: boolean; count: number };
  };
  missingData: string[];
  warnings: string[];
}

export class DataSufficiencyService {
  /**
   * Deterministically evaluates data sufficiency before running recommendation or AI pipelines
   */
  public async evaluateSufficiency(userId: string): Promise<DataSufficiencyResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        traineeProfile: {
          include: {
            targetRole: {
              include: {
                roleCompetencies: {
                  include: { competency: true },
                },
              },
            },
          },
        },
        userSkills: {
          include: { skill: true },
        },
        userCompetencies: {
          include: { competency: true },
        },
        assessmentAttempts: {
          where: { status: AttemptStatus.SUBMITTED },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User '${userId}' not found.`);
    }

    const profile = user.traineeProfile;
    const targetRole = profile?.targetRole;
    const roleCompetencies = targetRole?.roleCompetencies || [];
    const skills = user.userSkills;
    const assessmentAttempts = user.assessmentAttempts;
    const goals = profile?.learningGoals || [];

    const missingData: string[] = [];
    const warnings: string[] = [];

    // 1. Signal: Valid Role (20 pts) - HARD REQUIREMENT
    let roleScore = 0;
    let rolePassed = false;
    let roleDetails = 'Target role not specified.';

    if (targetRole) {
      roleScore = 20;
      rolePassed = true;
      roleDetails = `Target role configured: ${targetRole.name}`;
    } else {
      missingData.push('targetRole');
    }

    // 2. Signal: Role Competency Mapping (20 pts)
    let mappingScore = 0;
    let mappingPassed = false;
    let mappingDetails = 'No competency catalogue mapping available.';

    if (rolePassed && roleCompetencies.length > 0) {
      mappingScore = 20;
      mappingPassed = true;
      mappingDetails = `${roleCompetencies.length} competencies mapped from IMD catalogue.`;
    } else if (rolePassed) {
      missingData.push('roleCompetencyMapping');
      warnings.push(`Target role '${targetRole?.name}' currently has no competencies configured in the catalogue.`);
    }

    // 3. Signal: Current Skills (20 pts)
    let skillsScore = 0;
    if (skills.length >= 3) {
      skillsScore = 20;
    } else if (skills.length === 2) {
      skillsScore = 14;
    } else if (skills.length === 1) {
      skillsScore = 8;
    } else {
      missingData.push('currentSkills');
    }
    const skillsPassed = skills.length > 0;

    // 4. Signal: Skill Proficiency / Evidence (20 pts)
    let evidenceScore = 0;
    const hasProficiencies = skills.some((s) => s.proficiencyLevel && s.proficiencyLevel > 1);
    const hasCompetencyScores = user.userCompetencies.some((c) => (c.confidenceScore ?? 0) >= 0.50);

    if (hasCompetencyScores && hasProficiencies) {
      evidenceScore = 20;
    } else if (hasProficiencies || hasCompetencyScores) {
      evidenceScore = 12;
    } else if (skills.length > 0) {
      evidenceScore = 6;
    } else {
      missingData.push('skillEvidence');
    }
    const evidencePassed = evidenceScore >= 12;

    // 5. Signal: Assessment Evidence (10 pts)
    let assessmentScore = 0;
    if (assessmentAttempts.length >= 2) {
      assessmentScore = 10;
    } else if (assessmentAttempts.length === 1 || profile?.initialAssessmentCompleted) {
      assessmentScore = 7;
    } else {
      warnings.push('No objective assessment evidence recorded yet. Recommendations are based on self-reported inputs.');
    }
    const assessmentPassed = assessmentScore > 0;

    // 6. Signal: Learning Goals (10 pts)
    let goalsScore = 0;
    if (goals.length >= 2) {
      goalsScore = 10;
    } else if (goals.length === 1) {
      goalsScore = 6;
    } else {
      warnings.push('No specific learning goals selected.');
    }
    const goalsPassed = goalsScore > 0;

    // Total Score Calculation
    let totalScore = roleScore + mappingScore + skillsScore + evidenceScore + assessmentScore + goalsScore;

    // State Determination
    let status: SufficiencyStatus = 'READY';
    let code: SufficiencyCode = 'READY';
    let nextAction: NextActionType = 'VIEW_RECOMMENDATIONS';
    let headline = 'Recommendation Engine Ready';
    let message = 'Your learner profile has sufficient competency and skill data for personalized course recommendations.';

    // HARD CONSTRAINT: Missing role blocks the pipeline regardless of other data
    if (!rolePassed) {
      status = 'BLOCKED';
      code = 'INSUFFICIENT_PROFILE_DATA';
      nextAction = 'COMPLETE_PROFILE';
      headline = 'Target Cadre Role Required';
      message = 'Please complete onboarding and select your official IMD/MoES role to activate recommendations.';
      totalScore = Math.min(30, totalScore);
    } else if (!mappingPassed) {
      status = 'BLOCKED';
      code = 'ROLE_COMPETENCY_DATA_UNAVAILABLE';
      nextAction = 'COMPLETE_PROFILE';
      headline = 'Role Competency Mapping Unavailable';
      message = `Target role '${targetRole?.name}' does not currently have required competencies configured in the system.`;
    } else if (skills.length === 0 && assessmentAttempts.length === 0) {
      // Role exists, but trainee entered no skills
      status = 'NEEDS_MORE_DATA';
      code = 'INSUFFICIENT_PROFILE_DATA';
      nextAction = 'DIAGNOSTIC_ASSESSMENT';
      headline = 'More Skill Data Needed';
      message = `We know your target role (${targetRole?.name}), but we don't yet have enough information about your current skills.`;
    } else if (totalScore < 40) {
      status = 'BLOCKED';
      code = 'INSUFFICIENT_PROFILE_DATA';
      nextAction = 'ADD_SKILLS';
      headline = 'Insufficient Profile Data';
      message = 'Please provide your current skills or take a diagnostic assessment to receive accurate recommendations.';
    } else if (totalScore < 60) {
      status = 'NEEDS_MORE_DATA';
      code = 'INSUFFICIENT_PROFILE_DATA';
      nextAction = 'DIAGNOSTIC_ASSESSMENT';
      headline = 'Preliminary Profile Data';
      message = 'Add more domain skills or take a quick diagnostic check to refine your learning recommendations.';
    } else if (totalScore < 80) {
      status = 'LIMITED';
      code = 'READY';
      nextAction = 'VIEW_RECOMMENDATIONS';
      headline = 'Good Profile Coverage';
      message = 'Sufficient data available. Recommendations are operational but can be sharpened with a diagnostic check.';
    }

    return {
      status,
      score: totalScore,
      code,
      headline,
      message,
      nextAction,
      breakdown: {
        validRole: { score: roleScore, max: 20, passed: rolePassed, details: roleDetails },
        roleCompetencyMapping: { score: mappingScore, max: 20, passed: mappingPassed, details: mappingDetails },
        currentSkills: { score: skillsScore, max: 20, passed: skillsPassed, count: skills.length },
        skillEvidence: { score: evidenceScore, max: 20, passed: evidencePassed, details: evidencePassed ? 'Verified proficiency' : 'Self-reported prior' },
        assessmentEvidence: { score: assessmentScore, max: 10, passed: assessmentPassed, count: assessmentAttempts.length },
        learningGoals: { score: goalsScore, max: 10, passed: goalsPassed, count: goals.length },
      },
      missingData,
      warnings,
    };
  }

  /**
   * Retrieves active diagnostic assessment for cold-start or low data sufficiency learners
   */
  public async getDiagnosticAssessment() {
    const assessment = await prisma.assessment.findFirst({
      where: {
        isDiagnostic: true,
        status: 'PUBLISHED',
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                optionText: true,
                orderIndex: true,
                // Do NOT expose isCorrect
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError('No active diagnostic assessment available at this time.');
    }

    return assessment;
  }

  /**
   * Authoritative scoring for diagnostic assessment submission
   * Updates Learner Competency model with elevated confidence
   */
  public async submitDiagnostic(
    userId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
  ) {
    const assessment = await prisma.assessment.findFirst({
      where: {
        isDiagnostic: true,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError('Diagnostic assessment not found.');
    }

    let totalMarksObtained = 0;
    let totalPossibleMarks = 0;
    const answerRecords = [];

    for (const q of assessment.questions) {
      totalPossibleMarks += q.marks;
      const submitted = answers.find((a) => a.questionId === q.id);
      const chosenOption = q.options.find((opt) => opt.id === submitted?.selectedOptionId);
      const isCorrect = chosenOption?.isCorrect ?? false;
      const marksObtained = isCorrect ? q.marks : 0;

      totalMarksObtained += marksObtained;

      answerRecords.push({
        questionId: q.id,
        selectedOptionId: submitted?.selectedOptionId || null,
        isCorrect,
        marksObtained,
      });
    }

    const percentage = totalPossibleMarks > 0 ? (totalMarksObtained / totalPossibleMarks) * 100 : 0;
    const passed = percentage >= assessment.passingScore;

    // Record attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        userId,
        score: totalMarksObtained,
        percentage,
        passed,
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        answers: {
          create: answerRecords,
        },
      },
    });

    // Update TraineeProfile
    await prisma.traineeProfile.update({
      where: { userId },
      data: {
        initialAssessmentCompleted: true,
        profileCompletion: 100,
      },
    });

    // Find user's target role and competencies
    const profile = await prisma.traineeProfile.findUnique({
      where: { userId },
      include: {
        targetRole: {
          include: {
            roleCompetencies: true,
          },
        },
      },
    });

    // Update UserCompetency records with diagnostic score and elevated confidence (0.75)
    if (profile?.targetRole?.roleCompetencies) {
      for (const rc of profile.targetRole.roleCompetencies) {
        const diagnosticLevel = Math.max(1, Math.min(5, Math.round((percentage / 100) * 4) + 1));
        await prisma.userCompetency.upsert({
          where: {
            userId_competencyId: {
              userId,
              competencyId: rc.competencyId,
            },
          },
          update: {
            currentLevel: diagnosticLevel,
            competencyScore: percentage,
            confidenceScore: 0.78,
            source: CompetencySource.ASSESSMENT,
            lastAssessedAt: new Date(),
            evidenceCount: { increment: 1 },
          },
          create: {
            userId,
            competencyId: rc.competencyId,
            currentLevel: diagnosticLevel,
            competencyScore: percentage,
            confidenceScore: 0.78,
            source: CompetencySource.ASSESSMENT,
            lastAssessedAt: new Date(),
            evidenceCount: 1,
          },
        });
      }
    }

    return {
      attemptId: attempt.id,
      score: totalMarksObtained,
      percentage,
      passed,
      diagnosticCompleted: true,
      message: 'Diagnostic assessment evaluated successfully. Competency model initialized.',
    };
  }
}

export const dataSufficiencyService = new DataSufficiencyService();
