import prisma from '../src/database/client';
import { RequirementCriticality, QuestionType, AssessmentType, AssessmentStatus, Role } from '@prisma/client';

async function seedTraineePipeline() {
  console.log('Seeding Trainee Pipeline: Roles, Role Competencies, Diagnostic Assessments, and Trainer Profiles...');

  // 1. Fetch existing competencies
  const competencies = await prisma.competency.findMany();
  const compMap = new Map<string, string>();
  for (const c of competencies) {
    compMap.set(c.name, c.id);
  }

  console.log(`Found ${competencies.length} competencies in DB.`);

  // 2. Define standard MoES / IMD Roles
  const rolesData = [
    {
      name: 'Meteorologist Grade-I (Synoptic Forecaster)',
      code: 'ROLE-MET-001',
      department: 'National Weather Forecasting Centre (NWFC)',
      description: 'Operational forecasting, synoptic chart analysis, severe weather warning issuance, and radar/satellite integration.',
      competencies: [
        { name: 'Synoptic Meteorology & Weather Forecasting', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Numerical Weather Prediction & Modeling', level: 3, importance: 85, crit: RequirementCriticality.CORE },
        { name: 'Satellite Meteorology & Remote Sensing', level: 3, importance: 85, crit: RequirementCriticality.IMPORTANT },
        { name: 'Radar Meteorology & DWR Operations', level: 2, importance: 75, crit: RequirementCriticality.NORMAL },
      ],
    },
    {
      name: 'Doppler Weather Radar Specialist',
      code: 'ROLE-RADAR-001',
      department: 'Radar Meteorology Division',
      description: 'Operational calibration, dual-polarization volume scan analysis, severe convective storm nowcasting, and QPE estimation.',
      competencies: [
        { name: 'Radar Meteorology & DWR Operations', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Synoptic Meteorology & Weather Forecasting', level: 3, importance: 80, crit: RequirementCriticality.IMPORTANT },
        { name: 'Meteorological Instrumentation & AWS Networks', level: 3, importance: 80, crit: RequirementCriticality.IMPORTANT },
      ],
    },
    {
      name: 'Satellite Remote Sensing Meteorologist',
      code: 'ROLE-SAT-001',
      department: 'Satellite Meteorology Division',
      description: 'INSAT-3D/3DR multispectral imagery interpretation, convective cloud top brightness analysis, and atmospheric motion vectors.',
      competencies: [
        { name: 'Satellite Meteorology & Remote Sensing', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Synoptic Meteorology & Weather Forecasting', level: 3, importance: 80, crit: RequirementCriticality.IMPORTANT },
        { name: 'Numerical Weather Prediction & Modeling', level: 3, importance: 75, crit: RequirementCriticality.NORMAL },
      ],
    },
    {
      name: 'Numerical Weather Prediction Modeler',
      code: 'ROLE-NWP-001',
      department: 'Atmospheric Modeling Division',
      description: 'High-resolution WRF and global ensemble prediction systems, 4D-Var data assimilation, and boundary layer parameterization.',
      competencies: [
        { name: 'Numerical Weather Prediction & Modeling', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Climate Data Analysis & Climate Change Projections', level: 3, importance: 85, crit: RequirementCriticality.IMPORTANT },
        { name: 'Synoptic Meteorology & Weather Forecasting', level: 3, importance: 80, crit: RequirementCriticality.IMPORTANT },
      ],
    },
    {
      name: 'Climate Data Analyst',
      code: 'ROLE-CLIM-001',
      department: 'Climate Application & Services Division',
      description: 'Gridded observational data analysis, climate extremes indices calculation, seasonal monsoon outlooks, and trend projections.',
      competencies: [
        { name: 'Climate Data Analysis & Climate Change Projections', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Numerical Weather Prediction & Modeling', level: 3, importance: 75, crit: RequirementCriticality.NORMAL },
        { name: 'Meteorological Instrumentation & AWS Networks', level: 2, importance: 70, crit: RequirementCriticality.NORMAL },
      ],
    },
    {
      name: 'Hydrometeorologist & Flash Flood Specialist',
      code: 'ROLE-HYDRO-001',
      department: 'Hydrology & Flood Meteorological Division',
      description: 'Quantitative Precipitation Estimation (QPE), Flash Flood Guidance System (FFGS), river basin catchment rainfall modeling.',
      competencies: [
        { name: 'Radar Meteorology & DWR Operations', level: 3, importance: 85, crit: RequirementCriticality.CORE },
        { name: 'Synoptic Meteorology & Weather Forecasting', level: 4, importance: 90, crit: RequirementCriticality.CORE },
        { name: 'Ocean State Forecasting & Tsunami Warning', level: 2, importance: 70, crit: RequirementCriticality.OPTIONAL },
      ],
    },
    {
      name: 'Seismologist & Earthquake Monitoring Officer',
      code: 'ROLE-SEISM-001',
      department: 'National Centre for Seismology (NCS)',
      description: 'Broadband seismic network monitoring, hypocentral parameter estimation, focal mechanism analysis, and tsunami advisories.',
      competencies: [
        { name: 'Seismological Data Processing & Earthquake Monitoring', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Ocean State Forecasting & Tsunami Warning', level: 3, importance: 85, crit: RequirementCriticality.IMPORTANT },
        { name: 'Meteorological Instrumentation & AWS Networks', level: 3, importance: 80, crit: RequirementCriticality.NORMAL },
      ],
    },
    {
      name: 'Meteorological Instrumentation Engineer',
      code: 'ROLE-INST-001',
      department: 'Surface & Upper Air Instruments Division',
      description: 'Automatic Weather Station (AWS), Automatic Rain Gauge (ARG), and radiosonde ground receiving telemetry.',
      competencies: [
        { name: 'Meteorological Instrumentation & AWS Networks', level: 4, importance: 95, crit: RequirementCriticality.CORE },
        { name: 'Radar Meteorology & DWR Operations', level: 2, importance: 70, crit: RequirementCriticality.NORMAL },
      ],
    },
  ];

  for (const rData of rolesData) {
    const role = await prisma.roleProfile.upsert({
      where: { code: rData.code },
      update: {
        name: rData.name,
        department: rData.department,
        description: rData.description,
        isActive: true,
      },
      create: {
        name: rData.name,
        code: rData.code,
        department: rData.department,
        description: rData.description,
        isActive: true,
      },
    });

    for (const rc of rData.competencies) {
      const compId = compMap.get(rc.name);
      if (!compId) {
        console.warn(`Competency "${rc.name}" not found for role "${rData.name}". Skipping.`);
        continue;
      }

      await prisma.roleCompetency.upsert({
        where: {
          roleId_competencyId: {
            roleId: role.id,
            competencyId: compId,
          },
        },
        update: {
          requiredLevel: rc.level,
          importance: rc.importance,
          criticality: rc.crit,
        },
        create: {
          roleId: role.id,
          competencyId: compId,
          requiredLevel: rc.level,
          importance: rc.importance,
          criticality: rc.crit,
        },
      });
    }

    console.log(`Synced Role: ${role.name} (${role.code})`);
  }

  // 3. Update Trainer Profiles with realistic ratings and availability
  const trainers = await prisma.user.findMany({
    where: { role: Role.TRAINER },
    include: { trainerProfile: true },
  });

  const ratingPresets = [
    { rating: 4.9, reviews: 28 },
    { rating: 4.8, reviews: 34 },
    { rating: 4.95, reviews: 42 },
    { rating: 4.7, reviews: 19 },
    { rating: 4.85, reviews: 22 },
  ];

  for (let i = 0; i < trainers.length; i++) {
    const trainer = trainers[i];
    const preset = ratingPresets[i % ratingPresets.length];
    if (trainer.trainerProfile) {
      await prisma.trainerProfile.update({
        where: { id: trainer.trainerProfile.id },
        data: {
          isAvailable: true,
          averageRating: preset.rating,
          totalReviews: preset.reviews,
        },
      });
    }
  }

  console.log(`Updated ${trainers.length} Trainer Profiles with availability and rating metadata.`);

  // 4. Seed Diagnostic Assessment
  const anyTrainer = trainers[0] || (await prisma.user.findFirst({ where: { role: Role.ADMIN } }));
  if (anyTrainer) {
    const diagnosticAssessment = await prisma.assessment.upsert({
      where: { id: 'diag-imd-baseline-01' },
      update: {
        isDiagnostic: true,
        status: AssessmentStatus.PUBLISHED,
        passingScore: 50.0,
      },
      create: {
        id: 'diag-imd-baseline-01',
        title: 'IMD Baseline Operational Competency Diagnostic Check',
        subject: 'Atmospheric Sciences & Operational Cadre Baseline',
        description: 'A 10-minute diagnostic check evaluating synoptic, radar, satellite, and numerical modeling competency to establish your personalized learning baseline.',
        trainerId: anyTrainer.id,
        assessmentType: AssessmentType.MCQ,
        durationMinutes: 15,
        passingScore: 50.0,
        status: AssessmentStatus.PUBLISHED,
        isDiagnostic: true,
      },
    });

    // Check questions
    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: diagnosticAssessment.id },
    });

    if (questionCount === 0) {
      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: diagnosticAssessment.id,
          questionText: 'Which radar product is primarily utilized to detect mesocyclonic rotation and severe shear during convective nowcasting?',
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          orderIndex: 0,
          explanation: 'Storm Relative Velocity (SRV) removes storm motion to reveal inbound/outbound velocity couplets indicating rotation.',
          options: {
            create: [
              { optionText: 'Plan Position Indicator (PPI) Reflectivity (Z)', isCorrect: false, orderIndex: 0 },
              { optionText: 'Storm Relative Mean Radial Velocity (SRV)', isCorrect: true, orderIndex: 1 },
              { optionText: 'Echo Tops (ET)', isCorrect: false, orderIndex: 2 },
              { optionText: 'Vertically Integrated Liquid (VIL)', isCorrect: false, orderIndex: 3 },
            ],
          },
        },
      });

      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: diagnosticAssessment.id,
          questionText: 'In numerical weather prediction, what is the primary role of 4D-Var data assimilation over 3D-Var?',
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          orderIndex: 1,
          explanation: '4D-Var incorporates the forecast model dynamic equations within the assimilation time window to preserve physical consistency.',
          options: {
            create: [
              { optionText: 'It eliminates the need for satellite radiances', isCorrect: false, orderIndex: 0 },
              { optionText: 'It uses the model dynamics as a strong constraint across the assimilation time window', isCorrect: true, orderIndex: 1 },
              { optionText: 'It only processes surface observation data', isCorrect: false, orderIndex: 2 },
              { optionText: 'It increases horizontal grid resolution by a factor of four', isCorrect: false, orderIndex: 3 },
            ],
          },
        },
      });

      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: diagnosticAssessment.id,
          questionText: 'On INSAT-3D thermal infrared (TIR-1) channel imagery, convective cloud tops associated with severe thunderstorms are identified by:',
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          orderIndex: 2,
          explanation: 'Very low brightness temperatures (below -60°C to -80°C) represent tall convective cloud tops reaching the tropopause.',
          options: {
            create: [
              { optionText: 'Bright white tones indicating very high brightness temperatures (> 30°C)', isCorrect: false, orderIndex: 0 },
              { optionText: 'Extremely cold equivalent black body temperatures (<-65°C) with sharp cirrus canopies', isCorrect: true, orderIndex: 1 },
              { optionText: 'Uniform dark grey shading with zero temperature gradients', isCorrect: false, orderIndex: 2 },
              { optionText: 'Diffuse boundaries with temperatures identical to the sea surface', isCorrect: false, orderIndex: 3 },
            ],
          },
        },
      });

      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: diagnosticAssessment.id,
          questionText: 'What is the characteristic baroclinic structure of a developing mid-latitude or subtropical synoptic disturbance?',
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          orderIndex: 3,
          explanation: 'Westward tilt with height of the geopotential trough axis allows thermal advection to reinforce surface cyclogenesis.',
          options: {
            create: [
              { optionText: 'Trough axis tilts westward with height', isCorrect: true, orderIndex: 0 },
              { optionText: 'Trough axis tilts eastward with height', isCorrect: false, orderIndex: 1 },
              { optionText: 'Isotherms are strictly parallel to geopotential height contours at all levels', isCorrect: false, orderIndex: 2 },
              { optionText: 'Vertical temperature gradient equals zero across all tropospheric layers', isCorrect: false, orderIndex: 3 },
            ],
          },
        },
      });

      console.log(`Created diagnostic questions for assessment ${diagnosticAssessment.id}.`);
    }
  }

  console.log('Trainee Pipeline Database Seeding Completed Successfully.');
}

seedTraineePipeline()
  .catch((e) => {
    console.error('Error seeding trainee pipeline:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
