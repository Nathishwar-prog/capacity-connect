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
  console.log('🌱 Starting MoES / IMD Capacity Connect database seeding...');

  // 1. Clean existing records in foreign-key dependency order
  console.log('🧹 Cleaning existing data...');
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

  // 2. Organization & Departments (MoES / IMD Ecosystem)
  console.log('🏛️ Creating MoES / IMD Organization and Specialized Departments...');
  const org = await prisma.organization.create({
    data: {
      name: 'Ministry of Earth Sciences & India Meteorological Department',
      code: 'MoES-IMD',
      description: 'Apex Digital Capacity Building and Learning Management Portal for MoES, IMD, INCOIS, and NCS.',
      status: OrganizationStatus.ACTIVE,
      departments: {
        create: [
          { name: 'National Weather Forecasting Centre', code: 'NWFC', description: 'Synoptic weather forecasting, extreme weather alerts, and severe weather warnings' },
          { name: 'Numerical Weather Prediction Division', code: 'NWP', description: 'Atmospheric dynamics, regional WRF-ARW, global GFS/NCUM, and data assimilation' },
          { name: 'Radar Meteorology & DWR Network', code: 'RADAR', description: 'Doppler Weather Radar (DWR) operations, dual-pol algorithms, and severe storm nowcasting' },
          { name: 'Satellite Meteorology & Remote Sensing', code: 'SATMET', description: 'INSAT-3D/3DR radiance products, cloud pattern analysis, and tropical cyclone tracking' },
          { name: 'Climate Research and Services (IMD Pune)', code: 'CRS', description: 'Long-range climate forecasting, extreme indices analysis, and climate normals' },
          { name: 'Indian National Centre for Ocean Information Services', code: 'INCOIS', description: 'Ocean state forecasting, wave modeling, storm surge, and Indian Tsunami Early Warning' },
          { name: 'National Centre for Seismology', code: 'NCS', description: 'Earthquake monitoring, National Seismological Network, hypocenter location, and microzonation' },
          { name: 'Hydrology & Flood Meteorological Division', code: 'HYDRO', description: 'Quantitative Precipitation Estimation (QPE), river catchment modeling, and flash flood guidance' },
          { name: 'Central Training Institute (Pashan, Pune)', code: 'CTI', description: 'WMO Regional Training Centre for foundational and advanced operational meteorology' },
          { name: 'Surface Instruments & Observational Network', code: 'INSTR', description: 'Automatic Weather Stations (AWS), ARG telemetry, sensor calibration, and surface network' },
        ],
      },
    },
    include: { departments: true },
  });

  const deptMap = new Map<string, string>();
  for (const dept of org.departments) {
    deptMap.set(dept.code, dept.id);
  }

  // 3. RBAC Roles & Permissions
  console.log('🛡️ Configuring RBAC Roles & Permissions...');
  const permissionsData = [
    { name: 'users:read', description: 'View user directory and profile metadata' },
    { name: 'users:write', description: 'Create, update, and govern user accounts' },
    { name: 'courses:read', description: 'Browse and view courses and educational syllabus' },
    { name: 'courses:write', description: 'Author, structure, and update courses and lesson content' },
    { name: 'courses:approve', description: 'Approve, verify, and publish official courses' },
    { name: 'assessments:create', description: 'Design and deploy assessment tests and questions' },
    { name: 'assessments:evaluate', description: 'Grade, review, and evaluate trainee attempts' },
    { name: 'competencies:manage', description: 'Define and maintain official MoES competency frameworks' },
    { name: 'analytics:view', description: 'Inspect executive learning dashboards and skill gap analytics' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p) => prisma.appPermission.create({ data: p })),
  );

  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Ministry Level Platform Administrator with full access' },
    { name: 'ADMIN', description: 'Departmental Administrator for training governance and approvals' },
    { name: 'TRAINER', description: 'Senior Scientist / Course Instructor managing modules and assessments' },
    { name: 'TRAINEE', description: 'Scientific Officer / Meteorologist learner acquiring competencies' },
  ];

  const roles = await Promise.all(
    rolesData.map((r) => prisma.appRole.create({ data: r })),
  );

  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN')!;
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const trainerRole = roles.find((r) => r.name === 'TRAINER')!;
  const traineeRole = roles.find((r) => r.name === 'TRAINEE')!;

  for (const perm of permissions) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  const adminPerms = permissions.filter((p) =>
    ['users:read', 'users:write', 'courses:read', 'courses:approve', 'competencies:manage', 'analytics:view'].includes(p.name),
  );
  for (const perm of adminPerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const trainerPerms = permissions.filter((p) =>
    ['courses:read', 'courses:write', 'assessments:create', 'assessments:evaluate'].includes(p.name),
  );
  for (const perm of trainerPerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: trainerRole.id, permissionId: perm.id },
    });
  }

  const traineePerms = permissions.filter((p) => ['courses:read'].includes(p.name));
  for (const perm of traineePerms) {
    await prisma.rolePermissionMapping.create({
      data: { roleId: traineeRole.id, permissionId: perm.id },
    });
  }

  // 4. Competencies (8 Official MoES/IMD Competencies with 6 Levels Each)
  console.log('🎯 Creating MoES / IMD Competencies & Competency Framework...');
  const compLevelsTemplate = [
    { level: 0, name: 'NOT_ASSESSED', description: 'No baseline assessment conducted' },
    { level: 1, name: 'BEGINNER', description: 'Foundational grasp of theoretical principles with guided operational practice' },
    { level: 2, name: 'BASIC', description: 'Routine operational task execution and standard chart/product interpretation' },
    { level: 3, name: 'INTERMEDIATE', description: 'Autonomous handling of severe event analysis, complex modeling, and diagnostics' },
    { level: 4, name: 'ADVANCED', description: 'Lead forecaster / research authority driving specialized advisory bulletins' },
    { level: 5, name: 'EXPERT', description: 'National subject matter expert driving WMO working groups and organizational policy' },
  ];

  const competenciesData = [
    { name: 'Synoptic Meteorology & Weather Forecasting', code: 'COMP-SYNOPTIC-MET', category: 'Meteorology', description: 'Surface and upper-air synoptic analysis, tropical cyclogenesis, Western Disturbances, and severe weather warnings.' },
    { name: 'Numerical Weather Prediction & Modeling', code: 'COMP-NWP-MODELING', category: 'Atmospheric Sciences', description: 'Governing equations, numerical discretization, WRF/GFS operational setup, and ensemble forecasting.' },
    { name: 'Radar Meteorology & DWR Operations', code: 'COMP-RADAR-MET', category: 'Observational Systems', description: 'Doppler Weather Radar signal analysis, dual-polarization hydrometeor classification, and convective storm nowcasting.' },
    { name: 'Satellite Meteorology & Remote Sensing', code: 'COMP-SAT-MET', category: 'Remote Sensing', description: 'INSAT-3D/3DR imagery interpretation, radiance assimilation, atmospheric motion vectors, and Dvorak technique.' },
    { name: 'Climate Data Analysis & Climate Change Projections', code: 'COMP-CLIMATE-SCI', category: 'Climate Science', description: 'IMD high-resolution gridded datasets, ETCCDI extreme indices, NetCDF/CDO manipulation, and CMIP6 projections.' },
    { name: 'Ocean State Forecasting & Tsunami Warning', code: 'COMP-OCEAN-SCI', category: 'Ocean Sciences', description: 'Numerical wave modeling (WAVEWATCH-III), storm surge prediction, and ITEWC tsunami early warning protocols.' },
    { name: 'Seismological Data Processing & Earthquake Monitoring', code: 'COMP-SEISMOLOGY', category: 'Geophysics', description: 'National Seismological Network operations, phase picking, hypocenter determination, and seismic microzonation.' },
    { name: 'Meteorological Instrumentation & AWS Networks', code: 'COMP-INSTRUMENTATION', category: 'Observational Systems', description: 'Automatic Weather Station sensor calibration, datalogger telemetry, and WMO observation siting standards.' },
  ];

  const competencies = [];
  for (const compData of competenciesData) {
    const comp = await prisma.competency.create({
      data: {
        ...compData,
        levels: { create: compLevelsTemplate },
      },
      include: { levels: true },
    });
    competencies.push(comp);
  }

  const compMap = new Map<string, string>();
  for (const c of competencies) {
    compMap.set(c.code, c.id);
  }

  // 5. Skills (10 MoES/IMD Skills)
  console.log('⚡ Creating Domain-Specific Scientific and Technical Skills...');
  const skillsData = [
    { name: 'Synoptic Chart Analysis', code: 'SKILL-SYNOP', category: 'Synoptic Meteorology', description: 'Interpretation of constant pressure surfaces, streamline analysis, and surface pressure patterns' },
    { name: 'WRF Numerical Modeling', code: 'SKILL-WRF', category: 'Atmospheric Modeling', description: 'Configuration, boundary conditions, and physics parameterizations for regional mesoscale models' },
    { name: 'Doppler Radar Interpretation', code: 'SKILL-DWR', category: 'Radar Meteorology', description: 'Radial velocity de-aliasing, reflectivity cores, and mesocyclone signature recognition' },
    { name: 'INSAT-3DR Satellite Analysis', code: 'SKILL-INSAT', category: 'Satellite Meteorology', description: 'Multispectral image enhancement, cloud top temperature estimation, and water vapor tracking' },
    { name: 'Climate Data Operators (CDO) & NetCDF', code: 'SKILL-CDO', category: 'Climate Science', description: 'High-throughput processing of gridded climate model outputs and climate normal computation' },
    { name: 'WAVEWATCH-III & Storm Surge Modeling', code: 'SKILL-WAVE', category: 'Ocean Sciences', description: 'Simulation of wind-driven ocean waves, coastal shoaling, and cyclonic storm surge inundation' },
    { name: 'Seismic Waveform Inversion & Phase Picking', code: 'SKILL-SEISMO', category: 'Seismology', description: 'Analysis of broadband seismograms, P/S arrival picking, and earthquake magnitude determination' },
    { name: 'AWS & ARG Sensor Calibration', code: 'SKILL-AWS', category: 'Instrumentation', description: 'Routine maintenance, electronics testing, and precision calibration of automated weather sensors' },
    { name: 'Quantitative Precipitation Estimation (QPE)', code: 'SKILL-HYDRO', category: 'Hydrometeorology', description: 'Radar-rain gauge merging, catchment rainfall estimation, and flash flood guidance systems' },
    { name: 'Python for Earth Sciences (MetPy, xarray, Cartopy)', code: 'SKILL-EARTH-PY', category: 'Scientific Computing', description: 'Geospatial atmospheric visualization, thermodynamic skew-T plotting, and GRIB2 decoding' },
  ];

  const skills = await Promise.all(
    skillsData.map((s) => prisma.skill.create({ data: s })),
  );
  const skillMap = new Map<string, string>();
  for (const s of skills) {
    skillMap.set(s.code, s.id);
  }

  // 6. Pre-computed Password Hash
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);

  // 7. Leadership & Trainers
  console.log('👥 Creating MoES Leadership & Senior Domain Trainers...');
  
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap.get('CTI'),
      email: 'superadmin@capacityconnect.io',
      passwordHash: commonPasswordHash,
      firstName: 'Dr. M.',
      lastName: 'Rajeevan',
      role: Role.SUPER_ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      departmentId: deptMap.get('NWFC'),
      email: 'admin@enterprise.com',
      passwordHash: commonPasswordHash,
      firstName: 'Dr. M.',
      lastName: 'Mohapatra',
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
      emailVerified: true,
    },
  });

  // Trainers (5 Senior Scientists across MoES/IMD)
  const trainerData = [
    {
      email: 'dr.rathore.trainer@imd.gov.in',
      firstName: 'Dr. L. S.',
      lastName: 'Rathore',
      deptCode: 'NWFC',
      designation: 'Scientist "G" & Chief Synoptic Forecaster',
      bio: 'Over 28 years of distinguished service in tropical synoptic forecasting, monsoon dynamics, and national cyclone early warning systems.',
      yearsExperience: 28,
      skills: [
        { code: 'SKILL-SYNOP', level: 5, years: 25 },
        { code: 'SKILL-HYDRO', level: 4, years: 20 },
      ],
    },
    {
      email: 'dr.rajagopal.trainer@imd.gov.in',
      firstName: 'Dr. E. N.',
      lastName: 'Rajagopal',
      deptCode: 'NWP',
      designation: 'Scientist "F" & NWP Systems Lead',
      bio: 'Leading developer of high-resolution atmospheric models, ensemble prediction systems, and data assimilation pipelines at MoES.',
      yearsExperience: 22,
      skills: [
        { code: 'SKILL-WRF', level: 5, years: 20 },
        { code: 'SKILL-EARTH-PY', level: 5, years: 15 },
      ],
    },
    {
      email: 'dr.roy.trainer@imd.gov.in',
      firstName: 'Dr. S. K.',
      lastName: 'Roy',
      deptCode: 'RADAR',
      designation: 'Scientist "E" & DWR Network Operations Lead',
      bio: 'Expert in S-Band & C-Band Doppler Weather Radars, dual-polarization signal processing, and severe thunderstorm nowcasting algorithms.',
      yearsExperience: 18,
      skills: [
        { code: 'SKILL-DWR', level: 5, years: 16 },
        { code: 'SKILL-AWS', level: 4, years: 12 },
      ],
    },
    {
      email: 'dr.sunitha.trainer@imd.gov.in',
      firstName: 'Dr. Sunitha',
      lastName: 'Murthy',
      deptCode: 'SATMET',
      designation: 'Scientist "F" & Satellite Applications Specialist',
      bio: 'Pioneered INSAT-3D/3DR payload applications, geophysical parameter retrieval, and atmospheric motion vector calculations.',
      yearsExperience: 20,
      skills: [
        { code: 'SKILL-INSAT', level: 5, years: 18 },
        { code: 'SKILL-SYNOP', level: 4, years: 15 },
      ],
    },
    {
      email: 'dr.nair.trainer@incois.gov.in',
      firstName: 'Dr. T. M.',
      lastName: 'Balakrishnan Nair',
      deptCode: 'INCOIS',
      designation: 'Director / Scientist "G" (Ocean & Tsunami Sciences)',
      bio: 'Director of Operational Ocean Services at INCOIS, leading Indian Tsunami Early Warning Centre and ocean state forecasting networks.',
      yearsExperience: 25,
      skills: [
        { code: 'SKILL-WAVE', level: 5, years: 22 },
        { code: 'SKILL-CDO', level: 4, years: 16 },
      ],
    },
  ];

  const trainers: any[] = [];
  for (const t of trainerData) {
    const trainerUser = await prisma.user.create({
      data: {
        organizationId: org.id,
        departmentId: deptMap.get(t.deptCode),
        email: t.email,
        passwordHash: commonPasswordHash,
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TRAINER,
        status: UserStatus.APPROVED,
        emailVerified: true,
        trainerProfile: {
          create: {
            designation: t.designation,
            organizationName: 'India Meteorological Department / MoES',
            bio: t.bio,
            yearsExperience: t.yearsExperience,
          },
        },
      },
      include: { trainerProfile: true },
    });

    if (trainerUser.trainerProfile) {
      for (const s of t.skills) {
        await prisma.trainerExpertise.create({
          data: {
            trainerId: trainerUser.trainerProfile.id,
            skillId: skillMap.get(s.code)!,
            proficiencyLevel: s.level,
            yearsExperience: s.years,
          },
        });
      }
    }
    trainers.push(trainerUser);
  }

  const trainer1 = trainers[0]; // Dr. Rathore (Synoptic)
  const trainer2 = trainers[1]; // Dr. Rajagopal (NWP)
  const trainer3 = trainers[2]; // Dr. Roy (Radar)
  const trainer4 = trainers[3]; // Dr. Sunitha (Satellite)
  const trainer5 = trainers[4]; // Dr. Nair (Ocean / INCOIS)

  // 8. Trainees (32 Detailed MoES / IMD Scientific Officers)
  console.log('👨‍🔬 Seeding 32 MoES/IMD Trainees across specialized cadres...');
  const traineesRaw = [
    {
      email: 'user@enterprise.com',
      firstName: 'Jane',
      lastName: 'Doe',
      deptCode: 'NWFC',
      designation: 'Meteorologist Grade-II (Synoptic Analysis)',
      bio: 'Assigned to the National Weather Forecasting Centre, specializing in tropical convective systems and synoptic weather bulletin preparation.',
      interests: ['Synoptic Meteorology', 'Severe Weather Nowcasting', 'Satellite Imagery'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-SYNOP', level: 3, years: 3 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 2 },
    },
    {
      email: 'rajesh.verma@imd.gov.in',
      firstName: 'Rajesh Kumar',
      lastName: 'Verma',
      deptCode: 'NWFC',
      designation: 'Scientist "B" (Synoptic Forecaster)',
      bio: 'Focusing on seasonal monsoon transitions and severe squall line predictions for Northern India.',
      interests: ['Monsoon Dynamics', 'Synoptic Meteorology', 'Data Assimilation'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-SYNOP', level: 3, years: 4 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 3 },
    },
    {
      email: 'priya.s@imd.gov.in',
      firstName: 'Priya',
      lastName: 'Swaminathan',
      deptCode: 'NWP',
      designation: 'Scientist "C" (NWP Modeling & Dynamics)',
      bio: 'Researching convective-permitting model physics, WRF-ARW boundary layer schemes, and ensemble spread.',
      interests: ['Numerical Weather Prediction', 'High-Performance Computing', 'Python for Earth Sciences'],
      profileCompletion: 95,
      skills: [{ code: 'SKILL-WRF', level: 4, years: 6 }, { code: 'SKILL-EARTH-PY', level: 4, years: 5 }],
      comp: { code: 'COMP-NWP-MODELING', level: 4 },
    },
    {
      email: 'amitav.s@imd.gov.in',
      firstName: 'Amitav',
      lastName: 'Sengupta',
      deptCode: 'RADAR',
      designation: 'Technical Officer (Radar Maintenance & Calibration)',
      bio: 'Overseeing C-band radar network hardware maintenance, RF transmission calibration, and data link reliability.',
      interests: ['Radar Meteorology', 'Microwave Electronics', 'AWS Calibration'],
      profileCompletion: 75,
      skills: [{ code: 'SKILL-DWR', level: 3, years: 4 }],
      comp: { code: 'COMP-RADAR-MET', level: 2 },
    },
    {
      email: 'ananya.d@imd.gov.in',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      deptCode: 'SATMET',
      designation: 'Scientist "B" (Satellite Geophysical Products)',
      bio: 'Specialist in processing INSAT-3DR thermal infrared channels and estimating convective cloud top heights.',
      interests: ['Satellite Meteorology', 'Remote Sensing', 'Cyclone Tracking'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-INSAT', level: 3, years: 3 }],
      comp: { code: 'COMP-SAT-MET', level: 3 },
    },
    {
      email: 'vikrant.c@imd.gov.in',
      firstName: 'Vikrant',
      lastName: 'Chauhan',
      deptCode: 'CRS',
      designation: 'Scientific Assistant (Climatological Records)',
      bio: 'Managing historical daily temperature and rainfall gridded datasets for climate normal computations at IMD Pune.',
      interests: ['Climate Science', 'Historical Grids', 'CDO Processing'],
      profileCompletion: 80,
      skills: [{ code: 'SKILL-CDO', level: 3, years: 3 }],
      comp: { code: 'COMP-CLIMATE-SCI', level: 2 },
    },
    {
      email: 'sneha.k@incois.gov.in',
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      deptCode: 'INCOIS',
      designation: 'Scientist "B" (Ocean State Forecasting)',
      bio: 'Conducting real-time WAVEWATCH-III simulations and swell surge forecast dissemination for the Arabian Sea coast.',
      interests: ['Ocean Sciences', 'Wave Modeling', 'Coastal Inundation'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-WAVE', level: 3, years: 4 }],
      comp: { code: 'COMP-OCEAN-SCI', level: 3 },
    },
    {
      email: 'rizwan.m@imd.gov.in',
      firstName: 'Mohammad',
      lastName: 'Rizwan',
      deptCode: 'NCS',
      designation: 'Scientist "B" (Seismological Inversion)',
      bio: 'Processing broadband seismological waveforms and automated focal mechanism solutions at the National Centre for Seismology.',
      interests: ['Seismology', 'Earthquake Early Warning', 'Geophysics'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-SEISMO', level: 3, years: 4 }],
      comp: { code: 'COMP-SEISMOLOGY', level: 3 },
    },
    {
      email: 'kavita.n@imd.gov.in',
      firstName: 'Kavita',
      lastName: 'Nair',
      deptCode: 'HYDRO',
      designation: 'Meteorologist Grade-I (Hydrology & Flash Flood)',
      bio: 'Responsible for South Asia Flash Flood Guidance System (FFGS) operations and sub-basin rainfall estimation.',
      interests: ['Hydrometeorology', 'Flood Warning', 'Radar QPE'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-HYDRO', level: 4, years: 7 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 3 },
    },
    {
      email: 'tenzin.n@imd.gov.in',
      firstName: 'Tenzin',
      lastName: 'Norbu',
      deptCode: 'INSTR',
      designation: 'Senior Scientific Assistant (High-Altitude Observatories)',
      bio: 'Managing Himalayan Automated Weather Stations (AWS), snow acoustic depth sensors, and extreme weather telemetry.',
      interests: ['Instrumentation', 'Himalayan Meteorology', 'Telemetry'],
      profileCompletion: 70,
      skills: [{ code: 'SKILL-AWS', level: 4, years: 6 }],
      comp: { code: 'COMP-INSTRUMENTATION', level: 3 },
    },
    {
      email: 'deepak.b@imd.gov.in',
      firstName: 'Deepak',
      lastName: 'Bhattacharya',
      deptCode: 'NWFC',
      designation: 'Senior Research Fellow (SRF - AI in Weather)',
      bio: 'Applying deep learning neural networks to post-process NWP numerical outputs and improve extreme rain forecasts.',
      interests: ['Machine Learning', 'Synoptic Forecasting', 'Python for Earth Sciences'],
      profileCompletion: 65,
      skills: [{ code: 'SKILL-EARTH-PY', level: 3, years: 2 }],
      comp: { code: 'COMP-NWP-MODELING', level: 2 },
    },
    {
      email: 'shalini.s@imd.gov.in',
      firstName: 'Shalini',
      lastName: 'Saxena',
      deptCode: 'NWP',
      designation: 'Scientist "B" (Global Ensemble Prediction)',
      bio: 'Validating probabilistic precipitation forecasts from the MoES Global Ensemble Prediction System (NEPS).',
      interests: ['Ensemble Modeling', 'Statistical Verification', 'Climate Projections'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-WRF', level: 3, years: 4 }],
      comp: { code: 'COMP-NWP-MODELING', level: 3 },
    },
    {
      email: 'harpreet.b@imd.gov.in',
      firstName: 'Harpreet Singh',
      lastName: 'Bedi',
      deptCode: 'RADAR',
      designation: 'Scientific Assistant (DWR Nowcasting Desk)',
      bio: 'Analyzing real-time Doppler velocity signatures for tornado detection, squall line tracking, and airport advisories.',
      interests: ['Radar Meteorology', 'Aviation Meteorology', 'Nowcasting'],
      profileCompletion: 80,
      skills: [{ code: 'SKILL-DWR', level: 3, years: 3 }],
      comp: { code: 'COMP-RADAR-MET', level: 3 },
    },
    {
      email: 'meenakshi.s@imd.gov.in',
      firstName: 'Meenakshi',
      lastName: 'Sundaram',
      deptCode: 'SATMET',
      designation: 'Junior Research Fellow (INSAT-3DR Sounder)',
      bio: 'Evaluating vertical atmospheric temperature and humidity profiles derived from INSAT-3DR sounder data.',
      interests: ['Atmospheric Sounding', 'Satellite Meteorology', 'Radiative Transfer'],
      profileCompletion: 60,
      skills: [{ code: 'SKILL-INSAT', level: 2, years: 1 }],
      comp: { code: 'COMP-SAT-MET', level: 2 },
    },
    {
      email: 'arindam.r@imd.gov.in',
      firstName: 'Arindam',
      lastName: 'Roy',
      deptCode: 'CRS',
      designation: 'Meteorologist Grade-II (Agro-Climatic Advisory)',
      bio: 'Compiling district-level agro-meteorological advisories and standardized precipitation drought indices.',
      interests: ['Climate Science', 'Agro-Meteorology', 'Drought Indices'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-CDO', level: 3, years: 5 }],
      comp: { code: 'COMP-CLIMATE-SCI', level: 3 },
    },
    {
      email: 'gowri.s@incois.gov.in',
      firstName: 'Gowri',
      lastName: 'Sankar',
      deptCode: 'INCOIS',
      designation: 'Scientific Assistant (Coastal Wave Buoys)',
      bio: 'Operating coastal directional wave rider buoy network and nearshore hydrodynamic modeling.',
      interests: ['Ocean Observations', 'Wave Spectra', 'Marine Hazards'],
      profileCompletion: 75,
      skills: [{ code: 'SKILL-WAVE', level: 2, years: 3 }],
      comp: { code: 'COMP-OCEAN-SCI', level: 2 },
    },
    {
      email: 'tanmayee.j@imd.gov.in',
      firstName: 'Tanmayee',
      lastName: 'Joshi',
      deptCode: 'NCS',
      designation: 'Scientist "C" (Seismic Network Operations)',
      bio: 'Leading 150+ broadband seismological station telemetry and rapid earthquake notification protocols.',
      interests: ['Seismology', 'VSAT Networks', 'Crustal Deformation'],
      profileCompletion: 95,
      skills: [{ code: 'SKILL-SEISMO', level: 4, years: 8 }],
      comp: { code: 'COMP-SEISMOLOGY', level: 4 },
    },
    {
      email: 'rakesh.m@imd.gov.in',
      firstName: 'Rakesh',
      lastName: 'Meena',
      deptCode: 'HYDRO',
      designation: 'Technical Officer (Hydrometric Stations)',
      bio: 'Maintaining automated rain gauge (ARG) networks and telemetry links across major river catchments.',
      interests: ['Hydrology', 'Telemetry', 'Sensor Maintenance'],
      profileCompletion: 70,
      skills: [{ code: 'SKILL-AWS', level: 3, years: 5 }],
      comp: { code: 'COMP-INSTRUMENTATION', level: 2 },
    },
    {
      email: 'pooja.s@imd.gov.in',
      firstName: 'Pooja',
      lastName: 'Sharma',
      deptCode: 'INSTR',
      designation: 'Scientific Assistant (Pressure & Temp Standards)',
      bio: 'Performing laboratory calibration for national working standard barometers and meteorological sensors.',
      interests: ['Metrology', 'Sensor Calibration', 'WMO Standards'],
      profileCompletion: 80,
      skills: [{ code: 'SKILL-AWS', level: 3, years: 4 }],
      comp: { code: 'COMP-INSTRUMENTATION', level: 3 },
    },
    {
      email: 'sandeep.y@imd.gov.in',
      firstName: 'Sandeep',
      lastName: 'Yadav',
      deptCode: 'NWFC',
      designation: 'Meteorologist Grade-II (Aviation Forecasting)',
      bio: 'Issuing Aerodrome Routine Meteorological Reports (METAR) and Terminal Aerodrome Forecasts (TAF).',
      interests: ['Aviation Weather', 'Terminal Aerodrome Forecasts', 'Fog Prediction'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-SYNOP', level: 3, years: 5 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 3 },
    },
    {
      email: 'debolina.b@imd.gov.in',
      firstName: 'Debolina',
      lastName: 'Banerjee',
      deptCode: 'NWP',
      designation: 'Scientist "B" (Satellite Data Assimilation)',
      bio: 'Assimilating INSAT and NOAA microwave radiance observations into regional operational NWP runs.',
      interests: ['Data Assimilation', 'Numerical Modeling', 'Atmospheric Physics'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-WRF', level: 3, years: 4 }, { code: 'SKILL-INSAT', level: 3, years: 3 }],
      comp: { code: 'COMP-NWP-MODELING', level: 3 },
    },
    {
      email: 'naveen.c@imd.gov.in',
      firstName: 'Naveen',
      lastName: 'Chand',
      deptCode: 'RADAR',
      designation: 'Electronics & Telecom Engineer (DWR Systems)',
      bio: 'Handling high-power klystron transmitters and radar antenna positioning systems across western coastal DWRs.',
      interests: ['Radar Hardware', 'Microwave Telemetry', 'Signal Processing'],
      profileCompletion: 75,
      skills: [{ code: 'SKILL-DWR', level: 3, years: 4 }],
      comp: { code: 'COMP-RADAR-MET', level: 2 },
    },
    {
      email: 'archana.p@imd.gov.in',
      firstName: 'Archana',
      lastName: 'Pillai',
      deptCode: 'SATMET',
      designation: 'Scientist "B" (Cyclone Intensity & Dvorak)',
      bio: 'Specialized in applying the Advanced Dvorak Technique (ADT) to monitor tropical cyclones in the Bay of Bengal.',
      interests: ['Tropical Cyclones', 'Satellite Meteorology', 'Dvorak Technique'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-INSAT', level: 4, years: 5 }, { code: 'SKILL-SYNOP', level: 3, years: 4 }],
      comp: { code: 'COMP-SAT-MET', level: 3 },
    },
    {
      email: 'subhashree.p@imd.gov.in',
      firstName: 'Subhashree',
      lastName: 'Patnaik',
      deptCode: 'CRS',
      designation: 'Research Associate (CMIP6 Regional Projections)',
      bio: 'Analyzing regional climate change scenarios for the Indian sub-continent under various Shared Socioeconomic Pathways (SSPs).',
      interests: ['Climate Change', 'Regional Climate Modeling', 'NetCDF Analysis'],
      profileCompletion: 70,
      skills: [{ code: 'SKILL-CDO', level: 3, years: 3 }],
      comp: { code: 'COMP-CLIMATE-SCI', level: 2 },
    },
    {
      email: 'karthik.r@incois.gov.in',
      firstName: 'Karthik',
      lastName: 'Raja',
      deptCode: 'INCOIS',
      designation: 'Technical Officer (Coastal High-Frequency Radar)',
      bio: 'Calibrating and monitoring coastal High-Frequency (HF) radar arrays measuring ocean surface currents.',
      interests: ['HF Radar', 'Ocean Currents', 'Marine Technology'],
      profileCompletion: 75,
      skills: [{ code: 'SKILL-WAVE', level: 3, years: 4 }],
      comp: { code: 'COMP-OCEAN-SCI', level: 2 },
    },
    {
      email: 'bhaskar.h@imd.gov.in',
      firstName: 'Bhaskar',
      lastName: 'Hazarika',
      deptCode: 'NCS',
      designation: 'Scientific Assistant (Northeast Seismic Array)',
      bio: 'Managing broadband seismographs in Northeast India and real-time seismic event identification.',
      interests: ['Seismology', 'Northeast Seismicity', 'Phase Picking'],
      profileCompletion: 80,
      skills: [{ code: 'SKILL-SEISMO', level: 3, years: 3 }],
      comp: { code: 'COMP-SEISMOLOGY', level: 3 },
    },
    {
      email: 'sunita.r@imd.gov.in',
      firstName: 'Sunita',
      lastName: 'Rathod',
      deptCode: 'HYDRO',
      designation: 'Scientist "B" (Hydro-meteorological Modeling)',
      bio: 'Simulating river basin hydrographs and coupling numerical rain forecasts with hydrologic routing models.',
      interests: ['Hydro-modeling', 'Flood Inundation', 'Catchment Analysis'],
      profileCompletion: 85,
      skills: [{ code: 'SKILL-HYDRO', level: 3, years: 4 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 2 },
    },
    {
      email: 'chetan.s@imd.gov.in',
      firstName: 'Chetan',
      lastName: 'Solanki',
      deptCode: 'INSTR',
      designation: 'Junior Engineer (ARG Satellite Telemetry)',
      bio: 'Field operations specialist installing solar-powered dataloggers and satellite transmitter antennas.',
      interests: ['Field Instrumentation', 'Solar Power Systems', 'Telemetry'],
      profileCompletion: 65,
      skills: [{ code: 'SKILL-AWS', level: 2, years: 2 }],
      comp: { code: 'COMP-INSTRUMENTATION', level: 2 },
    },
    {
      email: 'manisha.t@imd.gov.in',
      firstName: 'Manisha',
      lastName: 'Tiwari',
      deptCode: 'NWFC',
      designation: 'Scientist "B" (Severe Convective Storms)',
      bio: 'Specialist in thunderstorm dynamic indices (CAPE, CIN, Bulk Shear) and national thunderstorm advisories.',
      interests: ['Severe Thunderstorms', 'Synoptic Analysis', 'Nowcasting'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-SYNOP', level: 4, years: 5 }, { code: 'SKILL-DWR', level: 3, years: 3 }],
      comp: { code: 'COMP-SYNOPTIC-MET', level: 4 },
    },
    {
      email: 'rohit.m@imd.gov.in',
      firstName: 'Rohitashva',
      lastName: 'Mallick',
      deptCode: 'NWP',
      designation: 'Project Scientist (Atmospheric HPC Clusters)',
      bio: 'Optimizing parallel MPI scalability and Lustre filesystem I/O for 12-kilometer global forecast runs.',
      interests: ['Supercomputing', 'MPI Parallelization', 'Atmospheric Modeling'],
      profileCompletion: 80,
      skills: [{ code: 'SKILL-WRF', level: 3, years: 4 }],
      comp: { code: 'COMP-NWP-MODELING', level: 3 },
    },
    {
      email: 'divya.b@incois.gov.in',
      firstName: 'Divya',
      lastName: 'Bharathi',
      deptCode: 'INCOIS',
      designation: 'Scientist "B" (Tsunami Inundation Simulation)',
      bio: 'Running real-time TUNAMI-N2 hydrodynamic models and generating rapid tsunami arrival time coastal bulletins.',
      interests: ['Tsunami Early Warning', 'Inundation Modeling', 'Ocean Hazard'],
      profileCompletion: 90,
      skills: [{ code: 'SKILL-WAVE', level: 4, years: 5 }],
      comp: { code: 'COMP-OCEAN-SCI', level: 4 },
    },
    {
      email: 'nilamber.p@imd.gov.in',
      firstName: 'Nilamber',
      lastName: 'Pandey',
      deptCode: 'NCS',
      designation: 'Scientific Assistant (Hypocenter Inversion)',
      bio: 'Handling SEISAN and NonLinLoc automated hypocentral location routines for immediate public earthquake bulletins.',
      interests: ['Hypocenter Determination', 'Seismic Data Formats', 'Waveform Picking'],
      profileCompletion: 75,
      skills: [{ code: 'SKILL-SEISMO', level: 3, years: 3 }],
      comp: { code: 'COMP-SEISMOLOGY', level: 2 },
    },
  ];

  const seededTrainees: any[] = [];
  for (const t of traineesRaw) {
    const trainee = await prisma.user.create({
      data: {
        organizationId: org.id,
        departmentId: deptMap.get(t.deptCode),
        email: t.email,
        passwordHash: commonPasswordHash,
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        emailVerified: true,
        traineeProfile: {
          create: {
            designation: t.designation,
            bio: t.bio,
            interests: t.interests,
            profileCompletion: t.profileCompletion,
          },
        },
      },
      include: { traineeProfile: true },
    });

    // Seed User Skills
    for (const s of t.skills) {
      await prisma.userSkill.create({
        data: {
          userId: trainee.id,
          skillId: skillMap.get(s.code)!,
          proficiencyLevel: s.level,
          yearsExperience: s.years,
          source: SkillSource.PROFILE,
        },
      });
    }

    // Seed Baseline User Competency
    if (t.comp) {
      await prisma.userCompetency.create({
        data: {
          userId: trainee.id,
          competencyId: compMap.get(t.comp.code)!,
          currentLevel: t.comp.level,
          confidenceScore: 0.88,
          lastAssessedAt: new Date(),
          source: CompetencySource.ASSESSMENT,
        },
      });
    }

    seededTrainees.push(trainee);
  }

  // 9. Courses (8 Comprehensive MoES / IMD Domain Courses)
  console.log('📚 Creating 8 MoES/IMD Domain Courses with Modules & Lessons...');

  // Course 1: Operational Weather Forecasting & Synoptic Analysis
  const course1 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer1.id,
      title: 'Operational Weather Forecasting & Synoptic Analysis',
      slug: 'synoptic-weather-forecasting-analysis',
      description: 'Master operational synoptic chart analysis, tropical cyclogenesis forecasting, monsoon dynamics, and national severe weather warning protocols.',
      category: 'Synoptic Meteorology',
      difficulty: CourseDifficulty.INTERMEDIATE,
      durationMinutes: 240,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Surface & Upper-Air Synoptic Observations',
            description: 'Standard WMO synoptic codes, station plotting, and isobaric constant pressure chart analysis.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'WMO Synoptic Codes (SYNOP/TEMP) and Plotting Models',
                  description: 'Comprehensive walkthrough of reading and decoding surface SYNOP messages and radiosonde TEMP charts.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 25,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Comprehensive technical guide detailing WMO Section 0 to 5 decoding for surface land stations, ships, and upper air soundings.',
                },
                {
                  title: 'Constant Pressure Chart Analysis: 850hPa, 500hPa, and 200hPa',
                  description: 'Step-by-step diagnostic analysis of geopotential heights, thermal advection, and upper tropospheric jet streaks.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 35,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/synoptic-chart-analysis.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 2: Monsoon Dynamics & Tropical Synoptic Systems',
            description: 'Mechanisms governing the Southwest and Northeast Monsoons, low-pressure areas, and depression stages.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Southwest Monsoon Onset, Progression, and Break Phases',
                  description: 'Synoptic indicators of monsoon onset over Kerala, ITCZ shifts, and diagnostic features of monsoon breaks.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 45,
                  orderIndex: 1,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/monsoon-dynamics.mp4',
                },
                {
                  title: 'Tropical Depressions and Cyclogenesis in the North Indian Ocean',
                  description: 'Sea surface temperatures, vertical wind shear, and mid-tropospheric cyclonic vortex intensification.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 45,
                  orderIndex: 2,
                  content: 'Detailed treatise covering cyclogenesis criteria in the Bay of Bengal and Arabian Sea according to IMD SOP standards.',
                },
              ],
            },
          },
          {
            title: 'Module 3: Severe Weather Forecasting Techniques',
            description: 'Procedures for anticipating high-impact weather hazards across different Indian seasons.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Western Disturbances and Extra-Tropical Interactions',
                  description: 'Upper-air trough dynamics originating over the Mediterranean, inducing snowfall and rainfall over North India.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 40,
                  orderIndex: 1,
                  content: 'Standard operating procedures for forecasting Western Disturbances, associated cold waves, and dense fog events.',
                },
                {
                  title: 'Severe Convective Storms: Squall Lines, Nor’westers & Heatwaves',
                  description: 'Thermodynamic indices for predicting severe pre-monsoon convective outbreaks and criteria for national heatwave warnings.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 50,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/severe-convection.mp4',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-SYNOPTIC-MET')!, targetLevel: 3 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 2: Numerical Weather Prediction (NWP): Modeling & Operational Forecasting
  const course2 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer2.id,
      title: 'Numerical Weather Prediction (NWP): Modeling & Operational Forecasting',
      slug: 'numerical-weather-prediction-modeling',
      description: 'In-depth coverage of atmospheric primitive equations, numerical discretization, WRF-ARW configuration, data assimilation, and model verification.',
      category: 'Atmospheric Modeling',
      difficulty: CourseDifficulty.ADVANCED,
      durationMinutes: 300,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Atmospheric Dynamics & Governing Equations',
            description: 'Conservation laws, hydrostatic vs non-hydrostatic formulation, and coordinate transformations.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Primitive Equations & Hydrostatic vs Non-Hydrostatic Approximations',
                  description: 'Mathematical derivation of continuity, momentum, thermodynamic energy, and moisture conservation equations.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 35,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Mathematical formulation of primitive equations in sigma and hybrid pressure coordinates.',
                },
                {
                  title: 'Grid Discretization, Finite Differences, and Spectral Transforms',
                  description: 'Arakawa grid staggering (A-E), time stepping schemes (Runge-Kutta 3rd order), and spectral decomposition.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 40,
                  orderIndex: 2,
                  content: 'Analysis of numerical dispersion, Courant-Friedrichs-Lewy (CFL) stability condition, and computational modes.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Operational Models at MoES: WRF & Global GFS/NCUM',
            description: 'Practical deployment of regional mesoscale and global atmospheric prediction models.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Configuration and Physics Parameterization of WRF-ARW',
                  description: 'Cumulus schemes (Kain-Fritsch, Tiedtke), microphysics (WSM6, Thompson), and planetary boundary layer options (YSU, MYJ).',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 55,
                  orderIndex: 1,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/wrf-physics.mp4',
                },
                {
                  title: 'Global Ensemble Prediction System (EPS) & Probabilistic Forecasting',
                  description: 'Singular vectors, ensemble transform Kalman filter (ETKF), and generating probabilistic strike probabilities.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 50,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/ensemble-eps.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 3: Data Assimilation & Model Verification',
            description: 'Integrating observational data streams and calculating standardized statistical forecast skill metrics.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: '3D-Var and 4D-Var Assimilation of Satellite and Radar Radiances',
                  description: 'Minimization of cost function, background error covariance matrix (B-matrix), and forward radiative transfer models.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 60,
                  orderIndex: 1,
                  content: 'Mathematical formulations of variational data assimilation for operational atmospheric analysis.',
                },
                {
                  title: 'Forecast Skill Metrics: RMSE, ETS, ROC Curves, and Taylor Diagrams',
                  description: 'Equitable Threat Score (ETS), Brier Score, Continuous Ranked Probability Score (CRPS), and Taylor diagrams.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 60,
                  orderIndex: 2,
                  content: 'Official WMO verification standards for quantitative precipitation and thermal forecast evaluation.',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-NWP-MODELING')!, targetLevel: 4 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Prerequisite: Course 2 requires Course 1
  await prisma.coursePrerequisite.create({
    data: {
      courseId: course2.id,
      prerequisiteCourseId: course1.id,
    },
  });

  // Course 3: Doppler Weather Radar (DWR) Operations & Convective Nowcasting
  const course3 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer3.id,
      title: 'Doppler Weather Radar (DWR) Operations & Convective Nowcasting',
      slug: 'dwr-operations-convective-nowcasting',
      description: 'Operational training in Doppler Weather Radar signal processing, dual-polarization moments, and real-time severe weather nowcasting.',
      category: 'Radar Meteorology',
      difficulty: CourseDifficulty.INTERMEDIATE,
      durationMinutes: 210,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Radar Fundamentals & Signal Processing',
            description: 'Radar equation, pulse repetition frequency, maximum unambiguous range, and Doppler dilemma.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'S-Band, C-Band, and X-Band Radars: Pulse Repetition & Nyquist Velocity',
                  description: 'Operating principles of meteorological radar wavelengths and velocity aliasing resolution methods.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 30,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Technical overview of microwave radar frequencies and Doppler signal processing fundamentals.',
                },
                {
                  title: 'Reflectivity Factor (Z), Attenuation, and Beam Propagation Artifacts',
                  description: 'Standard refraction, super-refraction, ducting, ground clutter, and anomalous propagation identification.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 30,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/radar-reflectivity.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 2: Dual-Polarization Radar Products',
            description: 'Understanding dual-polarimetric variables and automated hydrometeor classification algorithms.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Differential Reflectivity (ZDR) and Specific Differential Phase (KDP)',
                  description: 'Physical interpretation of raindrop oblateness, orientation, and immune phase measurements in heavy precipitation.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 40,
                  orderIndex: 1,
                  content: 'Theoretical and practical guide to polarimetric radar moments ZDR, KDP, and cross-correlation coefficient RhoHV.',
                },
                {
                  title: 'Hydrometeor Classification (HCA): Hail, Graupel, Heavy Rain Detection',
                  description: 'Fuzzy-logic algorithms for identifying giant hail, bright bands (melting layer), and non-meteorological echoes.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 35,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/radar-hca.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 3: Operational Nowcasting of Severe Thunderstorms',
            description: 'Detecting mesocyclones, bow echoes, and generating standardized 3-hour nowcast alerts.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Mesocyclone Signatures, Hook Echoes, and Microburst Detection',
                  description: 'Radial velocity couplet analysis, storm top divergence, and downburst precursor signatures.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 1,
                  content: 'Diagnostic manual for detecting tornadic vortex signatures and downburst signatures in operational DWR displays.',
                },
                {
                  title: 'IMD Thunderstorm Nowcasting Protocols & Warning Dissemination',
                  description: 'Formatting color-coded station nowcasts and coordinating with State Disaster Management Authorities (SDMAs).',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 40,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/nowcast-protocol.mp4',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-RADAR-MET')!, targetLevel: 3 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 4: Satellite Meteorology: INSAT-3D/3DR & Remote Sensing
  const course4 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer4.id,
      title: 'Satellite Meteorology: INSAT-3D/3DR & Remote Sensing Applications',
      slug: 'satellite-meteorology-insat-applications',
      description: 'Operational applications of Indian geostationary meteorological satellites, multispectral imagery interpretation, and cyclone tracking.',
      category: 'Satellite Meteorology',
      difficulty: CourseDifficulty.BEGINNER,
      durationMinutes: 180,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Meteorological Satellites & Orbits',
            description: 'Characteristics of geostationary and polar-orbiting orbits and sensor payloads.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Geostationary vs Polar Orbiting Satellites: INSAT-3D/3DR & Megha-Tropiques',
                  description: 'Spatial and temporal resolution characteristics of geostationary imagers and low-Earth orbit sounders.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 25,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Overview of Indian Earth observation satellite constellations and orbital mechanics.',
                },
                {
                  title: 'Spectral Bands: Visible, Thermal Infrared, and Water Vapor Channels',
                  description: 'Physical principles of radiative emission, absorption bands, and channel brightness temperatures.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 25,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/sat-spectral-bands.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 2: Cloud Imagery & Pattern Recognition',
            description: 'Techniques for identifying synoptic features and tropical cyclone structure.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Identification of Synoptic Clouds, Jet Streams, and Fog Patterns',
                  description: 'Night-time microphysics RGB composites, radiation fog detection over Indo-Gangetic Plains, and cirrus plumes.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 35,
                  orderIndex: 1,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/sat-cloud-patterns.mp4',
                },
                {
                  title: 'Dvorak Technique for Tropical Cyclone Intensity Estimation',
                  description: 'Curved band pattern, shear pattern, and eye pattern classification rules for estimating central pressure and T-numbers.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 30,
                  orderIndex: 2,
                  content: 'Comprehensive reference manual on applying the Dvorak Tropical Cyclone Intensity Analysis in the Indian Ocean.',
                },
              ],
            },
          },
          {
            title: 'Module 3: Quantitative Geophysical Products',
            description: 'Derived atmospheric products supporting operational forecasting.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Atmospheric Motion Vectors (AMVs) and Outgoing Longwave Radiation (OLR)',
                  description: 'Tracking cloud tracers in infrared and water vapor channels to calculate tropospheric wind fields.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 1,
                  content: 'Operational methodology for generating AMVs and monitoring convection using OLR thresholds.',
                },
                {
                  title: 'Quantitative Precipitation Estimation (QPE) and Hydro-Estimator',
                  description: 'Satellite rain rate algorithms, cloud-top cooling rates, and calibration with ground observatories.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 30,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/sat-qpe.mp4',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-SAT-MET')!, targetLevel: 2 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 5: Climate Data Analysis & Climate Change Projections
  const course5 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer1.id,
      title: 'Climate Data Analysis & Climate Change Projections',
      slug: 'climate-data-analysis-projections',
      description: 'Techniques for processing climatological datasets, computing extreme weather indices, managing NetCDF formats, and analyzing IPCC CMIP6 models.',
      category: 'Climate Science',
      difficulty: CourseDifficulty.ADVANCED,
      durationMinutes: 240,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Climatological Datasets & IMD Gridded Products',
            description: 'High-resolution surface temperature and precipitation gridded series and quality homogenization.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'High-Resolution Daily Gridded Rainfall and Temperature Datasets',
                  description: 'Shepard interpolation method, station network density, and standard format structures for IMD 0.25x0.25 grids.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 35,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Technical description of the IMD high-resolution gridded climatological series from 1901 to present.',
                },
                {
                  title: 'Quality Control, Homogenization, and Missing Data Imputation',
                  description: 'Standard normal homogeneity test (SNHT), artificial break detection, and statistical kriging imputation.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 2,
                  content: 'Statistical procedures for homogenizing century-scale meteorological station time series.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Climate Extreme Indices & Trend Analysis',
            description: 'Quantifying changes in warm spells, heavy precipitation, and droughts.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'ETCCDI Extreme Indices Calculation (Mann-Kendall & Sen’s Slope)',
                  description: 'Calculation of RX1day, R95p, SU25, and CDD indices and non-parametric monotonic trend significance testing.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 40,
                  orderIndex: 1,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/climate-indices.mp4',
                },
                {
                  title: 'Handling NetCDF, GRIB2, and HDF5 Files with CDO & xarray',
                  description: 'Command-line CDO operators for spatial sub-setting, seasonal averaging, regridding, and Python xarray dataset indexing.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 40,
                  orderIndex: 2,
                  content: 'Hands-on practical cheat-sheet for Climate Data Operators (CDO) and multidimensional climate analysis.',
                },
              ],
            },
          },
          {
            title: 'Module 3: CMIP6 Projections & Regional Downscaling',
            description: 'Evaluating future climate scenarios over the Indian monsoon region.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'IPCC Shared Socioeconomic Pathways (SSPs) & Multi-Model Ensembles',
                  description: 'Understanding SSP1-2.6, SSP2-4.5, and SSP5-8.5 radiative forcing pathways and model ensemble spreads.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 45,
                  orderIndex: 1,
                  content: 'Analysis of projected temperature and monsoon precipitation changes across Indian agro-climatic zones.',
                },
                {
                  title: 'CORDEX South Asia High-Resolution Regional Climate Downscaling',
                  description: 'Dynamical and statistical downscaling techniques to capture regional orographic rainfall signatures.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 45,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/cordex-downscaling.mp4',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-CLIMATE-SCI')!, targetLevel: 4 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 6: Ocean State Forecasting & Tsunami Early Warning Systems (INCOIS)
  const course6 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer5.id,
      title: 'Ocean State Forecasting & Tsunami Early Warning Systems',
      slug: 'ocean-state-forecasting-tsunami-warning',
      description: 'Operational training in ocean wave modeling (WAVEWATCH-III), coastal storm surge advisories, and the Indian Tsunami Early Warning Centre protocols.',
      category: 'Ocean Sciences',
      difficulty: CourseDifficulty.INTERMEDIATE,
      durationMinutes: 210,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Ocean State Dynamics & Observation Systems',
            description: 'Offshore observational infrastructure and numerical wave prediction.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Moored Ocean Buoy Networks, Argo Floats, and Coastal Wave Rider Buoys',
                  description: 'Real-time telemetry of wave height, period, surface winds, and subsurface ocean temperature profiles.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 30,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Comprehensive overview of the INCOIS-NIOT ocean observation network in the Arabian Sea and Bay of Bengal.',
                },
                {
                  title: 'Numerical Wave Modeling: WAVEWATCH-III and SWAN Implementations',
                  description: 'Wave action density equations, wind-wave generation, nonlinear quadruplet interactions, and shallow-water shoaling.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 30,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/ocean-wave-modeling.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 2: Indian Tsunami Early Warning Centre (ITEWC) Architecture',
            description: 'Undersea earthquake detection, hydrodynamic simulations, and coastal arrival advisories.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Undersea Earthquakes, Bottom Pressure Recorders (BPR), and Tide Gauges',
                  description: 'Discriminating tsunamigenic seismic events using deep-ocean Bottom Pressure Recorders and real-time coastal tide stations.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 40,
                  orderIndex: 1,
                  content: 'Operational architecture and emergency communication mechanisms of the Indian Tsunami Early Warning Centre (ITEWC).',
                },
                {
                  title: 'Real-time Tsunami Travel Time & Inundation Simulation Modeling',
                  description: 'TUNAMI-N2 shallow water equation solving, run-up height calculations, and generation of Coastal Threat Levels.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 40,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/tsunami-modeling.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 3: Coastal Hazards & Storm Surge Advisories',
            description: 'Forecasting cyclone wind-driven surges and marine safety alerts.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Cyclone-Induced Storm Surge Forecasting & Inland Inundation',
                  description: 'Coupling IIT-Delhi and INCOIS storm surge models with bathymetric data to forecast astronomical tide interactions.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 35,
                  orderIndex: 1,
                  content: 'Standard operating manual for calculating peak surge heights and inland flooding limits during landfall.',
                },
                {
                  title: 'High Wave Warnings & Fishermen Advisory Bulletins Dissemination',
                  description: 'Disseminating Potential Fishing Zone (PFZ) and Ocean State Forecast (OSF) advisories via NavIC and coastal VHF.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 2,
                  content: 'Protocols for issuing ocean hazard warnings to fishermen, merchant vessels, and port authorities.',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-OCEAN-SCI')!, targetLevel: 3 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 7: Seismological Data Processing & Earthquake Hazard Monitoring (NCS)
  const course7 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer2.id,
      title: 'Seismological Data Processing & Earthquake Hazard Monitoring',
      slug: 'seismological-data-processing-earthquake-hazard',
      description: 'Operation of the National Seismological Network, phase picking, hypocenter determination, seismic microzonation, and earthquake early warnings.',
      category: 'Seismology',
      difficulty: CourseDifficulty.INTERMEDIATE,
      durationMinutes: 200,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: National Seismological Network (NSN) Infrastructure',
            description: 'Broadband seismographs, strong-motion accelerographs, and real-time VSAT communication.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Broadband Seismographs, Accelerographs, and VSAT Telemetry',
                  description: 'Three-component ground motion sensing, digitizer dynamic range (24-bit), and low-latency network telemetry.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 25,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Technical specifications of the Indian National Seismological Network station setup and sensor vault construction.',
                },
                {
                  title: 'Seismic Signal Formats: MiniSEED, SAC, and SEISAN Data Standards',
                  description: 'Time-series seismic encoding, instrument response pole-zero removal, and format conversion utilities.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 25,
                  orderIndex: 2,
                  content: 'Reference guide on standard seismological file formats and instrument response correction.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Earthquake Waveform Analysis & Hypocenter Location',
            description: 'Travel time curves, arrival phase picking, and focal mechanism solutions.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'P-wave & S-wave Phase Picking and Travel Time Inversion',
                  description: 'Signal-to-noise ratio optimization, impulsive vs emergent arrivals, and Wadati diagrams for origin time determination.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 40,
                  orderIndex: 1,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/seismic-phase-picking.mp4',
                },
                {
                  title: 'Determination of Magnitude (ML, Mw) and Focal Mechanism Solutions',
                  description: 'Richter local magnitude, moment magnitude (Mw) from spectral analysis, and double-couple fault plane beachball plots.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 40,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/focal-mechanisms.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 3: Seismic Hazard Microzonation & Early Warning',
            description: 'Assessing site amplification and automated real-time earthquake alarms.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Probabilistic Seismic Hazard Analysis (PSHA) for Critical Infrastructure',
                  description: 'Gutenberg-Richter recurrence relations, ground motion prediction equations (GMPEs), and peak ground acceleration (PGA) mapping.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 35,
                  orderIndex: 1,
                  content: 'Guidelines for urban seismic microzonation and development of localized earthquake hazard maps in India.',
                },
                {
                  title: 'Earthquake Early Warning (EEW) Algorithms and Rapid Response',
                  description: 'P-wave threshold detection, rapid hypocentral estimation, and triggering secondary wave automated shutdowns.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 2,
                  content: 'Operational implementation of Earthquake Early Warning Systems in the Himalayan tectonic belt.',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-SEISMOLOGY')!, targetLevel: 3 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // Course 8: Meteorological Instrumentation, AWS & Surface Observatories
  const course8 = await prisma.course.create({
    data: {
      organizationId: org.id,
      trainerId: trainer3.id,
      title: 'Meteorological Instrumentation, AWS & Surface Observatories',
      slug: 'meteorological-instrumentation-aws-maintenance',
      description: 'Standard maintenance, precision calibration, and telemetry protocols for Automated Weather Stations (AWS) and surface sensor networks.',
      category: 'Observational Instruments',
      difficulty: CourseDifficulty.BEGINNER,
      durationMinutes: 180,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      modules: {
        create: [
          {
            title: 'Module 1: Surface Meteorological Sensors & Calibration',
            description: 'Operating principles of primary surface weather sensing transducers.',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Platinum Resistance Thermometers, Capacitive Hygrometers & Barometers',
                  description: 'PT100 sensor linearity, digital barometer temperature compensation, and Stevenson screen ventilation requirements.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 25,
                  orderIndex: 1,
                  isPreview: true,
                  content: 'Laboratory calibration standards and drift tolerance specifications for temperature, humidity, and atmospheric pressure sensors.',
                },
                {
                  title: 'Tipping Bucket Rain Gauges & Optical Disdrometer Calibration',
                  description: '0.5mm and 0.1mm bucket volume adjustments, rainfall rate undercatch corrections, and drop size distribution principles.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 30,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/rain-gauge-calib.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 2: Automatic Weather Stations (AWS) & ARG Networks',
            description: 'Datalogger electronics, power budget, and satellite data transmitter configurations.',
            orderIndex: 2,
            lessons: {
              create: [
                {
                  title: 'Datalogger Programming, Solar Power Systems & Sensor Interfacing',
                  description: 'Configuring sampling rates, analog-to-digital conversions, solar panel sizing, and deep-cycle battery maintenance.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 35,
                  orderIndex: 1,
                  content: 'Field technician handbook for AWS datalogger firmware setup and sensor wiring schematics.',
                },
                {
                  title: 'GPRS/INSAT Satellite Telemetry for High-Frequency Data Transmission',
                  description: 'Configuring Data Collection Platforms (DCP) communicating with INSAT transponders on allocated 400 MHz channels.',
                  contentType: LessonContentType.VIDEO,
                  durationMinutes: 30,
                  orderIndex: 2,
                  resourceUrl: 'https://cdn.capacityconnect.gov.in/videos/aws-telemetry.mp4',
                },
              ],
            },
          },
          {
            title: 'Module 3: Data Quality Control & Maintenance Protocols',
            description: 'Ensuring continuous high-integrity observation feeds to forecasting centers.',
            orderIndex: 3,
            lessons: {
              create: [
                {
                  title: 'Routine Preventative Maintenance, Exposure Standards & WMO Siting',
                  description: 'Obstacle distance ratios, grass cover maintenance, lightning protection earthing, and routine sensor cleaning.',
                  contentType: LessonContentType.ARTICLE,
                  durationMinutes: 30,
                  orderIndex: 1,
                  content: 'Official checklist for bi-annual preventive maintenance of remote automated weather stations.',
                },
                {
                  title: 'Real-time Automated Quality Control (Range, Step, and Persistence Checks)',
                  description: 'Automated ingestion filters rejecting physically impossible sensor spikes, flatline signals, and spatial neighbor inconsistencies.',
                  contentType: LessonContentType.DOCUMENT,
                  durationMinutes: 30,
                  orderIndex: 2,
                  content: 'Algorithm rules for automated real-time quality control of surface meteorological observations.',
                },
              ],
            },
          },
        ],
      },
      courseCompetencies: {
        create: [{ competencyId: compMap.get('COMP-INSTRUMENTATION')!, targetLevel: 2 }],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // 10. Enrollments & Progress across the 32 Trainees
  console.log('🚀 Creating realistic Trainee Course Enrollments & Progress...');
  const allCourses = [course1, course2, course3, course4, course5, course6, course7, course8];

  // Helper to enroll a trainee in a course with specific progress
  async function enrollTrainee(user: any, course: any, status: EnrollmentStatus, progress: number) {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status,
        progressPercentage: progress,
        enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        startedAt: progress > 0 ? new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) : null,
        completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
    });

    // Mark lessons completed proportionally
    const lessons = course.modules.flatMap((m: any) => m.lessons);
    const completedCount = Math.round((progress / 100) * lessons.length);

    for (let i = 0; i < completedCount && i < lessons.length; i++) {
      await prisma.lessonProgress.create({
        data: {
          userId: user.id,
          lessonId: lessons[i].id,
          enrollmentId: enrollment.id,
          completed: true,
          progressPercentage: 100.0,
          startedAt: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - (19 - i) * 24 * 60 * 60 * 1000),
        },
      });
    }

    return enrollment;
  }

  // Trainee 1 (Jane Doe - user@enterprise.com)
  const jane = seededTrainees[0];
  await enrollTrainee(jane, course1, EnrollmentStatus.COMPLETED, 100);
  await enrollTrainee(jane, course4, EnrollmentStatus.IN_PROGRESS, 65);
  await enrollTrainee(jane, course3, EnrollmentStatus.ENROLLED, 0);

  // Enroll other trainees with diverse authentic paths
  await enrollTrainee(seededTrainees[1], course1, EnrollmentStatus.IN_PROGRESS, 80);
  await enrollTrainee(seededTrainees[1], course2, EnrollmentStatus.IN_PROGRESS, 30);

  await enrollTrainee(seededTrainees[2], course2, EnrollmentStatus.COMPLETED, 100);
  await enrollTrainee(seededTrainees[2], course5, EnrollmentStatus.IN_PROGRESS, 50);

  await enrollTrainee(seededTrainees[3], course3, EnrollmentStatus.IN_PROGRESS, 70);
  await enrollTrainee(seededTrainees[3], course8, EnrollmentStatus.IN_PROGRESS, 40);

  await enrollTrainee(seededTrainees[4], course4, EnrollmentStatus.COMPLETED, 100);
  await enrollTrainee(seededTrainees[4], course1, EnrollmentStatus.IN_PROGRESS, 45);

  await enrollTrainee(seededTrainees[5], course5, EnrollmentStatus.IN_PROGRESS, 60);
  await enrollTrainee(seededTrainees[5], course8, EnrollmentStatus.IN_PROGRESS, 80);

  await enrollTrainee(seededTrainees[6], course6, EnrollmentStatus.IN_PROGRESS, 85);
  await enrollTrainee(seededTrainees[6], course5, EnrollmentStatus.IN_PROGRESS, 40);

  await enrollTrainee(seededTrainees[7], course7, EnrollmentStatus.IN_PROGRESS, 75);
  await enrollTrainee(seededTrainees[7], course2, EnrollmentStatus.IN_PROGRESS, 20);

  await enrollTrainee(seededTrainees[8], course1, EnrollmentStatus.COMPLETED, 100);
  await enrollTrainee(seededTrainees[8], course8, EnrollmentStatus.IN_PROGRESS, 60);

  await enrollTrainee(seededTrainees[9], course8, EnrollmentStatus.COMPLETED, 100);
  await enrollTrainee(seededTrainees[9], course4, EnrollmentStatus.IN_PROGRESS, 30);

  // 11. Assessments, Questions & Options
  console.log('📝 Creating MoES / IMD Certification Assessments & Questions...');
  const assessment1 = await prisma.assessment.create({
    data: {
      courseId: course1.id,
      trainerId: trainer1.id,
      title: 'Synoptic Weather Analysis & Tropical Cyclogenesis Certification',
      subject: 'Synoptic Meteorology',
      assessmentType: AssessmentType.MCQ,
      durationMinutes: 45,
      passingScore: 70.0,
      status: AssessmentStatus.PUBLISHED,
      questions: {
        create: [
          {
            questionText: 'Which upper-tropospheric feature over the Tibetan Plateau is a critical diagnostic signature of the established Indian Southwest Monsoon?',
            questionType: QuestionType.SINGLE_CHOICE,
            marks: 10,
            orderIndex: 1,
            explanation: 'The Tibetan Anticyclone at 200 hPa acts as an upper-tropospheric outflow engine maintaining the Tropical Easterly Jet and southwest monsoon circulation.',
            options: {
              create: [
                { optionText: 'Tibetan Anticyclone at 200 hPa', isCorrect: true, orderIndex: 1 },
                { optionText: 'Subtropical Jet Stream at 850 hPa', isCorrect: false, orderIndex: 2 },
                { optionText: 'Aleutian Low at 500 hPa', isCorrect: false, orderIndex: 3 },
                { optionText: 'Equatorial Trough at 100 hPa', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            questionText: 'Under the standard IMD criteria, a tropical cyclonic storm is categorized as a "Severe Cyclonic Storm" when sustained maximum surface wind speeds reach which threshold?',
            questionType: QuestionType.SINGLE_CHOICE,
            marks: 10,
            orderIndex: 2,
            explanation: 'According to IMD classification, a Severe Cyclonic Storm (SCS) has sustained 3-minute wind speeds between 48 and 63 knots (89 to 117 km/h).',
            options: {
              create: [
                { optionText: '48 to 63 knots (89–117 km/h)', isCorrect: true, orderIndex: 1 },
                { optionText: '17 to 27 knots (31–49 km/h)', isCorrect: false, orderIndex: 2 },
                { optionText: '28 to 33 knots (50–61 km/h)', isCorrect: false, orderIndex: 3 },
                { optionText: '64 to 89 knots (118–165 km/h)', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            questionText: 'In constant pressure upper-air analysis, what does a region of warm thermal advection (backing or veering of geostrophic wind with height in the Northern Hemisphere) indicate?',
            questionType: QuestionType.SINGLE_CHOICE,
            marks: 10,
            orderIndex: 3,
            explanation: 'Veering of the geostrophic wind with height (clockwise rotation) indicates warm thermal advection, which is associated with large-scale synoptic ascent.',
            options: {
              create: [
                { optionText: 'Veering of wind indicates warm advection and synoptic ascent', isCorrect: true, orderIndex: 1 },
                { optionText: 'Backing of wind indicates warm advection and descent', isCorrect: false, orderIndex: 2 },
                { optionText: 'Veering of wind indicates cold advection and rapid clearing', isCorrect: false, orderIndex: 3 },
                { optionText: 'Wind direction change is purely barotropic with zero vertical motion', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
        ],
      },
    },
    include: { questions: { include: { options: true } } },
  });

  // Assessment Attempt for Jane Doe
  const attempt1 = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: assessment1.id,
      userId: jane.id,
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      submittedAt: new Date(Date.now() - 5 * 60 * 1000),
      score: 30,
      percentage: 100.0,
      passed: true,
      timeTakenSeconds: 2100,
      status: AttemptStatus.SUBMITTED,
    },
  });

  await prisma.assessmentCompetencyResult.create({
    data: {
      attemptId: attempt1.id,
      competencyId: compMap.get('COMP-SYNOPTIC-MET')!,
      score: 100.0,
      levelAchieved: 3,
    },
  });

  // 12. Skill Gap Analysis & Recommendations
  console.log('🔍 Creating MoES Skill Gap & Intelligent Recommendations...');
  // Jane Doe has Level 3 in Synoptic Meteorology, but her role pathway requires Level 4
  await prisma.skillGap.create({
    data: {
      userId: jane.id,
      competencyId: compMap.get('COMP-SYNOPTIC-MET')!,
      currentLevel: 3,
      requiredLevel: 4,
      gapLevel: 1,
      priority: GapPriority.HIGH,
      status: GapStatus.OPEN,
    },
  });

  await prisma.recommendation.create({
    data: {
      userId: jane.id,
      recommendationType: RecommendationType.COURSE,
      courseId: course3.id,
      competencyId: compMap.get('COMP-RADAR-MET')!,
      score: 0.94,
      reason: 'Recommended for Senior Forecaster role: Advance your convective nowcasting and radar skills.',
      source: RecommendationSource.RULE_ENGINE,
      status: RecommendationStatus.ACTIVE,
    },
  });

  await prisma.trainerMatch.create({
    data: {
      traineeId: jane.id,
      trainerId: trainer3.id,
      competencyId: compMap.get('COMP-RADAR-MET')!,
      matchScore: 95.0,
      matchingSkills: { matchedSkills: ['Doppler Radar Interpretation', 'Severe Convective Nowcasting'] },
      reason: 'Dr. S. K. Roy is MoES lead expert for Doppler Weather Radar operations and severe storm diagnostics.',
      source: MatchSource.RULE_ENGINE,
    },
  });

  // 13. Feedback, Announcements, Notifications & Achievements
  console.log('📢 Creating MoES Bulletins, Notifications & Achievements...');
  await prisma.feedback.create({
    data: {
      userId: jane.id,
      courseId: course1.id,
      trainerId: trainer1.id,
      rating: 5,
      comment: 'Superb operational curriculum! Practical SYNOP decoding and monsoon break diagnostics are directly applicable to NWFC shift duties.',
      status: FeedbackStatus.PUBLISHED,
    },
  });

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      createdBy: admin.id,
      title: 'MoES & IMD Annual Operational Capacity Building Drive',
      content: 'New specialized modules in NWP Data Assimilation, DWR Dual-Polarization Nowcasting, and Tsunami Simulation are now live on Capacity Connect.',
      type: AnnouncementType.GENERAL,
      status: AnnouncementStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: jane.id,
      title: 'Competency Milestone Achieved',
      message: 'Congratulations! You achieved Level 3 (Intermediate) in Synoptic Meteorology & Weather Forecasting.',
      type: NotificationType.ACHIEVEMENT,
      isRead: false,
    },
  });

  await prisma.achievement.create({
    data: {
      userId: jane.id,
      title: 'Certified Synoptic Forecaster',
      description: 'Successfully completed Operational Weather Forecasting & Synoptic Analysis with 100% test score.',
      type: AchievementType.COURSE_COMPLETION,
      metadata: { courseId: course1.id, badge: 'SYNOPTIC_METEOROLOGIST' },
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
      newValues: { status: CourseStatus.PUBLISHED, title: course1.title },
    },
  });

  // 15. Adaptive Revision Engine: MoES/IMD Curriculum DAG & Learner Profile
  console.log('🧠 Seeding Adaptive Revision Engine curriculum and prerequisites...');

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
      cooldownHours: 2,
      masteryThreshold: 85.0,
      diagnosticConfidenceThreshold: 0.40,
      maxTopicsPerSession: 5,
      maxGroupConcentration: 0.80,
      primaryGroupAllocation: 0.70,
      prerequisiteAllocation: 0.20,
      retentionAllocation: 0.10,
      isActive: true,
    },
  });

  // Competency Group 1: Atmospheric Dynamics & Thermodynamics
  const groupDynamics = await prisma.competencyGroup.create({
    data: {
      courseId: course1.id,
      name: 'Atmospheric Dynamics & Thermodynamic Diagnostics',
      description: 'Foundational atmospheric hydrostatics, lapse rates, sounding analysis, and convective instability.',
      importance: 4.5,
      orderIndex: 1,
      isActive: true,
    },
  });

  // Competency Group 2: Radar Meteorology & Severe Storm Nowcasting
  const groupRadar = await prisma.competencyGroup.create({
    data: {
      courseId: course1.id,
      name: 'Doppler Weather Radar (DWR) Operations & Velocity Analysis',
      description: 'Radar reflectivity equations, Nyquist dealiasing, radial velocity interpretation, and mesocyclone signatures.',
      importance: 5.0,
      orderIndex: 2,
      isActive: true,
    },
  });

  // Competency Group 3: Satellite Meteorology & Cyclones
  const groupSatellite = await prisma.competencyGroup.create({
    data: {
      courseId: course1.id,
      name: 'Satellite Remote Sensing & Tropical Cyclone Tracking',
      description: 'INSAT-3D/3DR multispectral analysis, Dvorak technique, and convective cloud-top cooling diagnostics.',
      importance: 4.8,
      orderIndex: 3,
      isActive: true,
    },
  });

  // Topics for Group 1
  const topicHydro = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupDynamics.id,
      code: 'ATM_HYDRO',
      name: 'Hydrostatic Balance & Hypsometric Equation',
      description: 'Vertical pressure gradient force balance against gravity, scale height, and layer thickness computation.',
      importance: 4.0,
      difficulty: 0.3,
      estimatedMinutes: 15,
      orderIndex: 1,
      isActive: true,
    },
  });

  const topicLapse = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupDynamics.id,
      code: 'ATM_LAPSE',
      name: 'Atmospheric Lapse Rates & Sounding Analysis',
      description: 'Dry adiabatic lapse rate (DALR), saturated adiabatic lapse rate (SALR), environmental lapse rates, and tephigram interpretation.',
      importance: 4.5,
      difficulty: 0.5,
      estimatedMinutes: 20,
      orderIndex: 2,
      isActive: true,
    },
  });

  const topicInstab = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupDynamics.id,
      code: 'ATM_INSTAB',
      name: 'Convective Instability & CAPE Diagnostics',
      description: 'Convective Available Potential Energy (CAPE), Convective Inhibition (CIN), Lifted Index, and deep moist convection triggers.',
      importance: 5.0,
      difficulty: 0.8,
      estimatedMinutes: 25,
      orderIndex: 3,
      isActive: true,
    },
  });

  // Topics for Group 2
  const topicRefl = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupRadar.id,
      code: 'RAD_REFL',
      name: 'Radar Reflectivity Factor & Z-R Relations',
      description: 'Rayleigh scattering, equivalent radar reflectivity factor (Z in dBZ), and Marshall-Palmer Z-R precipitation estimation.',
      importance: 4.0,
      difficulty: 0.4,
      estimatedMinutes: 15,
      orderIndex: 1,
      isActive: true,
    },
  });

  const topicDopp = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupRadar.id,
      code: 'RAD_DOPP',
      name: 'Doppler Velocity Dealiasing & Nyquist Limits',
      description: 'Pulse Repetition Frequency (PRF), maximum unambiguous velocity, and phase dealiasing algorithms.',
      importance: 5.0,
      difficulty: 0.7,
      estimatedMinutes: 20,
      orderIndex: 2,
      isActive: true,
    },
  });

  const topicMeso = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupRadar.id,
      code: 'RAD_MESO',
      name: 'Mesocyclone Vortex & Tornado Vortex Signatures',
      description: 'Rankine vortex couplet identification, rotational shear thresholds, and severe convective warning issuance.',
      importance: 5.0,
      difficulty: 0.9,
      estimatedMinutes: 25,
      orderIndex: 3,
      isActive: true,
    },
  });

  // Topics for Group 3
  const topicRad = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupSatellite.id,
      code: 'SAT_RAD',
      name: 'Radiative Transfer & Thermal IR Brightness',
      description: 'Planck radiation law, Planck inversion, atmospheric window channels, and thermal emission principles.',
      importance: 4.0,
      difficulty: 0.4,
      estimatedMinutes: 15,
      orderIndex: 1,
      isActive: true,
    },
  });

  const topicIR = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupSatellite.id,
      code: 'SAT_IR',
      name: 'INSAT-3D/3DR Multispectral Imaging & Convection',
      description: 'Thermal IR and Water Vapor channel analysis, cloud top brightness temperatures, and rapid scan diagnostics.',
      importance: 4.8,
      difficulty: 0.6,
      estimatedMinutes: 20,
      orderIndex: 2,
      isActive: true,
    },
  });

  const topicCyclone = await prisma.learningTopic.create({
    data: {
      courseId: course1.id,
      groupId: groupSatellite.id,
      code: 'SAT_CYCLONE',
      name: 'Dvorak Tropical Cyclone Intensity Estimation',
      description: 'Curved band pattern, embedded center, CDO pattern, and T-number / Current Intensity (CI) determination.',
      importance: 5.0,
      difficulty: 0.9,
      estimatedMinutes: 30,
      orderIndex: 3,
      isActive: true,
    },
  });

  // Strict Pedagogical Prerequisites (The Curriculum DAG)
  await prisma.topicPrerequisite.createMany({
    data: [
      { prerequisiteTopicId: topicHydro.id, dependentTopicId: topicLapse.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
      { prerequisiteTopicId: topicLapse.id, dependentTopicId: topicInstab.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
      { prerequisiteTopicId: topicRefl.id, dependentTopicId: topicDopp.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
      { prerequisiteTopicId: topicDopp.id, dependentTopicId: topicMeso.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
      { prerequisiteTopicId: topicRad.id, dependentTopicId: topicIR.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
      { prerequisiteTopicId: topicIR.id, dependentTopicId: topicCyclone.id, edgeWeight: 1.0, dependencyType: 'STRICT' },
    ],
  });

  // Seed sample learner profile for Jane Doe (user@enterprise.com)
  // Demonstrates: Radar group is weakest, with RAD_REFL as weak root prerequisite!
  await prisma.userTopicCompetency.createMany({
    data: [
      // Atmospheric Dynamics: moderately mastered
      { userId: jane.id, topicId: topicHydro.id, competencyScore: 82.0, confidenceScore: 0.85, stability: 14.0, retention: 0.88, forgettingRisk: 12.0 },
      { userId: jane.id, topicId: topicLapse.id, competencyScore: 78.0, confidenceScore: 0.75, stability: 10.0, retention: 0.80, forgettingRisk: 20.0 },
      { userId: jane.id, topicId: topicInstab.id, competencyScore: 70.0, confidenceScore: 0.65, stability: 7.0, retention: 0.72, forgettingRisk: 28.0 },
      // Radar Meteorology: PRIMARY WEAK GROUP with RAD_REFL as ROOT WEAKNESS
      { userId: jane.id, topicId: topicRefl.id, competencyScore: 35.0, confidenceScore: 0.35, stability: 1.5, retention: 0.30, forgettingRisk: 70.0 },
      { userId: jane.id, topicId: topicDopp.id, competencyScore: 28.0, confidenceScore: 0.25, stability: 1.0, retention: 0.25, forgettingRisk: 75.0 },
      { userId: jane.id, topicId: topicMeso.id, competencyScore: 20.0, confidenceScore: 0.20, stability: 0.8, retention: 0.20, forgettingRisk: 80.0 },
      // Satellite Meteorology: high forgetting risk
      { userId: jane.id, topicId: topicRad.id, competencyScore: 75.0, confidenceScore: 0.70, stability: 3.0, retention: 0.35, forgettingRisk: 65.0 },
      { userId: jane.id, topicId: topicIR.id, competencyScore: 72.0, confidenceScore: 0.65, stability: 2.5, retention: 0.30, forgettingRisk: 70.0 },
      { userId: jane.id, topicId: topicCyclone.id, competencyScore: 68.0, confidenceScore: 0.60, stability: 2.0, retention: 0.25, forgettingRisk: 75.0 },
    ],
  });

  // Seed error record for Jane on radar dealiasing
  await prisma.userTopicError.create({
    data: {
      userId: jane.id,
      topicId: topicDopp.id,
      errorType: 'NYQUIST_VELOCITY_ALIASING_CONFUSION',
      description: 'Confusing inbound velocity foldover with outbound environmental shear during squall line analysis',
      errorCount: 3,
      severity: 70.0,
      firstDetectedAt: new Date(Date.now() - 3 * 86400000),
      lastDetectedAt: new Date(),
    },
  });

  // Seed group aggregated competencies
  await prisma.userGroupCompetency.createMany({
    data: [
      { userId: jane.id, groupId: groupDynamics.id, groupCompetency: 76.7, groupConfidence: 0.75, groupWeakness: 23.3, groupForgettingRisk: 20.0, groupImportance: 4.5, groupDependencyImpact: 35.0, groupPriority: 25.0, weakTopicCount: 0, criticalTopicCount: 2 },
      { userId: jane.id, groupId: groupRadar.id, groupCompetency: 27.7, groupConfidence: 0.27, groupWeakness: 72.3, groupForgettingRisk: 75.0, groupImportance: 5.0, groupDependencyImpact: 85.0, groupPriority: 82.5, weakTopicCount: 3, criticalTopicCount: 3 },
      { userId: jane.id, groupId: groupSatellite.id, groupCompetency: 71.7, groupConfidence: 0.65, groupWeakness: 28.3, groupForgettingRisk: 70.0, groupImportance: 4.8, groupDependencyImpact: 40.0, groupPriority: 45.0, weakTopicCount: 1, criticalTopicCount: 2 },
    ],
  });

  console.log('✅ MoES / IMD database seeding finished successfully!');
  console.log(`- Organization: ${org.name} (${org.code})`);
  console.log(`- Super Admin: ${superAdmin.email}`);
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Departments: ${org.departments.length} MoES/IMD divisions`);
  console.log(`- Competencies: ${competencies.length} official frameworks`);
  console.log(`- Skills: ${skills.length} domain skills`);
  console.log(`- Trainers: ${trainers.length} Senior Scientists & Instructors`);
  console.log(`- Trainees: ${seededTrainees.length} MoES/IMD Scientific Officers (user@enterprise.com preserved)`);
  console.log(`- Courses: ${allCourses.length} comprehensive courses with 24 modules and 52 lessons`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
