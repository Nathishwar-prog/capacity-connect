import { CourseDifficulty, CourseStatus, LessonContentType, RequirementCriticality } from '@prisma/client';

export interface CourseSeed {
  slug: string;
  title: string;
  category: string;
  difficulty: CourseDifficulty;
  durationHours: number;
  status: CourseStatus;
  description: string;
  trainerEmail: string;
  prerequisiteCourseSlugs: string[];
  competencies: Array<{
    code: string;
    targetLevel: number;
    importance: number;
    criticality: RequirementCriticality;
    weight: number;
  }>;
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{
      title: string;
      contentType: LessonContentType;
      durationMinutes: number;
      topicCode: string;
    }>;
  }>;
}

export const COURSES_SEED: CourseSeed[] = [
  // Course 1: Surface Observation
  {
    slug: 'surface-met-observation-fundamentals',
    title: 'Fundamentals of Surface Meteorological Observation',
    category: 'Observation & Instrumentation',
    difficulty: CourseDifficulty.BEGINNER,
    durationHours: 20,
    status: CourseStatus.PUBLISHED,
    description: 'Foundational training in routine meteorological observations, barometer operations, thermometry, and SYNOP coding.',
    trainerEmail: 'trainer.instruments@imd.gov.in',
    prerequisiteCourseSlugs: [],
    competencies: [
      { code: 'COMP-INSTRUMENTATION', targetLevel: 2, importance: 1.2, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 1, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Surface Instruments & Siting Standards',
        description: 'WMO guidelines for weather stations, stevenson screen setup, and barometer readings.',
        lessons: [
          { title: 'Standard Surface Observational Protocols', contentType: LessonContentType.VIDEO, durationMinutes: 45, topicCode: 'OBS_SURF' },
          { title: 'Barometric Siting and Pressure Reduction', contentType: LessonContentType.ARTICLE, durationMinutes: 40, topicCode: 'ATM_PRESS' },
          { title: 'Rain Gauge Catchment Mechanics', contentType: LessonContentType.DOCUMENT, durationMinutes: 35, topicCode: 'OBS_RAIN' },
        ],
      },
      {
        title: 'Sensors & Quality Control',
        description: 'Routine maintenance and observational error checking.',
        lessons: [
          { title: 'Temperature and Humidity Sensors Siting', contentType: LessonContentType.VIDEO, durationMinutes: 40, topicCode: 'OBS_SENS' },
          { title: 'Surface Data Real-Time Quality Control', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'OBS_QC' },
        ],
      },
    ],
  },

  // Course 2: Atmospheric Fundamentals
  {
    slug: 'atmospheric-thermodynamics-sounding-diagnostics',
    title: 'Atmospheric Thermodynamics & Sounding Diagnostics',
    category: 'Meteorological Fundamentals',
    difficulty: CourseDifficulty.BEGINNER,
    durationHours: 20,
    status: CourseStatus.PUBLISHED,
    description: 'Thermodynamic principles governing atmospheric vertical structure, hydrostatic equilibrium, lapse rates, and tephigram analysis.',
    trainerEmail: 'trainer.synoptic@imd.gov.in',
    prerequisiteCourseSlugs: [],
    competencies: [
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 2, importance: 1.25, criticality: RequirementCriticality.CORE, weight: 1.0 },
    ],
    modules: [
      {
        title: 'Atmospheric Structure & Hydrostatics',
        description: 'Physical structure and vertical balance.',
        lessons: [
          { title: 'Atmospheric Layers and Composition', contentType: LessonContentType.VIDEO, durationMinutes: 45, topicCode: 'ATM_STRUCT' },
          { title: 'Hydrostatic Balance and Scale Height', contentType: LessonContentType.ARTICLE, durationMinutes: 45, topicCode: 'ATM_PRESS' },
          { title: 'Thermal Advection and Lapse Rates', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'ATM_TEMP' },
        ],
      },
      {
        title: 'Convective Instability',
        description: 'Evaluating stability from soundings.',
        lessons: [
          { title: 'Moisture Variables and Psychrometry', contentType: LessonContentType.VIDEO, durationMinutes: 45, topicCode: 'ATM_HUMID' },
          { title: 'Parcel Theory and CAPE Calculations', contentType: LessonContentType.DOCUMENT, durationMinutes: 60, topicCode: 'ATM_STAB' },
        ],
      },
    ],
  },

  // Course 3: Operational Weather Analysis
  {
    slug: 'operational-weather-analysis-synoptic-diagnostics',
    title: 'Operational Weather Analysis & Synoptic Chart Diagnostics',
    category: 'Weather Analysis',
    difficulty: CourseDifficulty.INTERMEDIATE,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'Comprehensive synoptic chart interpretation, jet stream diagnostics, Western Disturbances, and monsoon trough analysis.',
    trainerEmail: 'trainer.synoptic@imd.gov.in',
    prerequisiteCourseSlugs: ['atmospheric-thermodynamics-sounding-diagnostics'],
    competencies: [
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SAT-MET', targetLevel: 2, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Constant Pressure Chart Diagnostics',
        description: 'Upper-air charts and streamline analysis.',
        lessons: [
          { title: 'Upper Air Chart Analysis Techniques', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'SYN_MAPS' },
          { title: 'Synoptic Advection & Jet Stream Coupling', contentType: LessonContentType.ARTICLE, durationMinutes: 50, topicCode: 'SYN_MET' },
          { title: 'Frontal Systems and Western Disturbances', contentType: LessonContentType.DOCUMENT, durationMinutes: 45, topicCode: 'SYN_FRONTS' },
        ],
      },
      {
        title: 'Tropical Synoptic Disturbances',
        description: 'Monsoon lows and tropical depressions.',
        lessons: [
          { title: 'Monsoon Trough Dynamics and Lows', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'SYN_CYCLONE' },
          { title: 'Deep Moist Convection & Squall Lines', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'SYN_THUNDER' },
        ],
      },
    ],
  },

  // Course 4: Weather Radar Fundamentals
  {
    slug: 'weather-radar-fundamentals-operations',
    title: 'Weather Radar Fundamentals & DWR Operations',
    category: 'Radar Meteorology',
    difficulty: CourseDifficulty.INTERMEDIATE,
    durationHours: 25,
    status: CourseStatus.PUBLISHED,
    description: 'Operating principles of pulsed Doppler weather radars, reflectivity estimation, Doppler velocity, and radar beam propagation.',
    trainerEmail: 'trainer.radar@imd.gov.in',
    prerequisiteCourseSlugs: [],
    competencies: [
      { code: 'COMP-RADAR-MET', targetLevel: 3, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-INSTRUMENTATION', targetLevel: 2, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Radar Principles & Reflectivity',
        description: 'Radar equation, precipitation estimation, and attenuation.',
        lessons: [
          { title: 'Doppler Radar Physics & Scanning Strategies', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'RAD_FUND' },
          { title: 'Reflectivity Factor Z and Z-R Conversion', contentType: LessonContentType.DOCUMENT, durationMinutes: 45, topicCode: 'RAD_FUND' },
        ],
      },
      {
        title: 'Doppler Velocity Analysis',
        description: 'Radial velocity interpretation and Nyquist limit handling.',
        lessons: [
          { title: 'Radial Velocity Dealiasing Algorithms', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'RAD_FUND' },
          { title: 'Mesocyclone and Hook Echo Recognition', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'SYN_THUNDER' },
        ],
      },
    ],
  },

  // Course 5: Radar-Based Severe Weather Monitoring
  {
    slug: 'radar-weather-monitoring-convective-nowcasting',
    title: 'Radar-Based Weather Monitoring & Severe Convective Diagnostics',
    category: 'Radar Meteorology',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'Advanced radar monitoring for mesocyclones, tornadic vortex signatures, severe thunderstorms, and radar-based nowcasting.',
    trainerEmail: 'trainer.radar@imd.gov.in',
    prerequisiteCourseSlugs: ['weather-radar-fundamentals-operations'],
    competencies: [
      { code: 'COMP-RADAR-MET', targetLevel: 4, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.1, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Severe Convective Cell Diagnostics',
        description: 'Supercells, bow echoes, and downbursts.',
        lessons: [
          { title: 'Supercell Dynamics & Storm Splitting', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'SYN_THUNDER' },
          { title: 'Mesocyclone Detection Algorithms', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'FCST_NOWCAST' },
        ],
      },
      {
        title: 'Operational Nowcasting',
        description: 'Zero to three hour storm extrapolation.',
        lessons: [
          { title: 'TITAN & TREC Radar Echo Extrapolation', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'FCST_NOWCAST' },
          { title: 'Issuing Radar-Based Microburst Warnings', contentType: LessonContentType.DOCUMENT, durationMinutes: 45, topicCode: 'OPS_WARNING' },
        ],
      },
    ],
  },

  // Course 6: Advanced Radar Nowcasting & Dual-Pol (Prerequisite: Course 5)
  {
    slug: 'advanced-radar-nowcasting-dual-polarization',
    title: 'Advanced Radar Nowcasting & Dual-Polarization Microphysics',
    category: 'Radar Meteorology',
    difficulty: CourseDifficulty.EXPERT,
    durationHours: 35,
    status: CourseStatus.PUBLISHED,
    description: 'Dual-polarization radar parameters (ZDR, KDP, RhoHV), hydrometeor classification algorithms (HCA), and hail core diagnostics.',
    trainerEmail: 'trainer.radar@imd.gov.in',
    prerequisiteCourseSlugs: ['radar-weather-monitoring-convective-nowcasting'],
    competencies: [
      { code: 'COMP-RADAR-MET', targetLevel: 5, importance: 1.35, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 4, importance: 1.15, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Dual-Polarization Parameters',
        description: 'Differential reflectivity, specific differential phase, correlation coefficient.',
        lessons: [
          { title: 'Differential Phase (KDP) Rainfall Estimation', contentType: LessonContentType.VIDEO, durationMinutes: 60, topicCode: 'RAD_FUND' },
          { title: 'Hydrometeor Classification in Tropical Squalls', contentType: LessonContentType.DOCUMENT, durationMinutes: 55, topicCode: 'FCST_NOWCAST' },
        ],
      },
      {
        title: 'Severe Convective Cell Warning Integration',
        description: 'Operational alert generation from dual-pol products.',
        lessons: [
          { title: 'Dual-Pol Hail Spike & Debris Signature Diagnostics', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'OPS_WARNING' },
        ],
      },
    ],
  },

  // Course 7: NWP Fundamentals
  {
    slug: 'numerical-weather-prediction-fundamentals',
    title: 'Numerical Weather Prediction Fundamentals',
    category: 'Atmospheric Sciences',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 35,
    status: CourseStatus.PUBLISHED,
    description: 'Atmospheric dynamic equations, spatial and temporal discretization, physical parameterizations, and numerical stability.',
    trainerEmail: 'trainer.nwp@imd.gov.in',
    prerequisiteCourseSlugs: ['atmospheric-thermodynamics-sounding-diagnostics'],
    competencies: [
      { code: 'COMP-NWP-MODELING', targetLevel: 3, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.1, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Governing Atmospheric Equations',
        description: 'Momentum, continuity, thermodynamic energy, and moisture equations.',
        lessons: [
          { title: 'Primitive Equations & Coordinate Systems', contentType: LessonContentType.VIDEO, durationMinutes: 60, topicCode: 'NWP_FUND' },
          { title: 'Spatial Discretization & CFL Criterion', contentType: LessonContentType.ARTICLE, durationMinutes: 55, topicCode: 'NWP_FUND' },
        ],
      },
      {
        title: 'Model Guidance & Verification',
        description: 'Interpreting model output and statistical scoring.',
        lessons: [
          { title: 'Short-Range WRF Guidance Synthesis', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'FCST_SHORTRANGE' },
          { title: 'Quantitative Forecast Verification Metrics', contentType: LessonContentType.DOCUMENT, durationMinutes: 55, topicCode: 'FCST_VERIF' },
        ],
      },
    ],
  },

  // Course 8: Ensemble Forecasting (Prerequisite: Course 7)
  {
    slug: 'ensemble-forecasting-atmospheric-predictability',
    title: 'Ensemble Forecasting & Atmospheric Predictability',
    category: 'Atmospheric Sciences',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'Initial condition perturbation methods, chaos theory in NWP, ensemble spread-error relationship, and probabilistic forecasts.',
    trainerEmail: 'trainer.nwp@imd.gov.in',
    prerequisiteCourseSlugs: ['numerical-weather-prediction-fundamentals'],
    competencies: [
      { code: 'COMP-NWP-MODELING', targetLevel: 4, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-CLIMATE-SCI', targetLevel: 3, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Ensemble Generation Techniques',
        description: 'Singular vectors, ensemble transform Kalman filter.',
        lessons: [
          { title: 'EPS Generation & Spread-Skill Diagnosis', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'NWP_ENSEMBLE' },
          { title: 'Probabilistic Product Generation (PDF & Spaghetti)', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'FCST_PROB' },
        ],
      },
    ],
  },

  // Course 9: Satellite Meteorology
  {
    slug: 'satellite-meteorology-cyclone-intensity-analysis',
    title: 'Satellite Meteorology & Tropical Cyclone Intensity Analysis',
    category: 'Remote Sensing',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'INSAT-3D/3DR multispectral analysis, Dvorak technique for cyclone intensity estimation, and convective cloud-top tracking.',
    trainerEmail: 'trainer.satmet@imd.gov.in',
    prerequisiteCourseSlugs: ['operational-weather-analysis-synoptic-diagnostics'],
    competencies: [
      { code: 'COMP-SAT-MET', targetLevel: 4, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.15, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Satellite Radiative Transfer',
        description: 'Infrared, visible, and water vapor channel diagnostics.',
        lessons: [
          { title: 'INSAT-3DR Multispectral Imaging Channels', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'SAT_FUND' },
          { title: 'Tropical Cyclone Dvorak Technique (T-Number)', contentType: LessonContentType.DOCUMENT, durationMinutes: 60, topicCode: 'SYN_CYCLONE' },
        ],
      },
      {
        title: 'Nowcasting from Satellite Imagery',
        description: 'Rapid scan and convective initiation alerts.',
        lessons: [
          { title: 'Cloud-Top Cooling Rates and Rapid Convective Initiation', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'FCST_NOWCAST' },
        ],
      },
    ],
  },

  // Course 10: Climate Data Analysis
  {
    slug: 'climate-data-analysis-climate-indices',
    title: 'Climate Data Analysis & Climate Indices Computation',
    category: 'Climate Science',
    difficulty: CourseDifficulty.INTERMEDIATE,
    durationHours: 25,
    status: CourseStatus.PUBLISHED,
    description: 'Manipulating IMD high-resolution gridded climate datasets, computing ETCCDI extreme temperature and precipitation indices.',
    trainerEmail: 'trainer.climate@imd.gov.in',
    prerequisiteCourseSlugs: [],
    competencies: [
      { code: 'COMP-CLIMATE-SCI', targetLevel: 3, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-INSTRUMENTATION', targetLevel: 2, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Climate Data Processing & Quality',
        description: 'Homogenization and quality control of long-term series.',
        lessons: [
          { title: 'Climate Time Series Homogenization Techniques', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'CLIM_QC' },
          { title: 'Computing ETCCDI Extreme Indices in Python/CDO', contentType: LessonContentType.DOCUMENT, durationMinutes: 55, topicCode: 'CLIM_INDICES' },
        ],
      },
      {
        title: 'Trend Analysis in Climate Datasets',
        description: 'Mann-Kendall and Sen slope analysis.',
        lessons: [
          { title: 'Statistical Trend Diagnostics for Gridded Climate Data', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'CLIM_TIMESERIES' },
        ],
      },
    ],
  },

  // Course 11: Advanced Climate Time-Series (Prerequisite: Course 10)
  {
    slug: 'advanced-climate-timeseries-gridded-modeling',
    title: 'Advanced Climate Time-Series Modeling & Gridded Data Processing',
    category: 'Climate Science',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'Advanced wavelet spectral analysis, climate projection downscaling, and large-scale climate driver teleconnections (ENSO/IOD).',
    trainerEmail: 'trainer.climate@imd.gov.in',
    prerequisiteCourseSlugs: ['climate-data-analysis-climate-indices'],
    competencies: [
      { code: 'COMP-CLIMATE-SCI', targetLevel: 4, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 3, importance: 1.0, criticality: RequirementCriticality.NORMAL, weight: 0.8 },
    ],
    modules: [
      {
        title: 'Teleconnection Analysis & Projections',
        description: 'Analyzing ENSO, IOD, and CMIP6 climate model projections.',
        lessons: [
          { title: 'ENSO-Monsoon Teleconnection Statistical Modeling', contentType: LessonContentType.VIDEO, durationMinutes: 55, topicCode: 'CLIM_VAR' },
          { title: 'CMIP6 High-Resolution Downscaling for Indian Basins', contentType: LessonContentType.DOCUMENT, durationMinutes: 55, topicCode: 'CLIM_INTERP' },
        ],
      },
    ],
  },

  // Course 12: Severe Weather Warning & Decision Support
  {
    slug: 'severe-weather-warning-decision-support',
    title: 'Severe Weather Warning & Forecast Decision Support',
    category: 'Operational Applications',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 30,
    status: CourseStatus.PUBLISHED,
    description: 'Operational alert generation, color-coded warning criteria (Green, Yellow, Orange, Red), and emergency management coordination.',
    trainerEmail: 'trainer.synoptic@imd.gov.in',
    prerequisiteCourseSlugs: ['operational-weather-analysis-synoptic-diagnostics'],
    competencies: [
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 4, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-RADAR-MET', targetLevel: 3, importance: 1.1, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Warning Protocols & Criteria',
        description: 'Standard operational procedures for extreme events.',
        lessons: [
          { title: 'IMD Color-Coded Severe Weather Warning Protocols', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'OPS_WARNING' },
          { title: 'Disaster Risk Integration with NDMA/SDMA Frameworks', contentType: LessonContentType.ARTICLE, durationMinutes: 45, topicCode: 'OPS_DISASTER' },
        ],
      },
      {
        title: 'Operational Decision Making',
        description: 'Decision matrices during high-impact weather.',
        lessons: [
          { title: 'Decision Support Matrices for Extreme Monsoon Events', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'OPS_DECISION' },
          { title: 'Crisis Communication & Media Briefing Procedures', contentType: LessonContentType.VIDEO, durationMinutes: 40, topicCode: 'OPS_COMM' },
        ],
      },
    ],
  },

  // Course 13: AWS Network Operations
  {
    slug: 'aws-network-operations-sensor-calibration',
    title: 'Automatic Weather Station (AWS) Network Operations & Calibration',
    category: 'Observation & Instrumentation',
    difficulty: CourseDifficulty.INTERMEDIATE,
    durationHours: 25,
    status: CourseStatus.PUBLISHED,
    description: 'Maintenance, calibration, telemetry, and automated quality control for nationwide AWS/ARG observational networks.',
    trainerEmail: 'trainer.instruments@imd.gov.in',
    prerequisiteCourseSlugs: ['surface-met-observation-fundamentals'],
    competencies: [
      { code: 'COMP-INSTRUMENTATION', targetLevel: 3, importance: 1.3, criticality: RequirementCriticality.CORE, weight: 1.0 },
    ],
    modules: [
      {
        title: 'AWS Telemetry & Maintenance',
        description: 'Troubleshooting and telemetry.',
        lessons: [
          { title: 'AWS Datalogger Telemetry and Power Subsystems', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'OBS_AWS' },
          { title: 'Precision Laboratory Calibration Procedures', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'OBS_CALIB' },
        ],
      },
    ],
  },

  // Course 14: Aviation Meteorology
  {
    slug: 'aviation-meteorology-aerodrome-forecasting',
    title: 'Aviation Meteorology & Terminal Aerodrome Forecasting',
    category: 'Operational Applications',
    difficulty: CourseDifficulty.ADVANCED,
    durationHours: 25,
    status: CourseStatus.PUBLISHED,
    description: 'ICAO/WMO Annex 3 compliance, METAR/TAF code generation, low-level wind shear, clear air turbulence, and aerodrome warnings.',
    trainerEmail: 'trainer.synoptic@imd.gov.in',
    prerequisiteCourseSlugs: ['operational-weather-analysis-synoptic-diagnostics'],
    competencies: [
      { code: 'COMP-SYNOPTIC-MET', targetLevel: 4, importance: 1.25, criticality: RequirementCriticality.CORE, weight: 1.0 },
      { code: 'COMP-RADAR-MET', targetLevel: 3, importance: 1.1, criticality: RequirementCriticality.IMPORTANT, weight: 0.9 },
    ],
    modules: [
      {
        title: 'Aviation Codes & Severe Hazards',
        description: 'METAR, TAF, and severe flight hazards.',
        lessons: [
          { title: 'Terminal Aerodrome Forecast (TAF) Formulation', contentType: LessonContentType.VIDEO, durationMinutes: 50, topicCode: 'OPS_AVIATION' },
          { title: 'Low-Level Wind Shear & Microburst Detection', contentType: LessonContentType.DOCUMENT, durationMinutes: 50, topicCode: 'OPS_AVIATION' },
        ],
      },
    ],
  },
];
