# Capacity Connect — Assessment Backend Module Documentation (M3 Development 5)

## Executive Overview
The **Assessment Backend Module** provides a secure, role-driven, MCQ-focused assessment framework for the Capacity Connect enterprise application. It enables Trainers and Admins to author assessments and manage questions, while providing Trainees with secure, timed attempt execution and authoritative server-side scoring.

---

## 1. Architectural Components

```
+-----------------------------------------------------------------------+
|                            API Gateway                                |
|                   /api/v1/assessments (Routes)                        |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                      Assessment Controller                            |
|             (HTTP validation, status mapping, DTOs)                   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       Assessment Service                              |
|   - IDOR Trainer Course Ownership Validation                          |
|   - Trainee Enrollment Guard (EnrollmentRepository)                    |
|   - Answer Sanitization (Strips isCorrect & explanation)              |
|   - Server-Side Attempt Timer & Expiry Enforcement                    |
|   - Authoritative Scoring Engine (Transactional)                     |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                      Assessment Repository                            |
|              (Prisma Transactional Data Access)                       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          PostgreSQL Database                          |
| (Assessment, AssessmentQuestion, QuestionOption, AssessmentAttempt)   |
+-----------------------------------------------------------------------+
```

---

## 2. Key Security Features & Design Decisions

### 2.1 Correct Answer Protection (Anti-Cheating Guard)
- Trainees calling `GET /assessments/:id`, `POST /assessments/:id/attempts`, or `GET /assessments/:id/attempts/:attemptId` receive sanitized question option payloads where `isCorrect` and `explanation` properties are strictly deleted server-side before response transmission.
- Correct answers remain secure on the server.

### 2.2 Strict IDOR & Role-Based Access Control (RBAC)
- **Trainers** can only create, edit, or delete assessments for courses they own (`course.trainerId === req.user.id`).
- **Trainees** can only attempt assessments for courses in which they are actively enrolled (`Enrollment.findByUserAndCourse`).
- **Trainees** can only view and submit their own attempts (`attempt.userId === req.user.id`).

### 2.3 Authoritative Server-Side Scoring Engine
- Answers submitted by trainees are evaluated server-side within a Prisma `$transaction`.
- Total marks, score percentages, and pass/fail indicators (`score >= passingScore`) are derived strictly from database truth.
- Attempt durations are enforced using server timestamps (`startedAt + durationMinutes + 30s grace period`). Submissions exceeding duration limits are auto-expired and rejected.

---

## 3. Registered API Endpoint Catalog

| HTTP Method | Route Endpoint | Required Roles | Description |
|---|---|---|---|
| `POST` | `/api/v1/assessments` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Create new assessment |
| `GET` | `/api/v1/assessments` | `ALL` | Paginated assessment list (Trainees see only `PUBLISHED`) |
| `GET` | `/api/v1/assessments/:id` | `ALL` | Get assessment details (Sanitized for `TRAINEE`) |
| `PATCH` | `/api/v1/assessments/:id` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Update assessment metadata & status |
| `DELETE` | `/api/v1/assessments/:id` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Delete assessment |
| `POST` | `/api/v1/assessments/:id/questions` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Add MCQ question with options & marks |
| `PATCH` | `/api/v1/assessments/:id/questions/:qId` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Update question or options |
| `DELETE` | `/api/v1/assessments/:id/questions/:qId` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | Delete question |
| `POST` | `/api/v1/assessments/:id/attempts` | `TRAINEE`, `ADMIN`, `SUPER_ADMIN` | Start or resume assessment attempt |
| `GET` | `/api/v1/assessments/:id/attempts/:attId` | `ALL` | Get attempt progress (Sanitized for `TRAINEE`) |
| `POST` | `/api/v1/assessments/:id/attempts/:attId/submit` | `TRAINEE`, `ADMIN`, `SUPER_ADMIN` | Submit answers for scoring & finalization |
| `GET` | `/api/v1/assessments/:id/attempts/:attId/result` | `ALL` | Get attempt score, percentage & pass/fail result |

---

## 4. Verification & Automated Test Coverage

The automated Jest test suite in `backend/src/__tests__/assessment.service.test.ts` provides **100% test coverage** across 15 core scenarios:

1. **Assessment CRUD & RBAC Authorization**: Validates trainer course ownership enforcement and trainee blocking.
2. **Correct Answer Protection (Sanitization)**: Verifies `isCorrect` and `explanation` stripping for trainee requests.
3. **Trainee Attempt Lifecycle**: Validates course enrollment guards, active attempt resumption, and deadline expiration.
4. **Automated Scoring Engine & Submission**: Verifies 100% score calculation, partial score calculation, pass/fail thresholds, time-limit auto-expiry, and duplicate submission guards.
5. **Results & IDOR Protection**: Verifies trainee ownership checks when retrieving assessment attempt results.
