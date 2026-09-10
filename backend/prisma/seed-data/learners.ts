export interface LearnerPersonaSeed {
  code: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentCode: string;
  designation: string;
  bio: string;
  personaType:
    | 'STRONG_BEGINNER'
    | 'WEAK_FUNDAMENTALS'
    | 'STRONG_OBSERVER'
    | 'STRONG_FORECASTER'
    | 'FORGETTING_RISK'
    | 'HIGH_SCORE_LOW_CONFIDENCE'
    | 'HINT_DEPENDENCY'
    | 'SLOW_BUT_ACCURATE'
    | 'RECENTLY_FAILED'
    | 'WELL_MASTERED'
    | 'MIXED_PROFILE'
    | 'COLD_START';
  expectedBehavior: string;
}

export const LEARNERS_SEED: LearnerPersonaSeed[] = [
  {
    code: 'LEARNER_A',
    email: 'learner-a@imd.gov.in',
    firstName: 'Aarav',
    lastName: 'Sharma',
    departmentCode: 'NWFC',
    designation: 'Probationary Scientific Assistant',
    bio: 'Recently joined IMD trainee with high aptitude for core atmospheric thermodynamics and physics, preparing for operational duties.',
    personaType: 'STRONG_BEGINNER',
    expectedBehavior: 'Strong fundamentals, low evidence count, moderate confidence, diagnostic recommendations for advanced domains.',
  },
  {
    code: 'LEARNER_B',
    email: 'learner-b@imd.gov.in',
    firstName: 'Bhavna',
    lastName: 'Patel',
    departmentCode: 'NWFC',
    designation: 'Meteorologist Trainee',
    bio: 'Attempted advanced thunderstorm and nowcasting topics without stabilizing foundational hydrostatics, pressure, and lapse rates.',
    personaType: 'WEAK_FUNDAMENTALS',
    expectedBehavior: 'Root prerequisite weakness detection: system identifies Atmospheric Stability as upstream blocker and prioritizes fundamental remediation.',
  },
  {
    code: 'LEARNER_C',
    email: 'learner-c@imd.gov.in',
    firstName: 'Chirag',
    lastName: 'Verma',
    departmentCode: 'INSTR',
    designation: 'Observational Systems Specialist',
    bio: 'Exemplary performance across surface observations, AWS telemetry, sensor calibration, and data QC; minimal forecasting experience.',
    personaType: 'STRONG_OBSERVER',
    expectedBehavior: 'Recommendations must focus on NWP, Radar, and Forecasting courses to bridge operational forecasting gap.',
  },
  {
    code: 'LEARNER_D',
    email: 'learner-d@imd.gov.in',
    firstName: 'Divya',
    lastName: 'Nair',
    departmentCode: 'NWFC',
    designation: 'Lead Synoptic Forecaster',
    bio: 'Extensive expertise in synoptic map analysis, cyclone tracking, and WRF interpretation; lacks formal sensor calibration background.',
    personaType: 'STRONG_FORECASTER',
    expectedBehavior: 'Recommendations must focus on instrumentation, sensor calibration, and data quality assurance.',
  },
  {
    code: 'LEARNER_E',
    email: 'learner-e@imd.gov.in',
    firstName: 'Eshaan',
    lastName: 'Mukherjee',
    departmentCode: 'NWFC',
    designation: 'Senior Duty Forecaster (Returning from Leave)',
    bio: 'Mastered synoptic weather analysis and tropical cyclogenesis 45 to 60 days ago; has not practiced since.',
    personaType: 'FORGETTING_RISK',
    expectedBehavior: 'Competency score remains reasonable, but retention decays and forgetting risk elevates (F > 0.60); revision engine schedules spaced retrieval.',
  },
  {
    code: 'LEARNER_F',
    email: 'learner-f@imd.gov.in',
    firstName: 'Farhan',
    lastName: 'Qureshi',
    departmentCode: 'RADAR',
    designation: 'Junior Radar Engineer',
    bio: 'Achieved 100% on 2 initial radar questions; evidence sample count is minimal (N=2).',
    personaType: 'HIGH_SCORE_LOW_CONFIDENCE',
    expectedBehavior: 'System must NOT assume mastery; confidence score remains low (< 0.40); prompts diagnostic verification rather than advanced promotion.',
  },
  {
    code: 'LEARNER_G',
    email: 'learner-g@imd.gov.in',
    firstName: 'Gitanjali',
    lastName: 'Rao',
    departmentCode: 'NWP',
    designation: 'NWP Assistant',
    bio: 'Consistently submits correct answers but heavily relies on hints and formula prompts on every attempt.',
    personaType: 'HINT_DEPENDENCY',
    expectedBehavior: 'Accuracy is high (> 85%), but independence score is heavily penalized; competency score is noticeably lower than independent Learner J.',
  },
  {
    code: 'LEARNER_H',
    email: 'learner-h@imd.gov.in',
    firstName: 'Harish',
    lastName: 'Chauhan',
    departmentCode: 'CRS',
    designation: 'Climate Analyst',
    bio: 'Methodical and highly accurate (90%+), but takes 3 to 4 times the expected duration to verify derivations.',
    personaType: 'SLOW_BUT_ACCURATE',
    expectedBehavior: 'Solid competency, but speedScore is reduced; treated as competent but deliberate learner.',
  },
  {
    code: 'LEARNER_I',
    email: 'learner-i@imd.gov.in',
    firstName: 'Ishita',
    lastName: 'Deshmukh',
    departmentCode: 'NWFC',
    designation: 'Severe Weather Duty Officer',
    bio: 'Previously competent, but suffered repeated severe failures in Nowcasting and Severe Weather Warning during yesterday shift.',
    personaType: 'RECENTLY_FAILED',
    expectedBehavior: 'Urgent remediation required; recent consecutive failures escalate priority and override cooldown suppression.',
  },
  {
    code: 'LEARNER_J',
    email: 'learner-j@imd.gov.in',
    firstName: 'Jitendra',
    lastName: 'Joshi',
    departmentCode: 'CTI',
    designation: 'Senior Meteorologist Instructor',
    bio: 'Consistently high performance (95%+) across repeated sessions spanning 60 days with high independence and fast response times.',
    personaType: 'WELL_MASTERED',
    expectedBehavior: 'High competency (> 90), high confidence (> 0.85), low revision priority, long review interval, maintain/challenge mode.',
  },
  {
    code: 'LEARNER_K',
    email: 'learner-k@imd.gov.in',
    firstName: 'Kavita',
    lastName: 'Sundaram',
    departmentCode: 'CRS',
    designation: 'Interdisciplinary Scientist',
    bio: 'Strong in climate indices and time-series analysis; moderate in synoptic analysis; weak in radar and satellite nowcasting.',
    personaType: 'MIXED_PROFILE',
    expectedBehavior: 'Personalized recommendations tailored to her specific skill gaps rather than globally popular generic courses.',
  },
  {
    code: 'LEARNER_L',
    email: 'learner-l@imd.gov.in',
    firstName: 'Lakshman',
    lastName: 'Pillai',
    departmentCode: 'NWFC',
    designation: 'Day-1 Inductee',
    bio: 'Newly onboarded officer with zero recorded learning events, assessments, or competencies.',
    personaType: 'COLD_START',
    expectedBehavior: 'Cold start handling: recommended foundational/beginner diagnostic assessments rather than aggressive advanced courses.',
  },
];
