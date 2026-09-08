import { CourseLearningOverview, LessonDetail } from '../types/learning-experience.types';

export const mockLearningCourses: Record<string, CourseLearningOverview> = {
  'course-1': {
    id: 'course-1',
    title: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    slug: 'satellite-meteorology-insat-3dr',
    description:
      'Comprehensive operational course on interpreting INSAT-3DR visible, thermal infrared, and water vapor channels for cloud classification, rapid convection detection, and derived atmospheric motion vectors.',
    category: 'SATELLITE_METEOROLOGY',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 1920,
    trainer: {
      id: 'trainer-1',
      name: 'Prof. A. Sharma',
      designation: 'Senior Scientist / Satellite Division',
      organizationName: 'Space Applications Centre (ISRO) & MoES',
      avatarUrl: null,
    },
    enrollment: {
      id: 'enroll-1',
      status: 'IN_PROGRESS',
      progressPercentage: 42,
      enrolledAt: '2024-01-15T00:00:00.000Z',
      lastAccessedAt: new Date().toISOString(),
    },
    totalModules: 3,
    totalLessons: 7,
    completedLessons: 3,
    currentLessonId: 'les-1-3',
    currentModuleId: 'mod-1',
    modules: [
      {
        id: 'mod-1',
        courseId: 'course-1',
        title: 'Module 1: Principles of Meteorological Satellite Remote Sensing',
        description:
          'Orbital mechanics, sensor specifications, and multispectral radiative transfer fundamentals.',
        orderIndex: 1,
        totalLessons: 3,
        completedLessons: 2,
        progressPercentage: 67,
        lessons: [
          {
            id: 'les-1-1',
            moduleId: 'mod-1',
            title: 'Lesson 1.1: Geostationary vs. Polar Orbiting Meteorological Satellites',
            description:
              'Comparison of temporal coverage, spatial resolution, and viewing geometry between INSAT-3DR/3DS and NOAA/MetOp platforms.',
            contentType: 'VIDEO',
            durationMinutes: 45,
            orderIndex: 1,
            isPreview: true,
            completed: true,
            progressPercentage: 100,
          },
          {
            id: 'les-1-2',
            moduleId: 'mod-1',
            title: 'Lesson 1.2: INSAT-3DR Imager & Sounder Technical Specifications',
            description:
              'Deep dive into channel central wavelengths: 0.65µm Visible, 3.9µm Short-wave IR, 6.7µm Water Vapor, and 10.8µm Thermal IR.',
            contentType: 'PDF',
            durationMinutes: 50,
            orderIndex: 2,
            isPreview: false,
            completed: true,
            progressPercentage: 100,
          },
          {
            id: 'les-1-3',
            moduleId: 'mod-1',
            title: 'Lesson 1.3: Radiative Transfer & Atmospheric Window Penetration',
            description:
              'Understanding atmospheric absorption bands, Planck blackbody radiation curves, and surface emissivity impacts on brightness temperature measurements.',
            contentType: 'VIDEO',
            durationMinutes: 40,
            orderIndex: 3,
            isPreview: false,
            completed: false,
            progressPercentage: 0,
          },
        ],
      },
      {
        id: 'mod-2',
        courseId: 'course-1',
        title: 'Module 2: Multispectral Interpretation & Convective Storm Nowcasting',
        description:
          'Utilizing thermal infrared and water vapor channels to identify severe thunderstorms, cloud top cooling rates, and squall lines.',
        orderIndex: 2,
        totalLessons: 2,
        completedLessons: 1,
        progressPercentage: 50,
        lessons: [
          {
            id: 'les-2-1',
            moduleId: 'mod-2',
            title: 'Lesson 2.1: Thermal Infrared Channel Analysis & Cloud-Top Cooling Rates',
            description:
              'Identifying overshooting convective tops, Enhanced-V signatures, and cold-U thermal patterns associated with severe mesoscale convective complexes.',
            contentType: 'VIDEO',
            durationMinutes: 55,
            orderIndex: 1,
            isPreview: false,
            completed: true,
            progressPercentage: 100,
          },
          {
            id: 'les-2-2',
            moduleId: 'mod-2',
            title: 'Lesson 2.2: Middle & Upper Tropospheric Water Vapor Channel Diagnostics',
            description:
              'Detecting upper-level vorticity maxes, jet streak streaks, and mid-tropospheric dry air intrusions preceding thunderstorm triggering.',
            contentType: 'DOCUMENT',
            durationMinutes: 45,
            orderIndex: 2,
            isPreview: false,
            completed: false,
            progressPercentage: 0,
          },
        ],
      },
      {
        id: 'mod-3',
        courseId: 'course-1',
        title: 'Module 3: Derived Meteorological Products & Quantitative Applications',
        description:
          'Extraction of Atmospheric Motion Vectors (AMVs), Quantitative Precipitation Estimates (HEM/IMSRA), and Outgoing Longwave Radiation (OLR).',
        orderIndex: 3,
        totalLessons: 2,
        completedLessons: 0,
        progressPercentage: 0,
        lessons: [
          {
            id: 'les-3-1',
            moduleId: 'mod-3',
            title: 'Lesson 3.1: Cloud Motion Vector (CMV) Generation & Quality Indicators',
            description:
              'Cross-correlation tracking algorithms, height assignment using water vapor slicing, and integration into NWP data assimilation systems.',
            contentType: 'VIDEO',
            durationMinutes: 60,
            orderIndex: 1,
            isPreview: false,
            completed: false,
            progressPercentage: 0,
          },
          {
            id: 'les-3-2',
            moduleId: 'mod-3',
            title: 'Lesson 3.2: Satellite-Derived Hydro-Estimator & Rainfall Validation',
            description:
              'Operational calibration of Hydro-Estimator Method (HEM) rainfall rates against IMD automatic rain gauge (ARG) network observations.',
            contentType: 'PDF',
            durationMinutes: 50,
            orderIndex: 2,
            isPreview: false,
            completed: false,
            progressPercentage: 0,
          },
        ],
      },
    ],
  },
};

