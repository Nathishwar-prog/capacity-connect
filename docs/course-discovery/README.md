# Development 4 — Course Discovery

> **Capacity Connect** — Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD) Enterprise Learning & Capacity Building Platform

---

## 1. Overview
The **Course Discovery** module provides a high-performance, domain-tailored catalog and exploration cockpit for authenticated trainees (meteorological forecasters, scientific officers, radar meteorologists, oceanographers, and earth science trainees) within the CAPACITY CONNECT platform. It enables real-time search, multi-faceted filtering, structured curricular inspection, and a secure two-step enrollment workflow across accredited meteorological training programs from MoES autonomous institutes and IMD training centers.

---

## 2. Objective
To provide a seamless, accredited course discovery experience aligned with WMO-258 standards:
- **Comprehensive Search**: Real-time querying across course titles, scientific domain keywords, and instructor names.
- **Faceted Exploration**: Dynamic multi-criteria filtering by scientific domain/category, operational difficulty level, designated trainer, and sorting parameters.
- **Deep Curricular Transparency**: Five-tab modal view covering Course Overview & Objectives, Syllabus & Lessons breakdown, Prerequisites (with graceful fallback), WMO-258 Competency Outcomes, and Instructor Institutional Profiles.
- **Controlled Enrollment**: Safe two-step confirmation dialog (*"Are you sure you want to enroll in this course?"*), duplicate enrollment prevention, and instantaneous UI status reflection.
- **Government Multilingualism**: Seamless real-time trilingual support across English, Hindi (`हिन्दी`), and Tamil (`தமிழ்`).
- **Resilient Offline Development**: Interactive domain-accurate mock dataset for local development when database services are offline.

---

## 3. User Role & Access Control
- **Target Primary Role**: `TRAINEE` (Operational Forecasters, Radar Engineers, NWP Analysts, Ocean Science Trainees).
- **Administrative Roles**: `ADMIN`, `SUPER_ADMIN` (Curriculum review, audit, institutional management).
- **Access Guard**:
  - Frontend: Protected under trainee layout at `/trainee/explore`.
  - Backend: JWT authentication middleware (`authenticate`) combined with role-based access control (`requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN])`).
- **Trainee Isolation**: Course enrollment strictly binds the authenticated trainee's identity from `req.user.userId`. Trainees cannot enroll on behalf of other officers.

---

## 4. Architecture & Functional Flow

```mermaid
graph TD
    A[Authenticated Trainee] --> B[Trainee App Shell /trainee/explore]
    B --> C[Language Selector: Eng / हिन्दी / தமிழ்]
    C --> D[useLanguageStore / i18n Dictionary]
    B --> E[CourseDiscovery Master Container]
    E --> F[useCourseDiscovery TanStack Query Hook]
    F -->|Live Backend Request| G[/api/v1/courses]
    F -->|Local Offline Fallback| H[MoES/IMD Domain Mock Data]
    G -.-> I[PostgreSQL / Prisma: Course, Module, Lesson, Prerequisite, Competency, Enrollment]
    H --> J[Interactive State Engine]
    J --> K1[1. Real-time Search Input with Clear]
    J --> K2[2. Multi-Faceted Filters & Sorting Dropdowns]
    J --> K3[3. Active Filter Chips & Clear All]
    J --> K4[4. Course Grid with Responsive Cards]
    K4 -->|View Details Action| L[5-Tab Course Details Modal]
    L --> L1[Tab 1: Overview & Objectives]
    L --> L2[Tab 2: Syllabus & Lesson Breakdown]
    L --> L3[Tab 3: Prerequisites with Fallback]
    L --> L4[Tab 4: WMO-258 Competencies]
    L --> L5[Tab 5: Instructor Profile]
    K4 -->|Enroll Now Action| M[Two-Step Enrollment Confirmation Dialog]
    M -->|Confirm Enrollment| N[Instantaneous Card State: Already Enrolled + Success Toast]
```

---

## 5. Course Catalog & Grid Presentation
Courses are presented in an enterprise 3-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) with glassmorphism touches and government design standards:
- **Card Metadata**:
  - Category Badge (e.g., *NUMERICAL MODELING*, *RADAR METEOROLOGY*, *SATELLITE METEOROLOGY*).
  - Operational Level Badge (*Beginner*, *Intermediate*, *Advanced*, *Operational*).
  - Course Title with hover transition.
  - Institutional Organization & Instructor name with icon.
  - Truncated curriculum overview.
  - Duration (hours/minutes) and WMO-258 alignment indicator.
