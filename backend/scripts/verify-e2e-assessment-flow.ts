import fs from 'fs';
import path from 'path';
import { prisma } from '../src/database/client';
import { Role, AssessmentStatus } from '@prisma/client';
import { assessmentImportService } from '../src/services/assessment-import.service';
import { AssessmentService } from '../src/services/assessment.service';
import { CourseStructureService } from '../src/services/course-structure.service';
import { TrainerMonitoringService } from '../src/services/trainer-monitoring.service';
import { CourseRepository } from '../src/repositories/course.repository';
import { CourseModuleRepository } from '../src/repositories/course-module.repository';
import { LessonRepository } from '../src/repositories/lesson.repository';
import { UserRepository } from '../src/repositories/user.repository';

async function runE2EWorkflow() {
  console.log('================================================================');
  console.log('🚀 CAPACITY CONNECT — COMPLETE E2E WORKFLOW VERIFICATION');
  console.log('================================================================\n');

  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedAssertions++;
    } else {
      console.error(`  ✕ FAIL: ${testName}`);
      if (details) console.error('    Details:', details);
      failedAssertions++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. Discover Target Course, Module, Trainer, and Trainee
  // -------------------------------------------------------------------------
  console.log('--- Step 1: Discovering Canonical Course Hierarchy in Database ---');

  // Find the canonical Forecasters Training Course with 7 modules and 27 lessons
  const course = await prisma.course.findFirst({
    where: {
      title: 'Forecasters Training Course',
      status: 'PUBLISHED',
      modules: {
        some: {
          title: { contains: 'Advanced Atmospheric Dynamics', mode: 'insensitive' },
        },
      },
    },
    include: {
      trainer: true,
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
  });

  assert(Boolean(course), 'Found canonical Forecasters Training Course in DB', { id: course?.id });
  if (!course) return;

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  console.log(`Course: "${course.title}" (${course.id})`);
  console.log(`Modules count: ${course.modules.length}, Total lessons: ${totalLessons}`);
  assert(course.modules.length === 7, `Course has exactly 7 modules (found: ${course.modules.length})`);
  assert(totalLessons >= 27, `Course has canonical lesson structure (found: ${totalLessons} lessons across 7 modules)`);

  const module1 = course.modules[0];
  console.log(`Module 1: "${module1.title}" (${module1.id}) with ${module1.lessons.length} lessons`);
  assert(
    module1.title.includes('Advanced Atmospheric Dynamics'),
    `Module 1 is "Advanced Atmospheric Dynamics & NWP" (found: "${module1.title}")`,
  );
  assert(module1.lessons.length === 4, `Module 1 has exactly 4 lessons (found: ${module1.lessons.length})`);

  const lesson1 = module1.lessons[0];
  console.log(`Module 1 Lesson 1: "${lesson1.title}" (${lesson1.id})`);

  // Target Trainer & Trainee
  const trainer = course.trainer;
  assert(Boolean(trainer), 'Course has assigned Trainer', { trainerId: trainer?.id, email: trainer?.email });

  const trainee = await prisma.user.findFirst({
    where: {
      role: Role.TRAINEE,
      enrollments: {
        some: {
          courseId: course.id,
          status: 'ENROLLED',
        },
      },
    },
  });

  assert(Boolean(trainee), 'Found authorized enrolled Trainee for course', { traineeId: trainee?.id, email: trainee?.email });
  if (!trainer || !trainee) return;

  // -------------------------------------------------------------------------
  // 2. Load and Validate Assessment JSON
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: Loading & Validating Valid Assessment JSON ---');
  const jsonPath = path.resolve(__dirname, '../../assessment-module-1-atmospheric-dynamics-valid.json');
  assert(fs.existsSync(jsonPath), `Assessment JSON file exists at: ${jsonPath}`);

  const rawJsonContent = fs.readFileSync(jsonPath, 'utf8');
  const payload = JSON.parse(rawJsonContent);

  const validationResult = await assessmentImportService.validateAssessmentImport(
    trainer.id,
    trainer.role as Role,
    payload,
    {
      placementType: 'MODULE',
      courseId: course.id,
      moduleId: module1.id,
      lessonId: lesson1.id,
    },
    trainer.organizationId || undefined,
  );

  assert(validationResult.valid === true, 'Assessment JSON passed Stage 1 validation without errors');
  assert(validationResult.errors.length === 0, `No validation errors (errors count: ${validationResult.errors.length})`);
  assert(
    validationResult.assessmentData.questions.length === 15,
    `Payload contains exactly 15 questions (found: ${validationResult.assessmentData.questions.length})`,
  );

  // -------------------------------------------------------------------------
  // 3. Execute Production Import Workflow (Stage 2)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: Executing Real Production Assessment Import ---');
  const importResult = await assessmentImportService.confirmAssessmentImport(
    trainer.id,
    trainer.role as Role,
    payload,
    { fileName: 'assessment-module-1-atmospheric-dynamics-valid.json', fileSize: rawJsonContent.length },
    {
      placementType: 'MODULE',
      courseId: course.id,
      moduleId: module1.id,
      lessonId: lesson1.id,
    },
    trainer.organizationId || undefined,
  );

  assert(importResult.success === true, 'confirmAssessmentImport succeeded');
  assert(Boolean(importResult.assessmentId), `Assessment ID generated: ${importResult.assessmentId}`);
  const importedAssessmentId = importResult.assessmentId;

  // -------------------------------------------------------------------------
  // 4. Database Relationship & Status Validation (Section 6 & 8)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 4: Validating Database Hierarchy Relationships ---');
  const assessmentRecord = await prisma.assessment.findUnique({
    where: { id: importedAssessmentId },
    include: {
      course: true,
      module: true,
      lesson: true,
      questions: {
        include: { options: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  assert(Boolean(assessmentRecord), 'Assessment record exists in PostgreSQL');
  if (!assessmentRecord) return;

  assert(assessmentRecord.status === AssessmentStatus.DRAFT, 'Imported assessment status is initially DRAFT');
  assert(assessmentRecord.courseId === course.id, `Assessment.courseId matches Course.id (${assessmentRecord.courseId})`);
  assert(assessmentRecord.moduleId === module1.id, `Assessment.moduleId matches Module.id (${assessmentRecord.moduleId})`);
  assert(assessmentRecord.lessonId === lesson1.id, `Assessment.lessonId matches Lesson.id (${assessmentRecord.lessonId})`);
  assert(assessmentRecord.module?.courseId === course.id, `Module.courseId matches Assessment.courseId (${assessmentRecord.module?.courseId})`);
  assert(assessmentRecord.lesson?.moduleId === module1.id, `Lesson.moduleId matches Assessment.moduleId (${assessmentRecord.lesson?.moduleId})`);
  assert(assessmentRecord.questions.length === 15, `Imported exactly 15 questions in database`);

  // Verify options count across all questions
  const totalOptions = assessmentRecord.questions.reduce((sum, q) => sum + q.options.length, 0);
  console.log(`Total questions in DB: ${assessmentRecord.questions.length}, Total options: ${totalOptions}`);
  assert(totalOptions >= 30, `Total options across 15 questions >= 30 (found: ${totalOptions})`);

  // -------------------------------------------------------------------------
  // 5. Pre-Publish Validation & Publishing (Section 9)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 5: Testing Pre-Publish Validation & Publishing ---');
  const assessmentService = new AssessmentService();

  // Test 5a: Attempt to publish with invalid module mapping (should fail)
  let blockedInvalidPublish = false;
  try {
    await assessmentService.updateAssessment(importedAssessmentId, trainer.id, trainer.role as Role, {
      status: AssessmentStatus.PUBLISHED,
      moduleId: '00000000-0000-0000-0000-000000000000', // non-existent module
    });
  } catch (err: any) {
    blockedInvalidPublish = true;
    console.log(`  ✓ Blocked invalid publish as expected: ${err.message}`);
  }
  assert(blockedInvalidPublish, 'Pre-publish validation successfully blocks invalid hierarchy mapping');

  // Test 5b: Legitimate publish of the valid imported assessment
  const publishedAssessment = await assessmentService.updateAssessment(
    importedAssessmentId,
    trainer.id,
    trainer.role as Role,
    {
      status: AssessmentStatus.PUBLISHED,
      moduleId: module1.id,
      lessonId: lesson1.id,
    },
  );

  assert(publishedAssessment.status === AssessmentStatus.PUBLISHED, 'Assessment successfully transitioned to PUBLISHED status');

  // -------------------------------------------------------------------------
  // 6. Trainee Course Outline & Viewer Deduplication (Sections 11, 12, 13)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 6: Verifying Trainee Course Outline & Deduplication ---');
  const courseStructureService = new CourseStructureService(
    new CourseModuleRepository(),
    new LessonRepository(),
    new CourseRepository(),
    new UserRepository(),
  );

  const outline = await courseStructureService.getCourseOutline(course.id, {
    userId: trainee.id,
    role: Role.TRAINEE,
    permissions: [],
  });

  assert(outline.modules.length === 7, `Trainee outline returns 7 modules`);
  const mod1Outline = outline.modules[0];
  console.log(`Module 1 in outline: "${mod1Outline.title}"`);
  console.log(`Assessments in Module 1:`, (mod1Outline as any).assessments);

  const mod1Assessments = (mod1Outline as any).assessments || [];
  assert(mod1Assessments.length >= 1, `Module 1 contains at least 1 assessment in outline (found: ${mod1Assessments.length})`);

  const targetAssInOutline = mod1Assessments.find((a: any) => a.id === importedAssessmentId);
  assert(Boolean(targetAssInOutline), `Target assessment "${targetAssInOutline?.title}" found under Module 1`);
  assert(targetAssInOutline?.questionCount === 15, `Assessment displays correct questionCount: 15`);
  assert(targetAssInOutline?.passingScore === 70, `Assessment displays correct passingScore: 70`);

  // Verify deduplication: ensure assessment appears in exactly ONE module across all 7 modules
  let totalOccurrencesInOutline = 0;
  outline.modules.forEach((m: any) => {
    const foundInMod = (m.assessments || []).filter((a: any) => a.id === importedAssessmentId);
    totalOccurrencesInOutline += foundInMod.length;
  });
  assert(totalOccurrencesInOutline === 1, `Assessment appears exactly ONCE in course outline (deduplication verified)`);

  // -------------------------------------------------------------------------
  // 7. Trainee Assessment Attempt & Leakage Check (Sections 14, 15, 16, 17)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 7: Starting Trainee Attempt & Security Verification ---');
  const attemptSession = await assessmentService.startAttempt(importedAssessmentId, trainee.id, Role.TRAINEE);

  assert(Boolean(attemptSession.attempt), 'Trainee successfully started assessment attempt');
  assert(attemptSession.questions.length === 15, `Attempt session loaded 15 questions`);

  // Critical Security Check: Ensure NO answers or explanations leaked before submission
  let leakedAnswersCount = 0;
  let leakedExplanationsCount = 0;
  attemptSession.questions.forEach((q: any) => {
    if (q.explanation) leakedExplanationsCount++;
    (q.options || []).forEach((opt: any) => {
      if (opt.isCorrect !== undefined) leakedAnswersCount++;
    });
  });

  assert(leakedAnswersCount === 0, `ZERO answer keys leaked to trainee prior to submission (leaked: ${leakedAnswersCount})`);
  assert(leakedExplanationsCount === 0, `ZERO explanations leaked to trainee prior to submission (leaked: ${leakedExplanationsCount})`);

  // -------------------------------------------------------------------------
  // 8. Trainee Answer Submission & Authoritative Server Scoring (Sections 18, 19)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 8: Trainee Submitting Answers & Server-Side Scoring ---');
  // Build answers: answer 14 correctly, 1 intentionally incorrect to test scoring accuracy
  const answersToSubmit = assessmentRecord.questions.map((q, idx) => {
    const correctOpt = q.options.find((o) => o.isCorrect);
    const incorrectOpt = q.options.find((o) => !o.isCorrect);

    // Make Question 1 intentionally incorrect
    const chosenOpt = idx === 0 ? (incorrectOpt || correctOpt) : correctOpt;
    return {
      questionId: q.id,
      selectedOptionId: chosenOpt?.id || null,
    };
  });

  const submissionResult = await assessmentService.submitAttempt(
    importedAssessmentId,
    attemptSession.attempt.id,
    trainee.id,
    Role.TRAINEE,
    { answers: answersToSubmit },
  );

  console.log('Submission scored by server:', submissionResult.result);
  assert(Boolean(submissionResult.result), 'Authoritative scoring completed');
  assert(
    submissionResult.result.totalPossibleMarks === 19,
    `Total possible marks equals 19 (got: ${submissionResult.result.totalPossibleMarks})`,
  );
  assert(
    submissionResult.result.score === 18, // 19 - 1 for question 1 (1 point)
    `Authoritative earned score is 18 / 19 (got: ${submissionResult.result.score})`,
  );
  assert(
    (submissionResult.result.percentage ?? 0) >= 94,
    `Calculated percentage is correct (~94.74%, got: ${submissionResult.result.percentage}%)`,
  );
  assert(submissionResult.result.passed === true, `Assessment passed: true (70% threshold met)`);

  // -------------------------------------------------------------------------
  // 9. Trainee Result Page Verification (Section 20)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 9: Fetching Final Trainee Result Report ---');
  const resultReport = await assessmentService.getResult(
    importedAssessmentId,
    attemptSession.attempt.id,
    trainee.id,
    Role.TRAINEE,
  );

  assert(resultReport.attemptId === attemptSession.attempt.id, 'Result report matches attempt ID');
  assert(resultReport.score === 18, 'Result report score matches submitted score (18)');
  assert(resultReport.passed === true, 'Result report indicates PASSED');
  assert(resultReport.answersSummary.length === 15, 'Result report includes feedback for all 15 questions');

  // Verify question 1 is marked incorrect and other 14 are correct
  const q1Result = resultReport.answersSummary.find((a) => a.questionId === assessmentRecord.questions[0].id);
  assert(q1Result?.isCorrect === false, 'Question 1 correctly identified as incorrect in post-submission report');

  // -------------------------------------------------------------------------
  // 10. Trainer Visibility & Monitoring Verification (Section 23)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 10: Verifying Authorized Trainer Monitoring Visibility ---');
  const trainerMonitoringService = new TrainerMonitoringService();

  const monitoring = await trainerMonitoringService.getAssessmentMonitoring(
    trainer.id,
    trainer.role as Role,
    {
      page: 1,
      limit: 50,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
      courseId: course.id,
    },
  );

  assert(Boolean(monitoring), 'Trainer monitoring successfully returned data');
  const attemptsList = (monitoring as any)?.data || [];
  const traineeAttemptInMonitoring = attemptsList.find(
    (att: any) => att.attemptId === attemptSession.attempt.id,
  );
  assert(
    Boolean(traineeAttemptInMonitoring),
    `Trainer can view trainee's attempt for imported assessment (found score: ${traineeAttemptInMonitoring?.score}, passed: ${traineeAttemptInMonitoring?.passed})`,
  );

  // -------------------------------------------------------------------------
  // Final Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passedAssertions} PASSED, ${failedAssertions} FAILED`);
  console.log('================================================================');

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2EWorkflow()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
