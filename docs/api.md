# REST API Endpoint Reference — Capacity Connect

**Digital Capacity Building and Learning Management Portal**  
*Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)*

This document provides complete, exhaustive documentation for each REST API endpoint implemented in Capacity Connect, detailing URL path, HTTP method, authentication requirements, role-based access controls (RBAC), rate limits, request parameters/payloads, and response structures.

---

## 1. System Architecture & Gateway Endpoints

### 1.1 Root Service Welcome & Status
- **Route**: `GET /`
- **Access**: Public
- **Description**: Returns root gateway information, institutional service name, API version, and timestamp.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Capacity Connect — Digital Capacity Building Portal for MoES / IMD",
    "version": "1.0.0",
    "status": "healthy",
    "timestamp": "2026-09-03T06:45:00.000Z",
    "apiCatalog": "/api/v1"
  }
  ```

### 1.2 Favicon Handler
- **Route**: `GET /favicon.ico`
- **Access**: Public
- **Description**: Silent handler returning HTTP 204 No Content to prevent 404 noise from browsers.
- **Response**: `204 No Content`

### 1.3 API Gateway v1 Index Catalog
- **Route**: `GET /api/v1`
- **Access**: Public
- **Description**: Interactive endpoint directory exposing available service routes.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Capacity Connect REST API Gateway v1",
    "status": "healthy",
    "timestamp": "2026-09-03T06:45:00.000Z",
    "endpoints": {
      "health": "/api/v1/health",
      "auth": {
        "login": "POST /api/v1/auth/login",
        "register": "POST /api/v1/auth/register",
        "refresh": "POST /api/v1/auth/refresh",
        "logout": "POST /api/v1/auth/logout",
        "me": "GET /api/v1/auth/me",
        "onboardingMeta": "GET /api/v1/auth/onboarding-meta",
        "onboarding": "POST /api/v1/auth/onboarding"
      },
      "users": {
        "list": "GET /api/v1/users",
        "create": "POST /api/v1/users",
        "me": "GET /api/v1/users/me",
        "updateMe": "PATCH /api/v1/users/me",
        "getById": "GET /api/v1/users/:id",
        "updateById": "PATCH /api/v1/users/:id",
        "deleteById": "DELETE /api/v1/users/:id"
      },
      "dashboard": {
        "trainee": "GET /api/v1/dashboard/trainee",
        "trainer": "GET /api/v1/dashboard/trainer",
        "admin": "GET /api/v1/dashboard/admin"
      }
    }
  }
  ```

