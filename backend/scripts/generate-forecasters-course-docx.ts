import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
} from 'docx';

async function generateForecastersDocx() {
  const outputPath = path.join(process.cwd(), 'uploads', 'Forecasters_Training_Course.docx');
  const uploadDir = path.dirname(outputPath);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'Forecasters Training Course',
            heading: HeadingLevel.TITLE,
          }),

          // Table of Contents (Must be detected and stripped so it does not become duplicate lessons!)
          new Paragraph({
            text: 'Table of Contents',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: 'Course Overview ................................................................ 2' }),
          new Paragraph({ text: 'Course-Level Learning Outcomes ................................................. 3' }),
          new Paragraph({ text: 'Target Audience & Prerequisites ................................................. 4' }),
          new Paragraph({ text: 'Module 1: Advanced Atmospheric Dynamics & NWP ................................... 5' }),
          new Paragraph({ text: '  1. Circulation Theorems and Pressure Systems ................................. 6' }),
          new Paragraph({ text: '  2. Atmospheric Waves and Instabilities ....................................... 8' }),
          new Paragraph({ text: '  3. Planetary Boundary Layer and Turbulence ................................... 10' }),
          new Paragraph({ text: '  4. Numerical Weather Prediction and Data Assimilation ........................ 12' }),
          new Paragraph({ text: 'Module 2: Physical Meteorology ................................................. 14' }),
          new Paragraph({ text: '  1. Cloud Microphysics ........................................................ 15' }),
          new Paragraph({ text: '  2. Radiation Processes ....................................................... 17' }),
          new Paragraph({ text: '  3. Aerosols and Optical Phenomena ............................................ 19' }),
          new Paragraph({ text: '  4. Atmospheric Electricity ................................................... 21' }),
          new Paragraph({ text: 'Module 3: Synoptic Weather Analysis and Forecasting ............................ 23' }),
          new Paragraph({ text: '  1. Surface and Upper-Air Synoptic Charts ..................................... 24' }),
          new Paragraph({ text: '  2. Frontal Systems and Mid-Latitude Cyclones ................................. 26' }),
          new Paragraph({ text: '  3. Tropical Cyclogenesis and Monsoon Depressions ............................. 28' }),
          new Paragraph({ text: '  4. Mesoscale Convective Systems and Thunderstorms ............................ 30' }),
          new Paragraph({ text: 'Module 4: Radar and Satellite Remote Sensing ................................... 32' }),
          new Paragraph({ text: '  1. Doppler Radar Principles and Reflectivity ................................. 33' }),
          new Paragraph({ text: '  2. Velocity Azimuth Display and Storm Tracking ............................... 35' }),
          new Paragraph({ text: '  3. Geostationary INSAT-3DR Multispectral Imagery ............................. 37' }),
          new Paragraph({ text: '  4. Quantitative Precipitation Estimation (QPE) ............................... 39' }),
          new Paragraph({ text: 'Module 5: Ocean and Marine Weather Operations .................................. 41' }),
          new Paragraph({ text: '  1. Ocean Surface Wind Stress and Wave Dynamics ............................... 42' }),
          new Paragraph({ text: '  2. Storm Surge Modeling and Coastal Inundation ............................... 44' }),
          new Paragraph({ text: '  3. Marine Forecasting and High Seas Bulletins ................................ 46' }),
          new Paragraph({ text: '  4. Tsunami Warning Principles and INCOIS Integration ......................... 48' }),
          new Paragraph({ text: 'Module 6: Severe Weather Warning and Operational Decisions ..................... 50' }),
          new Paragraph({ text: '  1. Warning Dissemination and Impact-Based Forecasting ........................ 51' }),
          new Paragraph({ text: '  2. Heat Wave and Cold Wave Advisory Protocols ................................ 53' }),
          new Paragraph({ text: '  3. Heavy Rainfall and Urban Flooding Nowcasting .............................. 55' }),
          new Paragraph({ text: '  4. Disaster Management Authority Coordination ................................ 57' }),
          new Paragraph({ text: 'Module 7: Statistics and Computer Applications ................................. 59' }),
          new Paragraph({ text: '  1. Applied Statistics in Meteorology ......................................... 60' }),
          new Paragraph({ text: '  2. Numerical Methods and Grid Discretization ................................. 62' }),
          new Paragraph({ text: '  3. Scientific Python Programming for Meteorological Data ..................... 64' }),
          new Paragraph({ text: '  4. Forecast Systems Architecture and GRIB2 Processing ........................ 66' }),
          new Paragraph({ text: 'Glossary ....................................................................... 68' }),
          new Paragraph({ text: 'References ..................................................................... 70' }),

          // Course-Level Special Sections
          new Paragraph({
            text: 'Course Overview',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'The Forecasters Training Course is an advanced operational curriculum established under the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD). Designed to transition scientific meteorological fundamentals into mission-critical weather forecasting, severe weather warnings, and numerical modeling capabilities.',
          }),

          new Paragraph({
            text: 'Course-Level Learning Outcomes',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '• Formulate synoptic and mesoscale forecasts across tropical and sub-tropical regimes.' }),
          new Paragraph({ text: '• Interpret multi-Doppler radar reflectivity and radial velocity vectors to issue severe storm alerts.' }),
          new Paragraph({ text: '• Process NWP data assimilation fields (WRF/GFS) and evaluate model uncertainties.' }),
          new Paragraph({ text: '• Coordinate emergency advisories with disaster management authorities.' }),

          new Paragraph({
            text: 'Target Audience',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'Operational Meteorologists, Scientific Officers, Radar Analysts, and Weather Forecasting Leads stationed at National and Regional Weather Forecasting Centres.',
          }),

          new Paragraph({
            text: 'Prerequisites',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: 'Graduate coursework in physics, mathematics, or meteorology; familiarity with basic thermodynamics and fluid dynamics.',
          }),

          // MODULE 1
          new Paragraph({
            text: 'Module 1: Advanced Atmospheric Dynamics & NWP',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: 'Module Overview: Rigorous mathematical treatment of atmospheric motions and numerical prediction schemes.' }),

          // M1 - Lesson 1
          new Paragraph({
            text: '1. Circulation Theorems and Pressure Systems',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Apply Kelvin and Bjerknes circulation theorems to rotating atmospheric systems.' }),
          new Paragraph({ text: '• Calculate geostrophic and gradient wind balances under variable Coriolis parameters.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Atmospheric circulation describes the large-scale movement of air that redistributes thermal energy from equator to poles. According to Kelvin theorem, absolute circulation along a closed fluid loop is conserved in barotropic ideal fluids.' }),
          new Paragraph({ text: 'Note: In baroclinic atmospheres, solenoidal terms generate circulation and baroclinic vorticity.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Solenoidal forcing drives secondary circulation around frontal boundaries.' }),
          new Paragraph({ text: 'Knowledge Check:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '1. Under barotropic assumptions, what happens to absolute circulation in an inviscid fluid loop?' }),
          new Paragraph({ text: 'A) It increases monotonically.' }),
          new Paragraph({ text: 'B) It is strictly conserved.' }),
          new Paragraph({ text: 'C) It degrades exponentially due to Coriolis forces.' }),
          new Paragraph({ text: 'D) It depends on surface topography.' }),
          new Paragraph({ text: 'Answer: B' }),

          // M1 - Lesson 2
          new Paragraph({
            text: '2. Atmospheric Waves and Instabilities',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Derive dispersion relations for planetary Rossby waves.' }),
          new Paragraph({ text: '• Evaluate baroclinic instability growth rates using the Eady and Charney models.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Planetary Rossby waves emerge from the latitudinal variation of the Coriolis parameter (beta effect). These waves govern the migration of synoptic troughs and ridges across mid-latitudes.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Phase speed of Rossby waves is westward relative to background zonal flow.' }),
          new Paragraph({ text: 'Knowledge Check:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '1. What fundamental mechanism provides the restoring force for planetary Rossby waves?' }),
          new Paragraph({ text: 'A) Buoyancy oscillation.' }),
          new Paragraph({ text: 'B) Conservation of potential vorticity on a beta plane.' }),
          new Paragraph({ text: 'C) Centrifugal acceleration.' }),
          new Paragraph({ text: 'D) Surface thermal contrast.' }),
          new Paragraph({ text: 'Answer: B' }),

          // M1 - Lesson 3
          new Paragraph({
            text: '3. Planetary Boundary Layer and Turbulence',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Characterize laminar, transition, and fully turbulent flow regimes in the boundary layer.' }),
          new Paragraph({ text: '• Parameterize Reynolds stresses using eddy viscosity formulations.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'The planetary boundary layer is the lowest atmospheric layer directly impacted by surface friction and diurnal heating cycles. Turbulence redistributes momentum and moisture upwards into the free troposphere.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Ekman layer cross-isobaric flow drives low-level convergence.' }),

          // M1 - Lesson 4
          new Paragraph({
            text: '4. Numerical Weather Prediction and Data Assimilation',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Formulate cost functions for 3D-Var and 4D-Var variational data assimilation.' }),
          new Paragraph({ text: '• Evaluate background error covariance matrices (B-matrix) in operational WRF/GFS runs.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Numerical Weather Prediction solves the discretized Navier-Stokes, thermodynamic, and moisture conservation equations. Data assimilation statistically blends background model forecasts with heterogeneous observational soundings.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• High-quality data assimilation prevents rapid error propagation in non-linear forecasts.' }),

          // MODULE 2
          new Paragraph({
            text: 'Module 2: Physical Meteorology',
            heading: HeadingLevel.HEADING_1,
          }),

          // M2 - Lesson 1
          new Paragraph({
            text: '1. Cloud Microphysics',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Contrast warm rain coalescence with the Wegener-Bergeron-Findeisen ice process.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Cloud droplet growth initiates via condensation on cloud condensation nuclei (CCN) and accelerates through collision-coalescence when droplet radius exceeds 20 micrometers.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Supercooled liquid water rapidly deposits onto ice crystals due to vapor pressure differences.' }),

          // M2 - Lesson 2
          new Paragraph({
            text: '2. Radiation Processes',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Calculate radiative fluxes using Planck, Stefan-Boltzmann, and Beer-Lambert laws.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Atmospheric radiation maintains the global energy budget. Solar shortwave radiation peaks in visible bands while Earth emits longwave infrared thermal radiation.' }),
          new Paragraph({ text: 'Key Takeaways:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Greenhouse absorption occurs primarily in distinct vibrational-rotational molecular bands.' }),

          // M2 - Lesson 3
          new Paragraph({
            text: '3. Aerosols and Optical Phenomena',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Differentiate Rayleigh scattering from Mie scattering regimes based on size parameter.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Aerosols modulate radiative forcing directly through scattering and absorption and indirectly by altering cloud albedo and lifetime.' }),

          // M2 - Lesson 4
          new Paragraph({
            text: '4. Atmospheric Electricity',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: 'Learning Objectives:', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ text: '• Explain charge separation mechanisms in convective thunderstorm updrafts.' }),
          new Paragraph({ text: 'Content:' }),
          new Paragraph({ text: 'Non-inductive charge separation between colliding graupel pellets and ice crystals creates dipole electric field structures inside cumulonimbus clouds, leading to lightning discharges.' }),

          // MODULE 3
          new Paragraph({
            text: 'Module 3: Synoptic Weather Analysis and Forecasting',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '1. Surface and Upper-Air Synoptic Charts', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Plotting and analyzing standard pressure levels (850, 700, 500, 200 hPa).' }),
          new Paragraph({ text: '2. Frontal Systems and Mid-Latitude Cyclones', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Norwegian cyclone model, warm and cold conveyor belts.' }),
          new Paragraph({ text: '3. Tropical Cyclogenesis and Monsoon Depressions', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Warm ocean heat content > 26.5°C, low vertical wind shear, and vorticity triggers.' }),
          new Paragraph({ text: '4. Mesoscale Convective Systems and Thunderstorms', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: CAPE, CIN, and vertical shear index evaluation for severe squall lines.' }),

          // MODULE 4
          new Paragraph({
            text: 'Module 4: Radar and Satellite Remote Sensing',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '1. Doppler Radar Principles and Reflectivity', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Dual-polarization ZDR, KDP, and rho-HV for hydrometeor classification.' }),
          new Paragraph({ text: '2. Velocity Azimuth Display and Storm Tracking', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Radial velocity dealiasing, mesocyclone detection algorithms.' }),
          new Paragraph({ text: '3. Geostationary INSAT-3DR Multispectral Imagery', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Thermal infrared, water vapor, and visible channels for convective cloud monitoring.' }),
          new Paragraph({ text: '4. Quantitative Precipitation Estimation (QPE)', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Radar-gauge calibration and multisatellite rainfall algorithms.' }),

          // MODULE 5
          new Paragraph({
            text: 'Module 5: Ocean and Marine Weather Operations',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '1. Ocean Surface Wind Stress and Wave Dynamics', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Wave spectrum modeling and wind-sea vs swell differentiation.' }),
          new Paragraph({ text: '2. Storm Surge Modeling and Coastal Inundation', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Shallow water equations and bathymetric resonance effects.' }),
          new Paragraph({ text: '3. Marine Forecasting and High Seas Bulletins', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Safety of Life at Sea (SOLAS) protocol and maritime warning formats.' }),
          new Paragraph({ text: '4. Tsunami Warning Principles and INCOIS Integration', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Bottom pressure recorder signals and seismic source focal mechanisms.' }),

          // MODULE 6
          new Paragraph({
            text: 'Module 6: Severe Weather Warning and Operational Decisions',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '1. Warning Dissemination and Impact-Based Forecasting', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: WMO impact-based forecasting matrices integrating vulnerability and hazard.' }),
          new Paragraph({ text: '2. Heat Wave and Cold Wave Advisory Protocols', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Temperature departure criteria and thermal comfort indices.' }),
          new Paragraph({ text: '3. Heavy Rainfall and Urban Flooding Nowcasting', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Basin-scale hydrological thresholds and nowcasting lead times.' }),
          new Paragraph({ text: '4. Disaster Management Authority Coordination', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: NDMA / SDMA standard operating procedures and emergency briefing protocols.' }),

          // MODULE 7
          new Paragraph({
            text: 'Module 7: Statistics and Computer Applications',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '1. Applied Statistics in Meteorology', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Empirical orthogonal functions (EOF), probability distributions, and verification scores.' }),
          new Paragraph({ text: '2. Numerical Methods and Grid Discretization', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Arakawa staggered grids, spectral transforms, and semi-Lagrangian advection.' }),
          new Paragraph({ text: '3. Scientific Python Programming for Meteorological Data', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Xarray, MetPy, Cartopy, and Matplotlib workflows for operational forecasting.' }),
          new Paragraph({ text: '4. Forecast Systems Architecture and GRIB2 Processing', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: 'Content: Decoding GRIB2 and NetCDF4 streams, high-performance computing clusters.' }),

          // Course-Level Glossary
          new Paragraph({
            text: 'Glossary',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: 'CAPE: Convective Available Potential Energy (J/kg).' }),
          new Paragraph({ text: 'CIN: Convective Inhibition (J/kg).' }),
          new Paragraph({ text: 'Doppler Velocity: Radial component of hydrometeor motion towards or away from the radar antenna.' }),
          new Paragraph({ text: 'Reflectivity (Z): Radar parameter proportional to the sum of the sixth power of droplet diameters.' }),
          new Paragraph({ text: 'Baroclinicity: Atmospheric state where surfaces of constant pressure intersect surfaces of constant density.' }),
          new Paragraph({ text: 'Ekman Spiral: Vertical wind profile in the boundary layer where wind veers and accelerates with height.' }),

          // Course-Level References
          new Paragraph({
            text: 'References',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: '[1] Holton, J. R., & Hakim, G. J. (2012). An Introduction to Dynamic Meteorology. Academic Press.' }),
          new Paragraph({ text: '[2] Wallace, J. M., & Hobbs, P. V. (2006). Atmospheric Science: An Introductory Survey. Elsevier.' }),
          new Paragraph({ text: '[3] Doviak, R. J., & Zrnic, D. S. (2006). Doppler Radar and Weather Observations. Dover Publications.' }),
          new Paragraph({ text: '[4] World Meteorological Organization (WMO). Guide to Public Weather Services Practices, WMO-No. 833.' }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated authentic DOCX test file at: ${outputPath} (${buffer.length} bytes)`);
  return outputPath;
}

generateForecastersDocx().catch((err) => {
  console.error('Failed to generate test DOCX:', err);
  process.exit(1);
});
