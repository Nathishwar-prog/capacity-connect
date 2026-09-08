# 01. Enrollment Lifecycle & Operations

## Overview

The Enrollment Lifecycle governs how learners (Trainees) register for courses, how course states are enforced prior to enrollment, and how enrollments can be dropped or reactivated.

```text
       [ Course: PUBLISHED ]
                 │
                 ▼
        POST /enrollments
                 │
                 ▼
          [ ENROLLED ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
 POST /progress    POST /drop
        │                 │
        ▼                 ▼
  [ IN_PROGRESS ]     [ DROPPED ]
        │                 │
  (All Lessons)           └────► Re-enroll: POST /enrollments
        │                              (Resets to ENROLLED)
        ▼
   [ COMPLETED ]
```

## Business & Security Rules

1. **Publication Validation**:
   - Trainees can ONLY enroll in courses with `status === 'PUBLISHED'`.
   - Attempting to enroll in a `DRAFT`, `PENDING_APPROVAL`, `REJECTED`, or `ARCHIVED` course throws `400 Bad Request`.

2. **Organization Boundary Enforcement**:
   - `trainee.organizationId` MUST equal `course.organizationId`.
   - Attempting to enroll in a course belonging to a different organization throws `403 Forbidden`.

3. **Duplicate & Re-enrollment Handling**:
   - Active enrollments (`ENROLLED`, `IN_PROGRESS`, `COMPLETED`) throw `409 Conflict` if enrollment is attempted again.
   - If an enrollment was previously `DROPPED`, calling `POST /enrollments` reactivates the enrollment back to `ENROLLED`.

4. **Dropping Courses**:
   - Active course enrollments can be dropped via `POST /api/v1/enrollments/:id/drop`.
   - Completed course enrollments (`COMPLETED`) cannot be dropped and throw `400 Bad Request`.