- **Dual Action Bar**:
  - **"View Details"**: Secondary action opening the 5-tab inspection modal.
  - **"Enroll Now" / "Already Enrolled"**: Primary action triggering the two-step enrollment confirmation dialog or displaying locked enrolled status.

---

## 6. Real-Time Search Engine
- **Searchable Attributes**:
  - Course title (case-insensitive substring match).
  - Scientific domain / category keyword.
  - Instructor name and institutional affiliation.
  - Course summary and syllabus keywords.
- **User Experience**:
  - Instantaneous debounce filtering.
  - Integrated clear button (`✕`) inside the input field for one-click reset.

---

## 7. Multi-Faceted Filters & Sorting
- **Domain / Category Filter**:
  - `ALL` (Show all curricula).
  - `NUMERICAL_MODELING`
  - `SEVERE_WEATHER`
  - `RADAR_METEOROLOGY`
  - `OCEAN_SCIENCES`
  - `CLIMATE_SCIENCE`
  - `CYCLONE_WARNING`
  - `SATELLITE_METEOROLOGY`
  - `INSTRUMENTATION`
- **Difficulty Level Filter**:
  - `ALL`
  - `BEGINNER`
  - `INTERMEDIATE`
  - `ADVANCED`
  - `OPERATIONAL`
- **Instructor Filter**:
  - Dynamic list populated from available courses or `/api/v1/courses/meta/filters`.
- **Sorting Options**:
  - `Newest First` (Default)
  - `Title (A - Z)`
  - `Duration (Short to Long)`
- **Active Filter Chips**:
  - Visually displayed above the course grid.
  - Each chip includes a remove button (`✕`).
  - "Clear All Filters" button resets all dropdowns and query parameters.

---

## 8. Course Details Modal (5 Tabs)
Accessible modal dialog with keyboard navigation (`Esc` to dismiss) and backdrop lock:
1. **Overview & Objectives**:
   - Bulleted list of formal learning outcomes (e.g., boundary layer parameterization, WRF-ARW namelist tuning).
   - High-level course metrics (total modules, lessons count, estimated duration, status).
2. **Syllabus & Modules**:
   - Chronologically ordered curriculum modules.
   - Expandable lesson breakdowns with individual duration and preview tags.
3. **Prerequisites**:
   - Lists required prior courses with category and difficulty badges.
   - **Open Enrollment Fallback**: If no prerequisites exist, displays an official message: *"No prerequisites required for this curriculum track. Open for direct enrollment."*
4. **WMO-258 Competency Outcomes**:
   - Formally maps the course to World Meteorological Organization competencies (e.g., *NWP_PARAM Level 3*, *SEVERE_WEATHER_NOWCASTING Level 4*).
5. **Instructor Profile**:
   - Instructor name, official designation, organization (e.g., NCMRWF, IITM Pune, IMD CTI Pune), and avatar.

---

## 9. Two-Step Enrollment Confirmation Workflow
- **Step 1**: Clicking "Enroll Now" opens a dedicated confirmation modal:
  - Header: *"Confirm Course Enrollment"*
  - Prompt: *"Are you sure you want to enroll in this course?"*
  - Course metadata card: title, category, and duration.
  - Actions: "Cancel" (dismisses) and "Confirm Enrollment" (proceeds).
- **Step 2**:
  - Dispatches `POST /api/v1/courses/:courseId/enroll` (or interactive mock state in offline mode).
  - Displays green success toast: *"Successfully enrolled in [Course Title]"*.
  - Immediately updates the course card button to **"Already Enrolled"** (disabled with checkmark icon).

---

## 10. Duplicate Enrollment Prevention
- **Backend Guard**: Checks if an active enrollment already exists for `(courseId, userId)`. If found, throws `409 Conflict` (*"You are already enrolled in this course"*).
- **Frontend Guard**: Prevents re-clicking the enroll button once enrolled; button is disabled with green badge.

---

