# Complete Trainee Workflow & Recommendation Pipeline Implementation Plan

This implementation plan covers the complete Trainee Workflow specified in [traineeImplementationPlan.txt](file:///d:/projects/capacity-connect/traineeImplementationPlan.txt).

The core pipeline is:
> **Trainee enters role → System determines required competencies for that role → AI analyzes current skills → Identifies competency gaps → Maps gaps to courses actually available in DB → Displays recommended courses → Trainee opens a course → System finds suitable/high-rated mentors for that specific course → Trainee can choose/enroll.**

---

## Architecture: 7 Modular Services

```
                    ┌─────────────────────────┐
                    │     TRAINEE SIGNUP      │
                    └────────────┬────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │ 1. Profile Onboarding   │
                    │ Role + Department       │
                    │ Skills + Preferences    │
                    └────────────┬────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │ 2. Role Competency      │
                    │ Resolver (DB Catalogue) │
                    └────────────┬────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │ 3. Data Sufficiency     │
                    │ Engine & State Machine  │
                    └────────────┬────────────┘
                                 ↓
                   ┌─────────────┴─────────────┐
                   ↓                           ↓
            DATA SUFFICIENT             DATA INSUFFICIENT
            (READY / LIMITED)         (NEEDS_MORE_DATA / BLOCKED)
                   ↓                           ↓
       ┌────────────────────────┐    ┌─────────────────────────┐
       │ 4. AI Skill Gap        │    │ Smart UX Prompt:        │
       │ Analyzer (DB as Truth) │    │ [Add Skills] or         │
       └───────────┬────────────┘    │ [Diagnostic Assessment] │
                   ↓                 └─────────────────────────┘
          Missing Competencies
                   ↓
       ┌────────────────────────┐
       │ 5. Course Matching     │
       │ Engine (Hard DB Filter)│
       └───────────┬────────────┘
                   ↓
          Available DB Courses
                   ↓
       ┌────────────────────────┐
       │ 6. Course Recommendation│
       │ Ranker (Explainable)   │
       └───────────┬────────────┘
                   ↓
         Recommended Courses
                   ↓
             User Clicks Course
                   ↓
       ┌────────────────────────┐
       │ 7. Course-Specific     │
       │ Trainer Matching Engine│
       │ (Expertise + Rating +  │
       │ Experience + Avail)    │
       └───────────┬────────────┘
                   ↓
         Ranked Course Mentors
                   ↓
         Course Detail Page +
         Recommended Mentors UI
```

---

## User Review Required

> [!IMPORTANT]
> **Prisma Schema Enhancements**:
> 1. **`RoleProfile` & `RoleCompetency`**: We will add `RoleProfile` (for organizational/cadre roles like Meteorologist Grade-I, Weather Forecaster, Data Analyst, Radar Specialist, etc.) and `RoleCompetency` (mapping roles to required competencies with `requiredLevel`, `importance`, and `criticality`).
> 2. **`TraineeProfile`**: We will add `targetRoleId`, `profileCompleted`, `initialAssessmentCompleted`, `competencyProfileInitialized`, `learningGoals`, `preferredLearningMode`, `preferredLanguage`, `availableHoursPerWeek`, and `preferredTrainerMode`.
> 3. **`TrainerProfile`**: We will add `isAvailable`, `averageRating`, and `totalReviews` to support authoritative trainer matching and ranking.
> 4. **`Assessment`**: We will add `isDiagnostic` (boolean) to distinguish baseline diagnostic checks from normal course assessments.
> 
> Neon PostgreSQL sync will be run with `npx prisma db push` without destroying existing data.

> [!NOTE]
> **AI Strict Guardrail**:
> AI is used solely for interpreting, explaining, and prioritizing competency gaps. The database is the single source of truth for competency scores, course availability, and trainer qualifications. Nonexistent courses and unapproved trainers will **NEVER** be hallucinated or recommended.

---

## Detailed Implementation Steps

### 1. Database Schema & Seed Data
- **File**: [`backend/prisma/schema.prisma`](file:///d:/projects/capacity-connect/backend/prisma/schema.prisma)
  - Add `model RoleProfile`:
    - `id`, `name`, `code`, `department`, `description`, `roleCompetencies`, `traineeProfiles`.
  - Add `model RoleCompetency`:
    - `id`, `roleId`, `competencyId`, `requiredLevel` (1-5), `importance` (0-100), `criticality` (`CORE`, `IMPORTANT`, `NORMAL`, `OPTIONAL`).
  - Update `model TraineeProfile`:
    - `targetRoleId`, `profileCompleted`, `initialAssessmentCompleted`, `competencyProfileInitialized`, `learningGoals`, `preferredLearningMode`, `preferredLanguage`, `availableHoursPerWeek`, `preferredTrainerMode`.
  - Update `model TrainerProfile`:
    - `isAvailable`, `averageRating`, `totalReviews`.
  - Update `model Assessment`:
    - `isDiagnostic` (`Boolean @default(false)`).
- **Seeding / Migration**:
  - Run `npx prisma db push` to synchronize with PostgreSQL.
  - Seed comprehensive IMD/MoES role profiles and competency requirements:
    - *Meteorologist Grade-I (Synoptic Forecaster)*: Synoptic Meteorology (Level 4, Imp: 95), NWP Modeling (Level 3, Imp: 85), Satellite Meteorology (Level 3, Imp: 85).
    - *Doppler Weather Radar Specialist*: Radar Meteorology & DWR Operations (Level 4, Imp: 95), Synoptic Meteorology (Level 3, Imp: 80), Instrumentation (Level 3, Imp: 75).
    - *Satellite Remote Sensing Meteorologist*: Satellite Meteorology (Level 4, Imp: 95), Synoptic Meteorology (Level 3, Imp: 80), NWP (Level 3, Imp: 75).
    - *Numerical Weather Prediction Modeler*: NWP & Modeling (Level 4, Imp: 95), Climate Data Analysis (Level 3, Imp: 85), Synoptic Meteorology (Level 3, Imp: 80).
    - *Data Analyst*: Climate Data Analysis (Level 4, Imp: 90), NWP Modeling (Level 3, Imp: 75), Instrumentation (Level 3, Imp: 70).
    - *Hydrometeorologist & Flash Flood Forecaster*: Radar Meteorology (Level 3, Imp: 85), Synoptic Meteorology (Level 4, Imp: 90), Ocean State Forecasting (Level 3, Imp: 75).
    - *Seismologist & Earthquake Analyst*: Seismological Data Processing (Level 4, Imp: 95), Instrumentation (Level 3, Imp: 80).
  - Ensure diagnostic assessments exist for baseline evaluation.

---

### 2. Backend Services (7 Core Modules)

#### Module 1: Profile Onboarding & Validation Service
- **File**: `backend/src/services/onboarding.service.ts`
  - Validates and stores onboarding data: Personal info, Target Role, Department, Experience, Current Skills with self-reported proficiency, Learning Goals, and Preferences.
  - Initializes `TraineeProfile` with `profileCompleted = true`.
  - Sets up `UserSkill` and initial `UserCompetency` with cold-start neutral priors and low confidence (0.40 - 0.50).

#### Module 2: Role Competency Resolver Service
- **File**: `backend/src/services/role-competency.service.ts`
  - Strictly reads role competency catalogue from PostgreSQL:
    - `getRoles()`: Returns all active roles with department and descriptions.
    - `getRoleCompetencies(roleId)`: Returns required competencies, levels, importance, and criticality.
    - Ensures no LLM hallucination of role competency requirements.

#### Module 3: Data Sufficiency Engine & State Machine
- **File**: `backend/src/services/data-sufficiency.service.ts`
  - Deterministic evaluation before running AI or recommendation engines:
    - Signal weights:
      - Valid Role: 20 pts (HARD REQUIREMENT: missing -> `BLOCKED`)
      - Role Competency Mapping: 20 pts (missing mapping -> `ROLE_COMPETENCY_DATA_UNAVAILABLE`)
      - Current Skills: 20 pts (pro-rated by skill coverage)
      - Skill Proficiency / Evidence: 20 pts
      - Assessment Evidence: 10 pts (from diagnostic or course assessments)
      - Learning Goals: 10 pts
    - Score bands:
      - `80–100`: `READY`
      - `60–79`: `LIMITED`
      - `40–59`: `NEEDS_MORE_DATA`
      - `0–39`: `BLOCKED`
    - Differentiates explicit error codes:
      - `READY`: Data sufficient for optimal recommendations.
      - `RECOMMENDATION_ENGINE_ERROR`: Technical breakdown.
      - `INSUFFICIENT_PROFILE_DATA`: Role exists but no skills/evidence.
      - `ROLE_COMPETENCY_DATA_UNAVAILABLE`: Role lacks configured competency mappings.
      - `NO_COURSE_MATCH`: Missing skill identified, but no published course covers it.
      - `NO_TRAINER_MATCH`: Course available, but no approved trainer meets criteria.
    - Returns actionable next steps: `[COMPLETE_PROFILE]`, `[ADD_SKILLS]`, `[DIAGNOSTIC_ASSESSMENT]`.
  - **Cold-Start Diagnostic Assessment Service**:
    - `getDiagnosticAssessment(roleId)`: Returns targeted diagnostic assessment.
    - `submitDiagnosticAssessment(userId, attemptData)`: Authoritative grading, creates `DIAGNOSTIC_ATTEMPT` learning events, elevates competency confidence to 0.70 - 0.85, sets `initialAssessmentCompleted = true`.

#### Module 4: AI Skill Gap Analyzer Service
- **File**: `backend/src/services/skill-gap-analysis.service.ts`
  - Database learner competencies are the authoritative source of truth.
  - Sends structured JSON to LLM: `{ role, requiredCompetencies, learnerCompetencies }`.
  - LLM returns structured JSON with gap severity (`HIGH`, `MEDIUM`, `LOW`), gap level, and explainable reasons.
  - Robust deterministic fallback ensuring 100% uptime if LLM is unavailable.

#### Module 5: Course Matching Engine & Hard Availability Filter
- **File**: `backend/src/services/course-matching.service.ts`
  - Queries `CourseCompetency` joined with published courses in PostgreSQL.
  - **HARD FILTER**: Only courses physically present in the database with status `PUBLISHED` can be returned.
  - If a missing competency has no corresponding course in DB, flags `NO_COURSE_MATCH` with a truthful, friendly message rather than inventing a course.

#### Module 6: Course Recommendation Ranker
- **File**: `backend/src/services/course-ranking.service.ts`
  - Multi-factor deterministic ranking:
    - 35% Skill gap relevance
    - 25% Competency coverage
    - 15% Prerequisite fit
    - 10% Course quality (ratings / completion rate)
    - 10% Difficulty fit
    - 5% Learner preference
  - Produces explainable reasons for every recommendation:
    - "Why this course?"
    - "Covers X% of your [Competency] gap required for [Role]."

#### Module 7: Course-Specific Trainer Matching & Ranker
- **File**: `backend/src/services/trainer-matching.service.ts`
  - Endpoint: `GET /api/v1/courses/:courseId/trainers`
  - Hard filters:
    - Trainer teaches course OR has verified expertise in course competencies (`TrainerExpertise`)
    - Trainer active and approved (`UserStatus.APPROVED`)
    - Trainer available (`isAvailable = true`)
  - Multi-factor ranking:
    - 35% Course Expertise
    - 25% Competency Match
    - 20% Rating (average rating from `TrainerProfile` and `Feedback`)
    - 10% Experience (years of experience)
    - 10% Availability
  - State machine:
    - `MATCHED`: Returns ranked mentors with match % and breakdown.
    - `NO_TRAINER_MATCH`: Graceful UI state when no approved trainer satisfies criteria.
    - `LIMITED_EVIDENCE`: Graceful UI state when trainer data is unverified.

---

### 3. API Routes & Controllers
- **File**: `backend/src/routes/trainee.routes.ts`
  - `POST /api/v1/trainee/onboarding`: Submits trainee onboarding data.
  - `GET /api/v1/trainee/recommendations/readiness`: Returns data sufficiency status and score.
  - `POST /api/v1/trainee/skill-gap/analyze`: Runs skill gap analysis.
  - `GET /api/v1/trainee/recommendations`: Returns ranked recommended courses with explainable reasons.
  - `GET /api/v1/trainee/diagnostic`: Returns diagnostic assessment.
  - `POST /api/v1/trainee/diagnostic/submit`: Submits diagnostic assessment.
- **File**: `backend/src/routes/course.routes.ts`
  - `GET /api/v1/courses/:courseId/trainers`: Returns course-specific matched mentors with rankings and explainable scores.
- **File**: `backend/src/routes/role.routes.ts`
  - `GET /api/v1/roles`: Returns all role profiles.
  - `GET /api/v1/roles/:roleId/competencies`: Returns role competencies catalogue.

---

### 4. Frontend Trainee Pages & Components

1. **Onboarding Page (`frontend/src/app/trainee/onboarding/page.tsx`)**:
   - Modern, high-aesthetic multi-step wizard:
     - Step 1: Personal Info (Name, Email, Organization)
     - Step 2: Cadre & Target Role (Select from DB role catalogue, Department, Designation, Years of Experience)
     - Step 3: Self-Reported Skills (Search & select skills, rate proficiency 1-5)
     - Step 4: Learning Goals & Preferences (Modality: Online/Hybrid/Self-paced, Language, Available hours/week)
     - Step 5: Cold-Start Choice: Complete now or Take 10-Minute Diagnostic Assessment
   - Redirect / link from `/trainee/setup` to ensure a single canonical flow.
   - Profile completion guard in AppShell / ProtectedRoute.

2. **Recommendations Page (`frontend/src/app/trainee/recommendations/page.tsx`)**:
   - Live integration with `/api/v1/trainee/recommendations/readiness`:
     - If `NEEDS_MORE_DATA` or `BLOCKED`: Displays the smart prompt card ("We know your target role, but we need more information about your current skills") with buttons: `[Add Skills]` and `[Take Diagnostic Assessment]`.
     - If `ROLE_COMPETENCY_DATA_UNAVAILABLE`: Displays informative alert with option to pick another role.
     - If `READY` or `LIMITED`: Displays recommended courses with match badges (e.g., "94% Match"), explainable reasons ("Why this course?"), competency coverage, and "View Course & Mentors" action.
     - Gracefully displays `NO_COURSE_MATCH` notifications for missing competencies without available courses.

3. **Course Detail Page (`frontend/src/app/trainee/courses/[id]/page.tsx`)**:
   - Displays "Recommended for You" banner if the course matches the trainee's skill gaps (e.g., "94% Match • High Competency Gap • Required for your Role").
   - Course Overview, Modules, Lessons, Assessments.
   - **Recommended Mentors Section**:
     - Fetches from `GET /api/v1/courses/:courseId/trainers`.
     - Displays ranked mentors with Match Score (e.g. 97%), Star Rating (⭐ 4.9), Years of Experience, Matched Competencies, "View Profile", and "Choose Mentor".
     - Shows `NO_TRAINER_MATCH` or `LIMITED_EVIDENCE` fallback when applicable.

4. **Diagnostic Assessment Page (`frontend/src/app/trainee/diagnostic/page.tsx`)**:
   - Clean, focused diagnostic runner for new trainees to establish their baseline competency profile.
   - Immediately updates competency evidence, raises confidence, and redirects to recommendations.

5. **Skill Gaps Page (`frontend/src/app/trainee/skill-gaps/page.tsx`)**:
   - Visualizes target role required competencies vs current levels, gap severity, and direct button to see matching courses.

---

## Verification Plan

### Automated Tests & Verification Script
- Create `backend/scripts/verify-trainee-pipeline.ts`:
  1. Test Onboarding: Register/fetch trainee, submit onboarding with role, verify `profileCompleted`.
  2. Test Role Competency Resolver: Verify role competency mappings for all MoES roles.
  3. Test Data Sufficiency: Verify all 4 states (`BLOCKED`, `NEEDS_MORE_DATA`, `LIMITED`, `READY`) and error codes.
  4. Test Diagnostic Assessment: Start diagnostic, submit answers, verify `UserCompetency` confidence boost.
  5. Test Skill Gap Analysis: Verify AI / structured gap calculation against DB learner model.
  6. Test Course Matching & Hard DB Filter: Verify only published DB courses are recommended; verify `NO_COURSE_MATCH` fallback.
  7. Test Course Ranking: Verify 6-factor weighting and explainable reasons.
  8. Test Course-Specific Trainer Matching: Call `/courses/:courseId/trainers`, verify 5-factor weighting (Course expertise 35%, Competency 25%, Rating 20%, Experience 10%, Availability 10%), verify `NO_TRAINER_MATCH` state.

### Frontend Compilation
- Run `npm run build` in `frontend/` to ensure all pages compile cleanly with 0 TypeScript/ESLint errors.

### Manual / Browser Verification
- Walk through the entire trainee flow in the browser:
  - Complete Onboarding → Check Data Sufficiency → View Recommendations → Open Course → View Recommended Mentors for Course.
