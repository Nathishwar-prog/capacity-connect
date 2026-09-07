# Trainer Monitoring APIs Module (M3 — Development 6)

## Overview
The **Trainer Monitoring APIs** module provides secure, role-based backend REST endpoints that enable trainers, administrators, and super-administrators to track and monitor trainee progress, performance, assessment participation, pass/fail status, and course completion across authorized courses.

The module enforces strict **Role-Based Access Control (RBAC)** and **Insecure Direct Object Reference (IDOR)** data isolation rules to ensure trainers can only access metrics and data for courses they own, while admins maintain organization-wide access.

---

## Key Capabilities
- **Monitoring Overview**: High-level aggregated statistics (total courses, trainees, average progress %, pass rates, completion rates).
- **Trainee Performance Monitoring**: Paginated lists of trainees with enrollment progress, lesson progress counts, assessment summary, and completion state.
- **Course-Level Monitoring**: Detailed metrics breakdown per course and list of enrolled trainees.
- **Detailed Trainee Progress Record**: Comprehensive view of an individual trainee's lesson progress breakdown and assessment attempt scores within an authorized course.
- **Assessment Participation & Scores Monitoring**: Query assessment attempts, score percentages, and pass/fail indicators (`PASS` / `FAIL`).

---

## Documentation Index
1. [Architecture & Endpoint Specification](./01_trainer_monitoring_architecture.md)
2. [Authorization, RBAC & IDOR Protection](./02_authorization_and_idor_protection.md)