## 11. Multilingual Support (English, Hindi, Tamil)
Integrated with global `useLanguageStore`:
- **English (`en`)**: Standard international scientific terminology.
- **Hindi (`hi` — हिन्दी)**: Complete translation of search placeholders, filter titles, modal tabs, confirmation dialogs, and button actions.
- **Tamil (`தமிழ்`)**: Complete translation of discovery UI, filters, tabs, confirmation prompts, and actions.
- Switching language via the header updates all visible text dynamically without state loss.

---

## 12. Frontend Architecture
Located in `frontend/src/features/course-discovery/`:
```
frontend/src/features/course-discovery/
├── api/
│   └── courseDiscoveryApi.ts               # Axios API client (/api/v1/courses/*)
├── components/
│   ├── CourseSearch.tsx                    # Search input with clear button
│   ├── CourseFilters.tsx                   # Category, difficulty, trainer, sort dropdowns & chips
│   ├── CourseCard.tsx                      # Course presentation card with dual actions
│   ├── CourseGrid.tsx                      # Responsive grid with loading skeletons & empty state
│   ├── CourseDetailsModal.tsx              # 5-tab course inspection dialog
│   ├── EnrollmentConfirmationModal.tsx     # Two-step enrollment confirmation dialog
│   └── CourseDiscovery.tsx                 # Master container connecting query & interactive state
├── hooks/
│   └── useCourseDiscovery.ts               # TanStack Query hook with offline mock fallback
├── types/
│   └── course-discovery.types.ts           # Domain TypeScript definitions
├── utils/
│   ├── i18n.ts                             # Trilingual dictionaries (EN, HI, TA)
│   └── mockData.ts                         # 8 domain-rich MoES/IMD scientific courses
└── index.ts                                # Public barrel export
```

Mounted on `/trainee/explore` in `frontend/src/app/trainee/explore/page.tsx`.

---

## 13. Backend Architecture
Layered enterprise backend implementation:
```
backend/src/
├── dto/
│   └── course-discovery.dto.ts             # Course list, details, modules, prerequisites, filters DTOs
├── validators/
│   └── course-discovery.validator.ts       # Zod schemas for query params & route params
├── repositories/
│   └── course-discovery.repository.ts      # Prisma query builder with joins & count aggregations
├── services/
│   └── course-discovery.service.ts         # Business logic: search, filter, details, duplicate check
├── controllers/
│   └── course-discovery.controller.ts      # HTTP request handlers & status codes
└── routes/
    ├── course-discovery.routes.ts          # Express routes with authenticate & requireRole
    └── index.ts                            # Mounted at /api/v1/courses
```

---

## 14. Database Schema & Prisma Model Reuse
Reuses existing PostgreSQL tables via Prisma without requiring new migrations:
- `courses`: Core course data (`title`, `slug`, `description`, `category`, `difficulty`, `durationMinutes`, `status`, `trainerId`).
- `course_modules`: Ordered syllabus modules (`title`, `orderIndex`).
- `lessons`: Lessons inside modules (`title`, `durationMinutes`, `orderIndex`, `isPreview`).
- `course_prerequisites`: Self-referencing course relationships (`courseId`, `prerequisiteId`).
- `course_competencies`: Links courses to competencies (`courseId`, `competencyId`, `targetLevel`).
- `enrollments`: Trainee enrollments (`courseId`, `userId`, `status`, `enrolledAt`).
- `users`: Trainer profile information (`firstName`, `lastName`, `designation`, `avatarUrl`, `organizationId`).

---

## 15. API Endpoints Reference

