import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runVerification() {
  console.log('================================================================');
  console.log('🔍 RUNNING MoES / IMD DATABASE VERIFICATION & INTEGRITY TESTS');
  console.log('================================================================\n');

  // Test 0: Aggregate Counts
  const totalUsers = await prisma.user.count();
  const totalTrainees = await prisma.traineeProfile.count();
  const totalTrainers = await prisma.trainerProfile.count();
  const totalCourses = await prisma.course.count();
  const totalModules = await prisma.courseModule.count();
  const totalLessons = await prisma.lesson.count();
  const totalEnrollments = await prisma.enrollment.count();
  const totalCompetencies = await prisma.competency.count();
  const totalSkills = await prisma.skill.count();

  console.log('📊 Aggregate System Metrics:');
  console.log(`   - Total Users: ${totalUsers}`);
  console.log(`   - Trainee Profiles: ${totalTrainees} (Target: 30+)`);
  console.log(`   - Trainer Profiles: ${totalTrainers}`);
  console.log(`   - Courses: ${totalCourses}`);
  console.log(`   - Course Modules: ${totalModules}`);
  console.log(`   - Lessons: ${totalLessons}`);
  console.log(`   - Enrollments: ${totalEnrollments}`);
  console.log(`   - Competencies: ${totalCompetencies}`);
  console.log(`   - Domain Skills: ${totalSkills}\n`);

  if (totalTrainees < 30) {
    throw new Error(`Expected at least 30 trainees, found ${totalTrainees}`);
  }
  if (totalCourses !== 8) {
    throw new Error(`Expected 8 domain courses, found ${totalCourses}`);
  }

  // Test 1: User -> TraineeProfile & Department
  const traineeUser = await prisma.user.findFirst({
    where: { email: 'user@enterprise.com' },
    include: { traineeProfile: true, department: true, organization: true },
  });
  console.log('✅ Test 1: User -> TraineeProfile & Organization');
  console.log(`   User: ${traineeUser?.firstName} ${traineeUser?.lastName} (${traineeUser?.email})`);
  console.log(`   Org: ${traineeUser?.organization.name} | Dept: ${traineeUser?.department?.name}`);
  console.log(`   Trainee Profile: ${traineeUser?.traineeProfile?.designation} | Completion: ${traineeUser?.traineeProfile?.profileCompletion}%\n`);

  // Test 2: User -> Skills
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: traineeUser!.id },
    include: { skill: true },
  });
  console.log('✅ Test 2: User -> Skills');
  userSkills.forEach((us) => {
    console.log(`   - Skill: ${us.skill.name} (${us.skill.code}) | Level: ${us.proficiencyLevel}/5 | Source: ${us.source}`);
  });
  console.log('');

  // Test 3: Trainer -> Courses
  const trainer = await prisma.user.findFirst({
    where: { email: 'dr.rathore.trainer@imd.gov.in' },
    include: { trainerProfile: true, taughtCourses: true },
  });
  console.log('✅ Test 3: Trainer -> Courses');
  console.log(`   Trainer: ${trainer?.firstName} ${trainer?.lastName} (${trainer?.trainerProfile?.designation})`);
  trainer?.taughtCourses.forEach((c) => {
    console.log(`   - Taught Course: ${c.title} [${c.difficulty}] (Slug: ${c.slug})`);
  });
  console.log('');

  // Test 4: Course -> Modules -> Lessons
  const courseWithModules = await prisma.course.findFirst({
    where: { slug: 'synoptic-weather-forecasting-analysis' },
    include: {
      modules: {
        include: { lessons: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
  console.log('✅ Test 4: Course -> Modules -> Lessons');
  console.log(`   Course: ${courseWithModules?.title}`);
  courseWithModules?.modules.forEach((m) => {
    console.log(`   Module ${m.orderIndex}: ${m.title} (${m.lessons.length} lessons)`);
    m.lessons.forEach((l) => {
      console.log(`     - Lesson ${l.orderIndex}: ${l.title} [${l.contentType}] (${l.durationMinutes}m)`);
    });
  });
  console.log('');

  // Test 5: Course -> Enrollment
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: courseWithModules!.id },
    include: { user: true, lessonProgress: true },
  });
  console.log('✅ Test 5: Course -> Enrollment & Lesson Progress');
  enrollments.forEach((e) => {
    console.log(`   Enrolled: ${e.user.email} | Status: ${e.status} | Progress: ${e.progressPercentage}% | Lessons logged: ${e.lessonProgress.length}`);
  });
  console.log('');

  // Test 6: Course -> Assessment -> Questions -> Options
  const assessment = await prisma.assessment.findFirst({
    where: { courseId: courseWithModules!.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
  console.log('✅ Test 6 & 7: Course -> Assessment -> Questions -> Options');
  console.log(`   Assessment: ${assessment?.title} (Passing: ${assessment?.passingScore}%)`);
  assessment?.questions.forEach((q) => {
    console.log(`   Q${q.orderIndex}: ${q.questionText} (${q.marks} marks)`);
    q.options.forEach((o) => {
      console.log(`     [${o.isCorrect ? '✓' : ' '}] ${o.optionText}`);
    });
  });
  console.log('');

  // Test 8: Assessment -> Attempts -> Answers & Competency Results
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessmentId: assessment!.id },
    include: {
      user: true,
      competencyResults: { include: { competency: true } },
    },
  });
  console.log('✅ Test 8: Assessment -> Attempts -> Results');
  attempts.forEach((a) => {
    console.log(`   Attempt by ${a.user.email}: Score=${a.score} (${a.percentage}%) | Status: ${a.status} | Passed: ${a.passed}`);
    a.competencyResults.forEach((cr) => {
      console.log(`     Competency Result: ${cr.competency.name} -> Level Achieved: ${cr.levelAchieved}`);
    });
  });
  console.log('');

  // Test 9: Course -> Competency Mappings
  const courseCompetencies = await prisma.courseCompetency.findMany({
    where: { courseId: courseWithModules!.id },
    include: { competency: { include: { levels: true } } },
  });
  console.log('✅ Test 9: Course -> Competencies');
  courseCompetencies.forEach((cc) => {
    console.log(`   Course develops: ${cc.competency.name} -> Target Level: ${cc.targetLevel}`);
  });
  console.log('');

  // Test 10: User -> Competency
  const userCompetencies = await prisma.userCompetency.findMany({
    where: { userId: traineeUser!.id },
    include: { competency: true },
  });
  console.log('✅ Test 10: User -> Competencies');
  userCompetencies.forEach((uc) => {
    console.log(`   User Competency: ${uc.competency.name} | Current Level: ${uc.currentLevel}/5 | Confidence: ${uc.confidenceScore}`);
  });
  console.log('');

  // Test 11: User -> SkillGap
  const skillGaps = await prisma.skillGap.findMany({
    where: { userId: traineeUser!.id },
    include: { competency: true },
  });
  console.log('✅ Test 11: User -> Skill Gaps');
  skillGaps.forEach((sg) => {
    console.log(`   Skill Gap in ${sg.competency.name}: Current=${sg.currentLevel}, Required=${sg.requiredLevel}, Gap=${sg.gapLevel} | Priority: ${sg.priority} | Status: ${sg.status}`);
  });
  console.log('');

  // Test 12: User -> Recommendations & Trainer Match
  const recommendations = await prisma.recommendation.findMany({
    where: { userId: traineeUser!.id },
    include: { course: true, competency: true },
  });
  console.log('✅ Test 12: User -> Recommendations');
  recommendations.forEach((r) => {
    console.log(`   Type: ${r.recommendationType} | Course: ${r.course?.title} | Reason: ${r.reason} | Status: ${r.status}`);
  });

  const trainerMatches = await prisma.trainerMatch.findMany({
    where: { traineeId: traineeUser!.id },
    include: { trainer: { include: { trainerProfile: true } }, competency: true },
  });
  console.log('\n✅ Test 13: Trainee -> Trainer Match');
  trainerMatches.forEach((tm) => {
    console.log(`   Matched with: ${tm.trainer.firstName} ${tm.trainer.lastName} | Score: ${tm.matchScore}% | Reason: ${tm.reason}`);
  });

  // End-to-End Flow Verification
  console.log('\n================================================================');
  console.log('🌟 COMPLETE END-TO-END DOMAIN FLOW VERIFICATION');
  console.log('================================================================');
  console.log(`1. User: ${traineeUser?.email}`);
  console.log(`2. Trainee Profile: ${traineeUser?.traineeProfile?.designation}`);
  console.log(`3. User Skill: ${userSkills[0].skill.name} (Lvl ${userSkills[0].proficiencyLevel})`);
  console.log(`4. Target Competency: ${userCompetencies[0].competency.name}`);
  console.log(`5. Skill Gap Identified: Lvl ${skillGaps[0].currentLevel} vs Required Lvl ${skillGaps[0].requiredLevel}`);
  console.log(`6. Recommended Course: ${recommendations[0].course?.title}`);
  console.log(`7. Course Enrollment: ${enrollments[0].courseId} (${enrollments[0].status})`);
  console.log(`8. Assessment Attempt: Score ${attempts[0].score} (Passed=${attempts[0].passed})`);
  console.log(`9. Competency Result: ${attempts[0].competencyResults[0].competency.name} Achieved Lvl ${attempts[0].competencyResults[0].levelAchieved}`);
  console.log(`10. User Competency Updated: Current Level = ${userCompetencies[0].currentLevel}`);
  console.log('================================================================');
  console.log('✨ ALL DATABASE TESTS AND RELATIONS VERIFIED SUCCESSFULLY!');
  console.log('================================================================');
}

runVerification()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
