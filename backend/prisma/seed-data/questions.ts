export interface AssessmentQuestionSeed {
  topicCode: string;
  questionText: string;
  difficulty: number; // 0.1 to 1.0
  marks: number;
  explanation: string;
  options: Array<{
    optionText: string;
    isCorrect: boolean;
  }>;
}

export const QUESTIONS_SEED: AssessmentQuestionSeed[] = [
  // ATM_STRUCT
  {
    topicCode: 'ATM_STRUCT',
    questionText: 'In the standard atmosphere, the environmental temperature increases with height in the stratosphere primarily due to:',
    difficulty: 0.3,
    marks: 5,
    explanation: 'Solar ultraviolet (UV) radiation is absorbed by stratospheric ozone (O3), converting radiant energy into thermal kinetic energy and creating a strong temperature inversion.',
    options: [
      { optionText: 'Absorption of solar ultraviolet radiation by ozone (O3)', isCorrect: true },
      { optionText: 'Direct conductive heating from the Earth surface', isCorrect: false },
      { optionText: 'Latent heat release from deep cumulonimbus towers', isCorrect: false },
      { optionText: 'Adiabatic compression of descending polar vortices', isCorrect: false },
    ],
  },
  {
    topicCode: 'ATM_STRUCT',
    questionText: 'The average height of the tropical tropopause over the Indian subcontinent during the Southwest Monsoon is approximately:',
    difficulty: 0.5,
    marks: 5,
    explanation: 'Over tropical latitudes, intense convective heating pushes the tropopause to 16–18 km (approximately 100 hPa), whereas over polar regions it sits near 8–10 km.',
    options: [
      { optionText: '16 to 18 km (~100 hPa)', isCorrect: true },
      { optionText: '8 to 10 km (~300 hPa)', isCorrect: false },
      { optionText: '11 to 12 km (~250 hPa)', isCorrect: false },
      { optionText: '22 to 25 km (~30 hPa)', isCorrect: false },
    ],
  },

  // ATM_PRESS
  {
    topicCode: 'ATM_PRESS',
    questionText: 'According to the hypsometric equation, the geopotential thickness of the 1000–500 hPa atmospheric layer is directly proportional to:',
    difficulty: 0.5,
    marks: 5,
    explanation: 'The hypsometric equation Delta Z = (R_d * T_v_bar / g_0) * ln(p1/p2) demonstrates that thickness is directly proportional to the mean virtual temperature of the layer.',
    options: [
      { optionText: 'The mean virtual temperature of the atmospheric layer', isCorrect: true },
      { optionText: 'The surface relative humidity at the lower boundary', isCorrect: false },
      { optionText: 'The Coriolis parameter at the specific latitude', isCorrect: false },
      { optionText: 'The planetary boundary layer wind speed', isCorrect: false },
    ],
  },
  {
    topicCode: 'ATM_PRESS',
    questionText: 'When reducing surface station pressure to Mean Sea Level (MSL) at a high-elevation station, an overestimated assumed virtual temperature will cause the computed MSL pressure to be:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'A warmer assumed virtual temperature reduces the fictitious air column density, resulting in an underestimation of the pressure increment added to reach sea level.',
    options: [
      { optionText: 'Falsely lower than the actual sea level pressure', isCorrect: true },
      { optionText: 'Falsely higher than the actual sea level pressure', isCorrect: false },
      { optionText: 'Completely unchanged because elevation dominates', isCorrect: false },
      { optionText: 'Oscillating dynamically with the diurnal cycle', isCorrect: false },
    ],
  },

  // ATM_TEMP
  {
    topicCode: 'ATM_TEMP',
    questionText: 'Under clear-sky, calm wind conditions at night, the strongest surface radiation inversion typically develops:',
    difficulty: 0.4,
    marks: 5,
    explanation: 'Radiational cooling of the ground emits longwave IR continuously throughout the night, reaching maximum cumulative thermal loss just around or shortly after sunrise.',
    options: [
      { optionText: 'Just before or around sunrise', isCorrect: true },
      { optionText: 'Precisely at local solar midnight', isCorrect: false },
      { optionText: 'Immediately after sunset', isCorrect: false },
      { optionText: 'At 03:00 local standard time', isCorrect: false },
    ],
  },

  // ATM_HUMID
  {
    topicCode: 'ATM_HUMID',
    questionText: 'If an air parcel with a dry-bulb temperature of 32°C and a dew point of 24°C is cooled isobarically (at constant pressure) until condensation begins, its final temperature is:',
    difficulty: 0.4,
    marks: 5,
    explanation: 'By definition, the dew point temperature is the temperature to which an air parcel must be cooled isobarically at constant moisture content to reach saturation (100% RH).',
    options: [
      { optionText: '24°C', isCorrect: true },
      { optionText: '28°C (the wet-bulb temperature)', isCorrect: false },
      { optionText: '32°C', isCorrect: false },
      { optionText: '0°C', isCorrect: false },
    ],
  },

  // ATM_STAB
  {
    topicCode: 'ATM_STAB',
    questionText: 'An atmospheric layer where a vertically displaced parcel tends to return toward its original position is generally described as:',
    difficulty: 0.3,
    marks: 5,
    explanation: 'In a statically stable atmosphere, the environmental lapse rate is less than the parcel lapse rate, meaning a displaced parcel is colder/denser than surrounding air and returns downward.',
    options: [
      { optionText: 'Statically Stable', isCorrect: true },
      { optionText: 'Absolutely Unstable', isCorrect: false },
      { optionText: 'Conditionally Unstable', isCorrect: false },
      { optionText: 'Superadiabatic', isCorrect: false },
    ],
  },
  {
    topicCode: 'ATM_STAB',
    questionText: 'On a thermodynamic tephigram, Convective Available Potential Energy (CAPE) represents the positive area bounded between the parcel trajectory and the environmental sounding from:',
    difficulty: 0.7,
    marks: 5,
    explanation: 'CAPE is the integrated buoyant energy from the Level of Free Convection (LFC), where the parcel first becomes warmer than the environment, up to the Equilibrium Level (EL).',
    options: [
      { optionText: 'The Level of Free Convection (LFC) to the Equilibrium Level (EL)', isCorrect: true },
      { optionText: 'The Lifting Condensation Level (LCL) to the Level of Free Convection (LFC)', isCorrect: false },
      { optionText: 'The Surface to the Lifting Condensation Level (LCL)', isCorrect: false },
      { optionText: 'The Equilibrium Level (EL) to the Tropopause', isCorrect: false },
    ],
  },
  {
    topicCode: 'ATM_STAB',
    questionText: 'A high CAPE value (> 2500 J/kg) coupled with moderate Convective Inhibition (CIN ~ 50-100 J/kg) over Gangetic West Bengal in pre-monsoon (Kalbaishakhi) signifies:',
    difficulty: 0.8,
    marks: 5,
    explanation: 'Moderate CIN acts as a thermodynamic "cap" preventing premature shallow convection, allowing explosive heat and moisture buildup until breached by mesoscale triggers.',
    options: [
      { optionText: 'High potential for explosive supercell thunderstorm outbreak upon cap breach', isCorrect: true },
      { optionText: 'Complete suppression of all thunderstorm activity for the day', isCorrect: false },
      { optionText: 'Widespread non-convective light stratiform drizzle', isCorrect: false },
      { optionText: 'Immediate subsidence and atmospheric drying within the boundary layer', isCorrect: false },
    ],
  },

  // ATM_WIND
  {
    topicCode: 'ATM_WIND',
    questionText: 'In the Northern Hemisphere, when geostrophic wind veers (rotates clockwise) with height between 850 hPa and 500 hPa, thermal wind balance dictates that the layer exhibits:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'Veering of the geostrophic wind with height indicates warm thermal advection (WAA) within that layer, which is kinematically associated with synoptic-scale upward vertical motion.',
    options: [
      { optionText: 'Warm thermal advection (WAA) and synoptic-scale ascent', isCorrect: true },
      { optionText: 'Cold thermal advection (CAA) and synoptic subsidence', isCorrect: false },
      { optionText: 'Pure barotropic flow with zero thermal advection', isCorrect: false },
      { optionText: 'Intense cross-isobaric frictional convergence', isCorrect: false },
    ],
  },

  // OBS_SURF
  {
    topicCode: 'OBS_SURF',
    questionText: 'According to WMO and IMD standard observation guidelines, the thermometers inside a standard Stevenson Screen must be mounted at what height above ground level?',
    difficulty: 0.4,
    marks: 5,
    explanation: 'WMO No. 8 and IMD siting regulations mandate that thermometer bulbs inside a louvred screen must be located between 1.25 and 2.0 meters (standard ~1.5 m) above ground.',
    options: [
      { optionText: '1.25 to 2.0 meters (nominally ~1.5 m)', isCorrect: true },
      { optionText: '0.25 to 0.5 meters', isCorrect: false },
      { optionText: '3.0 to 4.0 meters', isCorrect: false },
      { optionText: '10.0 meters above rooftop', isCorrect: false },
    ],
  },

  // OBS_AWS
  {
    topicCode: 'OBS_AWS',
    questionText: 'In an operational IMD Automatic Weather Station (AWS), the typical data reporting interval via INSAT satellite datalogger telemetry during standard non-cyclone mode is:',
    difficulty: 0.5,
    marks: 5,
    explanation: 'Standard IMD AWS telemetry transmits automated observation packets hourly via INSAT pseudo-random transmissions, stepping up to 15-minute or 10-minute intervals during severe storm modes.',
    options: [
      { optionText: 'Hourly (60 minutes)', isCorrect: true },
      { optionText: 'Every 24 hours at 08:30 IST', isCorrect: false },
      { optionText: 'Continuous 1-second streaming', isCorrect: false },
      { optionText: 'Once every 6 hours', isCorrect: false },
    ],
  },

  // OBS_CALIB
  {
    topicCode: 'OBS_CALIB',
    questionText: 'A digital barometric pressure transducer deployed in an AWS shows a continuous drift of +0.8 hPa relative to a portable reference standard. The proper remedial action is:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'A systematic offset across all pressures is resolved by entering an offset calibration correction in the datalogger firmware while tracking the drift rate in the station calibration log.',
    options: [
      { optionText: 'Apply firmware offset adjustment after multi-point calibration verification', isCorrect: true },
      { optionText: 'Immediately discard the barometer without laboratory testing', isCorrect: false },
      { optionText: 'Manually adjust the station elevation parameter to mask the error', isCorrect: false },
      { optionText: 'Disable pressure reporting from the AWS permanently', isCorrect: false },
    ],
  },

  // OBS_QC
  {
    topicCode: 'OBS_QC',
    questionText: 'A surface weather station records a sudden drop in dry-bulb temperature from 38°C to 24°C in 15 minutes accompanied by wind gusts of 65 km/h. An automated QC algorithm should:',
    difficulty: 0.7,
    marks: 5,
    explanation: 'A rapid temperature drop accompanied by wind gusts and pressure jumps is characteristic of a thunderstorm outflow boundary (gust front) and should pass cross-sensor consistency checks.',
    options: [
      { optionText: 'Validate the event as an authentic gust front via cross-sensor wind/pressure corroboration', isCorrect: true },
      { optionText: 'Hard-reject the record immediately as an unphysical sensor spike', isCorrect: false },
      { optionText: 'Replace the temperature reading with the previous hour value automatically', isCorrect: false },
      { optionText: 'Flag the station as completely offline', isCorrect: false },
    ],
  },

  // SYN_MET
  {
    topicCode: 'SYN_MET',
    questionText: 'In upper-tropospheric synoptic analysis, the equatorward entrance and poleward exit regions of a straight jet streak are kinematically characterized by:',
    difficulty: 0.7,
    marks: 5,
    explanation: 'Jet streak transverse circulations create upper-level divergence in the right-entrance and left-exit quadrants (equatorward entrance and poleward exit in Northern Hemisphere), favoring ascent.',
    options: [
      { optionText: 'Upper-level divergence and promoted synoptic-scale ascent', isCorrect: true },
      { optionText: 'Upper-level convergence and severe atmospheric subsidence', isCorrect: false },
      { optionText: 'Purely nondivergent barotropic geostrophic equilibrium', isCorrect: false },
      { optionText: 'Rapid dissipation of all pre-existing cloudiness', isCorrect: false },
    ],
  },

  // SYN_MAPS
  {
    topicCode: 'SYN_MAPS',
    questionText: 'On an Indian synoptic weather chart, streamline analysis is preferred over isobaric/geopotential height contours in the low latitudes (below 15°N) because:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'Near the equator, the Coriolis force approaches zero (f = 2*Omega*sin(phi) -> 0), weakening the geostrophic balance; kinematic wind streamline analysis is far more informative than pressure gradients.',
    options: [
      { optionText: 'The Coriolis parameter f is small, so geostrophic balance is weak', isCorrect: true },
      { optionText: 'Tropical weather systems do not produce any pressure variations', isCorrect: false },
      { optionText: 'Upper-air radiosonde observations cannot measure pressure in the tropics', isCorrect: false },
      { optionText: 'Isobars cannot physically be drawn across the equator', isCorrect: false },
    ],
  },

  // SYN_CYCLONE
  {
    topicCode: 'SYN_CYCLONE',
    questionText: 'During tropical cyclogenesis in the North Indian Ocean, which Sea Surface Temperature (SST) and vertical wind shear thresholds are most conducive?',
    difficulty: 0.6,
    marks: 5,
    explanation: 'Warm ocean water (SST >= 26.5°C to depth of ~50m) provides essential latent heat flux, while low vertical wind shear (< 10-15 knots between 850 and 200 hPa) prevents tilting of the vortex core.',
    options: [
      { optionText: 'SST >= 26.5°C and low vertical wind shear (< 10–15 knots)', isCorrect: true },
      { optionText: 'SST < 22.0°C and strong vertical wind shear (> 35 knots)', isCorrect: false },
      { optionText: 'SST >= 35.0°C with dry mid-tropospheric air', isCorrect: false },
      { optionText: 'SST independent with easterly vertical shear > 40 knots', isCorrect: false },
    ],
  },

  // SYN_THUNDER
  {
    topicCode: 'SYN_THUNDER',
    questionText: 'What distinguishes a supercell thunderstorm from an ordinary single-cell or multicell thunderstorm?',
    difficulty: 0.7,
    marks: 5,
    explanation: 'A supercell is uniquely characterized by a deep, persistently rotating updraft known as a mesocyclone, driven by vertical wind shear vorticity tilting.',
    options: [
      { optionText: 'A persistent, deep rotating updraft known as a mesocyclone', isCorrect: true },
      { optionText: 'A much shorter lifespan of less than 15 minutes', isCorrect: false },
      { optionText: 'The absence of any downdraft or precipitation core', isCorrect: false },
      { optionText: 'It only occurs over oceanic water surfaces', isCorrect: false },
    ],
  },

  // RAD_FUND
  {
    topicCode: 'RAD_FUND',
    questionText: 'In Doppler weather radar velocity dealiasing, the Maximum Unambiguous Velocity (V_max) is directly proportional to:',
    difficulty: 0.7,
    marks: 5,
    explanation: 'V_max = (lambda * PRF) / 4. Increasing the radar wavelength (lambda) or the Pulse Repetition Frequency (PRF) expands the unambiguous Nyquist velocity interval.',
    options: [
      { optionText: 'Radar wavelength (lambda) and Pulse Repetition Frequency (PRF)', isCorrect: true },
      { optionText: 'Antenna rotation rate and beam width', isCorrect: false },
      { optionText: 'Transmitter peak power and receiver bandwidth', isCorrect: false },
      { optionText: 'Atmospheric refractive index gradient', isCorrect: false },
    ],
  },

  // SAT_FUND
  {
    topicCode: 'SAT_FUND',
    questionText: 'In INSAT-3DR thermal infrared imagery (10.8 micrometers), deep convective cloud tops appear distinctly bright/white because:',
    difficulty: 0.5,
    marks: 5,
    explanation: 'The 10.8 um TIR channel measures terrestrial and cloud thermal radiance. High cumulonimbus cloud tops near the tropopause are extremely cold (-60°C to -80°C) and are conventionally displayed as bright white.',
    options: [
      { optionText: 'Their extremely cold cloud-top temperatures emit low thermal radiance', isCorrect: true },
      { optionText: 'They reflect large amounts of solar visible light at night', isCorrect: false },
      { optionText: 'Ozone emission peaks within convective anvil clouds', isCorrect: false },
      { optionText: 'The sensor saturates due to liquid droplet scattering', isCorrect: false },
    ],
  },

  // NWP_FUND
  {
    topicCode: 'NWP_FUND',
    questionText: 'The Courant-Friedrichs-Lewy (CFL) numerical stability condition in an explicit finite-difference atmospheric model requires that:',
    difficulty: 0.8,
    marks: 5,
    explanation: 'The CFL criterion (c * Delta t / Delta x <= 1) requires that the numerical wave propagation speed does not exceed the grid resolution speed, preventing unbounded exponential error growth.',
    options: [
      { optionText: 'The time step Delta t must be less than Delta x divided by maximum wave speed', isCorrect: true },
      { optionText: 'The spatial resolution Delta x must be equal to the Rossby radius', isCorrect: false },
      { optionText: 'The vertical layers must be spaced logarithmically in pressure', isCorrect: false },
      { optionText: 'The boundary conditions must be periodic in all three dimensions', isCorrect: false },
    ],
  },

  // FCST_NOWCAST
  {
    topicCode: 'FCST_NOWCAST',
    questionText: 'In radar-based convective nowcasting, a sudden "lightning jump" (rapid surge in total lightning flash rate) typically precedes:',
    difficulty: 0.7,
    marks: 5,
    explanation: 'A sharp surge in total lightning flash rate reflects rapid updraft intensification in the mixed-phase zone, typically preceding severe surface weather (hail, microbursts) by 10–25 minutes.',
    options: [
      { optionText: 'Severe surface weather (large hail, damaging downbursts) by 10 to 25 minutes', isCorrect: true },
      { optionText: 'Immediate dissipation and total collapse of the thunderstorm cell', isCorrect: false },
      { optionText: 'Transition of convective clouds into non-precipitating cirrus', isCorrect: false },
      { optionText: 'A shift to stratified steady stratiform rain for over 12 hours', isCorrect: false },
    ],
  },

  // FCST_VERIF
  {
    topicCode: 'FCST_VERIF',
    questionText: 'In 2x2 dichotomous weather forecast verification, if a model predicts rain 20 times and rain occurs 15 times, while rain occurs 5 times unpredicted, the False Alarm Ratio (FAR) is:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'FAR = False Alarms / (Hits + False Alarms) = (20 - 15) / 20 = 5 / 20 = 0.25 (25%).',
    options: [
      { optionText: '0.25 (25%)', isCorrect: true },
      { optionText: '0.75 (75%)', isCorrect: false },
      { optionText: '0.20 (20%)', isCorrect: false },
      { optionText: '0.33 (33%)', isCorrect: false },
    ],
  },

  // CLIM_INDICES
  {
    topicCode: 'CLIM_INDICES',
    questionText: 'The ETCCDI extreme climate index "R95p" represents:',
    difficulty: 0.6,
    marks: 5,
    explanation: 'R95p represents annual total precipitation from days exceeding the 95th percentile of the wet-day baseline climatology, indicating extreme rainfall intensity contributions.',
    options: [
      { optionText: 'Annual total precipitation from very wet days (> 95th percentile)', isCorrect: true },
      { optionText: 'The count of consecutive dry days in a given year', isCorrect: false },
      { optionText: 'The 95th percentile of maximum daily temperatures', isCorrect: false },
      { optionText: 'The ratio of monsoon rain to non-monsoon annual rainfall', isCorrect: false },
    ],
  },

  // OPS_WARNING
  {
    topicCode: 'OPS_WARNING',
    questionText: 'Under IMD official color-coded warning guidelines, an "ORANGE ALERT" (Be Prepared) instructs disaster managers to:',
    difficulty: 0.5,
    marks: 5,
    explanation: 'Orange Alert signifies "Be Prepared" for expected severe weather disruptions and structural impacts, prompting pre-positioning of response teams before escalation to Red (Take Action).',
    options: [
      { optionText: 'Be Prepared: Monitor advisories and keep emergency response machinery ready', isCorrect: true },
      { optionText: 'Take Action: Immediate evacuation and emergency protocol activation', isCorrect: false },
      { optionText: 'No Warning: Routine conditions with no advisory action necessary', isCorrect: false },
      { optionText: 'Post-Disaster Recovery: Immediate reconstruction operations', isCorrect: false },
    ],
  },
];