### 1. `GET /api/v1/courses`
- **Method**: `GET`
- **Auth**: Bearer JWT (Required)
- **Role**: `TRAINEE`, `ADMIN`, `SUPER_ADMIN`
- **Query Parameters**:
  - `search` (string, optional): Search keyword.
  - `category` (string, optional): Filter by category.
  - `difficulty` (CourseDifficulty, optional): `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `OPERATIONAL`.
  - `trainerId` (string, optional): Filter by instructor.
  - `page` (number, default: 1): Page index.
  - `limit` (number, default: 12): Items per page.
  - `sortBy` (`newest` | `title` | `duration`, default: `newest`).
- **Response**: `200 OK` with `CourseListResponseDto`.

### 2. `GET /api/v1/courses/:courseId`
- **Method**: `GET`
- **Auth**: Bearer JWT (Required)
- **Description**: Returns detailed course syllabus, modules, lessons, prerequisites, and WMO competencies.
- **Response**: `200 OK` with `CourseDetailsDto`.

### 3. `POST /api/v1/courses/:courseId/enroll`
- **Method**: `POST`
- **Auth**: Bearer JWT (Required)
- **Description**: Enrolls the authenticated trainee in the course. Prevents duplicate enrollments.
- **Response**: `201 Created` with enrollment record.
- **Error**: `409 Conflict` if already enrolled.

### 4. `GET /api/v1/courses/meta/filters`
- **Method**: `GET`
- **Auth**: Bearer JWT (Required)
- **Description**: Retrieves available categories, difficulty levels, and instructors for populating filter controls.
- **Response**: `200 OK` with `CourseFiltersMetadataDto`.

---

## 16. MoES / IMD Domain Specializations
Included curriculum tracks represent authentic Indian Earth Sciences disciplines:
1. **Numerical Weather Prediction & WRF-ARW Ensemble Modeling** (NCMRWF)
2. **Advanced Doppler Weather Radar & Velocity De-aliasing** (IMD Central Training Institute, Pune)
3. **Ocean-Atmosphere Coupled Dynamics & Indian Ocean Dipole** (INCOIS Hyderabad)
4. **Tropical Cyclone Structure, Dvorak Analysis & Track Prediction** (Cyclone Warning Division, IMD New Delhi)
5. **Aerosol-Cloud Interactions & Climate Radiative Forcing** (IITM Pune)
6. **Satellite Meteorology & INSAT-3DR Multispectral Imagery** (Satellite Meteorology Division, IMD HQ)
7. **Operational Aviation Weather Forecasting & SIGMET Issuance** (Aviation Meteorological Office, New Delhi)
8. **Agrometeorological Advisory Services & District-Level Forecasts** (Agrimet Division, IMD Pune)

---

## 17. Quality Verification

| Check | Tool | Result |
|---|---|---|
| **TypeScript Compilation** | `npm run typecheck` (`tsc --noEmit`) in `frontend` | ✅ **PASSED (0 errors)** |
| **Code Formatting** | `npm run format:check` (Prettier) | ✅ **PASSED (100% compliant)** |
| **Next.js Dev Server** | `http://localhost:3000/trainee/explore` | ✅ **Compiled 200 OK** |
| **Browser Subagent Testing** | Chrome headless automation | ✅ **PASSED** (Search, Category & Difficulty Filter, 5-Tab Details Modal, Enrollment Dialog & Instant Reflection, Trilingual Switch) |

---

## 18. Strict Feature Boundaries
The module strictly implements Course Discovery and respects platform boundaries:
- ❌ No Course Creator or editing tools (Trainer/Admin domain).
- ❌ No Learning Video Player or LMS playback (Development 5 LMS player).
- ❌ No Assessment or Quiz Engine (Assessment module).
- ❌ No Certificate Generation engine (Accreditation module).
- ❌ No AI Recommendation Engine.

---

## 19. Files Manifest

| Action | File Path |
|---|---|
| **NEW** | `backend/src/dto/course-discovery.dto.ts` |
| **NEW** | `backend/src/validators/course-discovery.validator.ts` |
| **NEW** | `backend/src/repositories/course-discovery.repository.ts` |
| **NEW** | `backend/src/services/course-discovery.service.ts` |
| **NEW** | `backend/src/controllers/course-discovery.controller.ts` |
| **NEW** | `backend/src/routes/course-discovery.routes.ts` |
| **MODIFY** | `backend/src/routes/index.ts` |
| **NEW** | `frontend/src/features/course-discovery/types/course-discovery.types.ts` |
| **NEW** | `frontend/src/features/course-discovery/utils/i18n.ts` |
| **NEW** | `frontend/src/features/course-discovery/utils/mockData.ts` |
| **NEW** | `frontend/src/features/course-discovery/api/courseDiscoveryApi.ts` |
| **NEW** | `frontend/src/features/course-discovery/hooks/useCourseDiscovery.ts` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseSearch.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseFilters.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseCard.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseGrid.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseDetailsModal.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/EnrollmentConfirmationModal.tsx` |
| **NEW** | `frontend/src/features/course-discovery/components/CourseDiscovery.tsx` |
| **NEW** | `frontend/src/features/course-discovery/index.ts` |
| **MODIFY** | `frontend/src/app/trainee/explore/page.tsx` |
| **NEW** | `docs/course-discovery/README.md` |
