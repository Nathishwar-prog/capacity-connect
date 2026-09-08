# Enrollment & Progress Management Module Overview

Welcome to the **Enrollment & Progress Management** documentation suite for **CAPACITY CONNECT** (Ministry of Earth Sciences / India Meteorological Department LMS).

## Overview

The Enrollment & Progress Management module handles the end-to-end lifecycle of learner registrations, lesson completion tracking, course progress percentage auto-calculation, and enrollment status transitions.

## Documentation Index

- [**01. Enrollment Lifecycle**](./01_enrollment_lifecycle.md): Course publication validation, enrollment creation, re-enrollment, and course dropping.
- [**02. Progress Tracking & Completion**](./02_progress_tracking.md): Lesson-level progress upserts, auto-calculation of course percentage, `ENROLLED` -> `IN_PROGRESS` -> `COMPLETED` state machine.
- [**03. Authorization & Testing**](./03_authorization_and_testing.md): Section 39 compliance, RBAC matrix, IDOR protection, Jest test cases, and OpenAPI testing guide.

## System API Summary

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/enrollments` | `POST` | `TRAINEE` / `ADMIN` | Enroll in a `PUBLISHED` course |
| `/api/v1/enrollments` | `GET` | `TRAINEE` / `ADMIN` | List my enrolled courses |
| `/api/v1/enrollments/:id` | `GET` | `TRAINEE` / `ADMIN` / `TRAINER` | View enrollment details & progress tree |
| `/api/v1/enrollments/:id/lessons/:lessonId/progress` | `POST` | `TRAINEE` | Update lesson completion & recalculate progress |
| `/api/v1/enrollments/:id/drop` | `POST` | `TRAINEE` / `ADMIN` | Drop course enrollment |
