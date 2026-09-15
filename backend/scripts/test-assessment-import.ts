import { assessmentImportService } from '../src/services/assessment-import.service';
import { prisma } from '../src/database/client';
import { Role } from '@prisma/client';

async function runTests() {
  console.log('🧪 Starting Assessment JSON Import Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  // 1. Setup mock/real trainer user and course in DB
  const trainer = await prisma.user.findFirst({
    where: { role: Role.TRAINER },
  });

  if (!trainer) {
    throw new Error('No trainer found in DB to run tests.');
  }

  const otherTrainer = await prisma.user.findFirst({
    where: { role: Role.TRAINER, id: { not: trainer.id } },
  });

  const trainerCourse = await prisma.course.findFirst({
    where: { trainerId: trainer.id },
  });

  console.log(`Using Trainer: ${trainer.id} (${trainer.email})`);
  if (trainerCourse) {
    console.log(`Using Course: ${trainerCourse.id} (${trainerCourse.title})`);
  }

  // TEST 1: Valid Single Choice Assessment
  console.log('\n--- Section 1: Valid Question Types ---');
  const validSingleChoicePayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Valid Single Choice Assessment',
      durationMinutes: 30,
      passingPercentage: 70,
      questions: [
        {
          externalId: 'Q-001',
          questionType: 'SINGLE_CHOICE',
          question: 'What balances the pressure gradient force in geostrophic wind?',
          options: [
            { id: 'A', text: 'Coriolis force' },
            { id: 'B', text: 'Friction' },
          ],
          correctAnswer: { type: 'OPTION', value: 'A' },
          explanation: 'The Coriolis force acts perpendicular to velocity balancing the pressure gradient.',
          points: 1,
        },
      ],
    },
  };

  const res1 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, validSingleChoicePayload);
  assert(res1.valid && res1.errors.length === 0, 'Valid single-choice assessment accepted');
  assert(res1.summary.questionTypes['SINGLE_CHOICE'] === 1, 'Single-choice question count is 1');

  // TEST 2: Valid Multiple Choice Assessment
  const validMultipleChoicePayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Valid Multiple Choice Assessment',
      durationMinutes: 45,
      passingPercentage: 75,
      questions: [
        {
          externalId: 'Q-002',
          questionType: 'MULTIPLE_CHOICE',
          question: 'Which factors contribute to cyclone development?',
          options: [
            { id: 'A', text: 'Warm sea surface temperature' },
            { id: 'B', text: 'Low vertical wind shear' },
            { id: 'C', text: 'Strong dry air intrusion' },
          ],
          correctAnswer: { type: 'OPTIONS', value: ['A', 'B'] },
          explanation: 'Warm sea surface (>26.5C) and low vertical wind shear promote tropical cyclogenesis.',
          points: 2,
        },
      ],
    },
  };

  const res2 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, validMultipleChoicePayload);
  assert(res2.valid && res2.errors.length === 0, 'Valid multiple-choice assessment accepted');
  assert(res2.summary.questionTypes['MULTIPLE_CHOICE'] === 1, 'Multiple-choice question count is 1');

  // TEST 3: Valid True/False Assessment
  const validTrueFalsePayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Valid True/False Assessment',
      durationMinutes: 15,
      passingPercentage: 60,
      questions: [
        {
          externalId: 'Q-003',
          questionType: 'TRUE_FALSE',
          question: 'The Coriolis parameter is zero at the equator.',
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: 'The Coriolis parameter is proportional to sin(latitude), which equals 0 at 0 degrees latitude.',
          points: 1,
        },
      ],
    },
  };

  const res3 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, validTrueFalsePayload);
  assert(res3.valid && res3.errors.length === 0, 'Valid true/false assessment accepted');
  assert(res3.summary.questionTypes['TRUE_FALSE'] === 1, 'True/False question count is 1');

  // TEST 4: Invalid JSON root / schemaVersion
  console.log('\n--- Section 2: Schema & Metadata Rejections ---');
  const invalidRootPayload = [ { something: 'else' } ];
  const res4 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, invalidRootPayload);
  assert(!res4.valid && res4.errors.some((e) => e.code === 'INVALID_ROOT_TYPE'), 'Array root is rejected');

  const invalidVersionPayload = {
    schemaVersion: '2.0',
    assessment: { title: 'Test', questions: [] },
  };
  const res5 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, invalidVersionPayload);
  assert(!res5.valid && res5.errors.some((e) => e.code === 'UNSUPPORTED_VERSION'), 'Schema version "2.0" rejected');

  const invalidMetadataPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'No', // too short (< 3)
      durationMinutes: -10, // negative
      passingPercentage: 150, // > 100
      questions: [],
    },
  };
  const res6 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, invalidMetadataPayload);
  assert(!res6.valid && res6.errors.some((e) => e.code === 'INVALID_TITLE_LENGTH'), 'Title < 3 chars rejected');
  assert(!res6.valid && res6.errors.some((e) => e.code === 'INVALID_DURATION'), 'Negative duration rejected');
  assert(!res6.valid && res6.errors.some((e) => e.code === 'INVALID_PASSING_PERCENTAGE'), 'Passing percentage > 100 rejected');

  // TEST 5: Question Option & Correct Answer Rejections
  console.log('\n--- Section 3: Option & Answer Rejections ---');
  const invalidOptionRefPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Invalid Option Ref Assessment',
      questions: [
        {
          questionType: 'SINGLE_CHOICE',
          question: 'Sample question prompt here?',
          options: [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
          ],
          correctAnswer: { type: 'OPTION', value: 'Z' }, // Option Z does not exist!
          explanation: 'Genuine valid explanation here for testing.',
        },
      ],
    },
  };
  const res7 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, invalidOptionRefPayload);
  assert(!res7.valid && res7.errors.some((e) => e.code === 'INVALID_OPTION_REFERENCE'), 'Non-existent option Z rejected');
  assert(res7.errors.some((e) => e.path === 'assessment.questions[0].correctAnswer.value'), 'Exact JSON path reported for option error');

  const duplicateAnswersPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Duplicate Answers Assessment',
      questions: [
        {
          questionType: 'MULTIPLE_CHOICE',
          question: 'Sample question prompt here?',
          options: [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
          ],
          correctAnswer: { type: 'OPTIONS', value: ['A', 'A'] }, // Duplicate A
          explanation: 'Genuine valid explanation here for testing.',
        },
      ],
    },
  };
  const res8 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, duplicateAnswersPayload);
  assert(!res8.valid && res8.errors.some((e) => e.code === 'DUPLICATE_CORRECT_ANSWER'), 'Duplicate correct answer ["A", "A"] rejected');

  const nonBooleanTFPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Non Boolean TF Assessment',
      questions: [
        {
          questionType: 'TRUE_FALSE',
          question: 'Is this true?',
          correctAnswer: { type: 'BOOLEAN', value: 'yes' }, // string "yes"
          explanation: 'Genuine valid explanation here for testing.',
        },
      ],
    },
  };
  const res9 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, nonBooleanTFPayload);
  assert(!res9.valid && res9.errors.some((e) => e.code === 'INVALID_BOOLEAN_ANSWER'), 'String "yes" for TRUE_FALSE rejected');

  // TEST 6: Explanation Rejections
  console.log('\n--- Section 4: Explanation Quality Checks ---');
  const missingExplanationPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Missing Explanation Assessment',
      questions: [
        {
          questionType: 'TRUE_FALSE',
          question: 'Is this true or false?',
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: '', // empty!
        },
      ],
    },
  };
  const res10 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, missingExplanationPayload);
  assert(!res10.valid && res10.errors.some((e) => e.code === 'MISSING_EXPLANATION'), 'Empty explanation rejected');

  const placeholderExplanationPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Placeholder Explanation Assessment',
      questions: [
        {
          questionType: 'TRUE_FALSE',
          question: 'Is this true or false?',
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: 'TODO', // Placeholder!
        },
      ],
    },
  };
  const res11 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, placeholderExplanationPayload);
  assert(!res11.valid && res11.errors.some((e) => e.code === 'INVALID_EXPLANATION'), 'Placeholder explanation "TODO" rejected');

  // TEST 7: Duplicate Question Detection
  console.log('\n--- Section 5: Duplicate Detection ---');
  const duplicateQuestionsPayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Duplicate Questions Assessment',
      questions: [
        {
          externalId: 'Q-DUP',
          questionType: 'TRUE_FALSE',
          question: 'The Coriolis force balances the pressure gradient force in geostrophic balance.',
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: 'Valid explanation for question one.',
        },
        {
          externalId: 'Q-DUP', // Duplicate externalId
          questionType: 'TRUE_FALSE',
          question: 'The Coriolis force balances the pressure gradient force in geostrophic balance.', // Exact duplicate text
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: 'Valid explanation for question two.',
        },
      ],
    },
  };
  const res12 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, duplicateQuestionsPayload);
  assert(!res12.valid && res12.errors.some((e) => e.code === 'DUPLICATE_EXTERNAL_ID'), 'Duplicate externalId rejected');
  assert(res12.warnings.some((e) => e.code === 'EXACT_DUPLICATE_QUESTION'), 'Exact duplicate question prompt warned');

  // TEST 8: Unsupported Question Types & Hierarchy Warnings
  console.log('\n--- Section 6: Unsupported Question Types & Hierarchy Warnings ---');
  const unsupportedTypePayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Unsupported Type Test',
      questions: [
        {
          questionType: 'SHORT_ANSWER',
          question: 'What is the standard atmospheric pressure at sea level in hPa?',
          correctAnswer: { type: 'TEXT', value: '1013.25' },
          explanation: 'Standard sea-level atmospheric pressure is 1013.25 hPa.',
        },
      ],
    },
  };
  const resUnsupported = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, unsupportedTypePayload);
  assert(!resUnsupported.valid && resUnsupported.errors.some((e) => e.code === 'UNSUPPORTED_QUESTION_TYPE'), 'SHORT_ANSWER rejected with UNSUPPORTED_QUESTION_TYPE');

  const unmatchedTitlePayload = {
    schemaVersion: '1.0',
    assessment: {
      title: 'Unmatched Course Title Test',
      course: { courseTitle: 'Unknown Nonexistent Meteorology Course' },
      questions: [
        {
          questionType: 'TRUE_FALSE',
          question: 'Valid question prompt for hierarchy test.',
          correctAnswer: { type: 'BOOLEAN', value: true },
          explanation: 'Valid explanation.',
        },
      ],
    },
  };
  const resUnmatched = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, unmatchedTitlePayload);
  assert(
    resUnmatched.valid && resUnmatched.warnings.some((w) => w.code === 'COURSE_MAPPING_REQUIRED'),
    'Unmatched courseTitle generates advisory COURSE_MAPPING_REQUIRED warning without failing validation',
  );

  const resStandaloneOverride = await assessmentImportService.validateAssessmentImport(
    trainer.id,
    Role.TRAINER,
    unmatchedTitlePayload,
    { placementType: 'STANDALONE' },
  );
  assert(
    resStandaloneOverride.valid && resStandaloneOverride.assessmentData.placementType === 'STANDALONE',
    'Standalone override sets placementType to STANDALONE',
  );

  // TEST 9: Hierarchy & Security (IDOR Protection)
  console.log('\n--- Section 7: Hierarchy & IDOR Protection ---');
  if (otherTrainer) {
    const otherCourse = await prisma.course.findFirst({
      where: { trainerId: otherTrainer.id },
    });

    if (otherCourse) {
      const idorPayload = {
        schemaVersion: '1.0',
        assessment: {
          title: 'IDOR Attempt Assessment',
          course: { courseId: otherCourse.id },
          questions: [
            {
              questionType: 'TRUE_FALSE',
              question: 'Valid question text prompt?',
              correctAnswer: { type: 'BOOLEAN', value: true },
              explanation: 'Valid explanation here.',
            },
          ],
        },
      };

      const res13 = await assessmentImportService.validateAssessmentImport(trainer.id, Role.TRAINER, idorPayload);
      assert(
        !res13.valid && res13.errors.some((e) => e.code === 'FORBIDDEN_COURSE_ACCESS'),
        'Cross-trainer course mapping attempt rejected (IDOR protection)',
      );
    }
  }

  // TEST 10: Full Confirm & Transaction Persistence
  console.log('\n--- Section 8: Database Transaction & Audit Logging ---');
  const templateObj = assessmentImportService.getTemplateJson() as any;
  templateObj.assessment.title = `Integration Test Assessment - ${Date.now()}`;
  if (trainerCourse) {
    templateObj.assessment.course = { courseId: trainerCourse.id };
    delete templateObj.assessment.module;
    delete templateObj.assessment.lesson;
  } else {
    delete templateObj.assessment.course;
    delete templateObj.assessment.module;
    delete templateObj.assessment.lesson;
  }

  const confirmRes = await assessmentImportService.confirmAssessmentImport(
    trainer.id,
    Role.TRAINER,
    templateObj,
    { fileName: 'template-test.json', fileSize: 1024 },
  );

  assert(confirmRes.success && Boolean(confirmRes.assessmentId), 'Assessment import confirmed successfully');

  // Verify DB state
  const persistedAssessment = await prisma.assessment.findUnique({
    where: { id: confirmRes.assessmentId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  assert(persistedAssessment !== null, 'Persisted assessment found in database');
  assert(persistedAssessment?.status === 'DRAFT', 'Assessment status defaults to DRAFT');
  assert(persistedAssessment?.questions.length === 15, `All 15 questions persisted in exact order (got ${persistedAssessment?.questions.length})`);
  assert(persistedAssessment?.questions[0].options.length === 4, 'Question 1 has 4 options');
  assert(
    Boolean(persistedAssessment?.questions[0].options.some((o) => o.isCorrect && o.optionText === 'Coriolis force')),
    'Question 1 correct option preserved',
  );

  // Verify Audit Log
  const auditLog = await prisma.auditLog.findFirst({
    where: {
      entityType: 'Assessment',
      entityId: confirmRes.assessmentId,
      action: 'ASSESSMENT_IMPORT',
    },
  });
  assert(auditLog !== null, 'AuditLog entry recorded with action ASSESSMENT_IMPORT');

  // Clean up created test assessment
  await prisma.assessment.delete({ where: { id: confirmRes.assessmentId } });
  console.log('Cleaned up test assessment from database.');


  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test runner failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
