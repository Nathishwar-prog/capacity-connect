import {
  PrismaClient,
  Role,
  UserStatus,
  OrganizationStatus,
  EnrollmentStatus,
  AssessmentType,
  AssessmentStatus,
  QuestionType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

import { MOES_ORGANIZATION } from './seed-data/domains';
import { COMPETENCIES_SEED } from './seed-data/competencies';
import { TOPICS_SEED } from './seed-data/topics';
import {
  TOPIC_DEPENDENCIES_SEED,
  COMPETENCY_DEPENDENCIES_SEED,
  verifyNoDependencyCycles,
} from './seed-data/dependencies';
import { COURSES_SEED } from './seed-data/courses';
import { QUESTIONS_SEED } from './seed-data/questions';
import { TRAINERS_SEED } from './seed-data/roles';
import { LEARNERS_SEED } from './seed-data/learners';
import { generateLearnerEvents } from './seed-data/learning-events';
import { learningEventService } from '../src/modules/revision/services/learning-event.service';
import { SkillGapAnalysisService } from '../src/modules/skill-gap/services/skill-gap-analysis.service';
import { RecommendationService } from '../src/modules/recommendation/services/recommendation.service';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================================================');
  console.log('🌱 CAPACITY CONNECT — DEVELOPMENT/TEST DATA SEEDING SYSTEM');
  console.log('   Smart India Hackathon 2026 | Problem Statement SIH26075');
  console.log('   Ministry of Earth Sciences & India Meteorological Department');
  console.log('========================================================================\n');

  // -------------------------------------------------------------
  // PHASE 21 — DATABASE SAFETY
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SAFETY STOP: Development seed cannot run in production environment!');
  }

  // Verify DAG has no cycles before touching DB
  console.log('🔍 Verifying Topic Dependency DAG acyclicity...');
  verifyNoDependencyCycles(TOPIC_DEPENDENCIES_SEED);
  console.log('✅ Dependency graph verified: Strictly acyclic Directed Acyclic Graph (DAG).\n');

  // -------------------------------------------------------------
  // CLEAN EXISTING DATA IN STRICT FOREIGN-KEY ORDER
  // -------------------------------------------------------------
  console.log('🧹 Cleaning existing records in foreign-key dependency order...');
  await prisma.skillGapAnalysisItem.deleteMany();
  await prisma.skillGapAnalysis.deleteMany();
  await prisma.competencyPrerequisite.deleteMany();
  await prisma.skillGapAlgorithmConfig.deleteMany();

  await prisma.revisionOutcome.deleteMany();
  await prisma.revisionSessionItem.deleteMany();
  await prisma.revisionSession.deleteMany();
  await prisma.userTopicError.deleteMany();
  await prisma.userTopicCompetency.deleteMany();
  await prisma.userGroupCompetency.deleteMany();
  await prisma.learningEvent.deleteMany();
  await prisma.lessonTopic.deleteMany();
  await prisma.assessmentQuestionTopic.deleteMany();
  await prisma.learningTopicCompetency.deleteMany();
  await prisma.topicPrerequisite.deleteMany();
  await prisma.learningTopic.deleteMany();
  await prisma.competencyGroup.deleteMany();
  await prisma.revisionAlgorithmConfig.deleteMany();

  await prisma.recommendationFeedback.deleteMany();
  await prisma.recommendationEvent.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.recommendationBatch.deleteMany();
  await prisma.userRecommendationProfile.deleteMany();
  await prisma.courseRecommendationProfile.deleteMany();
  await prisma.recommendationAlgorithmConfig.deleteMany();

  await prisma.trainerMatch.deleteMany();
  await prisma.skillGap.deleteMany();
  await prisma.assessmentCompetencyResult.deleteMany();
  await prisma.userCompetency.deleteMany();
  await prisma.courseCompetency.deleteMany();
  await prisma.competencyLevel.deleteMany();
  await prisma.competency.deleteMany();

  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();

  await prisma.lessonResource.deleteMany();
  await prisma.courseResource.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();

  await prisma.achievement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.certificateVerification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.workExperience.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.trainerExpertise.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.traineeProfile.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.rolePermissionMapping.deleteMany();
  await prisma.appPermission.deleteMany();
  await prisma.appRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();
  console.log('✅ Cleaned prior database records.\n');

  // -------------------------------------------------------------
  // 1. ORGANIZATION & DEPARTMENTS
  // -------------------------------------------------------------
  console.log('🏛️ Seeding MoES & IMD Organization and Specialized Departments...');
  const organization = await prisma.organization.create({
    data: {
      name: MOES_ORGANIZATION.name,
      code: MOES_ORGANIZATION.code,
      description: MOES_ORGANIZATION.description,
      status: OrganizationStatus.ACTIVE,
      departments: {
        create: MOES_ORGANIZATION.departments.map((d) => ({
          name: d.name,
          code: d.code,
          description: d.description,
        })),
      },
    },
    include: { departments: true },
  });

  const departmentMap = new Map<string, string>();
  for (const dept of organization.departments) {
    departmentMap.set(dept.code, dept.id);
  }
  console.log(`✅ Created organization '${organization.name}' with ${organization.departments.length} departments.\n`);

  // -------------------------------------------------------------
  // 2. RBAC ROLES & PERMISSIONS
  // -------------------------------------------------------------
  console.log('🛡️ Configuring RBAC Roles & Permissions...');
  const permissionsData = [
    { name: 'users:read', description: 'View user directory' },
    { name: 'users:write', description: 'Create and update users' },
    { name: 'courses:read', description: 'View courses syllabus' },
    { name: 'courses:write', description: 'Create and update courses' },
    { name: 'courses:approve', description: 'Publish courses' },
    { name: 'assessments:create', description: 'Create assessments' },
    { name: 'assessments:evaluate', description: 'Evaluate assessment attempts' },
    { name: 'competencies:manage', description: 'Manage competency framework' },
    { name: 'analytics:view', description: 'View analytics and skill gaps' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    permissions.push(await prisma.appPermission.create({ data: p }));
  }

  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Ministry Level Platform Administrator' },
    { name: 'ADMIN', description: 'Departmental Administrator' },
    { name: 'TRAINER', description: 'Senior Scientist / Instructor' },
    { name: 'TRAINEE', description: 'Scientific Officer / Trainee' },
  ];

  const roles = [];
  for (const r of rolesData) {
    roles.push(await prisma.appRole.create({ data: r }));
  }
  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN')!;
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const trainerRole = roles.find((r) => r.name === 'TRAINER')!;
  const traineeRole = roles.find((r) => r.name === 'TRAINEE')!;

  for (const perm of permissions) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }
  for (const perm of permissions.filter((p) => ['users:read', 'users:write', 'courses:read', 'courses:approve', 'competencies:manage', 'analytics:view'].includes(p.name))) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  for (const perm of permissions.filter((p) => ['courses:read', 'courses:write', 'assessments:create', 'assessments:evaluate'].includes(p.name))) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: trainerRole.id, permissionId: perm.id },
    });
  }
  for (const perm of permissions.filter((p) => ['courses:read'].includes(p.name))) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: traineeRole.id, permissionId: perm.id },
    });
  }

  // -------------------------------------------------------------
  // 3. COMPETENCIES & COMPETENCY LEVELS
  // -------------------------------------------------------------
  console.log('🎯 Seeding Official MoES Competencies & Proficiency Framework...');
  const competencyMap = new Map<string, string>();

  for (const compData of COMPETENCIES_SEED) {
    const createdComp = await prisma.competency.create({
      data: {
        code: compData.code,
        name: compData.name,
        category: compData.category,
        description: compData.description,
        levels: {
          create: compData.levels.map((l) => ({
            level: l.level,
            name: l.name,
            description: l.description,
          })),
        },
      },
    });
    competencyMap.set(createdComp.code, createdComp.id);
  }
  console.log(`✅ Seeded ${competencyMap.size} official competencies with levels 0-5.\n`);

  // -------------------------------------------------------------
  // 4. COMPETENCY PREREQUISITE DAG
  // -------------------------------------------------------------
  console.log('🔗 Seeding Competency Prerequisite DAG for Root Cause Analysis...');
  for (const dep of COMPETENCY_DEPENDENCIES_SEED) {
    const prereqId = competencyMap.get(dep.prerequisiteCompetencyCode);
    const depId = competencyMap.get(dep.dependentCompetencyCode);
    if (prereqId && depId) {
      await prisma.competencyPrerequisite.create({
        data: {
          prerequisiteCompetencyId: prereqId,
          dependentCompetencyId: depId,
          edgeWeight: dep.edgeWeight,
          dependencyType: dep.dependencyType,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // 5. USERS: ADMINS, TRAINERS & TRAINEES
  // -------------------------------------------------------------
  console.log('👥 Seeding System Users, Trainers, and 12 Behavioral Learner Personas...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Super Admin & Admin
  const defaultDeptId = departmentMap.get('NWFC')!;
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      departmentId: defaultDeptId,
      email: 'superadmin@enterprise.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. M.',
      lastName: 'Ravichandran',
      role: Role.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      departmentId: defaultDeptId,
      email: 'admin@enterprise.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Mrutyunjay',
      lastName: 'Mohapatra',
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });
  console.log(`   - SuperAdmin: ${superAdmin.email}, Admin: ${admin.email}`);

  // Skills
  const skillsData = [
    { name: 'Synoptic Chart Analysis', code: 'SKILL-SYNOP', category: 'Synoptic Meteorology' },
    { name: 'WRF Numerical Modeling', code: 'SKILL-WRF', category: 'Atmospheric Modeling' },
    { name: 'Doppler Radar Interpretation', code: 'SKILL-DWR', category: 'Radar Meteorology' },
    { name: 'INSAT-3DR Satellite Analysis', code: 'SKILL-INSAT', category: 'Satellite Meteorology' },
    { name: 'Climate Data Operators (CDO) & NetCDF', code: 'SKILL-CDO', category: 'Climate Science' },
    { name: 'AWS & ARG Sensor Calibration', code: 'SKILL-AWS', category: 'Instrumentation' },
  ];
  const skillMap = new Map<string, string>();
  for (const s of skillsData) {
    const skill = await prisma.skill.create({ data: s });
    skillMap.set(skill.code, skill.id);
  }

  // Trainers
  const trainerMap = new Map<string, string>();
  for (const trainerData of TRAINERS_SEED) {
    const deptId = departmentMap.get(trainerData.departmentCode) || defaultDeptId;
    const trainerUser = await prisma.user.create({
      data: {
        organizationId: organization.id,
        departmentId: deptId,
        email: trainerData.email,
        passwordHash: defaultPasswordHash,
        firstName: trainerData.firstName,
        lastName: trainerData.lastName,
        role: Role.TRAINER,
        status: UserStatus.APPROVED,
        emailVerified: true,
        trainerProfile: {
          create: {
            designation: trainerData.designation,
            organizationName: 'India Meteorological Department (MoES)',
            bio: trainerData.bio,
            yearsExperience: trainerData.yearsExperience,
          },
        },
      },
      include: { trainerProfile: true },
    });

    trainerMap.set(trainerUser.email, trainerUser.id);

    // Expertise mappings
    for (const exp of trainerData.expertiseSkills) {
      const sId = skillMap.get(exp.skillCode);
      if (sId && trainerUser.trainerProfile) {
        await prisma.trainerExpertise.create({
          data: {
            trainerId: trainerUser.trainerProfile.id,
            skillId: sId,
            proficiencyLevel: exp.proficiencyLevel,
            yearsExperience: trainerData.yearsExperience,
          },
        });
      }
    }
  }

  // Preserved Jane Doe (user@enterprise.com)
  const janeDoe = await prisma.user.create({
    data: {
      organizationId: organization.id,
      departmentId: departmentMap.get('NWFC')!,
      email: 'user@enterprise.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Jane',
      lastName: 'Doe',
      role: Role.TRAINEE,
      status: UserStatus.APPROVED,
      emailVerified: true,
      traineeProfile: {
        create: {
          designation: 'Scientific Officer Trainee',
          bio: 'Preserved regression trainee profile for continuous end-to-end user verification.',
          interests: ['Synoptic Meteorology', 'Radar Meteorology', 'Tropical Cyclones'],
          profileCompletion: 100,
        },
      },
    },
  });

  // 12 Personas (Learner A through L)
  const learnerMap = new Map<string, string>();
  learnerMap.set('JANE_DOE', janeDoe.id);

  for (const learner of LEARNERS_SEED) {
    const deptId = departmentMap.get(learner.departmentCode) || defaultDeptId;
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        departmentId: deptId,
        email: learner.email,
        passwordHash: defaultPasswordHash,
        firstName: learner.firstName,
        lastName: learner.lastName,
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        emailVerified: true,
        traineeProfile: {
          create: {
            designation: learner.designation,
            bio: `${learner.bio} Expected: ${learner.expectedBehavior}`,
            interests: ['Atmospheric Sciences', 'Meteorology', 'Climate Modeling'],
            profileCompletion: 95,
          },
        },
        recommendationProfile: {
          create: {
            preferredCategories: ['Meteorology', 'Atmospheric Sciences', 'Radar Meteorology'],
            engagementScore: learner.personaType === 'COLD_START' ? 10.0 : 75.0,
            explorationPreference: 0.15,
          },
        },
      },
    });
    learnerMap.set(learner.code, user.id);
  }
  console.log(`✅ Seeded ${LEARNERS_SEED.length} distinct behavioral learner personas + Jane Doe.\n`);

  // -------------------------------------------------------------
  // 6. COURSES, MODULES, LESSONS & COURSE PREREQUISITES
  // -------------------------------------------------------------
  console.log('📚 Seeding 14 Production-Quality MoES Courses & Modules...');
  const courseMap = new Map<string, string>();

  const defaultTrainerId = trainerMap.values().next().value as string;

  for (const courseData of COURSES_SEED) {
    const trainerId = (trainerMap.get(courseData.trainerEmail) || defaultTrainerId) as string;

    const course = await prisma.course.create({
      data: {
        organizationId: organization.id,
        trainerId,
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        difficulty: courseData.difficulty,
        durationMinutes: courseData.durationHours * 60,
        status: courseData.status,
        publishedAt: new Date(),
        recommendationProfile: {
          create: {
            qualityScore: 88.0,
            averageRating: 4.8,
            ratingCount: 24,
            popularityScore: 70.0,
            freshnessScore: 95.0,
          },
        },
      },
    });
    courseMap.set(course.slug, course.id);

    // Course Competencies
    for (const comp of courseData.competencies) {
      const compId = competencyMap.get(comp.code);
      if (compId) {
        await prisma.courseCompetency.create({
          data: {
            courseId: course.id,
            competencyId: compId,
            targetLevel: comp.targetLevel,
            importance: comp.importance,
            criticality: comp.criticality,
            weight: comp.weight,
          },
        });
      }
    }

    // Modules and Lessons
    for (let mIdx = 0; mIdx < courseData.modules.length; mIdx++) {
      const modData = courseData.modules[mIdx];
      const mod = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: modData.title,
          description: modData.description,
          orderIndex: mIdx + 1,
        },
      });

      for (let lIdx = 0; lIdx < modData.lessons.length; lIdx++) {
        const lesData = modData.lessons[lIdx];
        await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: lesData.title,
            contentType: lesData.contentType,
            durationMinutes: lesData.durationMinutes,
            orderIndex: lIdx + 1,
            content: `Official MoES Training Syllabus for ${lesData.title}. Covered concepts adhere to WMO No. 8 Guidelines.`,
          },
        });
      }
    }
  }

  // Course-level Prerequisites (Self-referencing Many-to-Many)
  console.log('🔗 Seeding Course Prerequisite Chains...');
  for (const courseData of COURSES_SEED) {
    const courseId = courseMap.get(courseData.slug);
    if (!courseId) continue;

    for (const prereqSlug of courseData.prerequisiteCourseSlugs) {
      const prereqCourseId = courseMap.get(prereqSlug);
      if (prereqCourseId) {
        await prisma.coursePrerequisite.create({
          data: {
            courseId,
            prerequisiteCourseId: prereqCourseId,
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${courseMap.size} courses and course prerequisite relations.\n`);

  // -------------------------------------------------------------
  // 7. COMPETENCY GROUPS & LEARNING TOPICS (37 Topics across 6 Domains)
  // -------------------------------------------------------------
  console.log('🌳 Seeding 6 Competency Groups and 37 Meteorological Learning Topics...');
  const primaryCourseId = courseMap.get('operational-weather-analysis-synoptic-diagnostics')!;

  const distinctGroups = [
    { code: 'GRP_FUNDAMENTALS', name: 'Atmospheric Fundamentals & Thermodynamics', importance: 4.8, orderIndex: 1 },
    { code: 'GRP_OBSERVATION', name: 'Surface Observation & Sensor Calibration', importance: 4.5, orderIndex: 2 },
    { code: 'GRP_ANALYSIS', name: 'Synoptic Weather Analysis & Remote Sensing', importance: 5.0, orderIndex: 3 },
    { code: 'GRP_FORECASTING', name: 'Forecasting & Numerical Modeling', importance: 5.0, orderIndex: 4 },
    { code: 'GRP_CLIMATE', name: 'Climate Variability & Data Quality', importance: 4.4, orderIndex: 5 },
    { code: 'GRP_OPERATIONAL', name: 'Operational Applications & Warning Systems', importance: 4.9, orderIndex: 6 },
  ];

  const groupMap = new Map<string, string>();
  for (const grp of distinctGroups) {
    const group = await prisma.competencyGroup.create({
      data: {
        courseId: primaryCourseId,
        name: grp.name,
        description: `Official group curriculum for ${grp.name}.`,
        importance: grp.importance,
        orderIndex: grp.orderIndex,
        isActive: true,
      },
    });
    groupMap.set(grp.code, group.id);
  }

  const topicMap = new Map<string, string>();
  for (let tIdx = 0; tIdx < TOPICS_SEED.length; tIdx++) {
    const tData = TOPICS_SEED[tIdx];
    const groupId = groupMap.get(tData.groupCode)!;

    const topic = await prisma.learningTopic.create({
      data: {
        courseId: primaryCourseId,
        groupId,
        code: tData.code,
        name: tData.name,
        description: tData.description,
        importance: tData.importance,
        difficulty: tData.difficulty,
        estimatedMinutes: tData.estimatedMinutes,
        orderIndex: tIdx + 1,
        isActive: true,
      },
    });
    topicMap.set(topic.code, topic.id);

    // Map Topic to Competencies
    for (const cCode of tData.competencyCodes) {
      const cId = competencyMap.get(cCode);
      if (cId) {
        await prisma.learningTopicCompetency.create({
          data: {
            topicId: topic.id,
            competencyId: cId,
            weight: 1.0,
          },
        });
      }
    }
  }
  console.log(`✅ Seeded ${topicMap.size} learning topics across 6 competency groups.\n`);

  // -------------------------------------------------------------
  // 8. TOPIC PREREQUISITES (The Curriculum DAG)
  // -------------------------------------------------------------
  console.log('🔗 Seeding Topic Prerequisites (The Curriculum DAG)...');
  for (const dep of TOPIC_DEPENDENCIES_SEED) {
    const prereqId = topicMap.get(dep.prerequisiteTopicCode);
    const depId = topicMap.get(dep.dependentTopicCode);
    if (prereqId && depId) {
      await prisma.topicPrerequisite.create({
        data: {
          prerequisiteTopicId: prereqId,
          dependentTopicId: depId,
          edgeWeight: dep.edgeWeight,
          dependencyType: dep.dependencyType,
        },
      });
    }
  }
  console.log(`✅ Seeded ${TOPIC_DEPENDENCIES_SEED.length} topic DAG prerequisite edges.\n`);

  // -------------------------------------------------------------
  // 9. ASSESSMENTS, QUESTIONS & OPTIONS
  // -------------------------------------------------------------
  console.log('📝 Seeding Domain Assessment Question Bank...');
  const leadTrainerId = trainerMap.get('trainer.synoptic@imd.gov.in')!;
  const certificationAssessment = await prisma.assessment.create({
    data: {
      courseId: primaryCourseId,
      trainerId: leadTrainerId,
      title: 'National Operational Meteorology & Synoptic Forecasting Certification',
      description: 'Comprehensive operational assessment validating atmospheric structure, stability, nowcasting, radar diagnostics, and warnings.',
      subject: 'Operational Meteorology',
      assessmentType: AssessmentType.MCQ,
      durationMinutes: 60,
      passingScore: 70.0,
      status: AssessmentStatus.PUBLISHED,
    },
  });

  for (let qIdx = 0; qIdx < QUESTIONS_SEED.length; qIdx++) {
    const qData = QUESTIONS_SEED[qIdx];
    const createdQuestion = await prisma.assessmentQuestion.create({
      data: {
        assessmentId: certificationAssessment.id,
        questionText: qData.questionText,
        questionType: QuestionType.SINGLE_CHOICE,
        marks: qData.marks,
        orderIndex: qIdx + 1,
        explanation: qData.explanation,
        options: {
          create: qData.options.map((opt, oIdx) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            orderIndex: oIdx + 1,
          })),
        },
      },
    });

    const topicId = topicMap.get(qData.topicCode);
    if (topicId) {
      await prisma.assessmentQuestionTopic.create({
        data: {
          questionId: createdQuestion.id,
          topicId,
          weight: 1.0,
        },
      });
    }
  }
  console.log(`✅ Seeded certification assessment with ${QUESTIONS_SEED.length} authentic MCQs.\n`);

  // -------------------------------------------------------------
  // 10. ALGORITHM CONFIGURATIONS
  // -------------------------------------------------------------
  console.log('⚙️ Initializing Engine Algorithm Configurations...');
  await prisma.revisionAlgorithmConfig.create({
    data: {
      version: 'v1.0.0',
      topicWeaknessWeight: 0.35,
      topicForgettingWeight: 0.18,
      topicImportanceWeight: 0.12,
      topicDependencyWeight: 0.12,
      topicErrorWeight: 0.10,
      topicUncertaintyWeight: 0.08,
      topicRecencyWeight: 0.05,
      groupWeaknessWeight: 0.40,
      groupForgettingWeight: 0.20,
      groupImportanceWeight: 0.15,
      groupDependencyWeight: 0.15,
      groupUncertaintyWeight: 0.10,
      cooldownHours: 24,
      masteryThreshold: 85.0,
      diagnosticConfidenceThreshold: 0.40,
      maxTopicsPerSession: 6,
      maxGroupConcentration: 0.80,
      primaryGroupAllocation: 0.70,
      prerequisiteAllocation: 0.20,
      retentionAllocation: 0.10,
      isActive: true,
    },
  });

  await prisma.skillGapAlgorithmConfig.create({
    data: {
      version: 'v1.0.0',
      severityWeight: 0.35,
      importanceWeight: 0.20,
      dependencyWeight: 0.15,
      uncertaintyWeight: 0.10,
      forgettingWeight: 0.10,
      errorSeverityWeight: 0.10,
      coreMultiplier: 1.25,
      importantMultiplier: 1.10,
      normalMultiplier: 1.00,
      optionalMultiplier: 0.80,
      readinessThresholdFull: 80.0,
      readinessThresholdCond: 60.0,
      isActive: true,
    },
  });

  await prisma.recommendationAlgorithmConfig.create({
    data: {
      version: 'v1.0.0',
      skillWeight: 0.25,
      contentWeight: 0.15,
      behaviorWeight: 0.15,
      collaborativeWeight: 0.10,
      qualityWeight: 0.10,
      contextWeight: 0.08,
      popularityWeight: 0.07,
      freshnessWeight: 0.05,
      explorationWeight: 0.05,
      explorationPercentage: 0.15,
      diversityLambda: 0.70,
      maxSameCategory: 3,
      maxSameGroup: 2,
      maxSameTrainer: 2,
      minimumEvidence: 3,
      isActive: true,
    },
  });

  // -------------------------------------------------------------
  // 11. ENROLLMENTS
  // -------------------------------------------------------------
  console.log('🎓 Seeding Learner Enrollments across Course Catalog...');
  // Learner C (Strong Observer): Completed surface courses, enrolled in radar
  const cId = learnerMap.get('LEARNER_C')!;
  await prisma.enrollment.create({
    data: {
      userId: cId,
      courseId: courseMap.get('surface-met-observation-fundamentals')!,
      status: EnrollmentStatus.COMPLETED,
      progressPercentage: 100,
      completedAt: new Date(Date.now() - 20 * 86400000),
    },
  });
  await prisma.enrollment.create({
    data: {
      userId: cId,
      courseId: courseMap.get('aws-network-operations-sensor-calibration')!,
      status: EnrollmentStatus.COMPLETED,
      progressPercentage: 100,
      completedAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  // Learner D (Strong Forecaster): Completed synoptic courses
  const dId = learnerMap.get('LEARNER_D')!;
  await prisma.enrollment.create({
    data: {
      userId: dId,
      courseId: courseMap.get('atmospheric-thermodynamics-sounding-diagnostics')!,
      status: EnrollmentStatus.COMPLETED,
      progressPercentage: 100,
      completedAt: new Date(Date.now() - 30 * 86400000),
    },
  });
  await prisma.enrollment.create({
    data: {
      userId: dId,
      courseId: courseMap.get('operational-weather-analysis-synoptic-diagnostics')!,
      status: EnrollmentStatus.COMPLETED,
      progressPercentage: 100,
      completedAt: new Date(Date.now() - 15 * 86400000),
    },
  });

  // Learner B (Weak Fundamentals): Enrolled in nowcasting without completing fundamentals
  const bId = learnerMap.get('LEARNER_B')!;
  await prisma.enrollment.create({
    data: {
      userId: bId,
      courseId: courseMap.get('atmospheric-thermodynamics-sounding-diagnostics')!,
      status: EnrollmentStatus.IN_PROGRESS,
      progressPercentage: 35,
    },
  });

  // Preserved Jane Doe
  await prisma.enrollment.create({
    data: {
      userId: janeDoe.id,
      courseId: courseMap.get('operational-weather-analysis-synoptic-diagnostics')!,
      status: EnrollmentStatus.COMPLETED,
      progressPercentage: 100,
      completedAt: new Date(Date.now() - 5 * 86400000),
    },
  });

  // -------------------------------------------------------------
  // 12. INGEST TEMPORAL LEARNING EVENTS VIA PRODUCTION PIPELINE
  // -------------------------------------------------------------
  console.log('⚡ Ingesting Temporal Learning Events through Authentic Production Engine...');
  const plannedEvents = generateLearnerEvents();
  let ingestedCount = 0;

  for (const pEvent of plannedEvents) {
    const userId = learnerMap.get(pEvent.learnerCode);
    const topicId = topicMap.get(pEvent.topicCode);

    if (userId && topicId) {
      const occurredAt = new Date(Date.now() - pEvent.daysAgo * 86400000);

      await learningEventService.ingestEvent({
        userId,
        topicId,
        eventType: pEvent.eventType,
        score: pEvent.score,
        maxScore: pEvent.maxScore,
        isCorrect: pEvent.isCorrect,
        timeSpentSeconds: pEvent.timeSpentSeconds,
        expectedDurationSeconds: pEvent.expectedDurationSeconds,
        hintCount: pEvent.hintCount,
        helpRequested: pEvent.helpRequested,
        confidenceSelfReport: pEvent.confidenceSelfReport,
        errorCategory: pEvent.errorCategory,
        courseId: primaryCourseId,
        occurredAt,
      });
      ingestedCount++;
      if (ingestedCount % 20 === 0 || ingestedCount === plannedEvents.length) {
        console.log(`   [Ingestion Progress] ${ingestedCount}/${plannedEvents.length} events processed...`);
      }
    }
  }
  console.log(`✅ Ingested ${ingestedCount} temporal learning events across all personas.\n`);

  // Synchronize UserCompetency records from UserTopicCompetency states
  console.log('🔄 Synchronizing User Competencies from topic states...');
  const topicCompetencyMappings = await prisma.learningTopicCompetency.findMany({
    include: { topic: true },
  });

  const allUserTopics = await prisma.userTopicCompetency.findMany();
  const userCompAggregation = new Map<string, { scores: number[]; confidences: number[]; retentions: number[]; stabilities: number[] }>();

  for (const ut of allUserTopics) {
    const mapped = topicCompetencyMappings.filter((m) => m.topicId === ut.topicId);
    for (const m of mapped) {
      const key = `${ut.userId}_${m.competencyId}`;
      if (!userCompAggregation.has(key)) {
        userCompAggregation.set(key, { scores: [], confidences: [], retentions: [], stabilities: [] });
      }
      const agg = userCompAggregation.get(key)!;
      agg.scores.push(ut.competencyScore);
      agg.confidences.push(ut.confidenceScore);
      agg.retentions.push(ut.retention);
      agg.stabilities.push(ut.stability);
    }
  }

  for (const [key, agg] of userCompAggregation.entries()) {
    const [uId, cId] = key.split('_');
    const avgScore = agg.scores.reduce((sum, s) => sum + s, 0) / agg.scores.length;
    const avgConf = agg.confidences.reduce((sum, c) => sum + c, 0) / agg.confidences.length;
    const avgRetention = agg.retentions.reduce((sum, r) => sum + r, 0) / agg.retentions.length;
    const avgStability = agg.stabilities.reduce((sum, s) => sum + s, 0) / agg.stabilities.length;

    let level = 1;
    if (avgScore >= 85) level = 4;
    else if (avgScore >= 70) level = 3;
    else if (avgScore >= 50) level = 2;
    else if (avgScore >= 30) level = 1;
    else level = 0;

    await prisma.userCompetency.upsert({
      where: { userId_competencyId: { userId: uId, competencyId: cId } },
      create: {
        userId: uId,
        competencyId: cId,
        currentLevel: level,
        competencyScore: Math.round(avgScore * 10) / 10,
        confidenceScore: Math.round(avgConf * 100) / 100,
        evidenceCount: agg.scores.length,
        stability: Math.round(avgStability * 10) / 10,
        retention: Math.round(avgRetention * 100) / 100,
        forgettingRisk: Math.round((1.0 - avgRetention) * 100 * 10) / 10,
        lastAssessedAt: new Date(),
        lastActivityAt: new Date(),
      },
      update: {
        currentLevel: level,
        competencyScore: Math.round(avgScore * 10) / 10,
        confidenceScore: Math.round(avgConf * 100) / 100,
        evidenceCount: agg.scores.length,
        stability: Math.round(avgStability * 10) / 10,
        retention: Math.round(avgRetention * 100) / 100,
        forgettingRisk: Math.round((1.0 - avgRetention) * 100 * 10) / 10,
        lastAssessedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
  }

  // -------------------------------------------------------------
  // 13. EXECUTE INITIAL SKILL GAP ANALYSIS & RECOMMENDATIONS
  // -------------------------------------------------------------
  console.log('🎯 Running Initial Skill Gap Analyses & Recommendations via Real Algorithms...');
  const skillGapService = new SkillGapAnalysisService();
  const recommendationService = new RecommendationService();

  for (const learner of LEARNERS_SEED) {
    const uId = learnerMap.get(learner.code)!;
    try {
      await skillGapService.analyzeLearnerGaps({
        userId: uId,
        courseId: primaryCourseId,
        includeAiGuidance: false,
      });
      await recommendationService.getRecommendations({
        userId: uId,
        surface: 'DASHBOARD',
        limit: 5,
      });
    } catch (err) {
      console.warn(`Initial analysis note for ${learner.code}:`, err);
    }
  }

  // -------------------------------------------------------------
  // PHASE 26 — DATA QUALITY & SEED REPORT GENERATION
  // -------------------------------------------------------------
  console.log('📊 Compiling seed-report.json...');
  const userCount = await prisma.user.count();
  const courseCount = await prisma.course.count();
  const topicCount = await prisma.learningTopic.count();
  const compCount = await prisma.competency.count();
  const depCount = await prisma.topicPrerequisite.count();
  const qCount = await prisma.assessmentQuestion.count();
  const eventCount = await prisma.learningEvent.count();
  const enrollCount = await prisma.enrollment.count();
  const gapCount = await prisma.skillGap.count();
  const recCount = await prisma.recommendation.count();
  const userTopicCount = await prisma.userTopicCompetency.count();

  const events = await prisma.learningEvent.findMany();
  const correctnessCount = events.filter((e) => e.correct).length;
  const hintEvents = events.filter((e) => (e.hintsUsed ?? 0) > 0).length;

  const seedReport = {
    generatedAt: new Date().toISOString(),
    organization: MOES_ORGANIZATION.name,
    environment: process.env.NODE_ENV || 'development',
    summary: {
      users: userCount,
      courses: courseCount,
      topics: topicCount,
      competencies: compCount,
      dependencies: depCount,
      questions: qCount,
      learningEvents: eventCount,
      enrollments: enrollCount,
      skillGaps: gapCount,
      recommendations: recCount,
      userTopicCompetencies: userTopicCount,
    },
    distributions: {
      totalEvents: eventCount,
      correctEvents: correctnessCount,
      incorrectEvents: eventCount - correctnessCount,
      accuracyRatePercentage: eventCount > 0 ? Math.round((correctnessCount / eventCount) * 100) : 0,
      hintUsagePercentage: eventCount > 0 ? Math.round((hintEvents / eventCount) * 100) : 0,
      personaCoverage: LEARNERS_SEED.map((l) => ({
        code: l.code,
        persona: l.personaType,
        email: l.email,
        expectedBehavior: l.expectedBehavior,
      })),
    },
  };

  const reportPath = path.join(__dirname, '..', 'seed-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(seedReport, null, 2));
  console.log(`✅ Seed Report generated at: ${reportPath}`);

  console.log('\n========================================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Courses: ${courseCount}`);
  console.log(`   - Topics: ${topicCount}`);
  console.log(`   - Events: ${eventCount}`);
  console.log(`   - Preserved Account: user@enterprise.com (Jane Doe) / password123`);
  console.log('========================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
