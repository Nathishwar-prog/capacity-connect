import {
  PrismaClient,
  Role,
  UserStatus,
  OrganizationStatus,
  SkillSource,
  CompetencySource,
  CourseDifficulty,
  CourseStatus,
  LessonContentType,
  EnrollmentStatus,
  AssessmentType,
  AssessmentStatus,
  QuestionType,
  AttemptStatus,
  GapPriority,
  GapStatus,
  RecommendationType,
  RecommendationSource,
  RecommendationStatus,
  MatchSource,
  FeedbackStatus,
  AnnouncementType,
  AnnouncementStatus,
  NotificationType,
  AchievementType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Capacity Connect database seeding...');

  // 1. Clean existing records in foreign-key dependency order
  console.log('🧹 Cleaning existing data...');
  await prisma.achievement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.trainerMatch.deleteMany();
  await prisma.recommendation.deleteMany();
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

  // 2. Organization & Departments
  console.log('🏢 Creating Organization and Departments...');
  const org = await prisma.organization.create({
    data: {
      name: 'Capacity Connect Demo Organization',
      code: 'CC-DEMO',
      description: 'Enterprise Capacity Building and Learning Management Portal',
      status: OrganizationStatus.ACTIVE,
      departments: {
        create: [
          { name: 'Technology & Engineering', code: 'TECH', description: 'Software and Cloud Architecture' },
          { name: 'Human Resources', code: 'HR', description: 'People and Organizational Development' },
          { name: 'Training & Development', code: 'TRAIN', description: 'Capacity and Skill Enablement' },
        ],
      },
    },
    include: { departments: true },
  });

  const techDept = org.departments.find((d) => d.code === 'TECH')!;
  const trainDept = org.departments.find((d) => d.code === 'TRAIN')!;
  const hrDept = org.departments.find((d) => d.code === 'HR')!;

  // 3. RBAC Roles & Permissions
  console.log('🛡️ Creating RBAC Roles & Permissions...');
  const permissionsData = [
    { name: 'users:read', description: 'Read user directory and profile info' },
    { name: 'users:write', description: 'Create and edit user accounts' },
    { name: 'courses:read', description: 'Browse and view courses' },
    { name: 'courses:write', description: 'Create and update courses' },
    { name: 'courses:approve', description: 'Approve or reject published courses' },
    { name: 'assessments:create', description: 'Create and manage assessments' },
    { name: 'assessments:evaluate', description: 'Review and evaluate trainee attempts' },
    { name: 'competencies:manage', description: 'Create and map organizational competencies' },
    { name: 'analytics:view', description: 'View executive and organizational analytics' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p) => prisma.appPermission.create({ data: p })),
  );

  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Platform Administrator with unrestricted system access' },
    { name: 'ADMIN', description: 'Organization Administrator with user and governance controls' },
    { name: 'TRAINER', description: 'Instructor managing courses, assessments, and evaluations' },
    { name: 'TRAINEE', description: 'Learner consuming content, taking tests, and tracking skills' },
  ];

  const roles = await Promise.all(
    rolesData.map((r) => prisma.appRole.create({ data: r })),
  );

  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN')!;
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const trainerRole = roles.find((r) => r.name === 'TRAINER')!;
  const traineeRole = roles.find((r) => r.name === 'TRAINEE')!;

  // Map permissions to roles
  for (const perm of permissions) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // Admin gets user, course approval, and analytics
  const adminPerms = permissions.filter((p) =>
    ['users:read', 'users:write', 'courses:read', 'courses:approve', 'competencies:manage', 'analytics:view'].includes(p.name),
  );
  for (const perm of adminPerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Trainer gets course write, assessment create/evaluate
  const trainerPerms = permissions.filter((p) =>
    ['courses:read', 'courses:write', 'assessments:create', 'assessments:evaluate'].includes(p.name),
  );
  for (const perm of trainerPerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: trainerRole.id, permissionId: perm.id },
    });
  }

  // Trainee gets read access
  const traineePerms = permissions.filter((p) => ['courses:read'].includes(p.name));
  for (const perm of traineePerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: traineeRole.id, permissionId: perm.id },
    });
  }

  // 4. Users (1 Super Admin, 1 Admin, 2 Trainers, 3 Trainees)
  console.log('👥 Creating Users & User Profiles...');
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);
  const adminPasswordHash = commonPasswordHash;
  const trainerPasswordHash = commonPasswordHash;
  const traineePasswordHash = commonPasswordHash;

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: techDept.id,
      email: 'superadmin@capacityconnect.io',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'SuperAdmin',
      role: Role.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: hrDept.id,
      email: 'admin@enterprise.com',
      passwordHash: adminPasswordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });

  // Trainer 1: Python & ML Expert
  const trainer1 = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: trainDept.id,
      email: 'alex.trainer@enterprise.com',
      passwordHash: trainerPasswordHash,
      firstName: 'Alex',
      lastName: 'Rivers',
      role: Role.TRAINER,
      status: UserStatus.APPROVED,
      emailVerified: true,
      trainerProfile: {
        create: {
          designation: 'Principal AI & Cloud Architect',
          organizationName: 'Capacity Connect Learning Lab',
          bio: '12+ years of experience leading Python, Data Engineering, and Cloud Native workshops.',
          yearsExperience: 12,
        },
      },
    },
    include: { trainerProfile: true },
  });

  // Trainer 2: Cloud & Database Expert
  const trainer2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: trainDept.id,
      email: 'elena.trainer@enterprise.com',
      passwordHash: trainerPasswordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      role: Role.TRAINER,
      status: UserStatus.APPROVED,
      emailVerified: true,
      trainerProfile: {
        create: {
          designation: 'Senior Database & Cloud Consultant',
          organizationName: 'Capacity Connect Learning Lab',
          bio: 'Expert in PostgreSQL optimization, Distributed Databases, and AWS Architecture.',
          yearsExperience: 9,
        },
      },
    },
    include: { trainerProfile: true },
  });

  // Trainee 1
  const trainee1 = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: techDept.id,
      email: 'user@enterprise.com',
      passwordHash: traineePasswordHash,
      firstName: 'Jane',
      lastName: 'Doe',
      role: Role.TRAINEE,
      status: UserStatus.APPROVED,
      emailVerified: true,
      traineeProfile: {
        create: {
          designation: 'Junior Software Engineer',
          bio: 'Passionate about backend systems and distributed data processing.',
          interests: ['Python', 'SQL', 'Cloud Computing'],
          profileCompletion: 85,
        },
      },
    },
    include: { traineeProfile: true },
  });

  // Trainee 2
  const trainee2 = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: techDept.id,
      email: 'mark.trainee@enterprise.com',
      passwordHash: traineePasswordHash,
      firstName: 'Mark',
      lastName: 'Zucker',
      role: Role.TRAINEE,
      status: UserStatus.APPROVED,
      emailVerified: true,
      traineeProfile: {
        create: {
          designation: 'Associate Cloud Engineer',
          bio: 'Focused on Kubernetes, CI/CD pipelines, and cloud automation.',
          interests: ['Cloud Computing', 'Machine Learning'],
          profileCompletion: 70,
        },
      },
    },
  });

  // Trainee 3
  const trainee3 = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: hrDept.id,
      email: 'david.trainee@enterprise.com',
      passwordHash: traineePasswordHash,
      firstName: 'David',
      lastName: 'Kim',
      role: Role.TRAINEE,
      status: UserStatus.APPROVED,
      emailVerified: true,
      traineeProfile: {
        create: {
          designation: 'People Operations Analyst',
          bio: 'Learning data analytics and automated database workflows.',
          interests: ['Database Management', 'Communication'],
          profileCompletion: 60,
        },
      },
    },
  });

  // 5. Skills
  console.log('⚡ Creating Skills...');
  const skillsData = [
    { name: 'Python', code: 'SKILL-PY', category: 'Programming', description: 'Core Python syntax, OOP, and async libraries' },
    { name: 'Java', code: 'SKILL-JAVA', category: 'Programming', description: 'Enterprise Java and Spring Framework' },
    { name: 'SQL & PostgreSQL', code: 'SKILL-SQL', category: 'Database', description: 'Relational data modeling, indexing, and query optimization' },
    { name: 'Machine Learning', code: 'SKILL-ML', category: 'Data Science', description: 'Supervised learning, neural networks, and model evaluation' },
    { name: 'Cloud Computing', code: 'SKILL-CLOUD', category: 'DevOps', description: 'AWS, Docker, and Kubernetes infrastructure' },
    { name: 'Communication', code: 'SKILL-COMM', category: 'Soft Skills', description: 'Executive presentation, documentation, and team coaching' },
  ];

  const skills = await Promise.all(
    skillsData.map((s) => prisma.skill.create({ data: s })),
  );

  const pySkill = skills.find((s) => s.code === 'SKILL-PY')!;
  const sqlSkill = skills.find((s) => s.code === 'SKILL-SQL')!;
  const mlSkill = skills.find((s) => s.code === 'SKILL-ML')!;
  const cloudSkill = skills.find((s) => s.code === 'SKILL-CLOUD')!;

  // Map Trainer Expertise
  if (trainer1.trainerProfile) {
    await prisma.trainerExpertise.createMany({
      data: [
        { trainerId: trainer1.trainerProfile.id, skillId: pySkill.id, proficiencyLevel: 5, yearsExperience: 10 },
        { trainerId: trainer1.trainerProfile.id, skillId: mlSkill.id, proficiencyLevel: 4, yearsExperience: 7 },
      ],
    });
  }

  if (trainer2.trainerProfile) {
    await prisma.trainerExpertise.createMany({
      data: [
        { trainerId: trainer2.trainerProfile.id, skillId: sqlSkill.id, proficiencyLevel: 5, yearsExperience: 9 },
        { trainerId: trainer2.trainerProfile.id, skillId: cloudSkill.id, proficiencyLevel: 4, yearsExperience: 6 },
      ],
    });
  }

  // Trainee 1 Skills
  await prisma.userSkill.createMany({
    data: [
      { userId: trainee1.id, skillId: pySkill.id, proficiencyLevel: 2, yearsExperience: 1, source: SkillSource.PROFILE },
      { userId: trainee1.id, skillId: sqlSkill.id, proficiencyLevel: 2, yearsExperience: 1, source: SkillSource.ASSESSMENT },
    ],
  });

  // 6. Competencies & Competency Levels
  console.log('🎯 Creating Competencies & Levels...');
  const compLevelsTemplate = [
    { level: 0, name: 'NOT_ASSESSED', description: 'No baseline assessment conducted' },
    { level: 1, name: 'BEGINNER', description: 'Fundamental understanding with guided execution' },
    { level: 2, name: 'BASIC', description: 'Autonomous handling of routine tasks' },
    { level: 3, name: 'INTERMEDIATE', description: 'Proficient in complex problem solving and optimizations' },
    { level: 4, name: 'ADVANCED', description: 'System design and cross-functional leadership' },
    { level: 5, name: 'EXPERT', description: 'Industry authority and strategic innovation' },
  ];

  const competenciesData = [
    { name: 'Python Programming', code: 'COMP-PY-PROG', category: 'Software Engineering', description: 'End-to-end Python software development and architecture' },
    { name: 'Database Management', code: 'COMP-DB-MGMT', category: 'Data Architecture', description: 'Database design, indexing, and high-throughput transaction engineering' },
    { name: 'Machine Learning', code: 'COMP-ML-OPS', category: 'Artificial Intelligence', description: 'Statistical modeling, deep learning, and predictive pipelines' },
    { name: 'Cloud Computing', code: 'COMP-CLOUD-ARCH', category: 'Cloud Infrastructure', description: 'Scalable cloud infrastructure deployment and security' },
    { name: 'Communication & Leadership', code: 'COMP-LEAD-COMM', category: 'Leadership', description: 'Cross-functional alignment and technical mentorship' },
  ];

  const competencies = [];
  for (const compData of competenciesData) {
    const comp = await prisma.competency.create({
      data: {
        ...compData,
        levels: {
          create: compLevelsTemplate,
        },
      },
      include: { levels: true },
    });
    competencies.push(comp);
  }

  const pyComp = competencies.find((c) => c.code === 'COMP-PY-PROG')!;

  // 7. Courses, Modules, Lessons & Prerequisites
  console.log('📚 Creating Courses, Modules, and Lessons...');
  const course1 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer1.id,
      title: 'Python Fundamentals & Object-Oriented Design',
      slug: 'python-fundamentals-oop',
      description: 'Master core Python data structures, standard libraries, and robust object-oriented architecture.',
      category: 'Software Engineering',
      difficulty: CourseDifficulty.BEGINNER,
      durationMinutes: 180,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Language Syntax & Control Flow',
            orderIndex: 1,
            lessons: {
              create: [
                { title: 'Introduction & Python Environment', contentType: LessonContentType.VIDEO, durationMinutes: 20, orderIndex: 1, isPreview: true },
                { title: 'Data Structures: Lists, Dicts, and Sets', contentType: LessonContentType.ARTICLE, durationMinutes: 30, orderIndex: 2 },
              ],
            },
          },
          {
            title: 'Module 2: Object-Oriented Programming',
            orderIndex: 2,
            lessons: {
              create: [
                { title: 'Classes, Objects & Encapsulation', contentType: LessonContentType.VIDEO, durationMinutes: 40, orderIndex: 1 },
                { title: 'Inheritance, Polymorphism & Protocols', contentType: LessonContentType.ARTICLE, durationMinutes: 35, orderIndex: 2 },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: pyComp.id, targetLevel: 2 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  const course2 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer1.id,
      title: 'Advanced Python: Concurrency & Design Patterns',
      slug: 'advanced-python-concurrency',
      description: 'Deep dive into GIL internals, asyncio pipelines, multiprocessing, and gang-of-four architectural patterns.',
      category: 'Software Engineering',
      difficulty: CourseDifficulty.ADVANCED,
      durationMinutes: 240,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Asyncio & Event Loops',
            orderIndex: 1,
            lessons: {
              create: [
                { title: 'Async Generators and Task Groups', contentType: LessonContentType.VIDEO, durationMinutes: 45, orderIndex: 1 },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: pyComp.id, targetLevel: 4 }],
      },
    },
  });

  // Course Prerequisite: Course 2 requires Course 1
  await prisma.coursePrerequisite.create({
    data: {
      courseId: course2.id,
      prerequisiteCourseId: course1.id,
    },
  });

  // 8. Assessments, Questions & Options
  console.log('📝 Creating Assessments & Evaluation Questions...');
  const assessment = await prisma.assessment.create({
    data: {
      courseId: course1.id,
      trainerId: trainer1.id,
      title: 'Python Fundamentals Competency Certification Test',
      subject: 'Python Programming',
      assessmentType: AssessmentType.MCQ,
      durationMinutes: 45,
      passingScore: 70.0,
      status: AssessmentStatus.PUBLISHED,
      questions: {
        create: [
          {
            questionText: 'What is the time complexity of looking up a key in a standard Python dictionary?',
            questionType: QuestionType.SINGLE_CHOICE,
            marks: 10,
            orderIndex: 1,
            explanation: 'Python dictionaries are implemented using hash tables, giving average O(1) time complexity.',
            options: {
              create: [
                { optionText: 'O(1) average', isCorrect: true, orderIndex: 1 },
                { optionText: 'O(n)', isCorrect: false, orderIndex: 2 },
                { optionText: 'O(log n)', isCorrect: false, orderIndex: 3 },
                { optionText: 'O(n^2)', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            questionText: 'Which keyword is used in Python to define a generator function?',
            questionType: QuestionType.SINGLE_CHOICE,
            marks: 10,
            orderIndex: 2,
            explanation: 'The yield keyword transforms a normal function into a generator.',
            options: {
              create: [
                { optionText: 'yield', isCorrect: true, orderIndex: 1 },
                { optionText: 'return', isCorrect: false, orderIndex: 2 },
                { optionText: 'generator', isCorrect: false, orderIndex: 3 },
                { optionText: 'async', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // 9. Enrollments & Trainee Progress
  console.log('🚀 Creating Enrollments & Progress...');
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: trainee1.id,
      courseId: course1.id,
      status: EnrollmentStatus.IN_PROGRESS,
      progressPercentage: 50.0,
      enrolledAt: new Date(),
      startedAt: new Date(),
    },
  });

  const firstLesson = course1.modules[0].lessons[0];
  await prisma.lessonProgress.create({
    data: {
      userId: trainee1.id,
      lessonId: firstLesson.id,
      enrollmentId: enrollment.id,
      completed: true,
      progressPercentage: 100.0,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  // 10. Assessment Attempt, Evaluation & Competency Bridge
  console.log('📊 Simulating Assessment Attempt & Competency Results...');
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment.id,
      userId: trainee1.id,
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      submittedAt: new Date(),
      score: 20,
      percentage: 100.0,
      passed: true,
      timeTakenSeconds: 1800,
      status: AttemptStatus.SUBMITTED,
    },
  });

  // Connect assessment performance to Competency Result
  await prisma.assessmentCompetencyResult.create({
    data: {
      attemptId: attempt.id,
      competencyId: pyComp.id,
      score: 100.0,
      levelAchieved: 2,
    },
  });

  // Update Trainee Competency
  await prisma.userCompetency.create({
    data: {
      userId: trainee1.id,
      competencyId: pyComp.id,
      currentLevel: 2,
      confidenceScore: 0.95,
      lastAssessedAt: new Date(),
      source: CompetencySource.ASSESSMENT,
    },
  });

  // 11. Skill Gap Analysis
  console.log('🔍 Creating Skill Gap Record...');
  // Trainee 1 has currentLevel 2 for Python, but target role requires level 4
  await prisma.skillGap.create({
    data: {
      userId: trainee1.id,
      competencyId: pyComp.id,
      currentLevel: 2,
      requiredLevel: 4,
      gapLevel: 2,
      priority: GapPriority.HIGH,
      status: GapStatus.OPEN,
    },
  });

  // 12. Recommendations & Trainer Matching
  console.log('💡 Generating Recommendations & Trainer Match...');
  await prisma.recommendation.create({
    data: {
      userId: trainee1.id,
      recommendationType: RecommendationType.COURSE,
      courseId: course2.id,
      competencyId: pyComp.id,
      score: 0.92,
      reason: 'Recommended based on your Python skill gap target (Level 4 requirement)',
      source: RecommendationSource.RULE_ENGINE,
      status: RecommendationStatus.ACTIVE,
    },
  });

  await prisma.trainerMatch.create({
    data: {
      traineeId: trainee1.id,
      trainerId: trainer1.id,
      competencyId: pyComp.id,
      matchScore: 94.5,
      matchingSkills: { matchedSkills: ['Python', 'Machine Learning'] },
      reason: 'Trainer Alex Rivers is an expert in Advanced Python and Cloud Architecture.',
      source: MatchSource.RULE_ENGINE,
    },
  });

  // 13. Feedback, Announcements, Notifications & Achievements
  console.log('📢 Creating Announcements, Notifications & Achievements...');
  await prisma.feedback.create({
    data: {
      userId: trainee1.id,
      courseId: course1.id,
      trainerId: trainer1.id,
      rating: 5,
      comment: 'Exceptional course! Clear OOP architecture explanations and great examples.',
      status: FeedbackStatus.PUBLISHED,
    },
  });

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      createdBy: admin.id,
      title: 'Welcome to Capacity Connect Q3 Learning Cycle',
      content: 'New competency paths and certifications in Python, Cloud, and Machine Learning are now live.',
      type: AnnouncementType.GENERAL,
      status: AnnouncementStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: trainee1.id,
      title: 'Course Recommendation Available',
      message: 'You have a new recommended course: Advanced Python based on your skill gap analysis.',
      type: NotificationType.RECOMMENDATION,
      isRead: false,
    },
  });

  await prisma.achievement.create({
    data: {
      userId: trainee1.id,
      title: 'First Step Achiever',
      description: 'Completed your first interactive lesson module in Python Fundamentals',
      type: AchievementType.COURSE_COMPLETION,
      metadata: { courseId: course1.id, badge: 'FOUNDATION_EXPLORER' },
    },
  });

  // 14. Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: admin.id,
      action: 'COURSE_APPROVED',
      entityType: 'Course',
      entityId: course1.id,
      newValues: { status: CourseStatus.PUBLISHED },
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`- Organization: ${org.name} (${org.code})`);
  console.log(`- Super Admin: ${superAdmin.email}`);
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Trainers: ${trainer1.email}, ${trainer2.email}`);
  console.log(`- Trainees: ${trainee1.email}, ${trainee2.email}, ${trainee3.email}`);
  console.log(`- Courses seeded: ${course1.title}, ${course2.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
