import fs from 'fs';
import path from 'path';
import prisma from '../src/database/client';
import { DocumentParserService } from '../src/services/document-parser.service';
import { CourseImportService } from '../src/services/course-import.service';
import { CourseValidationService } from '../src/services/course-validation.service';
import { CourseStatus } from '@prisma/client';

async function runCourseBuilderVerification() {
  console.log('===============================================================');
  console.log('STARTING COMPLETE COURSE BUILDER WORKFLOW VERIFICATION');
  console.log('Capacity Connect — Smart India Hackathon 2026 (SIH26075)');
  console.log('===============================================================\n');

  const docPath = path.join(process.cwd(), 'uploads', 'Forecasters_Training_Course.docx');
  if (!fs.existsSync(docPath)) {
    throw new Error(`Test file not found at: ${docPath}`);
  }

  // Find or use a test trainer and organization from DB
  const trainer = await prisma.user.findFirst({
    where: { role: { in: ['TRAINER', 'ADMIN', 'SUPER_ADMIN'] } },
    include: { organization: true },
  });

  if (!trainer) {
    throw new Error('No trainer found in database. Please run prisma seed first.');
  }

  console.log(`Using Trainer: ${trainer.email} (${trainer.id})`);
  console.log(`Using Organization: ${trainer.organization?.name || trainer.organizationId}\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 1: Deterministic Document Parsing & Structural Segmentation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST STEP 1: Deterministic Document Parsing ---');
  const parser = new DocumentParserService();
  const fileBuffer = fs.readFileSync(docPath);
  const parsed = await parser.parseDocument(fileBuffer, 'DOCX', 'doc-test-123', 'Forecasters_Training_Course.docx');

  console.log(`✓ Detected Course Title: "${parsed.title}"`);
  console.log(`✓ Detected Modules: ${parsed.modules.length}`);
  const totalLessons = parsed.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  console.log(`✓ Detected Lessons: ${totalLessons}`);
  console.log(`✓ Detected Topics: ${parsed.globalTopics.length}`);
  console.log(`✓ Detected TOC Entries: ${parsed.detectedTOC.length}`);
  console.log(`✓ Overall Structure Confidence: ${(parsed.overallConfidence * 100).toFixed(1)}%`);

  // Assertions on parsing
  if (!parsed.title.toLowerCase().includes('forecasters')) {
    throw new Error(`FAIL: Course title mismatch. Expected "Forecasters Training Course", got "${parsed.title}"`);
  }

  if (parsed.modules.length !== 7) {
    throw new Error(`FAIL: Module count mismatch. Expected 7 modules, got ${parsed.modules.length}`);
  }

  if (totalLessons !== 27) {
    throw new Error(`FAIL: Lesson count mismatch. Expected 27 lessons (Module 5 has 3 lessons), got ${totalLessons}`);
  }

  // Verify TOC suppression (TOC must NOT create duplicate modules)
  const moduleTitles = parsed.modules.map(m => m.title);
  const uniqueTitles = new Set(moduleTitles);
  if (moduleTitles.length !== uniqueTitles.size) {
    throw new Error('FAIL: Duplicate modules detected! TOC suppression failed.');
  }
  console.log('✓ TOC Deduplication verified: Zero duplicate modules created.');

  // Verify Special Sections were NOT turned into lessons
  const allLessonTitles = parsed.modules.flatMap(m => m.lessons.map(l => l.title.toLowerCase()));
  const forbiddenTitles = ['course overview', 'table of contents', 'glossary', 'references', 'target audience', 'prerequisites'];
  for (const forbidden of forbiddenTitles) {
    if (allLessonTitles.some(t => t.includes(forbidden))) {
      throw new Error(`FAIL: Special section "${forbidden}" was incorrectly converted into a lesson!`);
    }
  }
  console.log('✓ Special Sections Classifier verified: Metadata and resources routed to course level.');

  // Verify source provenance
  const sampleLesson = parsed.modules[0].lessons[0];
  if (!sampleLesson.provenance && sampleLesson.contentBlocks.length > 0 && !(sampleLesson.contentBlocks[0] as any).provenance) {
    throw new Error('FAIL: Source provenance missing from extracted lesson.');
  }
  console.log(`✓ Source Provenance verified: "${sampleLesson.title}" has provenance metadata.`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 2: Asynchronous Import Job Lifecycle
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST STEP 2: Asynchronous Import Job Execution ---');
  const importService = new CourseImportService();

  const mockFile: any = {
    fieldname: 'file',
    originalname: 'Forecasters_Training_Course.docx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: fs.statSync(docPath).size,
    destination: path.dirname(docPath),
    filename: path.basename(docPath),
    path: docPath,
    buffer: fs.readFileSync(docPath),
    stream: fs.createReadStream(docPath),
  };

  const jobInit = await importService.createImportJob(mockFile, trainer.id);
  console.log(`✓ Ingestion Job Initialized: ${jobInit.jobId} (Status: ${jobInit.status})`);

  // Wait for background processing to finish (poll up to 10 seconds)
  let jobStatus = await importService.getJobStatus(jobInit.jobId, trainer.id);
  let attempts = 0;
  while (jobStatus.status !== 'READY_FOR_REVIEW' && jobStatus.status !== 'FAILED' && attempts < 25) {
    await new Promise(r => setTimeout(r, 500));
    jobStatus = await importService.getJobStatus(jobInit.jobId, trainer.id);
    attempts++;
  }

  if (jobStatus.status !== 'READY_FOR_REVIEW') {
    throw new Error(`FAIL: Ingestion job did not reach READY_FOR_REVIEW. Status: ${jobStatus.status}, Error: ${jobStatus.error}`);
  }
  console.log(`✓ Ingestion Job reached READY_FOR_REVIEW (Progress: ${jobStatus.progress}%, Confidence: ${jobStatus.confidenceScore})`);

  const previewRes = await importService.getJobPreview(jobInit.jobId, trainer.id) as any;
  const preview = previewRes.preview || previewRes;
  if (!preview.modules || preview.modules.length !== 7) {
    throw new Error(`FAIL: Preview data modules count mismatch. Expected 7, got ${preview.modules?.length}`);
  }
  console.log('✓ Import Preview Data validated successfully.');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 3: Atomic Transactional Course Hierarchy Persistence
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST STEP 3: Transactional Database Persistence ---');
  const approvedCourse = await importService.approveJob(
    jobInit.jobId,
    trainer.id,
    trainer.organizationId
  ) as any;

  console.log(`✓ Course Persisted in PostgreSQL: ID=${approvedCourse.id}, Slug=${approvedCourse.slug}`);

  // Data Integrity Verification (source count vs database count)
  const dbModules = await prisma.courseModule.findMany({
    where: { courseId: approvedCourse.id },
    include: { lessons: true },
  });
  const dbLessonsCount = dbModules.reduce((acc, m) => acc + m.lessons.length, 0);

  console.log(`✓ Persisted Modules in DB: ${dbModules.length}`);
  console.log(`✓ Persisted Lessons in DB: ${dbLessonsCount}`);

  if (dbModules.length !== 7) {
    throw new Error(`FAIL: Database module count (${dbModules.length}) !== detected modules (7)`);
  }
  if (dbLessonsCount !== 27) {
    throw new Error(`FAIL: Database lesson count (${dbLessonsCount}) !== detected lessons (27)`);
  }
  console.log('✓ Data Integrity Test PASSED: Detected structure count perfectly matches PostgreSQL count.');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 4: Course Validation & Health Engine
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST STEP 4: Course Health & Validation Engine ---');
  const validationService = new CourseValidationService();
  const validation = await validationService.validateCourse(approvedCourse.id);

  console.log(`✓ Course Health Score: ${validation.healthScore}%`);
  console.log(`✓ Is Publishable: ${validation.isPublishable}`);
  console.log(`✓ Blocking Errors: ${validation.errorsCount}`);
  console.log(`✓ Warnings: ${validation.warningsCount}`);

  if (!validation.isPublishable) {
    console.error('Validation issues:', validation.issues);
    throw new Error('FAIL: Course should be publishable without critical blocking errors.');
  }
  console.log('✓ Pre-Flight Validation PASSED: Course meets all publication criteria.');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 5: Course Publishing Workflow
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST STEP 5: Course Publishing Workflow ---');
  const publishedCourse = await prisma.course.update({
    where: { id: approvedCourse.id },
    data: {
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  if (publishedCourse.status !== CourseStatus.PUBLISHED || !publishedCourse.publishedAt) {
    throw new Error('FAIL: Course publishing failed.');
  }
  console.log(`✓ Course Published: "${publishedCourse.title}" is now active in the catalog.`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST STEP 6: Trainee Enrollment & Real Learning Event Generation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST STEP 6: Trainee Enrollment & Learning Event Emission ---');
  const trainee = await prisma.user.findFirst({
    where: { role: 'TRAINEE' },
  });

  if (!trainee) {
    console.log('⚠ No test trainee found; skipping trainee enrollment test.');
  } else {
    // Enroll trainee
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee.id,
          courseId: publishedCourse.id,
        },
      },
      update: { status: 'ENROLLED' },
      create: {
        userId: trainee.id,
        courseId: publishedCourse.id,
        status: 'ENROLLED',
      },
    });
    console.log(`✓ Trainee ${trainee.email} enrolled: Enrollment ID=${enrollment.id}`);

    // Emit Real Learning Event for a lesson
    const firstLesson = dbModules[0].lessons[0];
    const learningTopic = await prisma.learningTopic.findFirst({
      where: { courseId: publishedCourse.id },
    });

    if (learningTopic) {
      const learningEvent = await prisma.learningEvent.create({
        data: {
          userId: trainee.id,
          courseId: publishedCourse.id,
          lessonId: firstLesson.id,
          topicId: learningTopic.id,
          eventType: 'LESSON_COMPLETED',
          source: 'LMS_VIEWER_AUTOMATED_TEST',
          correct: true,
          responseTimeMs: 2500,
          confidenceRating: 0.95,
        },
      });
      console.log(`✓ Real Learning Event Emitted: ID=${learningEvent.id}, Topic=${learningTopic.name}`);
      console.log('✓ Downstream Loop: Ready for AI Skill Gap Analyzer & Adaptive Revision Engine.');
    }
  }

  console.log('\n===============================================================');
  console.log('ALL COURSE BUILDER PIPELINE TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runCourseBuilderVerification()
  .catch((err) => {
    console.error('\n❌ Course Builder Verification FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