export const mockLessonDetails: Record<string, LessonDetail> = {
  'les-1-1': {
    id: 'les-1-1',
    moduleId: 'mod-1',
    moduleTitle: 'Module 1: Principles of Meteorological Satellite Remote Sensing',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 1.1: Geostationary vs. Polar Orbiting Meteorological Satellites',
    description:
      'Explore orbital geometry, spatial coverage, and sensor architectures of geostationary satellites (INSAT-3DR/3DS at 74°E & 82°E) compared to low-Earth Sun-synchronous polar orbiters.',
    contentType: 'VIDEO',
    content: null,
    resourceUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationMinutes: 45,
    orderIndex: 1,
    completed: true,
    progressPercentage: 100,
    previousLessonId: null,
    nextLessonId: 'les-1-2',
    keyTakeaways: [
      'Geostationary satellites offer high temporal frequency (15-min scans / 4-min rapid scans) essential for nowcasting severe convective events across the Indian subcontinent.',
      'Polar orbiters offer sub-kilometer multi-channel microwave soundings invaluable for vertical thermodynamic profiling and NWP numerical initialization.',
      'Viewing angles towards high latitudes require limb correction and parallax adjustment when analyzing convective cloud top coordinates.',
    ],
    operationalChecklist: [
      'Confirm current INSAT-3DR scan sector mode (Asia-sector or rapid-scan).',
      'Cross-reference geostationary thermal infrared channels with polar microwave passes for convective core precipitation verification.',
      'Check navigation registration and land-sea boundary alignment before running automated feature trackers.',
    ],
    transcript:
      '[00:00] Welcome, Trainees and Scientific Officers, to Lesson 1.1 of our Advanced Satellite Meteorology curriculum under MoES Capacity Building.\n[03:15] Let us begin by inspecting the orbital mechanics of our geostationary orbiters located at 74 degrees and 82 degrees East longitude.\n[08:30] At an altitude of 35,786 kilometers, the orbital period precisely matches Earth’s rotation period of 23 hours, 56 minutes, and 4 seconds.\n[14:45] Notice how rapid-scan imagery allows us to compute cloud-top divergence and early storm development every 4 minutes.\n[24:10] In contrast, polar Sun-synchronous orbiters fly at 850 km, passing each tropical coordinate approximately twice per solar day, providing microwave soundings that penetrate non-precipitating cirrus clouds.',
  },
  'les-1-2': {
    id: 'les-1-2',
    moduleId: 'mod-1',
    moduleTitle: 'Module 1: Principles of Meteorological Satellite Remote Sensing',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 1.2: INSAT-3DR Imager & Sounder Technical Specifications',
    description:
      'Detailed study of the INSAT-3DR multispectral imager channels: Visible (0.55-0.75 µm), Short-wave Infrared (3.80-4.00 µm), Water Vapor (6.50-7.10 µm), Thermal Infrared 1 (10.3-11.3 µm), and Thermal Infrared 2 (11.5-12.5 µm).',
    contentType: 'PDF',
    content: `
# INSAT-3DR MULTISPECTRAL IMAGER & SOUNDER
## Operational Technical Reference Manual (MoES / ISRO SAC)

### 1. Optical Payload Characteristics
The INSAT-3DR platform carries two dedicated meteorological instruments:
1. **Multispectral Imager (6 Channels)**:
   - Visible: 0.65 µm (1 km Ground Resolution)
   - Shortwave Infrared (SWIR): 1.62 µm (1 km Ground Resolution)
   - Mid-Infrared (MIR): 3.9 µm (4 km Ground Resolution)
   - Water Vapor (WV): 6.7 µm (8 km Ground Resolution)
   - Thermal Infrared 1 (TIR-1): 10.8 µm (4 km Ground Resolution)
   - Thermal Infrared 2 (TIR-2): 12.0 µm (4 km Ground Resolution)

2. **19-Channel Infrared Sounder**:
   - 18 Infrared bands + 1 Visible band providing high-resolution vertical temperature profiles (Surface to 10 hPa) and moisture profiles (Surface to 300 hPa).

---

### 2. Operational Channel Applications

| Spectral Channel | Central Wavelength | Primary Operational Meteorological Target |
| :--- | :--- | :--- |
| **Visible (VIS)** | 0.65 µm | Cloud geometric structure, low-level stratus & fog, aerosol optical depth, snow cover mapping. |
| **Short-Wave IR (SWIR)**| 1.62 µm | Cloud phase discrimination (liquid water droplets vs. ice crystals), snow vs. cloud separation. |
| **Middle IR (MIR)** | 3.90 µm | Forest fire hot-spot detection, nighttime fog & low stratus detection via (TIR - MIR) difference. |
| **Water Vapor (WV)** | 6.70 µm | Middle and upper tropospheric moisture (500–200 hPa), jet stream axes, dry slot intrusions. |
| **Thermal IR 1 (TIR1)**| 10.8 µm | Cloud-top temperature (CTT), cloud-top height (CTH), convective vigor, tropical cyclone Dvorak analysis. |
| **Split Window (TIR2)**| 12.0 µm | Total precipitable water (TPW) retrieval, atmospheric water vapor attenuation correction, volcanic ash detection. |

---

### 3. Forecaster Best Practices for Severe Weather Nowcasting
- For thunderstorm tracking, monitor the **(TIR1 - WV)** brightness temperature difference. Positive values indicate overshooting cloud tops penetrating the tropopause into the stratosphere.
- For nighttime fog along the Indo-Gangetic Plains, use the **(TIR1 - MIR)** channel difference: water clouds have lower emissivity at 3.9 µm, producing negative differences of -2K to -6K.
    `,
    resourceUrl: 'https://www.wmo.int/pages/prog/sat/documents/INSAT-3DR-Users-Guide.pdf',
    durationMinutes: 50,
    orderIndex: 2,
    completed: true,
    progressPercentage: 100,
    previousLessonId: 'les-1-1',
    nextLessonId: 'les-1-3',
    keyTakeaways: [
      'The 6-channel imager provides 1 km visible and 4 km infrared resolution over the Indian Ocean Rim every 15 minutes.',
      'Split-window channels (10.8 µm & 12.0 µm) allow differential absorption corrections to isolate lower-tropospheric humidity.',
      'The 19-channel sounder delivers continuous atmospheric stability indices (Lifted Index, Total Totals, CAPE) prior to convective initiation.',
    ],
    operationalChecklist: [
      'Verify radiometric calibration flags before using brightness temperature thresholds.',
      'Apply split-window algorithm for sea surface temperature (SST) anomaly detection.',
      'Correlate water vapor dry slots with middle-tropospheric subsidence in synoptic charts.',
    ],
  },
  'les-1-3': {
    id: 'les-1-3',
    moduleId: 'mod-1',
    moduleTitle: 'Module 1: Principles of Meteorological Satellite Remote Sensing',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 1.3: Radiative Transfer & Atmospheric Window Penetration',
    description:
      'Examine the radiative transfer equation (RTE), Planck radiation law, atmospheric transmission windows, and surface emissivity impacts on satellite radiance calculations.',
    contentType: 'VIDEO',
    content: null,
    resourceUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationMinutes: 40,
    orderIndex: 3,
    completed: false,
    progressPercentage: 0,
    previousLessonId: 'les-1-2',
    nextLessonId: 'les-2-1',
    keyTakeaways: [
      'Atmospheric transmission windows (specifically 8–12 µm) permit direct observation of land and sea surfaces under cloud-free skies.',
      'Selective absorption by H2O, CO2, and O3 attenuates upwelling radiance according to the Schwarzschild form of the Radiative Transfer Equation.',
      'Effective brightness temperature requires accurate weighting functions for channel response peaks.',
    ],
    operationalChecklist: [
      'Identify surface thermal emission versus reflected solar radiation in the 3.9 µm channel during dawn/dusk transitions.',
      'Account for water vapor continuum absorption when analyzing tropical maritime air masses.',
    ],
    transcript:
      '[00:00] In this lecture, we examine the fundamental equations governing how radiation emitted by the Earth-atmosphere system reaches the satellite sensor.\n[04:20] Observe Planck’s radiation curve: at Earth’s average temperature of 288 Kelvin, the emission peak sits precisely in the thermal infrared window at approximately 10 micrometers.\n[12:10] The weighting function d(tau)/d(ln p) determines from which atmospheric layer the measured channel radiance originates.',
  },
  'les-2-1': {
    id: 'les-2-1',
    moduleId: 'mod-2',
    moduleTitle: 'Module 2: Multispectral Interpretation & Convective Storm Nowcasting',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 2.1: Thermal Infrared Channel Analysis & Cloud-Top Cooling Rates',
    description:
      'Operational techniques for calculating cloud-top brightness temperature drops, detecting overshooting tops, and issuing nowcast alerts for severe squall lines.',
    contentType: 'VIDEO',
    content: null,
    resourceUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationMinutes: 55,
    orderIndex: 1,
    completed: true,
    progressPercentage: 100,
    previousLessonId: 'les-1-3',
    nextLessonId: 'les-2-2',
    keyTakeaways: [
      'A cloud-top cooling rate exceeding 4°C per 15 minutes is a primary satellite indicator of severe updraft intensification.',
      'Cold-U or Enhanced-V shapes indicate a strong blocking updraft deflecting upper-tropospheric ambient winds around the storm core.',
    ],
    operationalChecklist: [
      'Apply color enhancement curve (BD curve / NHC curve) to 10.8 µm imagery.',
      'Measure minimum cloud-top temperature against the local tropopause sounding temperature.',
      'Issue thunderstorm advisory if cooling rate exceeds threshold for two consecutive scans.',
    ],
    transcript:
      '[00:00] In Lesson 2.1, we analyze real-time severe convective thunderstorms using INSAT-3DR thermal infrared imagery.\n[05:40] Notice this mesoscale convective system developing over Odisha and Gangetic West Bengal.\n[12:30] As the updraft penetrates the Equilibrium Level, the cloud top temperature plummets below -75°C.',
  },
  'les-2-2': {
    id: 'les-2-2',
    moduleId: 'mod-2',
    moduleTitle: 'Module 2: Multispectral Interpretation & Convective Storm Nowcasting',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 2.2: Middle & Upper Tropospheric Water Vapor Channel Diagnostics',
    description:
      'Interpret water vapor channel dark bands, dry slots, deformation zones, and jet stream isotach patterns for cyclogenesis forecasting.',
    contentType: 'DOCUMENT',
    content: `
# WATER VAPOR (6.7 µm) CHANNEL OPERATIONAL GUIDE
## India Meteorological Department — Synoptic Forecasters Handbook

### 1. Physical Principle of Water Vapor Imagery
Unlike visible and thermal channels that require clouds to produce useful signals, the 6.7 µm water vapor channel responds directly to water vapor gas concentration in the middle and upper troposphere (typically between 600 hPa and 250 hPa).

- **Dark / Warm Regions**: Dry air masses with little water vapor in the upper levels. Radiance originates from warmer, lower levels.
- **Bright / Cold Regions**: Moist upper troposphere or thick cirrus clouds. Radiance originates from cold, high altitudes.

---

### 2. Identifying Synoptic Features on 6.7 µm Imagery

#### A. Upper-Level Jet Streams
- The poleward side of a strong subtropical jet streak appears as a sharp gradient between very dry (dark) stratospheric air and moist (bright) tropical cirrus shields.
- Forecasters can locate the maximum wind isotach axis right along the dark-to-bright boundary.

#### B. Dry Slots & Cyclogenesis
- In developing tropical and extratropical low-pressure systems, the intrusion of a wedge-shaped dark dry slot indicates stratospheric air descending into the middle troposphere.
- This creates strong convective instability and marks the onset of rapid intensification.

#### C. Deformation Zones
- Col regions and stretching deformation axes are easily traceable through water vapor moisture streamlines, even in completely cloud-free regions.

---

### 3. Forecaster Standard Operating Procedure (SOP)
1. Inspect the 6.7 µm channel animation over a 6-hour moving loop.
2. Locate the core of the Subtropical Westerly Jet (SWJ) over Northern India during winter and the Tropical Easterly Jet (TEJ) during the monsoon.
3. If an advancing dry slot overruns moist boundary-layer maritime air from the Bay of Bengal, mark the convergence zone for localized severe squalls and hail alerts.
    `,
    resourceUrl: null,
    durationMinutes: 45,
    orderIndex: 2,
    completed: false,
    progressPercentage: 0,
    previousLessonId: 'les-2-1',
    nextLessonId: 'les-3-1',
    keyTakeaways: [
      'The water vapor channel reveals upper-tropospheric kinematics regardless of whether clouds have formed.',
      'Dark dry slots indicate dry air subsidence and high potential vorticity (PV) anomalies.',
    ],
    operationalChecklist: [
      'Trace deformation axes on synoptic worksheets.',
      'Verify jet stream core speed by tracking water vapor feature displacements.',
    ],
  },
  'les-3-1': {
    id: 'les-3-1',
    moduleId: 'mod-3',
    moduleTitle: 'Module 3: Derived Meteorological Products & Quantitative Applications',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 3.1: Cloud Motion Vector (CMV) Generation & Quality Indicators',
    description:
      'Algorithmic extraction of atmospheric motion vectors from automated feature tracking across consecutive geostationary image triplets.',
    contentType: 'VIDEO',
    content: null,
    resourceUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationMinutes: 60,
    orderIndex: 1,
    completed: false,
    progressPercentage: 0,
    previousLessonId: 'les-2-2',
    nextLessonId: 'les-3-2',
    keyTakeaways: [
      'CMVs provide wind speed and direction vectors at low, mid, and high levels over data-sparse oceanic regions.',
      'Quality Indicator (QI) scores above 0.85 are required for assimilation into IMD GFS and NCMRWF unified model cycles.',
    ],
    operationalChecklist: [
      'Inspect height assignment flags (infrared window vs. H2O intercept method).',
      'Filter out vectors with high spatial shear divergence.',
    ],
  },
  'les-3-2': {
    id: 'les-3-2',
    moduleId: 'mod-3',
    moduleTitle: 'Module 3: Derived Meteorological Products & Quantitative Applications',
    courseId: 'course-1',
    courseTitle: 'Satellite Meteorology & INSAT-3DR Multispectral Imagery',
    title: 'Lesson 3.2: Satellite-Derived Hydro-Estimator & Rainfall Validation',
    description:
      'Operational calibration of Hydro-Estimator Method (HEM) and IMSRA precipitation rates against IMD automatic rain gauge network observations.',
    contentType: 'PDF',
    content: `
# SATELLITE PRECIPITATION ESTIMATION (HEM & IMSRA)
## Operational Verification Manual

### 1. The Hydro-Estimator Method (HEM)
The Hydro-Estimator uses 10.8 µm infrared brightness temperatures adjusted for:
- Cloud-top growth rate
- Equilibrium level temperature from NWP forecasts
- Low-level relative humidity and precipitable water
- Topographic rainfall enhancement over the Western Ghats and Himalayan foothills

### 2. Validation Metrics
Satellite estimates are continuously compared with IMD 24-hour accumulated rainfall observations:
- **Probability of Detection (POD)**: Target > 0.80
- **False Alarm Ratio (FAR)**: Target < 0.25
- **Critical Success Index (CSI)**: Target > 0.65
- **Equitable Threat Score (ETS)**: Target > 0.40
    `,
    resourceUrl: 'https://imdpune.gov.in/Training/Hydro_Estimator_Manual.pdf',
    durationMinutes: 50,
    orderIndex: 2,
    completed: false,
    progressPercentage: 0,
    previousLessonId: 'les-3-1',
    nextLessonId: null,
    keyTakeaways: [
      'HEM provides real-time quantitative precipitation estimates every 15 minutes at 4 km spatial resolution.',
      'Overshooting convective storms receive parallax and moist-adiabatic moisture correction.',
    ],
    operationalChecklist: [
      'Compare satellite HEM accumulation against Doppler weather radar QPE.',
      'Issue urban flash flood alerts when HEM rates exceed 50 mm/hour.',
    ],
  },
};
