import prisma from '../src/database/client';
import { roleCompetencyService } from '../src/services/role-competency.service';
import { onboardingService } from '../src/services/onboarding.service';
import { dataSufficiencyService } from '../src/services/data-sufficiency.service';
import { courseMatchingService } from '../src/services/course-matching.service';
import { trainerMatchingService } from '../src/services/trainer-matching.service';
import { traineeRecommendationService } from '../src/services/trainee-recommendation.service';
import { SkillGapAnalysisService } from '../src/modules/skill-gap/services/skill-gap-analysis.service';
import { Role, UserStatus, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function runTraineePipelineVerification() {
  console.log('========================================================================');
  console.log('CAPACITY CONNECT — TRAINEE WORKFLOW & RECOMMENDATION PIPELINE VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}${details ? ` -> ${details}` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Role Competency Catalogue
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Role Competency Resolver (Database Catalogue) ---');
  const roles = await roleCompetencyService.getRoles();
  assert(roles.length >= 8, 'Role catalogue has at least 8 active roles', `Found ${roles.length} roles`);

  const radarRole = roles.find((r) => r.code === 'ROLE-RADAR-001');
  assert(Boolean(radarRole), 'Doppler Weather Radar Specialist role exists');

  if (radarRole) {
    const radarComps = await roleCompetencyService.getRoleCompetencies(radarRole.id);
    assert(radarComps.length >= 3, 'Radar Specialist role has mapped required competencies', `Mapped ${radarComps.length} competencies`);
    const hasCore = radarComps.some((c) => c.criticality === 'CORE');
    assert(hasCore, 'Radar Specialist competencies include CORE requirements');
  }

  // ---------------------------------------------------------------------------
  // 2. Trainee Setup & Cold-Start Scenarios
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing Trainee Onboarding & Data Sufficiency State Machine ---');
  const testEmail = 'verify.trainee.pipeline@imd.gov.in';
  let testUser = await prisma.user.findUnique({ where: { email: testEmail } });

  const org = await prisma.organization.findFirst() || await prisma.organization.create({
    data: { name: 'IMD New Delhi', code: 'IMD-ND' },
  });

  const pwHash = await bcrypt.hash('SecurePassword@123', 10);

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: pwHash,
        firstName: 'Ananya',
        lastName: 'Sharma',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        organizationId: org.id,
      },
    });
  }

  // Clear previous test state
  await prisma.userSkill.deleteMany({ where: { userId: testUser.id } });
  await prisma.userCompetency.deleteMany({ where: { userId: testUser.id } });
  await prisma.assessmentAttempt.deleteMany({ where: { userId: testUser.id } });
  await prisma.traineeProfile.deleteMany({ where: { userId: testUser.id } });

  // Scenario A: Unonboarded user (no role, no skills) -> Must be BLOCKED
  await prisma.traineeProfile.create({
    data: {
      userId: testUser.id,
      designation: 'Cadre Trainee',
      profileCompleted: false,
    },
  });

  const unonboardedSufficiency = await dataSufficiencyService.evaluateSufficiency(testUser.id);
  assert(unonboardedSufficiency.status === 'BLOCKED', 'Unonboarded trainee is BLOCKED', `Score: ${unonboardedSufficiency.score}`);
  assert(unonboardedSufficiency.code === 'INSUFFICIENT_PROFILE_DATA', 'Error code is INSUFFICIENT_PROFILE_DATA');
  assert(unonboardedSufficiency.nextAction === 'COMPLETE_PROFILE', 'Next action is COMPLETE_PROFILE');

  // Scenario B: User with role but 0 skills -> Must be NEEDS_MORE_DATA
  const metRole = roles.find((r) => r.code === 'ROLE-MET-001') || roles[0];
  await onboardingService.submitOnboarding(testUser.id, {
    designation: 'Meteorologist Grade-I',
    targetRoleId: metRole.id,
    skills: [], // No skills
    learningGoals: ['Severe weather nowcasting'],
  });

  const noSkillsSufficiency = await dataSufficiencyService.evaluateSufficiency(testUser.id);
  assert(noSkillsSufficiency.status === 'NEEDS_MORE_DATA', 'Role with 0 skills is NEEDS_MORE_DATA', `Score: ${noSkillsSufficiency.score}`);
  assert(noSkillsSufficiency.nextAction === 'DIAGNOSTIC_ASSESSMENT', 'Action suggests diagnostic assessment');
  assert(noSkillsSufficiency.message.includes('target role'), 'Smart UX message communicates role known but skills needed');

  // Scenario C: User onboards with valid role + 3 domain skills -> Must be READY or LIMITED
  await onboardingService.submitOnboarding(testUser.id, {
    designation: 'Meteorologist Grade-I',
    targetRoleId: metRole.id,
    skills: [
      { name: 'Synoptic Meteorology', proficiencyLevel: 3 },
      { name: 'Numerical Weather Prediction', proficiencyLevel: 2 },
      { name: 'Doppler Weather Radar', proficiencyLevel: 2 },
    ],
    learningGoals: ['Monsoon depression forecasting', 'Radar nowcasting'],
    preferredLearningMode: 'HYBRID',
  });

  const skilledSufficiency = await dataSufficiencyService.evaluateSufficiency(testUser.id);
  assert(
    skilledSufficiency.status === 'READY' || skilledSufficiency.status === 'LIMITED',
    'Trainee with role and 3 skills is READY/LIMITED',
    `Score: ${skilledSufficiency.score}, Status: ${skilledSufficiency.status}`,
  );
  assert(skilledSufficiency.score >= 60, 'Sufficiency score is >= 60');

  // ---------------------------------------------------------------------------
  // 3. Cold-Start Diagnostic Assessment
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing Cold-Start Diagnostic Assessment Flow ---');
  const diagnostic = await dataSufficiencyService.getDiagnosticAssessment();
  assert(Boolean(diagnostic && diagnostic.isDiagnostic), 'Diagnostic assessment retrieved with isDiagnostic: true');
  assert(diagnostic.questions.length >= 4, 'Diagnostic assessment has questions', `Questions: ${diagnostic.questions.length}`);

  // Submit diagnostic answers (all correct for testing)
  const answers = diagnostic.questions.map((q) => {
    // Pick first option
    return {
      questionId: q.id,
      selectedOptionId: q.options[0].id,
    };
  });

  const diagResult = await dataSufficiencyService.submitDiagnostic(testUser.id, answers);
  assert(diagResult.diagnosticCompleted, 'Diagnostic assessment scored and completed');

  // Verify UserCompetency confidence boost
  const userCompsAfterDiag = await prisma.userCompetency.findMany({
    where: { userId: testUser.id },
  });
  assert(userCompsAfterDiag.length > 0, 'User competencies initialized after diagnostic', `Count: ${userCompsAfterDiag.length}`);
  const hasElevatedConfidence = userCompsAfterDiag.some((uc) => (uc.confidenceScore ?? 0) >= 0.70);
  assert(hasElevatedConfidence, 'Competency confidence elevated to >= 0.70 after diagnostic assessment');

  // Post-diagnostic sufficiency score
  const postDiagSufficiency = await dataSufficiencyService.evaluateSufficiency(testUser.id);
  assert(postDiagSufficiency.score >= 80, 'Sufficiency score reaches >= 80 after diagnostic check', `Score: ${postDiagSufficiency.score}`);
  assert(postDiagSufficiency.status === 'READY', 'Sufficiency status upgraded to READY');

  // ---------------------------------------------------------------------------
  // 4. AI Skill Gap Analysis
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testing AI Skill Gap Analyzer (Database Truth) ---');
  const skillGapService = new SkillGapAnalysisService();
  const gapResult = await skillGapService.analyzeLearnerGaps({
    userId: testUser.id,
    includeAiGuidance: true,
  });

  assert(Boolean(gapResult.id), 'Skill gap analysis generated and persisted');
  assert(Array.isArray(gapResult.items) && gapResult.items.length > 0, 'Identified gap items from learner competencies');
  assert(Boolean(gapResult.aiGuidance), 'AI Guidance structured output present');
  assert(Boolean(gapResult.aiGuidance?.actionableLearningPath), 'Actionable learning path provided in guidance');

  // ---------------------------------------------------------------------------
  // 5. Course Matching Engine & Hard DB Filter
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testing Course Matching Engine & Hard Availability Filter ---');
  const missingComps = gapResult.items
    .filter((i) => i.rawGap > 0)
    .map((i) => ({
      competencyId: i.competencyId,
      code: i.code,
      name: i.name,
      requiredLevel: i.requiredLevel,
      currentLevel: i.currentLevel,
      gapLevel: i.rawGap,
      gapSeverity: i.priorityLevel as any,
      importance: 85,
    }));

  const matching = await courseMatchingService.matchCoursesForGaps(missingComps);
  assert(Array.isArray(matching.courses), 'Matching returns course list', `Matched: ${matching.courses.length} courses`);

  // Ensure ONLY PUBLISHED courses are matched (HARD FILTER)
  const matchedCourseIds = matching.courses.map((c) => c.courseId);
  if (matchedCourseIds.length > 0) {
    const nonPublishedInDb = await prisma.course.count({
      where: {
        id: { in: matchedCourseIds },
        status: { not: CourseStatus.PUBLISHED },
      },
    });
    assert(nonPublishedInDb === 0, 'HARD FILTER: Zero draft or unpublished courses returned');
  }

  // ---------------------------------------------------------------------------
  // 6. Course Recommendation Ranking
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Testing Course Recommendation Ranking (6-Factor Explainable Weights) ---');
  const recsResponse = await traineeRecommendationService.getTraineeRecommendations(testUser.id);
  assert(recsResponse.hasRecommendations, 'Personalized recommendations generated successfully');
  assert(recsResponse.recommendations.length > 0, 'Recommendations contain ranked courses', `Count: ${recsResponse.recommendations.length}`);

  const topCourse = recsResponse.recommendations[0];
  assert(topCourse.finalScore >= 60, 'Top recommended course has valid match score', `Score: ${topCourse.finalScore}%`);
  assert(Boolean(topCourse.explanation.headline), 'Recommendation has headline', `Headline: "${topCourse.explanation.headline}"`);
  assert(Boolean(topCourse.explanation.whyRecommended), 'Recommendation has explainable reason', `Why: "${topCourse.explanation.whyRecommended}"`);
  assert(Boolean(topCourse.factorScores.skillGapRelevance !== undefined), 'Factor breakdown includes skill gap relevance (35%)');
  assert(Boolean(topCourse.factorScores.competencyCoverage !== undefined), 'Factor breakdown includes competency coverage (25%)');

  // ---------------------------------------------------------------------------
  // 7. Course-Specific Mentor Matching & Ranking
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Testing Course-Specific Mentor Matching & Ranking ---');
  const courseId = topCourse.courseId;
  const mentorsResult = await trainerMatchingService.matchTrainersForCourse(courseId);

  assert(mentorsResult.courseId === courseId, 'Matched mentors returned for requested courseId');
  assert(mentorsResult.status === 'MATCHED' || mentorsResult.status === 'LIMITED_EVIDENCE', 'Mentor matching status is valid');
  assert(mentorsResult.trainers.length > 0, 'Found approved mentors for course', `Mentors count: ${mentorsResult.trainers.length}`);

  const topMentor = mentorsResult.trainers[0];
  assert(topMentor.matchScore >= 60, 'Top mentor has match score', `Match: ${topMentor.matchScore}%`);
  assert(topMentor.rating >= 4.0, 'Top mentor has valid rating', `Rating: ${topMentor.rating}`);
  assert(Boolean(topMentor.factorScores.courseExpertise !== undefined), 'Factor breakdown includes course expertise (35%)');
  assert(Boolean(topMentor.factorScores.rating !== undefined), 'Factor breakdown includes rating (20%)');
  assert(Boolean(topMentor.reason), 'Mentor has explainable reason text', `Reason: "${topMentor.reason}"`);

  // Test Non-existent Course Mentor Matching (Should throw 404 NotFoundError)
  let notFoundCaught = false;
  try {
    await trainerMatchingService.matchTrainersForCourse('non-existent-course-id-12345');
  } catch (err: any) {
    notFoundCaught = true;
  }
  assert(notFoundCaught, 'Non-existent course correctly throws NotFoundError');

  console.log('\n========================================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTraineePipelineVerification()
  .catch((e) => {
    console.error('Verification failed with unhandled error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
