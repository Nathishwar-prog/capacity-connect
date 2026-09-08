import { FullProfessionalProfile } from '../types/professional-profile.types';

export const mockProfessionalProfile: FullProfessionalProfile = {
  basicInfo: {
    id: 'demo-trainee-id',
    email: 'yoga.s@imd.gov.in',
    firstName: 'Yoga',
    lastName: 'S.',
    phone: '+91 98401 23456',
    avatarUrl: null,
    role: 'TRAINEE',
    departmentId: 'dept-nwfc-01',
    departmentName: 'National Weather Forecasting Centre (NWFC)',
    organizationName: 'India Meteorological Department (MoES)',
    designation: 'Forecaster Grade I (Operational Trainee)',
    bio: 'Operational meteorological forecaster specializing in mesoscale convective systems, numerical weather prediction interpretation, and Doppler radar velocity de-aliasing. Enrolled in the MoES-IMD Continuous Professional Competency Transformation program.',
    age: 28,
    location: 'Mausam Bhawan, Lodhi Road, New Delhi',
    moesEmployeeId: 'MoES-TR-2026-089',
    imdEmployeeId: 'IMD-FC-4492',
    profileCompletion: 85,
  },
  qualifications: [
    {
      id: 'qual-1',
      degree: 'M.Sc. in Meteorology & Atmospheric Sciences',
      fieldOfStudy: 'Tropical Meteorology, NWP & Cyclone Dynamics',
      institution: 'Cochin University of Science and Technology (CUSAT)',
      startDate: '2020-07-01T00:00:00.000Z',
      endDate: '2022-06-30T00:00:00.000Z',
      description:
        'Completed specialized thesis on Bay of Bengal severe cyclonic storm genesis and parameterization of boundary layer fluxes using WRF modeling.',
    },
    {
      id: 'qual-2',
      degree: 'B.Sc. in Physics & Applied Mathematics',
      fieldOfStudy: 'Classical Thermodynamics & Physical Sciences',
      institution: 'Madras Christian College (MCC), University of Madras',
      startDate: '2017-06-01T00:00:00.000Z',
      endDate: '2020-05-31T00:00:00.000Z',
      description:
        'First Class with Distinction. Focused on fluid dynamics, thermodynamics of gas systems, and differential equation modeling.',
    },
  ],
  experiences: [
    {
      id: 'exp-1',
      companyName: 'National Weather Forecasting Centre (NWFC), IMD HQ',
      jobTitle: 'Operational Forecaster Trainee (Grade I)',
      startDate: '2023-08-01T00:00:00.000Z',
      endDate: null,
      isCurrent: true,
      description:
        'Responsible for daily synoptic weather analysis, monitoring INSAT-3DR satellite loops, interpreting NWP ensemble forecasts (GFS/WRF), and drafting operational severe weather bulletins for north and central India.',
    },
    {
      id: 'exp-2',
      companyName: 'Regional Meteorological Centre (RMC) Chennai, IMD',
      jobTitle: 'Meteorological Observer & Radar Analyst Intern',
      startDate: '2022-07-01T00:00:00.000Z',
      endDate: '2023-07-15T00:00:00.000Z',
      isCurrent: false,
      description:
        'Operated Chennai S-band Doppler Weather Radar during northeast monsoon season; logged AWS data, calibrated micro-barographs, and participated in twice-daily radiosonde balloon launches.',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      name: 'Synoptic Chart Analysis',
      code: 'SYNOPTIC_CHART_ANALYSIS',
      category: 'METEOROLOGY',
      proficiencyLevel: 4,
    },
    {
      id: 'skill-2',
      name: 'NWP Model Interpretation (WRF/GFS)',
      code: 'NWP_MODEL_INTERPRETATION',
      category: 'NUMERICAL_MODELING',
      proficiencyLevel: 3,
    },
    {
      id: 'skill-3',
      name: 'Doppler Weather Radar (DWR)',
      code: 'DOPPLER_WEATHER_RADAR',
      category: 'RADAR_METEOROLOGY',
      proficiencyLevel: 3,
    },
    {
      id: 'skill-4',
      name: 'INSAT-3DR Satellite Imagery',
      code: 'INSAT_3DR_SATELLITE_IMAGERY',
      category: 'SATELLITE_METEOROLOGY',
      proficiencyLevel: 4,
    },
    {
      id: 'skill-5',
      name: 'Tropical Cyclone Tracking',
      code: 'TROPICAL_CYCLONE_TRACKING',
      category: 'SEVERE_WEATHER',
      proficiencyLevel: 3,
    },
    {
      id: 'skill-6',
      name: 'QGIS Geospatial Mapping',
      code: 'QGIS_GEOSPATIAL_MAPPING',
      category: 'GIS',
      proficiencyLevel: 3,
    },
    {
      id: 'skill-7',
      name: 'Python for Atmospheric Sciences',
      code: 'PYTHON_ATMOSPHERIC_SCIENCES',
      category: 'SCIENTIFIC_COMPUTING',
      proficiencyLevel: 3,
    },
    {
      id: 'skill-8',
      name: 'Automatic Weather Station (AWS) Calibration',
      code: 'AWS_CALIBRATION',
      category: 'INSTRUMENTATION',
      proficiencyLevel: 4,
    },
  ],
  interests: [
    'Numerical Weather Prediction',
    'Satellite Meteorology',
    'Radar Meteorology',
    'Severe Weather Nowcasting',
    'Climate Change & Monsoon Dynamics',
    'Mesoscale Convective Systems',
  ],
  certificates: [
    {
      id: 'cert-1',
      title: 'WMO-258 Basic Instruction Package for Meteorologists (BIP-M)',
      issuingOrganization: 'WMO Regional Training Centre (RTC) Pune & IMD',
      credentialId: 'WMO-RTC-2024-BIPM-0182',
      issueDate: '2024-03-15T00:00:00.000Z',
      expiryDate: '2029-03-15T00:00:00.000Z',
      certificateUrl: 'https://capacity-connect.moes.gov.in/verify/WMO-RTC-2024-BIPM-0182',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'cert-2',
      title: 'Advanced Doppler Weather Radar Operations & Velocity De-aliasing',
      issuingOrganization:
        'India Meteorological Department Central Training Institute (CTI) Pashan',
      credentialId: 'IMD-CTI-DWR-2023-8891',
      issueDate: '2023-11-20T00:00:00.000Z',
      expiryDate: null,
      certificateUrl: 'https://capacity-connect.moes.gov.in/verify/IMD-CTI-DWR-2023-8891',
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'cert-3',
      title: 'INSAT-3DR Multispectral Imagery and Severe Storm Nowcasting',
      issuingOrganization: 'Space Applications Centre (ISRO) & Ministry of Earth Sciences',
      credentialId: 'ISRO-SAC-MoES-2023-402',
      issueDate: '2023-05-10T00:00:00.000Z',
      expiryDate: null,
      certificateUrl: 'https://capacity-connect.moes.gov.in/verify/ISRO-SAC-MoES-2023-402',
      verificationStatus: 'VERIFIED',
    },
  ],
};

export const domainSuggestedSkills = [
  'Nowcasting Severe Convective Storms',
  'Radiosonde Upper-Air Sounding',
  'High-Resolution NWP Data Assimilation',
  'Lightning Detection Network Interpretation',
  'Aviation Meteorological Briefing',
  'Hydrometeorological Flood Forecasting',
];

export const domainSuggestedInterests = [
  'Mesoscale Modeling with WRF-ARW',
  'Dual-Polarimetric Radar Applications',
  'Atmospheric Boundary Layer Physics',
  'Aerosol-Cloud Radiation Interactions',
  'Urban Heat Island Dynamics',
  'Disaster Warning Communications',
];
