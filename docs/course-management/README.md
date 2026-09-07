# Course Management

## 1. Overview
The Course Management module for CAPACITY CONNECT manages the course lifecycle, enforcing the development and publishing workflow (Draft -> Submit -> Approve/Reject -> Publish -> Archive) for domain-oriented training programs designed for MoES and IMD.

## 2. Objective
This module ensures that trainers can create domain-relevant learning content and administrators govern course publication according to the MoES/IMD standards and organizational boundaries.

## 3. Scope
The application exposes a RESTful API covering:
- Course definition (metadata, prerequisites)
- Lifecycle state transitions
- Organization isolation enforcing context boundaries
- Access controls per Trainer/Trainee/Admin scopes

## 4. User Roles
- **SUPER_ADMIN**: Full system access over courses.
- **ADMIN**: Review, approve, reject, publish courses within valid organization boundaries.
- **TRAINER**: Draft, update, submit, and archive their own editable courses.
- **TRAINEE**: Search and consume only PUBLISHED, properly configured courses.

## 5. Course Lifecycle
`DRAFT` -> `PENDING_APPROVAL` (Submit) -> `PUBLISHED` (Approve/Publish) OR `REJECTED` (Reject) -> `ARCHIVED` (Archive). 

## 6. Functional Flow
```text
User
 ↓
Frontend
 ↓
API
 ↓
Authentication
 ↓
Authorization
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Database
```

## 7. Architecture
Follows standard module pattern mapped to Route -> Controller -> Service -> Repository. 

## 8. Backend Implementation
- `backend/src/repositories/course.repository.ts`: Abstraction for Prisma interactions.
- `backend/src/services/course.service.ts`: Business logic and lifecycle validation.
- `backend/src/controllers/course.controller.ts`: Endpoint controller logic.
- `backend/src/routes/course.routes.ts`: Router integration.
- `backend/src/validators/course.validation.ts`: Zod schema definitions.
- `backend/src/dto/course.dto.ts`: Contract data types.
- `backend/src/permissions/index.ts`: RBAC permission matrix for courses.

## 9. Database Changes
No new tables needed. Existing Prisma models: `Course` and `CoursePrerequisite`.

## 10. API Endpoints

### 10.1 List Courses
- **Endpoint**: `GET /api/v1/courses`
- **Method**: GET
- **Auth/Permissions**: Requires `courses:read`
- **Request**: Query `skip`, `take`, `category`, `difficulty`, `status`, `search`
- **Response**: Array of active/visible courses within scope

### 10.2 Get Course
- **Endpoint**: `GET /api/v1/courses/:id`
- **Method**: GET
- **Auth/Permissions**: Requires `courses:read`
- **Request**: Params `id`
- **Response**: Full course details

### 10.3 Create Course
- **Endpoint**: `POST /api/v1/courses`
- **Method**: POST
- **Auth/Permissions**: Requires `courses:create`
- **Request**: CreateCourseDTO (title, slug, category, difficulty, etc.)
- **Response**: Created Course object (starts in DRAFT status)

### 10.4 Update Course
- **Endpoint**: `PATCH /api/v1/courses/:id`
- **Method**: PATCH
- **Auth/Permissions**: Requires `courses:update`
- **Request**: UpdateCourseDTO
- **Response**: Updated Course object

### 10.5 Archive Course
- **Endpoint**: `DELETE /api/v1/courses/:id`
- **Method**: DELETE
- **Auth/Permissions**: Requires `courses:archive`
- **Response**: Soft deleted (status=ARCHIVED) Course

### 10.6 Submit Course
- **Endpoint**: `POST /api/v1/courses/:id/submit`
- **Method**: POST
- **Auth/Permissions**: Requires `courses:submit`
- **Response**: Course transitioned to PENDING_APPROVAL

### 10.7 Approve Course
- **Endpoint**: `POST /api/v1/courses/:id/approve`
- **Method**: POST
- **Auth/Permissions**: Requires `courses:approve`
- **Response**: Course transitioned to PUBLISHED

### 10.8 Reject Course
- **Endpoint**: `POST /api/v1/courses/:id/reject`
- **Method**: POST
- **Auth/Permissions**: Requires `courses:reject`
- **Response**: Course transitioned to REJECTED

### 10.9 Publish Course
- **Endpoint**: `POST /api/v1/courses/:id/publish`
- **Method**: POST
- **Auth/Permissions**: Requires `courses:publish`
- **Response**: Course transitioned to PUBLISHED

## 11. Security
Protected by JWT authentication and permission boundary (based on matrix).

## 12. Validation
Powered by Zod validation matching all parameters against strict domain limits.

## 13. Error Handling
Throws standardized AppErrors (400, 401, 403, 404, 409). 

## 14. Scalability
Ready to support filtering, cursor or offset pagination, and large-scale deployments matching infrastructure models. 

## 15. Future Improvements
Enable direct mapping of courses to AI generated assessments matching IMD criteria. 

## 16. Manual Testing

The following manual testing was performed on the Course Management API:

- **Login**: Verified JWT token generation and that the email in the token matches a record in the `user` table.
- **List Courses**: GET /api/v1/courses returned only courses the authenticated user is authorized to view.
- **Create Course**: POST /api/v1/courses succeeded for a Trainer role and stored the course with status `DRAFT`.
- **Submit Course**: POST /api/v1/courses/:id/submit transitioned the course to `PENDING_APPROVAL`.
- **Approve Course**: POST /api/v1/courses/:id/approve (Admin) transitioned the course to `PUBLISHED`.
- **Reject Course**: POST /api/v1/courses/:id/reject (Admin) transitioned the course to `REJECTED`.
- **Archive Course**: DELETE /api/v1/courses/:id (Trainer/Admin) set status to `ARCHIVED`.
- **Permission Checks**: Attempted each endpoint with insufficient permissions and confirmed a `403 Forbidden` response.

All endpoints behaved as documented in the OpenAPI specification and returned appropriate HTTP status codes.

## 17. Authorization Details

Authentication is performed via JWT Bearer tokens. The `auth.middleware.ts` validates the token and:

1. Extracts the `email` claim.
2. Looks up the user in the database (`user` table, column `email`).
3. Confirms the user exists and is active.
4. Attaches the full user record (`id`, `email`, `role`, `permissions`) to `req.user`.
5. Authorization is enforced using the permission matrix defined in `backend/src/permissions/index.ts`.

Only email addresses stored in the database are accepted for authentication, ensuring that testing and production environments use the same source of truth for user identities.
