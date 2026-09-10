export interface TrainerSeed {
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  departmentCode: string;
  bio: string;
  yearsExperience: number;
  expertiseSkills: Array<{
    skillCode: string;
    proficiencyLevel: number;
  }>;
}

export const TRAINERS_SEED: TrainerSeed[] = [
  {
    email: 'trainer.synoptic@imd.gov.in',
    firstName: 'Dr. Ramesh',
    lastName: 'Jenamani',
    designation: 'Senior Scientist-G (Lead Forecaster)',
    departmentCode: 'NWFC',
    bio: 'Over 28 years of operational synoptic weather forecasting, Western Disturbance diagnostics, tropical cyclogenesis, and monsoon break analysis at NWFC New Delhi.',
    yearsExperience: 28,
    expertiseSkills: [
      { skillCode: 'SKILL-SYNOP', proficiencyLevel: 5 },
      { skillCode: 'SKILL-INSAT', proficiencyLevel: 4 },
    ],
  },
  {
    email: 'trainer.radar@imd.gov.in',
    firstName: 'Dr. Sanjay',
    lastName: 'Roy',
    designation: 'Scientist-F (Radar Network Operations)',
    departmentCode: 'RADAR',
    bio: 'Lead authority on Doppler Weather Radar (DWR) operations, dual-polarization hydrometeor classification, de-aliasing algorithms, and convective nowcasting.',
    yearsExperience: 22,
    expertiseSkills: [
      { skillCode: 'SKILL-DWR', proficiencyLevel: 5 },
      { skillCode: 'SKILL-AWS', proficiencyLevel: 4 },
    ],
  },
  {
    email: 'trainer.nwp@imd.gov.in',
    firstName: 'Dr. V. S.',
    lastName: 'Prasad',
    designation: 'Senior Scientist-F (NWP & Modeling)',
    departmentCode: 'NWP',
    bio: 'Expert in regional mesoscale WRF modeling, data assimilation of satellite and radar radiances, and global GFS ensemble prediction systems.',
    yearsExperience: 24,
    expertiseSkills: [
      { skillCode: 'SKILL-WRF', proficiencyLevel: 5 },
      { skillCode: 'SKILL-CDO', proficiencyLevel: 4 },
    ],
  },
  {
    email: 'trainer.satmet@imd.gov.in',
    firstName: 'Dr. Sunitha',
    lastName: 'Devi',
    designation: 'Scientist-F (Satellite Meteorology)',
    departmentCode: 'SATMET',
    bio: 'Specialist in INSAT-3D/3DR geostationary satellite multispectral imagery interpretation, Dvorak tropical cyclone intensity analysis, and cloud motion vectors.',
    yearsExperience: 20,
    expertiseSkills: [
      { skillCode: 'SKILL-INSAT', proficiencyLevel: 5 },
      { skillCode: 'SKILL-SYNOP', proficiencyLevel: 4 },
    ],
  },
  {
    email: 'trainer.climate@imd.gov.in',
    firstName: 'Dr. O. P.',
    lastName: 'Sreejith',
    designation: 'Head, Climate Research & Services',
    departmentCode: 'CRS',
    bio: 'Climatologist leading long-range monsoon outlooks, ETCCDI extreme indices calculations, climate data homogenization, and CMIP6 climate model projections.',
    yearsExperience: 25,
    expertiseSkills: [
      { skillCode: 'SKILL-CDO', proficiencyLevel: 5 },
      { skillCode: 'SKILL-SYNOP', proficiencyLevel: 4 },
    ],
  },
  {
    email: 'trainer.instruments@imd.gov.in',
    firstName: 'Dr. A. K.',
    lastName: 'Mitra',
    designation: 'Scientist-G (Observational Systems & AWS)',
    departmentCode: 'INSTR',
    bio: 'Chief architect of nationwide AWS/ARG automated networks, sensor calibration laboratories, WMO siting compliance, and quality control architectures.',
    yearsExperience: 26,
    expertiseSkills: [
      { skillCode: 'SKILL-AWS', proficiencyLevel: 5 },
      { skillCode: 'SKILL-DWR', proficiencyLevel: 3 },
    ],
  },
];
