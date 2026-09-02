# 🚀 Module 07: Migrations, Neon Configuration & Verification

## 1. Database Environment

* **Target Database Engine**: PostgreSQL 16+
* **Host**: Neon Serverless PostgreSQL
* **ORM**: Prisma ORM 5.22.0
* **Schema Path**: `backend/prisma/schema.prisma`

---

## 2. Neon Connection Strategy

Prisma connects to Neon using two distinct connection strings configured via environment variables:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

* **`DATABASE_URL`**: Connects via Neon's pooled endpoint (`-pooler.region.neon.tech`) using PgBouncer for transaction-level connection pooling. Used for runtime queries.
* **`DIRECT_URL`**: Connects directly to the compute instance (`.region.neon.tech`) without pooling. Required by Prisma CLI for executing migrations and DDL locks.

---

## 3. Applied Migration History

### Migration: `20260902152535_init_capacity_connect`
* **Status**: Applied successfully to live Neon PostgreSQL database.
* **Tables Created**: 32 relational tables (`organizations`, `departments`, `users`, `roles`, `permissions`, `role_permissions`, `refresh_tokens`, `audit_logs`, `trainee_profiles`, `trainer_profiles`, `skills`, `user_skills`, `trainer_expertise`, `qualifications`, `work_experiences`, `certificates`, `certificate_verifications`, `courses`, `course_prerequisites`, `course_modules`, `lessons`, `enrollments`, `lesson_progress`, `resources`, `course_resources`, `lesson_resources`, `assessments`, `assessment_questions`, `question_options`, `assessment_attempts`, `assessment_answers`, `competencies`, `competency_levels`, `course_competencies`, `user_competencies`, `assessment_competency_results`, `skill_gaps`, `recommendations`, `trainer_matches`, `feedbacks`, `announcements`, `notifications`, `achievements`).
* **Enums Created**: 22 PostgreSQL native ENUM types.

---

## 4. Seed Data Verification

The seed script (`backend/prisma/seed.ts`) populates structured test data:
* **Organization**: `Capacity Connect Demo Organization` (`CC-DEMO`)
* **Departments**: `Technology & Engineering`, `Human Resources`, `Training & Development`
* **RBAC**: 4 Roles (`SUPER_ADMIN`, `ADMIN`, `TRAINER`, `TRAINEE`) and 9 granular Permissions
* **Accounts**:
  * Super Admin: `superadmin@capacityconnect.io`
  * Admin: `admin@enterprise.com`
  * Trainers: `alex.trainer@enterprise.com`, `elena.trainer@enterprise.com`
  * Trainees: `user@enterprise.com`, `mark.trainee@enterprise.com`, `david.trainee@enterprise.com`
* **Skills**: `Python`, `Java`, `SQL & PostgreSQL`, `Machine Learning`, `Cloud Computing`, `Communication`
* **Competencies**: 5 Competency models with 6-tier level hierarchies (`0` to `5`)
* **Courses**: `Python Fundamentals & Object-Oriented Design`, `Advanced Python: Concurrency & Design Patterns` (with prerequisite relationship)
* **Assessments**: Multi-question MCQ certification test with passing thresholds and answer keys
* **Simulated Trainee Journey**: Enrollment, progress tracking, submitted attempt, competency result, skill-gap detection, course recommendation, and trainer match.

---

## 5. Relational Verification Suite

Run the full integrity test suite with:
```bash
cd backend
npx ts-node prisma/verify_db.ts
```

### Verified Business Relations:
1. `User` $\rightarrow$ `TraineeProfile` & `Organization`
2. `User` $\rightarrow$ `Skills`
3. `Trainer` $\rightarrow$ `Courses`
4. `Course` $\rightarrow$ `Modules` $\rightarrow$ `Lessons`
5. `Course` $\rightarrow$ `Enrollment` $\rightarrow$ `LessonProgress`
6. `Course` $\rightarrow$ `Assessment` $\rightarrow$ `Questions` $\rightarrow$ `Options`
7. `Assessment` $\rightarrow$ `Attempts` $\rightarrow$ `Answers` & `CompetencyResults`
8. `Course` $\rightarrow$ `Competencies` (Target Level)
9. `User` $\rightarrow$ `UserCompetency`
10. `User` $\rightarrow$ `SkillGap`
11. `User` $\rightarrow$ `Recommendation`
12. `Trainee` $\rightarrow$ `TrainerMatch`
