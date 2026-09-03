# Implementation Plan: Complete Trainer Module for Capacity Connect

This document outlines the architectural and engineering implementation plan for the complete **Trainer Module** for CAPACITY CONNECT (Ministry of Earth Sciences & India Meteorological Department), adhering to [DOMAINSPECIFICRULE.md](file:///d:/projects/capacity-connect/DOMAINSPECIFICRULE.md) and [INSTRUCTION.md](file:///d:/projects/capacity-connect/INSTRUCTION.md).

---

## 1. Goal Description

Build the complete, production-grade **Trainer Module** covering the full capacity-building lifecycle:
1. **Trainer Dashboard**: Action-oriented KPI hub (active courses, learners, pending evaluations, action required items).
2. **Trainer Profile & Expertise**: Personal, professional, qualifications, experience, and domain skill competencies.
3. **Trainee Monitoring & Trainee Detail**: Scoped visibility into enrolled trainees, module/lesson progress, competency baselines, and skill gaps.
4. **Course Management**: Scoped course portfolio, filtering by status (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`, `ARCHIVED`), and approval workflow transitions.
5. **Course Upload**: Initial course creation, metadata, category, difficulty, thumbnail, and learning resources.
6. **Course Builder**: Structured course authoring tree (modules, lessons with multi-format content, ordering, prerequisites, and competency mapping).
7. **Assessment Management**: Creation of assessments, multiple-choice questions, scoring thresholds, attempt reviews, and results.
8. **Trainer Analytics**: Performance insights, course completion velocity, average scores, and competency coverage.
9. **Trainee Feedback & Notifications**: Reviews, ratings, approval notices, and system alerts.

---

## 2. User Review & Architectural Highlights

> [!IMPORTANT]
> **Strict Scoping & Zero-Trust Security**:
> - All trainer endpoints are isolated under `/api/v1/trainer/*` and enforce `authenticate` + `requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN])`.
> - `trainerId`, `userId`, and `organizationId` are **always derived server-side** from JWT authentication context.
> - Trainers can only view, edit, or submit courses, assessments, and modules they own.
> - Trainee monitoring is strictly scoped to trainees enrolled in the trainer's courses.

> [!NOTE]
> **Zero Database Schema Disruptions**:
> The existing Prisma schema (`TrainerProfile`, `TrainerExpertise`, `Course`, `CourseModule`, `Lesson`, `Resource`, `Enrollment`, `LessonProgress`, `Assessment`, `AssessmentQuestion`, `Competency`, `CourseCompetency`, `SkillGap`, `Feedback`, `AuditLog`) fully supports the complete Trainer module without requiring disruptive schema alterations.

---

## 3. Phased Implementation Roadmap (Section 45 Order)

The implementation follows the exact 12-phase dependency order specified in the prompt:

### Phase 1: Trainer Backend Foundation
- **Route Namespace**: Register `/api/v1/trainer` router in [backend/src/routes/index.ts](file:///d:/projects/capacity-connect/backend/src/routes/index.ts).
- **Repositories**:
  - `TrainerRepository` ([backend/src/repositories/trainer.repository.ts](file:///d:/projects/capacity-connect/backend/src/repositories/trainer.repository.ts)): Scoped queries for courses, trainees, enrollments, assessments, profile, expertise, and stats.
  - `CourseRepository` ([backend/src/repositories/course.repository.ts](file:///d:/projects/capacity-connect/backend/src/repositories/course.repository.ts)): Course, module, lesson, prerequisite, and competency relations.
- **Service Layer**:
  - `TrainerService` ([backend/src/services/trainer.service.ts](file:///d:/projects/capacity-connect/backend/src/services/trainer.service.ts)): Business logic, ownership verification, state transition validation, and metric aggregations.
- **Controller & DTO**:
  - `TrainerController` ([backend/src/controllers/trainer.controller.ts](file:///d:/projects/capacity-connect/backend/src/controllers/trainer.controller.ts)).
  - Validation schemas using Zod ([backend/src/validators/trainer.validation.ts](file:///d:/projects/capacity-connect/backend/src/validators/trainer.validation.ts)).

### Phase 2: Trainer Profile & Expertise
- **Backend Endpoints**:
  - `GET /api/v1/trainer/profile` — Returns personal, professional info, qualifications, work experiences, and stats.
  - `PATCH /api/v1/trainer/profile` — Update designation, bio, years of experience.
  - `GET /api/v1/trainer/expertise` — List trainer expertise skills with levels.
  - `POST /api/v1/trainer/expertise` — Add/link skill with proficiency (1–5).
  - `DELETE /api/v1/trainer/expertise/:skillId` — Remove skill expertise.
- **Frontend**:
  - Dedicated Profile view / tabbed editor in [frontend/src/features/trainer/components/TrainerProfileView.tsx](file:///d:/projects/capacity-connect/frontend/src/features/trainer/components/TrainerProfileView.tsx) with Qualifications, Experience, and Skill Expertise badges.

### Phase 3: Trainer Dashboard
- **Backend Endpoint**:
  - `GET /api/v1/trainer/dashboard` — Live aggregated metrics (total courses, published, drafts, pending approval, total enrolled trainees, active learners, completed, avg progress, pending evaluations, recent activity, action required items).
- **Frontend**:
  - Enhanced [frontend/src/features/dashboard/trainer/TrainerDashboard.tsx](file:///d:/projects/capacity-connect/frontend/src/features/dashboard/trainer/TrainerDashboard.tsx) connected directly to live API metrics with empty states, loading skeletons, action required cards, and quick course authoring actions.

### Phase 4: Trainee Monitoring & Individual Trainee Detail
- **Backend Endpoints**:
  - `GET /api/v1/trainer/trainees` — Paginated list of trainees enrolled in trainer's courses with search, course filter, status filter, and progress ranges.
  - `GET /api/v1/trainer/trainees/:traineeId` — Deep dive into individual trainee: enrolled courses, lesson progress breakdown, competency level vs required level, skill gaps, assessment scores, and recent activity.
- **Frontend**:
  - `TrainerTraineesPage` at `/trainer/trainees` ([frontend/src/app/trainer/trainees/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/trainees/page.tsx)).
  - `TraineeDetailPage` at `/trainer/trainees/[traineeId]` ([frontend/src/app/trainer/trainees/[traineeId]/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/trainees/[traineeId]/page.tsx)).

### Phase 5: Course Management
- **Backend Endpoints**:
  - `GET /api/v1/trainer/courses` — Scoped course list with status tabs (`ALL`, `DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `ARCHIVED`), search, category, and difficulty filters.
  - `POST /api/v1/trainer/courses` — Create initial course draft.
  - `GET /api/v1/trainer/courses/:courseId` — Get course details with modules, lessons, and competencies.
  - `PATCH /api/v1/trainer/courses/:courseId` — Update course metadata (only if in DRAFT or REJECTED state).
  - `DELETE /api/v1/trainer/courses/:courseId` — Archive/delete draft course.
  - `POST /api/v1/trainer/courses/:courseId/submit` — Transition course from `DRAFT` to `PENDING_APPROVAL` with strict structural validation.
- **Frontend**:
  - `TrainerCoursesPage` at `/trainer/courses` ([frontend/src/app/trainer/courses/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/page.tsx)).

### Phase 6: Course Upload & Initial Creation
- **Frontend**:
  - `CourseUploadPage` at `/trainer/courses/new` ([frontend/src/app/trainer/courses/new/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/new/page.tsx)).
  - Form validation: title, slug, category, difficulty, duration, description, target competencies, and initial learning resource links.

### Phase 7: Course Builder (Modules & Lessons)
- **Backend Endpoints**:
  - `POST /api/v1/trainer/courses/:courseId/modules` — Create module with order index.
  - `PATCH /api/v1/trainer/courses/:courseId/modules/:moduleId` — Rename/edit module.
  - `DELETE /api/v1/trainer/courses/:courseId/modules/:moduleId` — Remove module.
  - `POST /api/v1/trainer/courses/:courseId/modules/:moduleId/lessons` — Create lesson (`VIDEO`, `ARTICLE`, `DOCUMENT`, `QUIZ`, `PDF`).
  - `PATCH /api/v1/trainer/courses/:courseId/modules/:moduleId/lessons/:lessonId` — Edit lesson.
  - `DELETE /api/v1/trainer/courses/:courseId/modules/:moduleId/lessons/:lessonId` — Remove lesson.
  - `PUT /api/v1/trainer/courses/:courseId/reorder` — Reorder modules and lessons.
  - `POST /api/v1/trainer/courses/:courseId/competencies` — Map/unmap course competencies and target levels.
  - `POST /api/v1/trainer/courses/:courseId/prerequisites` — Add/remove prerequisite courses.
- **Frontend**:
  - Full interactive Course Builder at `/trainer/courses/[courseId]/builder` ([frontend/src/app/trainer/courses/[courseId]/builder/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/[courseId]/builder/page.tsx)) featuring tree navigation, module editing, lesson editing with content previews, autosave debounce, and validation alerts.

### Phase 8: Assessment Management
- **Backend Endpoints**:
  - `GET /api/v1/trainer/assessments` — List trainer-authored assessments.
  - `POST /api/v1/trainer/assessments` — Create assessment with questions, options, and passing score.
  - `GET /api/v1/trainer/assessments/:assessmentId` — View assessment questions and submissions.
  - `GET /api/v1/trainer/assessments/:assessmentId/attempts` — View trainee attempts and scores.
- **Frontend**:
  - `TrainerAssessmentsPage` at `/trainer/assessments` ([frontend/src/app/trainer/assessments/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/assessments/page.tsx)).

### Phase 9: Trainer Analytics
- **Backend Endpoint**:
  - `GET /api/v1/trainer/analytics` — Aggregated course completion rates, score distributions, trainee enrollment timeline, and competency coverage.
- **Frontend**:
  - `TrainerAnalyticsPage` at `/trainer/analytics` ([frontend/src/app/trainer/analytics/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/analytics/page.tsx)).

### Phase 10: Feedback & Notifications
- **Backend Endpoints**:
  - `GET /api/v1/trainer/feedback` — List trainee ratings and reviews.
  - `GET /api/v1/trainer/notifications` — Trainer-relevant alerts and pending actions.
- **Frontend**:
  - `TrainerFeedbackPage` at `/trainer/feedback` and Notification drawer integration.

### Phase 11 & 12: Testing, Verification & Walkthrough
- Backend integration tests validating ownership guards, state transitions, and trainee scoping.
- TypeScript check (`npm run typecheck`) and verification of complete end-to-end flows.
- Comprehensive [walkthrough.md](file:///C:/Users/ACER-PC/.gemini/antigravity-ide/brain/440f2f9d-8953-4e33-99bc-50f8a56e517a/walkthrough.md) documenting all endpoints and UI views.

---

## 4. Proposed Changes by File

### Backend (Component: Trainer Module API)
#### [NEW] [trainer.repository.ts](file:///d:/projects/capacity-connect/backend/src/repositories/trainer.repository.ts)
Scoped Prisma queries for trainer data (courses, cohorts, assessments, profile, analytics).

#### [NEW] [trainer.service.ts](file:///d:/projects/capacity-connect/backend/src/services/trainer.service.ts)
Business logic, validation of course state transitions, and authorization scope.

#### [NEW] [trainer.controller.ts](file:///d:/projects/capacity-connect/backend/src/controllers/trainer.controller.ts)
HTTP request handling and JSON response contracts.

#### [NEW] [trainer.validation.ts](file:///d:/projects/capacity-connect/backend/src/validators/trainer.validation.ts)
Zod schemas for course creation, module/lesson editing, profile updates, and assessments.

#### [NEW] [trainer.routes.ts](file:///d:/projects/capacity-connect/backend/src/routes/trainer.routes.ts)
Express router mounted at `/api/v1/trainer` protected with `authenticate` and `requireRole`.

#### [MODIFY] [index.ts](file:///d:/projects/capacity-connect/backend/src/routes/index.ts)
Mount `trainerRouter`.

---

### Frontend (Component: Trainer Feature & Pages)
#### [NEW] [trainerApi.ts](file:///d:/projects/capacity-connect/frontend/src/features/trainer/api/trainerApi.ts)
Axios API client methods for all `/api/v1/trainer/*` endpoints.

#### [NEW] [useTrainer.ts](file:///d:/projects/capacity-connect/frontend/src/features/trainer/hooks/useTrainer.ts)
TanStack Query hooks for trainer operations (dashboard, courses, trainees, builder, analytics).

#### [NEW] [trainerTypes.ts](file:///d:/projects/capacity-connect/frontend/src/features/trainer/types/trainer.types.ts)
TypeScript contracts matching backend DTOs.

#### [MODIFY] [AppShell.tsx](file:///d:/projects/capacity-connect/frontend/src/components/layout/AppShell.tsx)
Expand Trainer navigation items: Dashboard, My Profile, My Courses, Trainees, Assessments, Analytics, Feedback.

#### [NEW] Frontend Pages under `frontend/src/app/trainer/`
- [frontend/src/app/trainer/courses/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/page.tsx) — Course Management.
- [frontend/src/app/trainer/courses/new/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/new/page.tsx) — Course Upload / Creation.
- [frontend/src/app/trainer/courses/[courseId]/builder/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/courses/[courseId]/builder/page.tsx) — Course Builder.
- [frontend/src/app/trainer/trainees/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/trainees/page.tsx) — Trainee Monitoring.
- [frontend/src/app/trainer/trainees/[traineeId]/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/trainees/[traineeId]/page.tsx) — Individual Trainee Detail.
- [frontend/src/app/trainer/assessments/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/assessments/page.tsx) — Assessments.
- [frontend/src/app/trainer/analytics/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/analytics/page.tsx) — Analytics.
- [frontend/src/app/trainer/feedback/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/feedback/page.tsx) — Feedback.
- [frontend/src/app/trainer/profile/page.tsx](file:///d:/projects/capacity-connect/frontend/src/app/trainer/profile/page.tsx) — Trainer Profile & Expertise.

---

## 5. Verification Plan

### Automated Tests
1. **Backend Route & Guard Verification**:
   - Verify that unauthenticated requests to `/api/v1/trainer/*` return 401.
   - Verify that TRAINEE role requests return 403.
   - Verify that authenticated TRAINER (`dr.rathore.trainer@imd.gov.in`) successfully retrieves dashboard, courses, and trainees.
2. **Course Creation & Submission Cycle**:
   - Create a course draft via API $\to$ add module $\to$ add lesson $\to$ map competency $\to$ submit for approval $\to$ verify status transitions to `PENDING_APPROVAL`.
   - Verify ownership guard prevents Trainer B from editing Trainer A's course.
3. **TypeScript Validation**:
   - Run `npm run typecheck` in `backend` and `frontend` to verify 0 errors.

### Manual / Browser Verification
- Login as `dr.rathore.trainer@imd.gov.in` (password `Password123!`).
- Navigate through Dashboard $\to$ Courses $\to$ Builder $\to$ Trainees $\to$ Trainee Details $\to$ Assessments $\to$ Analytics.
- Verify real MoES/IMD data renders with loading, empty, and populated states.
