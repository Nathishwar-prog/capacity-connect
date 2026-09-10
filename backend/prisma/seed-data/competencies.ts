export interface CompetencySeed {
  code: string;
  name: string;
  category: string;
  description: string;
  levels: Array<{
    level: number;
    name: string;
    description: string;
  }>;
}

const STANDARD_LEVELS = [
  { level: 0, name: 'NOT_ASSESSED', description: 'Zero recorded evidence or baseline performance.' },
  { level: 1, name: 'BEGINNER', description: 'Understands fundamental physical principles under direct supervision.' },
  { level: 2, name: 'BASIC', description: 'Performs standard routine operational analysis and chart diagnostics.' },
  { level: 3, name: 'INTERMEDIATE', description: 'Autonomously interprets multi-source observations and models during active duty.' },
  { level: 4, name: 'ADVANCED', description: 'Leads severe event warnings, model customization, and specialized advisory issuance.' },
  { level: 5, name: 'EXPERT', description: 'National research authority and WMO working group contributor.' },
];

export const COMPETENCIES_SEED: CompetencySeed[] = [
  {
    code: 'COMP-SYNOPTIC-MET',
    name: 'Synoptic Meteorology & Weather Forecasting',
    category: 'Meteorology',
    description: 'Surface and upper-air synoptic analysis, tropical cyclogenesis, Western Disturbances, monsoon breaks, and severe weather warnings.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-NWP-MODELING',
    name: 'Numerical Weather Prediction & Modeling',
    category: 'Atmospheric Sciences',
    description: 'Governing equations of atmospheric motion, finite difference discretization, WRF/GFS operational setup, and ensemble forecasting.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-RADAR-MET',
    name: 'Radar Meteorology & DWR Operations',
    category: 'Observational Systems',
    description: 'Doppler Weather Radar signal analysis, dual-polarization hydrometeor classification, and convective storm nowcasting.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-SAT-MET',
    name: 'Satellite Meteorology & Remote Sensing',
    category: 'Remote Sensing',
    description: 'INSAT-3D/3DR multispectral imagery interpretation, radiance assimilation, atmospheric motion vectors, and Dvorak technique.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-CLIMATE-SCI',
    name: 'Climate Data Analysis & Climate Change Projections',
    category: 'Climate Science',
    description: 'IMD high-resolution gridded datasets, ETCCDI extreme climate indices, NetCDF/CDO manipulation, and climate projections.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-OCEAN-SCI',
    name: 'Ocean State Forecasting & Tsunami Warning',
    category: 'Ocean Sciences',
    description: 'Numerical wave modeling (WAVEWATCH-III), cyclonic storm surge prediction, and ITEWC tsunami early warning protocols.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-SEISMOLOGY',
    name: 'Seismological Data Processing & Earthquake Monitoring',
    category: 'Geophysics',
    description: 'National Seismological Network operations, phase picking, hypocenter determination, and seismic hazard microzonation.',
    levels: STANDARD_LEVELS,
  },
  {
    code: 'COMP-INSTRUMENTATION',
    name: 'Meteorological Instrumentation & AWS Networks',
    category: 'Observational Systems',
    description: 'Automatic Weather Station sensor calibration, datalogger telemetry, sensor quality control, and WMO observation siting standards.',
    levels: STANDARD_LEVELS,
  },
];