### 1.4 System Health & Neon Database Check
- **Route**: `GET /api/v1/health`
- **Access**: Public
- **Description**: Verifies backend server health, environment mode, uptime, and Neon PostgreSQL connectivity.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Service is healthy",
    "data": {
      "status": "UP",
      "timestamp": "2026-09-03T06:45:00.000Z",
      "environment": "development",
      "uptimeSeconds": 142.5,
      "checks": {
        "database": {
          "status": "UP",
          "latencyMs": 18
        }
      }
    }
  }
  ```

---

## 2. Authentication & Session Endpoints (`/api/v1/auth/*`)

Security Specifications:
- **Access Tokens**: Short-lived JWT (15 minutes), passed via `Authorization: Bearer <token>`.
- **Refresh Tokens**: Long-lived single-use rotating token (7 days), stored in an `HttpOnly`, `Secure` (in prod), `SameSite=Lax` cookie scoped to `/api/v1/auth`.
- **Rate Limiting**: Protected with sliding-window limiter (30 requests per 15 minutes per client IP).

### 2.1 Public User Registration
- **Route**: `POST /api/v1/auth/register`
- **Access**: Public (Rate Limited)
- **Security Boundary**: **Strict Privilege Escalation Prevention**. Public self-registration is strictly hardcoded to create a `TRAINEE` account in `PENDING`/`APPROVED` state. Any client-sent role (`ADMIN`, `SUPER_ADMIN`, `TRAINER`) is discarded.
- **Request Body**:
  ```json
  {
    "email": "trainee.name@imd.gov.in",
    "password": "Password123!",
    "firstName": "Ramesh",
    "lastName": "Sharma",
    "phone": "+91-9876543210"
  }
  ```
- **Response (201 Created)**:
  - Sets `refreshToken` HttpOnly cookie.
  - Body:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "accessToken": "eyJhbGciOi...",
        "user": {
          "id": "uuid-v4",
          "email": "trainee.name@imd.gov.in",
          "firstName": "Ramesh",
          "lastName": "Sharma",
          "role": "TRAINEE",
          "status": "APPROVED",
          "permissions": ["courses:read", "assessments:take"]
        }
      }
    }
    ```

### 2.2 User Login
- **Route**: `POST /api/v1/auth/login`
- **Access**: Public (Rate Limited)
- **Description**: Authenticates email and password using bcrypt. Validates account status (`APPROVED` required). Prevents account enumeration via generic error messages. Logs security audit event.
- **Request Body**:
  ```json
  {
    "email": "official@imd.gov.in",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  - Sets `refreshToken` HttpOnly cookie.
  - Body:
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "accessToken": "eyJhbGciOi...",
        "user": {
          "id": "uuid-v4",
          "organizationId": "org-uuid",
          "organizationName": "India Meteorological Department",
          "email": "official@imd.gov.in",
          "firstName": "Official",
          "lastName": "User",
          "role": "TRAINEE",
          "status": "APPROVED",
          "permissions": ["courses:read", "assessments:take"]
        }
      }
    }
    ```
- **Error Codes**:
  - `401 Unauthorized`: "Invalid email or password" (mismatched credentials)
  - `401 Unauthorized`: "Your account is awaiting administrative approval" (`PENDING` status)
  - `401 Unauthorized`: "Your account is currently unavailable. Please contact your administrator" (`SUSPENDED`/`DEACTIVATED`)
  - `429 Too Many Requests`: Rate limit exceeded

### 2.3 Token Refresh & Rotation
- **Route**: `POST /api/v1/auth/refresh`
- **Access**: Public / Authenticated (Requires `refreshToken` cookie)
- **Description**: Verifies the single-use refresh token hash in PostgreSQL, immediately revokes the old token, issues a newly hashed replacement token in HttpOnly cookie (single-use rotation), and issues a fresh 15-minute access token.
- **Response (200 OK)**:
  - Sets rotated `refreshToken` cookie.
  - Body:
    ```json
    {
      "success": true,
      "message": "Token refreshed successfully",
      "data": {
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```
- **Error Codes**:
  - `401 Unauthorized`: Missing or revoked refresh token

### 2.4 User Logout
- **Route**: `POST /api/v1/auth/logout`
- **Access**: Authenticated / Public
- **Description**: Revokes active refresh token in database, clears `refreshToken` cookie.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

### 2.5 Current User Session Identity
- **Route**: `GET /api/v1/auth/me`
- **Access**: Authenticated (`Bearer <token>`)
- **Description**: Fetches current user profile, role, permissions, organization, and associated trainee/trainer profile summary.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Current user profile retrieved successfully",
    "data": {
      "id": "uuid-v4",
      "organizationId": "org-uuid",
      "organizationName": "India Meteorological Department",
      "email": "official@imd.gov.in",
      "firstName": "Official",
      "lastName": "User",
      "role": "TRAINEE",
      "status": "APPROVED",
      "permissions": ["courses:read", "assessments:take"],
      "traineeProfile": {
        "id": "profile-uuid",
        "designation": "Scientific Officer",
        "bio": "Numerical Weather Prediction trainee",
        "interests": ["Atmospheric Dynamics", "Radar Meteorology"],
        "profileCompletion": 75
      }
    }
  }
  ```

### 2.6 Onboarding Metadata
- **Route**: `GET /api/v1/auth/onboarding-meta`
- **Access**: Authenticated (`Bearer <token>`)
- **Description**: Returns selectable departments and competency skills for onboarding profile completion.

### 2.7 Submit Trainee Onboarding
- **Route**: `POST /api/v1/auth/onboarding`
- **Access**: Authenticated (`Bearer <token>`)
- **Request Body**:
  ```json
  {
    "departmentId": "dept-uuid",
    "designation": "Meteorological Specialist",
    "skills": ["Radar Analysis", "Satellite Imagery"],
    "interests": ["Climate Modelling", "Severe Weather Warnings"],
    "bio": "Specializing in Doppler weather radar analysis."
  }
  ```

---

## 3. Role-Based Dashboard Endpoints (`/api/v1/dashboard/*`)

All dashboard endpoints require authentication (`Bearer <token>`) and enforce strict RBAC authorization.

### 3.1 Trainee Dashboard Summary
- **Route**: `GET /api/v1/dashboard/trainee`
- **Access**: `TRAINEE`, `ADMIN`, `SUPER_ADMIN`
- **Description**: Returns learning progress, active course enrollments, assessment attempts, competency matrix progress, recommendations, and recent audit activity.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Trainee dashboard summary retrieved successfully",
    "data": {
      "metrics": {
        "inProgressCourses": 2,
        "completedCourses": 1,
        "pendingAssessments": 1,
        "competenciesTracked": 4
      },
      "activeCourses": [
        {
          "id": "enrollment-uuid",
          "courseId": "course-uuid",
          "title": "Radar Meteorology & Severe Weather Forecasting",
          "slug": "radar-meteorology-severe-weather",
          "category": "Radar Meteorology",
          "difficulty": "INTERMEDIATE",
          "progressPercentage": 45,
          "enrolledAt": "2026-08-15T10:00:00.000Z"
        }
      ],
      "assessments": [
        {
          "id": "attempt-uuid",
          "assessmentId": "assessment-uuid",
          "title": "Doppler Radar Interpretation Assessment",
          "type": "MCQ",
          "status": "IN_PROGRESS",
          "score": null,
          "passingScore": 60.0,
          "durationMinutes": 45,
          "startedAt": "2026-09-01T12:00:00.000Z"
        }
      ],
      "competencies": [
        {
          "id": "comp-uuid",
          "name": "Radar Echo Identification",
          "code": "MET-RAD-01",
          "category": "Operational Radar",
          "currentLevel": 3
        }
      ],
      "recommendations": [],
      "recentActivity": []
    }
  }
  ```
- **Error Codes**:
  - `403 Forbidden`: Accessed by unauthorized role

### 3.2 Trainer Dashboard Summary
- **Route**: `GET /api/v1/dashboard/trainer`
- **Access**: `TRAINER`, `ADMIN`, `SUPER_ADMIN`
- **Description**: Returns instructor metrics, courses authored/instructed, total enrolled trainees, pending evaluations, and recent trainee feedback.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Trainer dashboard summary retrieved successfully",
    "data": {
      "metrics": {
        "activeCourses": 2,
        "totalTrainees": 14,
        "pendingEvaluations": 3,
        "feedbackCount": 8
      },
      "courses": [
        {
          "id": "course-uuid",
          "title": "Atmospheric Dynamics & NWP Model Diagnostics",
          "slug": "atmospheric-dynamics-nwp",
          "status": "PUBLISHED",
          "difficulty": "ADVANCED"
        }
      ],
      "recentFeedback": [
        {
          "id": "feedback-uuid",
          "rating": 5,
          "comment": "Exceptional practical guidance on WRF model calibration.",
          "courseTitle": "Atmospheric Dynamics & NWP Model Diagnostics",
          "traineeName": "Kavita Nair",
          "createdAt": "2026-09-02T14:30:00.000Z"
        }
      ]
    }
  }
  ```

### 3.3 Admin Institutional Dashboard Summary
- **Route**: `GET /api/v1/dashboard/admin`
- **Access**: `ADMIN`, `SUPER_ADMIN`
- **Description**: Aggregates institutional capacity-building metrics across the department, including user distribution by role, pending approvals, published courses count, competencies count, and security audit activity.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Administrative dashboard overview retrieved successfully",
    "data": {
      "metrics": {
        "totalUsers": 9,
        "trainees": 5,
        "trainers": 2,
        "administrators": 2,
        "pendingApprovals": 0,
        "totalCourses": 2,
        "publishedCourses": 2,
        "totalCompetencies": 5
      },
      "recentActivity": [
        {
          "id": "audit-uuid",
          "action": "USER_REGISTERED",
          "entityType": "USER",
          "userName": "Ramesh Sharma",
          "userEmail": "ramesh.sharma@imd.gov.in",
          "userRole": "TRAINEE",
          "createdAt": "2026-09-03T06:50:00.000Z"
        }
      ]
    }
  }
  ```
- **Error Codes**:
  - `403 Forbidden`: User lacks administrative role

---

## 4. User Directory & Management Endpoints (`/api/v1/users/*`)

All user management endpoints require authentication (`Bearer <token>`).

### 4.1 List Users Directory
- **Route**: `GET /api/v1/users`
- **Access**: `ADMIN` or `SUPER_ADMIN`
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
  - `search` (optional, searches name and email)
  - `role` (optional: `SUPER_ADMIN`, `ADMIN`, `TRAINER`, `TRAINEE`)
  - `status` (optional: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 9,
      "totalPages": 1
    }
  }
  ```

### 4.2 Create New User (Administrative Provisioning)
- **Route**: `POST /api/v1/users`
- **Access**: `ADMIN` or `SUPER_ADMIN`
- **Description**: Allows administrators to provision accounts directly with explicit roles (`ADMIN`, `TRAINER`, `TRAINEE`).
- **Request Body**:
  ```json
  {
    "email": "trainer.new@imd.gov.in",
    "password": "Password123!",
    "firstName": "Dr. Sunita",
    "lastName": "Patel",
    "role": "TRAINER",
    "phone": "+91-9876543211",
    "status": "APPROVED"
  }
  ```
- **Response (201 Created)**: User object created.

### 4.3 Get Current User Profile (`/users/me`)
- **Route**: `GET /api/v1/users/me`
- **Access**: Authenticated (Any role)
- **Description**: Fetches current authenticated user profile without requiring user ID in path.
- **Response (200 OK)**: Full user profile with permissions and role metadata.

### 4.4 Update Current User Profile (`/users/me`)
- **Route**: `PATCH /api/v1/users/me`
- **Access**: Authenticated (Any role)
- **Request Body**:
  ```json
  {
    "firstName": "Ramesh",
    "lastName": "Sharma",
    "phone": "+91-9876543210"
  }
  ```

### 4.5 Get User By ID
- **Route**: `GET /api/v1/users/:id`
- **Access**: Self (`req.user.userId === req.params.id`) OR `ADMIN` / `SUPER_ADMIN`
- **Parameters**: `id` (UUID format)

### 4.6 Update User By ID
- **Route**: `PATCH /api/v1/users/:id`
- **Access**: Self (`req.user.userId === req.params.id`) OR `ADMIN` / `SUPER_ADMIN`
- **Parameters**: `id` (UUID format)

### 4.7 Delete / Deactivate User
- **Route**: `DELETE /api/v1/users/:id`
- **Access**: `ADMIN` or `SUPER_ADMIN`
- **Parameters**: `id` (UUID format)
- **Description**: Soft-deletes user record and revokes all active session tokens.

---

## 5. Course Management & Course Structure Endpoints (`/api/v1/courses/*`)

All course management & structure endpoints require authentication (`Bearer <token>`) and enforce RBAC permission policies.

### 5.1 Full Course Hierarchy
- **Route**: `GET /api/v1/courses/:courseId/structure`
- **Access**: `courses:read` permission (TRAINEE can access only if status is `PUBLISHED`)
- **Description**: Returns complete hierarchical course tree containing ordered modules, ordered lessons, attached resources, and calculated module duration.

### 5.2 Course Modules
- **`POST /api/v1/courses/:courseId/modules`**: Create Module (`courses:update` required, course in `DRAFT`/`REJECTED`)
- **`GET /api/v1/courses/:courseId/modules`**: List Modules ordered by `orderIndex`
- **`GET /api/v1/courses/:courseId/modules/:moduleId`**: Get Module details
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId`**: Update Module title/description/orderIndex
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId`**: Delete Module (cascades lessons)
- **`PATCH /api/v1/courses/:courseId/modules/reorder`**: Transactional reorder (`moduleOrders: [{ id, orderIndex }]`)

### 5.3 Lessons
- **`POST /api/v1/courses/:courseId/modules/:moduleId/lessons`**: Create Lesson (`contentType`: VIDEO, PDF, PPT, ARTICLE, QUIZ, LINK, DOCUMENT)
- **`GET /api/v1/courses/:courseId/modules/:moduleId/lessons`**: List Lessons ordered by `orderIndex`
- **`GET /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Get Lesson details with attached resources
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Update Lesson attributes
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Delete Lesson
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId/lessons/reorder`**: Transactional reorder (`lessonOrders: [{ id, orderIndex }]`)

### 5.4 Lesson Resources
- **`POST /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId/resources`**: Attach resource (`resourceId`)
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId/resources/:resourceId`**: Detach resource

---

## 6. Enrollment & Progress Management APIs

### 6.1 Course Enrollment
- **`POST /api/v1/enrollments`**: Enroll in a published course (`courseId` in body). Requires `PUBLISHED` status & matching `organizationId`. Returns `201 Created` or `409 Conflict` if already enrolled.
- **`GET /api/v1/enrollments`**: List my enrolled courses (query parameters: `status`, `skip`, `take`).
- **`GET /api/v1/enrollments/:id`**: View enrollment details, module structure, and lesson completion tree.
- **`POST /api/v1/enrollments/:id/lessons/:lessonId/progress`**: Update lesson completion (`completed: boolean`, `progressPercentage?: number`). Auto-recalculates course percentage and transitions status (`IN_PROGRESS` or `COMPLETED`).
- **`POST /api/v1/enrollments/:id/drop`**: Drop course enrollment. Transitions status to `DROPPED`.

---

## 7. Standard Error Handling & Response Codes

All error responses strictly follow the uniform JSON format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": []
}
```

| HTTP Status | Error Type | Trigger Conditions |
| :--- | :--- | :--- |
| **400 Bad Request** | Validation Failure | Request body failed Zod schema checks or invalid reorder payload |
| **401 Unauthorized** | Authentication Failure | Missing/expired access token or unapproved account |
| **403 Forbidden** | RBAC Authorization Failure | Insufficient user role or modifying another trainer's course |
| **404 Not Found** | Missing Entity | Course, Module, Lesson, or Resource ID not found |
| **409 Conflict** | State Conflict | Modifying structure of course in `PUBLISHED`/`PENDING_APPROVAL` status |
| **429 Too Many Requests** | Rate Limit Exceeded | Client exceeded sliding-window request threshold |
| **500 Internal Server Error** | Unexpected Failure | Database or server operational exception |


