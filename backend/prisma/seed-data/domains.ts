export interface DepartmentSeed {
  code: string;
  name: string;
  description: string;
}

export interface OrganizationSeed {
  name: string;
  code: string;
  description: string;
  departments: DepartmentSeed[];
}

export const MOES_ORGANIZATION: OrganizationSeed = {
  name: 'Ministry of Earth Sciences & India Meteorological Department',
  code: 'MoES-IMD',
  description: 'Apex Digital Capacity Building, Knowledge Management and Training Portal for MoES, IMD, NCMRWF, INCOIS, and IITM.',
  departments: [
    {
      code: 'NWFC',
      name: 'National Weather Forecasting Centre',
      description: 'Synoptic weather diagnostics, severe weather advisories, cyclogenesis tracking, and monsoon monitoring.',
    },
    {
      code: 'NWP',
      name: 'Numerical Weather Prediction Division',
      description: 'Regional WRF-ARW, global GFS/NCUM operational models, ensemble prediction systems (EPS), and data assimilation.',
    },
    {
      code: 'RADAR',
      name: 'Radar Meteorology & DWR Network',
      description: 'Operational S-band and C-band Doppler Weather Radar network, dual-polarization products, and convective nowcasting.',
    },
    {
      code: 'SATMET',
      name: 'Satellite Meteorology & Remote Sensing',
      description: 'INSAT-3D, 3DR, and 3DS radiance processing, cloud top temperature estimation, Dvorak analysis, and motion vectors.',
    },
    {
      code: 'CRS',
      name: 'Climate Research and Services (IMD Pune)',
      description: 'Long-range climate forecasting, gridded meteorological datasets, climate indices, and climate normals.',
    },
    {
      code: 'INCOIS',
      name: 'Indian National Centre for Ocean Information Services',
      description: 'Operational ocean state forecasting, coastal storm surge modeling, high-wave alerts, and tsunami early warning.',
    },
    {
      code: 'NCS',
      name: 'National Centre for Seismology',
      description: 'National Seismological Network operations, earthquake monitoring, hypocenter location, and seismic hazard assessment.',
    },
    {
      code: 'CTI',
      name: 'Central Training Institute (Pashan, Pune)',
      description: 'WMO Regional Training Centre for meteorological capacity building, basic, intermediate, and advanced operational courses.',
    },
    {
      code: 'INSTR',
      name: 'Surface Instruments & Observational Network',
      description: 'Automatic Weather Stations (AWS), Automatic Rain Gauges (ARG), sensor calibration, quality control, and siting standards.',
    },
    {
      code: 'HYDRO',
      name: 'Hydrology & Flood Meteorological Division',
      description: 'Quantitative Precipitation Estimation (QPE), Flash Flood Guidance System (FFGS), and river basin flood advisories.',
    },
  ],
};

export interface RoleProfileSeed {
  roleName: string;
  departmentCode: string;
  description: string;
  requiredCompetencies: Array<{
    code: string;
    targetLevel: number;
    importance: number;
    criticality: 'CORE' | 'IMPORTANT' | 'NORMAL' | 'OPTIONAL';
  }>;
}

export const TARGET_ROLE_PROFILES: RoleProfileSeed[] = [
  {
    roleName: 'Operational Forecasting Analyst',
    departmentCode: 'NWFC',
    description: 'Autonomous duty forecaster issuing national synoptic weather bulletins, nowcasts, and severe convective warnings.',
    requiredCompetencies: [
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 4, importance: 1.25, criticality: 'CORE' },
      { code: 'COMP-RADAR-MET', targetLevel: 3, importance: 1.15, criticality: 'CORE' },
      { code: 'COMP-SAT-MET', targetLevel: 3, importance: 1.10, criticality: 'IMPORTANT' },
      { code: 'COMP-NWP-MODELING', targetLevel: 3, importance: 1.05, criticality: 'IMPORTANT' },
      { code: 'COMP-INSTRUMENTATION', targetLevel: 2, importance: 0.90, criticality: 'NORMAL' },
    ],
  },
  {
    roleName: 'Radar Weather & Nowcasting Specialist',
    departmentCode: 'RADAR',
    description: 'Expert radar meteorologist responsible for DWR calibration, dual-polarization hydrometeor classification, and microburst alerts.',
    requiredCompetencies: [
      { code: 'COMP-RADAR-MET', targetLevel: 4, importance: 1.30, criticality: 'CORE' },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.10, criticality: 'IMPORTANT' },
      { code: 'COMP-INSTRUMENTATION', targetLevel: 3, importance: 1.05, criticality: 'IMPORTANT' },
      { code: 'COMP-NWP-MODELING', targetLevel: 2, importance: 0.85, criticality: 'NORMAL' },
    ],
  },
  {
    roleName: 'NWP Numerical Modeling Specialist',
    departmentCode: 'NWP',
    description: 'Atmospheric modeler executing WRF mesoscale setups, boundary condition ingestion, ensemble forecasting, and forecast verification.',
    requiredCompetencies: [
      { code: 'COMP-NWP-MODELING', targetLevel: 4, importance: 1.30, criticality: 'CORE' },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.10, criticality: 'IMPORTANT' },
      { code: 'COMP-CLIMATE-SCI', targetLevel: 3, importance: 1.00, criticality: 'NORMAL' },
      { code: 'COMP-SAT-MET', targetLevel: 2, importance: 0.90, criticality: 'NORMAL' },
    ],
  },
  {
    roleName: 'Climate Data Analyst',
    departmentCode: 'CRS',
    description: 'Climatologist analyzing long-term climate normals, ETCCDI indices, NetCDF reanalysis datasets, and climate trends.',
    requiredCompetencies: [
      { code: 'COMP-CLIMATE-SCI', targetLevel: 4, importance: 1.30, criticality: 'CORE' },
      { code: 'COMP-INSTRUMENTATION', targetLevel: 3, importance: 1.05, criticality: 'IMPORTANT' },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 2, importance: 0.90, criticality: 'NORMAL' },
    ],
  },
  {
    roleName: 'Meteorological Instrumentation & Observation Officer',
    departmentCode: 'INSTR',
    description: 'Field officer managing surface observation networks, AWS sensor calibration, barometers, rain gauges, and data quality assurance.',
    requiredCompetencies: [
      { code: 'COMP-INSTRUMENTATION', targetLevel: 4, importance: 1.30, criticality: 'CORE' },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 2, importance: 1.00, criticality: 'NORMAL' },
      { code: 'COMP-RADAR-MET', targetLevel: 2, importance: 0.90, criticality: 'NORMAL' },
    ],
  },
];
