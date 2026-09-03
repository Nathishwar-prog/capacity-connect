# Implementation Plan: MoES & IMD Domain Courses & 30+ Trainees Seeding

Seeding realistic, domain-specific data for the **Ministry of Earth Sciences (MoES)** and the **India Meteorological Department (IMD)** into CAPACITY CONNECT, adhering strictly to [DOMAINSPECIFICRULE.md](file:///d:/projects/capacity-connect/DOMAINSPECIFICRULE.md) and [INSTRUCTION.md](file:///d:/projects/capacity-connect/INSTRUCTION.md).

---

## 1. Feature & Objective

### Objective
- Populate the CAPACITY CONNECT database with high-quality, authentic MoES/IMD training domain data to allow realistic frontend and backend feature testing and development.
- Replace generic IT/software-engineering placeholders with authentic earth-sciences, meteorological, oceanographic, seismological, and atmospheric training programs.
- Seed **32+ distinct Trainees** across 8 core MoES/IMD departments and divisions with realistic scientific designations, competency levels, enrolled courses, and progress.
- Seed **8 comprehensive Courses**, each structured with 3–4 modules, 8–12 lessons (with diverse content types: Video, Article, PDF, Document, Quiz), prerequisites, and competency mappings.

---

## 2. Domain Alignment ([DOMAINSPECIFICRULE.md](file:///d:/projects/capacity-connect/DOMAINSPECIFICRULE.md))

In strict compliance with [DOMAINSPECIFICRULE.md](file:///d:/projects/capacity-connect/DOMAINSPECIFICRULE.md):
- **Organization**: Ministry of Earth Sciences (MoES) & India Meteorological Department (IMD)
- **Departments & Divisions**:
  1. `NWFC`: National Weather Forecasting Centre, New Delhi
  2. `NWP`: Numerical Weather Prediction Division
  3. `RADAR`: Radar Meteorology & Doppler Weather Radar (DWR) Network
  4. `SATMET`: Satellite Meteorology & Remote Sensing Division
  5. `CRS`: Climate Research and Services, IMD Pune
  6. `INCOIS`: Indian National Centre for Ocean Information Services (Hyderabad)
  7. `NCS`: National Centre for Seismology
  8. `HYDRO`: Hydrology & Flood Meteorological Division
  9. `CTI`: Central Training Institute, Pashan, Pune
  10. `INSTR`: Surface Instruments, AWS & Observational Network Division

---

## 3. Database Schema Evaluation

### Schema Review ([schema.prisma](file:///d:/projects/capacity-connect/backend/prisma/schema.prisma))
The existing Prisma schema already contains rich models supporting this structure:
- `Organization` & `Department`: Supports hierarchical organizational mapping.
- `User` & `TraineeProfile`: Supports designations, bio, interests array, and profile completion.
- `Course`: Supports `slug`, `category`, `difficulty`, `durationMinutes`, `status`, `thumbnailUrl`.
- `CourseModule` & `Lesson`: Supports hierarchical lessons with `contentType` (`VIDEO`, `PDF`, `ARTICLE`, `DOCUMENT`, `QUIZ`, `LINK`), duration, preview flag, and markdown/text content.
- `CoursePrerequisite`: Supports self-referencing prerequisite DAGs between courses.
- `Competency`, `CompetencyLevel`, and `CourseCompetency`: Allows courses to target specific competency levels (1 to 5).
- `Enrollment` & `LessonProgress`: Supports realistic trainee progress and completion percentages.

### Schema Assessment:
> [!NOTE]
> The current schema models (`Course`, `CourseModule`, `Lesson`, `CourseCompetency`, `CoursePrerequisite`, `TraineeProfile`, `UserSkill`, `UserCompetency`) completely and cleanly satisfy the requirements without requiring disruptive schema alterations.
> Optional enhancement evaluated: We can add an optional `tags` array field (`String[] @default([])`) to `Course` if tag-based filtering in the UI is desired; otherwise the current `category`, `difficulty`, and `courseCompetencies` provide full taxonomy.

---

## 4. Proposed Course Catalog & Detailed Content

Below are the 8 comprehensive MoES/IMD courses designed with full syllabi, module breakdowns, lesson titles, formats, durations, and competency targets:

### Course 1: Operational Weather Forecasting & Synoptic Analysis
- **Code/Slug**: `synoptic-weather-forecasting-analysis`
- **Category**: `Synoptic Meteorology` | **Difficulty**: `INTERMEDIATE` | **Duration**: 240 mins (4 hrs)
- **Target Competency**: `COMP-SYNOPTIC-MET` (Level 3 - Intermediate)
- **Trainer**: Dr. L. S. Rathore (Scientist 'G', Chief Synoptic Forecaster)
- **Modules & Lessons**:
  - **Module 1: Surface & Upper-Air Synoptic Observations (60 mins)**
    - Lesson 1.1: WMO Synoptic Codes (SYNOP/TEMP) and Plotting Models (`ARTICLE`, 25m, Preview)
    - Lesson 1.2: Constant Pressure Chart Analysis: 850hPa, 500hPa, and 200hPa (`VIDEO`, 35m)
  - **Module 2: Monsoon Dynamics & Tropical Synoptic Systems (90 mins)**
    - Lesson 2.1: Southwest Monsoon Onset, Progression, and Break Phases (`VIDEO`, 45m)
    - Lesson 2.2: Tropical Depressions and Cyclogenesis in the North Indian Ocean (`ARTICLE`, 45m)
  - **Module 3: Severe Weather Forecasting Techniques (90 mins)**
    - Lesson 3.1: Western Disturbances and Extra-Tropical Interactions (`DOCUMENT`, 40m)
    - Lesson 3.2: Severe Convective Storms: Squall Lines, Nor'westers & Heatwaves (`VIDEO`, 50m)

---

### Course 2: Numerical Weather Prediction (NWP): Modeling & Operational Forecasting
- **Code/Slug**: `numerical-weather-prediction-modeling`
- **Category**: `Atmospheric Modeling` | **Difficulty**: `ADVANCED` | **Duration**: 300 mins (5 hrs)
- **Prerequisite**: Course 1 (`synoptic-weather-forecasting-analysis`)
- **Target Competency**: `COMP-NWP-MODELING` (Level 4 - Advanced)
- **Trainer**: Dr. E. N. Rajagopal (Scientist 'F', NWP Systems Lead)
- **Modules & Lessons**:
  - **Module 1: Atmospheric Dynamics & Governing Equations (75 mins)**
    - Lesson 1.1: Primitive Equations & Hydrostatic vs Non-Hydrostatic Approximations (`ARTICLE`, 35m, Preview)
    - Lesson 1.2: Grid Discretization, Finite Differences, and Spectral Transforms (`DOCUMENT`, 40m)
  - **Module 2: Operational Models at MoES: WRF & Global GFS/NCUM (105 mins)**
    - Lesson 2.1: Configuration and Physics Parameterization of WRF-ARW (`VIDEO`, 55m)
    - Lesson 2.2: Global Ensemble Prediction System (EPS) & Probabilistic Forecasting (`VIDEO`, 50m)
  - **Module 3: Data Assimilation & Model Verification (120 mins)**
    - Lesson 3.1: 3D-Var and 4D-Var Assimilation of Satellite and Radar Radiances (`ARTICLE`, 60m)
    - Lesson 3.2: Forecast Skill Metrics: RMSE, ETS, ROC Curves, and Taylor Diagrams (`DOCUMENT`, 60m)

---

### Course 3: Doppler Weather Radar (DWR) Operations & Convective Nowcasting
- **Code/Slug**: `dwr-operations-convective-nowcasting`
- **Category**: `Radar Meteorology` | **Difficulty**: `INTERMEDIATE` | **Duration**: 210 mins (3.5 hrs)
- **Target Competency**: `COMP-RADAR-MET` (Level 3 - Intermediate)
- **Trainer**: Dr. S. K. Roy (Scientist 'E', DWR Network Operations)
- **Modules & Lessons**:
  - **Module 1: Radar Fundamentals & Signal Processing (60 mins)**
    - Lesson 1.1: S-Band, C-Band, and X-Band Radars: Pulse Repetition & Nyquist Velocity (`ARTICLE`, 30m, Preview)
    - Lesson 1.2: Reflectivity Factor (Z), Attenuation, and Beam Propagation Artifacts (`VIDEO`, 30m)
  - **Module 2: Dual-Polarization Radar Products (75 mins)**
    - Lesson 2.1: Differential Reflectivity (ZDR) and Specific Differential Phase (KDP) (`ARTICLE`, 40m)
    - Lesson 2.2: Hydrometeor Classification (HCA): Hail, Graupel, Heavy Rain Detection (`VIDEO`, 35m)
  - **Module 3: Operational Nowcasting of Severe Thunderstorms (75 mins)**
    - Lesson 3.1: Mesocyclone Signatures, Hook Echoes, and Microburst Detection (`DOCUMENT`, 35m)
    - Lesson 3.2: IMD Thunderstorm Nowcasting Protocols & Warning Dissemination (`VIDEO`, 40m)

---

### Course 4: Satellite Meteorology: INSAT-3D/3DR & Remote Sensing
- **Code/Slug**: `satellite-meteorology-insat-applications`
- **Category**: `Satellite Meteorology` | **Difficulty**: `BEGINNER` | **Duration**: 180 mins (3 hrs)
- **Target Competency**: `COMP-SAT-MET` (Level 2 - Basic)
- **Trainer**: Dr. Sunitha Murthy (Scientist 'F', Satellite Applications)
- **Modules & Lessons**:
  - **Module 1: Meteorological Satellites & Orbits (50 mins)**
    - Lesson 1.1: Geostationary vs Polar Orbiting Satellites: INSAT-3D/3DR & Megha-Tropiques (`ARTICLE`, 25m, Preview)
    - Lesson 1.2: Spectral Bands: Visible, Thermal Infrared, and Water Vapor Channels (`VIDEO`, 25m)
  - **Module 2: Cloud Imagery & Pattern Recognition (65 mins)**
    - Lesson 2.1: Identification of Synoptic Clouds, Jet Streams, and Fog Patterns (`VIDEO`, 35m)
    - Lesson 2.2: Dvorak Technique for Tropical Cyclone Intensity Estimation (`ARTICLE`, 30m)
  - **Module 3: Quantitative Geophysical Products (65 mins)**
    - Lesson 3.1: Atmospheric Motion Vectors (AMVs) and Outgoing Longwave Radiation (OLR) (`DOCUMENT`, 35m)
    - Lesson 3.2: Quantitative Precipitation Estimation (QPE) and Hydro-Estimator (`VIDEO`, 30m)

---

### Course 5: Climate Data Analysis & Climate Change Projections
- **Code/Slug**: `climate-data-analysis-projections`
- **Category**: `Climate Science` | **Difficulty**: `ADVANCED` | **Duration**: 240 mins (4 hrs)
- **Target Competency**: `COMP-CLIMATE-SCI` (Level 4 - Advanced)
- **Trainer**: Dr. Pulak Guhathakurta (Scientist 'G', Climate Monitoring & Analysis)
- **Modules & Lessons**:
  - **Module 1: Climatological Datasets & IMD Gridded Products (70 mins)**
    - Lesson 1.1: High-Resolution Daily Gridded Rainfall and Temperature Datasets (`ARTICLE`, 35m, Preview)
    - Lesson 1.2: Quality Control, Homogenization, and Missing Data Imputation (`DOCUMENT`, 35m)
  - **Module 2: Climate Extreme Indices & Trend Analysis (80 mins)**
    - Lesson 2.1: ETCCDI Extreme Indices Calculation (Mann-Kendall & Sen's Slope) (`VIDEO`, 40m)
    - Lesson 2.2: Handling NetCDF, GRIB2, and HDF5 Files with CDO & xarray (`DOCUMENT`, 40m)
  - **Module 3: CMIP6 Projections & Regional Downscaling (90 mins)**
    - Lesson 3.1: IPCC Shared Socioeconomic Pathways (SSPs) & Multi-Model Ensembles (`ARTICLE`, 45m)
    - Lesson 3.2: CORDEX South Asia High-Resolution Regional Climate Downscaling (`VIDEO`, 45m)

---

### Course 6: Ocean State Forecasting & Tsunami Early Warning Systems
- **Code/Slug**: `ocean-state-forecasting-tsunami-warning`
- **Category**: `Ocean Sciences` | **Difficulty**: `INTERMEDIATE` | **Duration**: 210 mins (3.5 hrs)
- **Target Competency**: `COMP-OCEAN-SCI` (Level 3 - Intermediate)
- **Trainer**: Dr. T. M. Balakrishnan Nair (Director / Scientist 'G', INCOIS)
- **Modules & Lessons**:
  - **Module 1: Ocean State Dynamics & Observation Systems (60 mins)**
    - Lesson 1.1: Moored Ocean Buoy Networks, Argo Floats, and Coastal Wave Rider Buoys (`ARTICLE`, 30m, Preview)
    - Lesson 1.2: Numerical Wave Modeling: WAVEWATCH-III and SWAN Implementations (`VIDEO`, 30m)
  - **Module 2: Indian Tsunami Early Warning Centre (ITEWC) Architecture (80 mins)**
    - Lesson 2.1: Undersea Earthquakes, Bottom Pressure Recorders (BPR), and Tide Gauges (`DOCUMENT`, 40m)
    - Lesson 2.2: Real-time Tsunami Travel Time & Inundation Simulation Modeling (`VIDEO`, 40m)
  - **Module 3: Coastal Hazards & Storm Surge Advisories (70 mins)**
    - Lesson 3.1: Cyclone-Induced Storm Surge Forecasting & Inland Inundation (`ARTICLE`, 35m)
    - Lesson 3.2: High Wave Warnings & Fishermen Advisory Bulletins Dissemination (`DOCUMENT`, 35m)

---

### Course 7: Seismological Data Processing & Earthquake Hazard Monitoring
- **Code/Slug**: `seismological-data-processing-earthquake-hazard`
- **Category**: `Seismology` | **Difficulty**: `INTERMEDIATE` | **Duration**: 200 mins (3.3 hrs)
- **Target Competency**: `COMP-SEISMOLOGY` (Level 3 - Intermediate)
- **Trainer**: Dr. O. P. Mishra (Director, National Centre for Seismology)
- **Modules & Lessons**:
  - **Module 1: National Seismological Network (NSN) Infrastructure (50 mins)**
    - Lesson 1.1: Broadband Seismographs, Accelerographs, and VSAT Telemetry (`ARTICLE`, 25m, Preview)
    - Lesson 1.2: Seismic Signal Formats: MiniSEED, SAC, and SEISAN Data Standards (`DOCUMENT`, 25m)
  - **Module 2: Earthquake Waveform Analysis & Hypocenter Location (80 mins)**
    - Lesson 2.1: P-wave & S-wave Phase Picking and Travel Time Inversion (`VIDEO`, 40m)
    - Lesson 2.2: Determination of Magnitude (ML, Mw) and Focal Mechanism Solutions (`VIDEO`, 40m)
  - **Module 3: Seismic Hazard Microzonation & Early Warning (70 mins)**
    - Lesson 3.1: Probabilistic Seismic Hazard Analysis (PSHA) for Critical Infrastructure (`ARTICLE`, 35m)
    - Lesson 3.2: Earthquake Early Warning (EEW) Algorithms and Rapid Response (`DOCUMENT`, 35m)

---

### Course 8: Meteorological Instrumentation, AWS & Surface Observatories
- **Code/Slug**: `meteorological-instrumentation-aws-maintenance`
- **Category**: `Observational Instruments` | **Difficulty**: `BEGINNER` | **Duration**: 180 mins (3 hrs)
- **Target Competency**: `COMP-INSTRUMENTATION` (Level 2 - Basic)
- **Trainer**: Dr. K. S. Hosalikar (Scientist 'G', Surface Instruments & Observations)
- **Modules & Lessons**:
  - **Module 1: Surface Meteorological Sensors & Calibration (55 mins)**
    - Lesson 1.1: Platinum Resistance Thermometers, Capacitive Hygrometers & Barometers (`ARTICLE`, 25m, Preview)
    - Lesson 1.2: Tipping Bucket Rain Gauges & Optical Disdrometer Calibration (`VIDEO`, 30m)
  - **Module 2: Automatic Weather Stations (AWS) & ARG Networks (65 mins)**
    - Lesson 2.1: Datalogger Programming, Solar Power Systems & Sensor Interfacing (`DOCUMENT`, 35m)
    - Lesson 2.2: GPRS/INSAT Satellite Telemetry for High-Frequency Data Transmission (`VIDEO`, 30m)
  - **Module 3: Data Quality Control & Maintenance Protocols (60 mins)**
    - Lesson 3.1: Routine Preventative Maintenance, Exposure Standards & WMO Siting (`ARTICLE`, 30m)
    - Lesson 3.2: Real-time Automated Quality Control (Range, Step, and Persistence Checks) (`DOCUMENT`, 30m)

---

## 5. Proposed Trainees Design (32 Detailed Profiles)

32 Trainees mapped to official MoES/IMD scientific, technical, and operational cadres across 8 divisions:

| # | Name | Email | Department | Cadre / Designation | Profile Completion | Enrolled Courses & Progress |
|---|------|-------|------------|---------------------|--------------------|----------------------------|
| 1 | Jane Doe | `user@enterprise.com` | `NWFC` | Meteorologist Grade-II | 90% | Course 1 (100%), Course 4 (65%) |
| 2 | Rajesh Kumar Verma | `rajesh.verma@imd.gov.in` | `NWFC` | Scientist 'B' (Synoptic Forecaster) | 85% | Course 1 (80%), Course 2 (30%) |
| 3 | Priya Swaminathan | `priya.s@imd.gov.in` | `NWP` | Scientist 'C' (NWP Modeling) | 95% | Course 2 (100%), Course 5 (50%) |
| 4 | Amitav Sengupta | `amitav.s@imd.gov.in` | `RADAR` | Technical Officer (Radar Maint.) | 75% | Course 3 (70%), Course 8 (40%) |
| 5 | Ananya Deshmukh | `ananya.d@imd.gov.in` | `SATMET` | Scientist 'B' (Satellite Products) | 85% | Course 4 (90%), Course 1 (45%) |
| 6 | Vikrant Chauhan | `vikrant.c@imd.gov.in` | `CRS` | Scientific Assistant (Climatology) | 80% | Course 5 (60%), Course 8 (80%) |
| 7 | Sneha Kulkarni | `sneha.k@incois.gov.in` | `INCOIS` | Scientist 'B' (Ocean Dynamics) | 90% | Course 6 (85%), Course 5 (40%) |
| 8 | Mohammad Rizwan | `rizwan.m@imd.gov.in` | `NCS` | Scientist 'B' (Seismic Inversion) | 85% | Course 7 (75%), Course 2 (20%) |
| 9 | Kavita Nair | `kavita.n@imd.gov.in` | `HYDRO` | Meteorologist Grade-I (Hydrology) | 90% | Course 1 (90%), Course 8 (60%) |
| 10 | Tenzin Norbu | `tenzin.n@imd.gov.in` | `INSTR` | Senior Scientific Assistant (AWS) | 70% | Course 8 (100%), Course 4 (30%) |
| 11 | Deepak Bhattacharya | `deepak.b@imd.gov.in` | `NWFC` | Senior Research Fellow (SRF - AI/ML) | 65% | Course 2 (40%), Course 1 (50%) |
| 12 | Shalini Saxena | `shalini.s@imd.gov.in` | `NWP` | Scientist 'B' (Ensemble Modeling) | 85% | Course 2 (85%), Course 5 (30%) |
| 13 | Harpreet Singh Bedi | `harpreet.b@imd.gov.in` | `RADAR` | Scientific Assistant (DWR Nowcasting) | 80% | Course 3 (95%), Course 1 (60%) |
| 14 | Meenakshi Sundaram | `meenakshi.s@imd.gov.in` | `SATMET` | Junior Research Fellow (INSAT-3DR) | 60% | Course 4 (70%), Course 3 (20%) |
| 15 | Arindam Roy | `arindam.r@imd.gov.in` | `CRS` | Meteorologist Grade-II (Drought) | 85% | Course 5 (90%), Course 1 (70%) |
| 16 | Gowri Sankar | `gowri.s@incois.gov.in` | `INCOIS` | Scientific Assistant (Wave Modeling) | 75% | Course 6 (80%), Course 8 (50%) |
| 17 | Tanmayee Joshi | `tanmayee.j@imd.gov.in` | `NCS` | Scientist 'C' (Seismological Network) | 95% | Course 7 (100%), Course 6 (40%) |
| 18 | Rakesh Meena | `rakesh.m@imd.gov.in` | `HYDRO` | Technical Officer (Hydro-Meteorology) | 70% | Course 1 (45%), Course 8 (65%) |
| 19 | Pooja Sharma | `pooja.s@imd.gov.in` | `INSTR` | Scientific Assistant (Sensor Calib.) | 80% | Course 8 (90%), Course 3 (35%) |
| 20 | Sandeep Yadav | `sandeep.y@imd.gov.in` | `NWFC` | Meteorologist Grade-II (Aviation Met) | 85% | Course 1 (85%), Course 3 (60%) |
| 21 | Debolina Banerjee | `debolina.b@imd.gov.in` | `NWP` | Scientist 'B' (Data Assimilation) | 90% | Course 2 (75%), Course 4 (55%) |
| 22 | Naveen Chand | `naveen.c@imd.gov.in` | `RADAR` | Electronics & Telecom Engineer (Radar) | 75% | Course 3 (80%), Course 8 (70%) |
| 23 | Archana Pillai | `archana.p@imd.gov.in` | `SATMET` | Scientist 'B' (Cyclone Tracking) | 85% | Course 4 (100%), Course 1 (80%) |
| 24 | Subhashree Patnaik | `subhashree.p@imd.gov.in` | `CRS` | Research Associate (Climate Normals) | 70% | Course 5 (80%), Course 2 (25%) |
| 25 | Karthik Raja | `karthik.r@incois.gov.in` | `INCOIS` | Technical Officer (Coastal HF Radar) | 75% | Course 6 (70%), Course 3 (40%) |
| 26 | Bhaskar Hazarika | `bhaskar.h@imd.gov.in` | `NCS` | Scientific Assistant (Northeast Array) | 80% | Course 7 (85%), Course 8 (45%) |
| 27 | Sunita Rathod | `sunita.r@imd.gov.in` | `HYDRO` | Scientist 'B' (Flash Flood Guidance) | 85% | Course 1 (65%), Course 2 (50%) |
| 28 | Chetan Solanki | `chetan.s@imd.gov.in` | `INSTR` | Junior Engineer (ARG Telemetry) | 65% | Course 8 (75%), Course 1 (30%) |
| 29 | Manisha Tiwari | `manisha.t@imd.gov.in` | `NWFC` | Scientist 'B' (Severe Weather Desk) | 90% | Course 1 (100%), Course 3 (80%) |
| 30 | Rohitashva Mallick | `rohit.m@imd.gov.in` | `NWP` | Project Scientist (Supercomputing) | 80% | Course 2 (90%), Course 5 (45%) |
| 31 | Divya Bharathi | `divya.b@incois.gov.in` | `INCOIS` | Scientist 'B' (Tsunami Modeling) | 90% | Course 6 (95%), Course 7 (60%) |
| 32 | Nilamber Pandey | `nilamber.p@imd.gov.in` | `NCS` | Scientific Assistant (Hypocenter Analysis) | 75% | Course 7 (80%), Course 5 (30%) |

---

## 6. Implementation Workflow & Seed Script Updates

1. **Git Feature Branch**: Already created and checked out (`feature/seed-moes-imd-domain-data`).
2. **Modular Seed Architecture**:
   - Update `backend/prisma/seed.ts` with clean foreign-key cascades, seeding:
     - Ministry Organization (`Ministry of Earth Sciences & India Meteorological Department`).
     - 10 realistic Departments & Divisions.
     - 8 MoES/IMD Competencies with 6 proficiency levels each.
     - 10 Domain Skills (Synoptic Chart Analysis, NWP Discretization, Doppler Velocity Interpretation, INSAT-3DR Channel Analysis, NetCDF/CDO Processing, Wavewatch-III, Seismic Waveform Inversion, Sensor Calibration, Flash Flood Guidance, Python for Earth Sciences).
     - 5 Senior Domain Trainers (Scientists 'G'/'F'/'E' with detailed profiles and verified expertise).
     - 8 Full Courses with 24 Modules and 50+ rich Lessons (Articles, Videos, Documents).
     - Course Prerequisites & Target Competency Mappings.
     - 32 Trainee Users with corresponding `TraineeProfile` records, UserSkills, baseline Competencies, and realistic Course Enrollments with progress percentages.
3. **Password Configuration**:
   - Standard test password for all trainees and trainers (`Password123!`) with pre-computed bcrypt hash for fast seeding.
   - Primary test user `user@enterprise.com` retained as Trainee #1 (Jane Doe, Meteorologist Gr-II) so existing login tests continue to pass without disruption.

---

## 7. Verification Plan

### Automated Verification:
- Run `npx prisma validate` in `backend/` to verify schema integrity.
- Execute the seed script: `npx prisma db seed` (or `npm run seed`).
- Run `backend/prisma/verify_db.ts` or custom query test script to confirm:
  - Total Trainees $\ge 32$
  - Total Courses $= 8$
  - Total Modules $\ge 24$
  - Total Lessons $\ge 50$
  - All foreign key relations (modules, lessons, prerequisites, enrollments, competencies) correctly wired.

### Application Verification:
- Verify courses endpoint returns the 8 MoES/IMD courses with modules and lessons.
- Verify user directory / admin dashboard displays the 32 trainees with designations and departments.
- Verify Trainee dashboard for `user@enterprise.com` displays active enrollments, lesson progress, and competencies.
