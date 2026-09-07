# 03. Authorization, RBAC Matrix & Testing Guide

## Section 39 Specification Compliance

All authorization, authentication, IDOR protection, and role-based enrollment testing strictly uses the project's canonical database seed users. No fake or temporary users are created during test setup or execution.

### Canonical Database Users

| Role | Canonical Email | User ID | Authorization Scope |
| :--- | :--- | :--- | :--- |
| **`TRAINEE 1`** | `user@enterprise.com` | `trainee-user-1` | Enrolls in courses, updates own lesson progress, views own courses, drops own enrollment. |
| **`TRAINEE 2`** | `mark.trainee@enterprise.com` | `trainee-user-2` | Secondary trainee used for IDOR cross-trainee ownership testing. |
| **`TRAINER`** | `alex.trainer@enterprise.com` | `trainer-user-1` | Views enrollment details for courses taught by trainer. |
| **`ADMIN`** | `admin@enterprise.com` | `admin-user-1` | Administrative oversight across organizational enrollments. |

---

## RBAC Authorization Matrix

| Action / Endpoint | `TRAINEE` (Owner) | `TRAINEE` (Other) | `TRAINER` (Course Author) | `ADMIN` / `SUPER_ADMIN` |
| :--- | :---: | :---: | :---: | :---: |
| **Enroll in Course** (`POST /enrollments`) | ✅ Allowed | N/A | ❌ Rejected | ✅ Allowed |
| **List My Courses** (`GET /enrollments`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ✅ Allowed |
| **View Enrollment Details** (`GET /enrollments/:id`) | ✅ Allowed | ❌ `403 Forbidden` | ✅ Allowed | ✅ Allowed |
| **Update Lesson Progress** (`POST /:id/lessons/:lessonId/progress`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ Rejected |
| **Drop Enrollment** (`POST /enrollments/:id/drop`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ✅ Allowed |

---

## Automated Test Results (`enrollment.service.test.ts`)

- **Total Unit & Integration Tests**: 18 Passed, 0 Failed (18 Total)
- **Overall Suite**: 70 Passed across 3 test suites (`enrollment.service.test.ts`, `course-structure.service.test.ts`, `course.service.test.ts`).
- **Pass Rate**: 100%

### Test Scenarios Covered
- `TC-ENR-001`: Trainee enrolls in `PUBLISHED` course (Pass)
- `TC-ENR-002`: Enroll in `DRAFT` course rejected with `400 Bad Request` (Pass)
- `TC-ENR-003`: Foreign organization course enrollment rejected with `403 Forbidden` (Pass)
- `TC-ENR-004`: Duplicate active enrollment rejected with `409 Conflict` (Pass)
- `TC-ENR-005`: Re-enrolling in `DROPPED` course resets status to `ENROLLED` (Pass)
- `TC-ENR-010`: Trainee fetches own enrollments (Pass)
- `TC-ENR-011`: Non-admin accessing another user's enrollments rejected with `403 Forbidden` (Pass)
- `TC-ENR-020`: Trainee views own enrollment details (Pass)
- `TC-ENR-021`: Trainee 2 accessing Trainee 1 enrollment details rejected with `403 Forbidden` (Pass)
- `TC-ENR-022`: Trainer views enrollment details for own course (Pass)
- `TC-ENR-023`: Admin views enrollment details (Pass)
- `TC-ENR-030`: Partial lesson progress updates course percentage and transitions status to `IN_PROGRESS` (Pass)
- `TC-ENR-031`: All lessons completed transitions status to `COMPLETED` (Pass)
- `TC-ENR-032`: Trainee 2 updating Trainee 1 progress rejected with `403 Forbidden` (Pass)
- `TC-ENR-033`: Updating progress on `DROPPED` course rejected with `400 Bad Request` (Pass)
- `TC-ENR-040`: Trainee drops active enrollment (Pass)
- `TC-ENR-041`: Dropping `COMPLETED` enrollment rejected with `400 Bad Request` (Pass)
- `TC-ENR-042`: Trainee 2 dropping Trainee 1 enrollment rejected with `403 Forbidden` (Pass)
