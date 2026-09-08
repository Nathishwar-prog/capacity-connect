# 01. Course Lifecycle & Management

## 1. Overview & Objective
The Course Management component governs course creation, metadata management, prerequisite linkage, and state transitions according to MoES and IMD institutional standards.

## 2. Course Lifecycle States
`DRAFT` -> `PENDING_APPROVAL` (Submit) -> `PUBLISHED` (Approve/Publish) OR `REJECTED` (Reject) -> `ARCHIVED` (Archive).

```text
       ┌──────────┐
       │  DRAFT   │ ◄───────┐
       └────┬─────┘         │
            │ Submit        │ Reject
            ▼               │
┌───────────────────────┐   │
│   PENDING_APPROVAL    ├───┴──────────┐
└───────────┬───────────┘              │
            │ Approve                  │ Approve
            ▼                          ▼
       ┌──────────┐              ┌───────────┐
       │PUBLISHED │              │ REJECTED  │
       └────┬─────┘              └───────────┘
            │ Archive
            ▼
       ┌──────────┐
       │ ARCHIVED │
       └──────────┘
```

## 3. Database Model (`Course`)
- `id` (UUID): Primary key.
- `organizationId` (UUID): Tenant boundary.
- `trainerId` (UUID): Owning trainer ID.
- `title` (String), `slug` (Unique String), `description` (Text).
- `category` (String), `difficulty` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`).
- `durationMinutes` (Int): Total estimated course duration.
- `status` (`DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`, `ARCHIVED`).
- `publishedAt` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime), `deletedAt` (DateTime).

## 4. API Endpoints

### 4.1 List Courses
- **GET** `/api/v1/courses`
- **Permissions**: `courses:read`
- **Query Params**: `skip`, `take`, `category`, `difficulty`, `status`, `search`

### 4.2 Get Course Details
- **GET** `/api/v1/courses/:id`
- **Permissions**: `courses:read`

### 4.3 Create Course
- **POST** `/api/v1/courses`
- **Permissions**: `courses:create` (Trainer role)
- **Body**: `CreateCourseDTO` (starts in `DRAFT` status)

### 4.4 Update Course
- **PATCH** `/api/v1/courses/:id`
- **Permissions**: `courses:update` (Owner Trainer / Admin)

### 4.5 Archive Course
- **DELETE** `/api/v1/courses/:id`
- **Permissions**: `courses:archive` (Owner Trainer / Admin)

### 4.6 Submit Course for Approval
- **POST** `/api/v1/courses/:id/submit`
- **Permissions**: `courses:submit` (Owner Trainer) -> transitions to `PENDING_APPROVAL`

### 4.7 Approve Course
- **POST** `/api/v1/courses/:id/approve`
- **Permissions**: `courses:approve` (Admin) -> transitions to `PUBLISHED`

### 4.8 Reject Course
- **POST** `/api/v1/courses/:id/reject`
- **Permissions**: `courses:reject` (Admin) -> transitions to `REJECTED`

### 4.9 Publish Course
- **POST** `/api/v1/courses/:id/publish`
- **Permissions**: `courses:publish` (Admin) -> transitions to `PUBLISHED`
