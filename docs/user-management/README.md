# User Management — Capacity Connect

**Digital Capacity Building and Learning Management Portal**  
*Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)*  
*Component: M2 Development 3 — Backend User Management*

---

## 1. Overview

The User Management module in Capacity Connect provides administrative capabilities for governing platform identities across MoES/IMD departments and institutions. Building strictly upon Development 1 (Authentication) and Development 2 (Role-Based Access Control), this module empowers administrators to inspect user accounts, execute multi-dimensional searches and filters, manage onboarding approval lifecycles (`PENDING` → `APPROVED` / `REJECTED`), update user statuses (including suspension and deactivation), and assign operational platform roles (`TRAINEE`, `TRAINER`, `ADMIN`).

All administrative actions are strictly enforced on the backend via cryptographic Bearer JWT authentication, fine-grained permission checks, and institutional audit logging.

---

## 2. Objective

The core objectives of the User Management backend APIs are:
- **Administrative Oversight**: Provide institutional administrators with comprehensive visibility into registered users across organizations and departments.
- **Controlled Onboarding Lifecycle**: Enforce the project-defined approval pipeline (`Signup` → `Pending` → `Admin Approval` → `Login`).
- **Granular Account Governance**: Enable administrators to safely modify user account statuses (`PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `DEACTIVATED`) and roles with automatic session termination upon suspension or privilege alterations.
- **Server-Side Security & Privilege Isolation**: Prevent non-administrative users and trainees from escalating their privileges or accessing administrative directory listings.
- **High-Performance Database Operations**: Implement search, multi-dimensional filtering, and pagination strictly at the PostgreSQL database level using Prisma.
- **Full OpenAPI / Swagger Testability**: Ensure every administrative endpoint is comprehensively documented and testable in Swagger UI.

---

## 3. User Roles

User Management interacts directly with the four platform roles defined in the database schema:

| Role | Database Value | Scope in User Management |
| :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN` | Unrestricted wildcard access (`*`) to view, approve, reject, alter status, and update roles across all organizations. |
| **Admin** | `ADMIN` | Institutional governance authority possessing `user:read`, `user:approve`, `user:reject`, and `user:role:update` permissions. Authorized to manage user directories, process approvals/rejections, and assign roles. |
| **Trainer** | `TRAINER` | Scientific instructor. Possesses zero administrative user-management permissions. Any attempt to invoke `/admin/*` routes is rejected with HTTP `403 Forbidden`. |
| **Trainee** | `TRAINEE` | Operational/scientific learner. Zero administrative privileges. Cannot view directory, approve users, or mutate roles. |

---

## 4. Functional Flow

The complete administrative workflow follows a strict sequential pipeline:

```
Admin Client / Swagger UI
           ↓
Bearer JWT Authentication (`authenticate` middleware)
           ↓
RBAC Authorization (`requireRole([ADMIN, SUPER_ADMIN])` & `requirePermission(...)`)
           ↓
Input Validation (`validate` middleware with Zod)
           ↓
Admin User Controller (`AdminUserController` — thin handler)
           ↓
Admin User Service (`AdminUserService` — business logic, session invalidation, audit logging)
           ↓
User Repository (`UserRepository` — Prisma query builder, transactions, DB-level pagination)
           ↓
Database (PostgreSQL / Neon Pooler)
```

### Approval & Authentication Lifecycle Integration

```
User Registration (Self-service / Onboarding)
           ↓
User Record Created with status = PENDING
           ↓
Admin Inspects Directory: GET /admin/users?status=PENDING
           ↓
Admin Executes Approval or Rejection:
  ├── PATCH /admin/users/:id/approve  → status = APPROVED  → User can now log in
  └── PATCH /admin/users/:id/reject   → status = REJECTED  → Sessions revoked, login blocked
```

---

## 5. Architecture

Following the enterprise Clean Architecture and SOLID design principles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          HTTP Presentation Layer                       │
│  admin.routes.ts ───► AdminUserController ───► ResponseHelper.success │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Application Service Layer                    │
│  AdminUserService: Business rules, token revocation, audit logs        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Repository & Data Layer                      │
│  UserRepository ───► Prisma Client ───► PostgreSQL                     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Separation of Concerns**: Controllers only handle HTTP translation and status mapping. All state logic, session revocations, and audit payload formulations reside in `AdminUserService`.
- **Database Query Encapsulation**: SQL filtering, multi-condition OR queries, and pagination logic are encapsulated inside `UserRepository`.

---

## 6. Backend Implementation

### 6.1 Repository Layer (`backend/src/repositories/user.repository.ts`)
- `findPaginatedUsers(options)`:
  - Database-level pagination using Prisma `$transaction([findMany, count])`.
  - Case-insensitive search on `firstName`, `lastName`, and `email`.
  - Filters by `role`, `status`, and `department` (matching UUID or relational `name`/`code`).
  - Explicit ordering by `createdAt: 'desc'`.
- `updateUserStatus(id, status)`: Updates account status in `users` table.
- `updateUserRole(id, role)`: Updates role assignment in `users` table.
- `revokeUserRefreshTokens(userId)`: Revokes all active refresh tokens for the given user.
- `createAuditLog(data)`: Persists structured audit events in `audit_logs` table with defensive foreign-key safety.

### 6.2 Service Layer (`backend/src/services/admin-user.service.ts`)
- `getUsers(filters)`: Calculates pagination offsets (`skip`, `take`), invokes repository, computes `totalPages`, and returns sanitized `UserResponseDto[]` with pagination metadata.
- `getUserById(id)`: Retrieves user by UUID; throws `NotFoundError` if non-existent.
- `approveUser(id, context)`: Transitions status to `APPROVED`, persists `USER_APPROVED` in `audit_logs`, and logs with Winston.
- `rejectUser(id, context)`: Transitions status to `REJECTED`, terminates all active user sessions, persists `USER_REJECTED` in `audit_logs`, and logs with Winston.
- `updateUserStatus(id, newStatus, context)`: Validates status, terminates active sessions if `SUSPENDED`/`DEACTIVATED`/`REJECTED`, creates audit logs (`ACCOUNT_SUSPENDED`, `USER_APPROVED`, `USER_REJECTED`, or `USER_STATUS_UPDATED`).
- `updateUserRole(id, newRole, context)`: Changes assigned role, revokes refresh tokens to enforce renewed token claims on subsequent refresh, and creates `ROLE_CHANGED` audit record.

### 6.3 Controller Layer (`backend/src/controllers/admin-user.controller.ts`)
Thin controller exposing asynchronous methods (`getUsers`, `getUserById`, `approveUser`, `rejectUser`, `updateStatus`, `updateRole`) utilizing `ResponseHelper.success` with sanitized DTOs.

### 6.4 Route Layer (`backend/src/routes/admin.routes.ts`)
Registers all 6 endpoints with global route middleware:
1. `authenticate`: Validates Bearer access token.
2. `requireRole([Role.ADMIN, Role.SUPER_ADMIN])`: Restricts route access to administrators.
3. `requirePermission(...)`: Enforces fine-grained permission keys.
4. `validate(...)`: Validates query, path parameters, and request payloads via Zod.
5. Mounted under `/admin` in `apiRouter` (`/api/v1/admin/*`) and aliased at root `/admin/*`.

---

## 7. API Endpoints

### 7.1 List / Search / Filter / Paginate Users
- **Method**: `GET`
- **URL**: `/api/v1/admin/users` (Alias: `/admin/users`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:read` (Roles: `ADMIN`, `SUPER_ADMIN`)
- **Query Parameters**:
  - `search` (string, optional): Case-insensitive match on `firstName`, `lastName`, or `email`.
  - `role` (enum, optional): `TRAINEE`, `TRAINER`, `ADMIN`, `SUPER_ADMIN`.
  - `status` (enum, optional): `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`, `DEACTIVATED`.
  - `department` (string, optional): Department name, code, or UUID.
  - `departmentId` (uuid, optional): Department UUID.
  - `page` (integer, optional, default: 1): Page number (1-indexed).
  - `limit` (integer, optional, default: 20, max: 100): Page size.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User directory retrieved successfully",
    "data": [
      {
        "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
        "organizationId": "5895fb97-8cbe-4aa7-a160-f1b212f86c22",
        "departmentId": "4dae2d5c-fbf4-498c-8f9f-6fa10339d375",
        "email": "official@imd.gov.in",
        "firstName": "Ramesh",
        "lastName": "Sharma",
        "phone": "+919876543210",
        "avatarUrl": null,
        "role": "TRAINEE",
        "status": "APPROVED",
        "emailVerified": true,
        "lastLoginAt": "2026-09-07T12:00:00.000Z",
        "createdAt": "2026-09-01T08:00:00.000Z",
        "updatedAt": "2026-09-07T12:00:00.000Z",
        "permissions": ["courses:read", "assessments:take"]
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
  ```
- **Errors**: `400 Bad Request` (Invalid query parameter), `401 Unauthorized`, `403 Forbidden`.

---

### 7.2 Get User by ID
- **Method**: `GET`
- **URL**: `/api/v1/admin/users/:id` (Alias: `/admin/users/:id`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:read` (Roles: `ADMIN`, `SUPER_ADMIN`)
- **Path Parameter**: `id` (UUID)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User retrieved successfully",
    "data": {
      "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
      "organizationId": "5895fb97-8cbe-4aa7-a160-f1b212f86c22",
      "departmentId": "4dae2d5c-fbf4-498c-8f9f-6fa10339d375",
      "email": "official@imd.gov.in",
      "firstName": "Ramesh",
      "lastName": "Sharma",
      "phone": "+919876543210",
      "avatarUrl": null,
      "role": "TRAINEE",
      "status": "APPROVED",
      "emailVerified": true,
      "lastLoginAt": "2026-09-07T12:00:00.000Z",
      "createdAt": "2026-09-01T08:00:00.000Z",
      "updatedAt": "2026-09-07T12:00:00.000Z",
      "permissions": ["courses:read", "assessments:take"]
    }
  }
  ```
- **Errors**: `400 Bad Request` (Invalid UUID), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 7.3 Approve User Registration
- **Method**: `PATCH`
- **URL**: `/api/v1/admin/users/:id/approve` (Alias: `/admin/users/:id/approve`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:approve` (Roles: `ADMIN`, `SUPER_ADMIN`)
- **Path Parameter**: `id` (UUID)
- **Request Body**: None
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User approved successfully",
    "data": {
      "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
      "email": "new.officer@imd.gov.in",
      "role": "TRAINEE",
      "status": "APPROVED",
      "updatedAt": "2026-09-07T14:50:00.000Z"
    }
  }
  ```
- **Audit Event**: `USER_APPROVED`
- **Errors**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 7.4 Reject User Registration
- **Method**: `PATCH`
- **URL**: `/api/v1/admin/users/:id/reject` (Alias: `/admin/users/:id/reject`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:reject` (Roles: `ADMIN`, `SUPER_ADMIN`)
- **Path Parameter**: `id` (UUID)
- **Request Body**: None
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User rejected successfully",
    "data": {
      "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
      "email": "unauthorized@external.org",
      "role": "TRAINEE",
      "status": "REJECTED",
      "updatedAt": "2026-09-07T14:50:00.000Z"
    }
  }
  ```
- **Audit Event**: `USER_REJECTED`
- **Errors**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 7.5 Update User Status
- **Method**: `PATCH`
- **URL**: `/api/v1/admin/users/:id/status` (Alias: `/admin/users/:id/status`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:approve` (Roles: `ADMIN`, `SUPER_ADMIN`)  
  *(Implementation Note: In the 10 source permissions, account approval/suspension lifecycle is administered under `user:approve` authority).*
- **Path Parameter**: `id` (UUID)
- **Request Body**:
  ```json
  {
    "status": "SUSPENDED"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User status updated successfully",
    "data": {
      "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
      "status": "SUSPENDED",
      "updatedAt": "2026-09-07T14:50:00.000Z"
    }
  }
  ```
- **Audit Event**: `ACCOUNT_SUSPENDED` (for suspension), `USER_APPROVED`, `USER_REJECTED`, or `USER_STATUS_UPDATED`.
- **Session Effect**: If status is `SUSPENDED`, `DEACTIVATED`, or `REJECTED`, all active user refresh tokens are revoked immediately.
- **Errors**: `400 Bad Request` (Invalid status), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 7.6 Update User Role
- **Method**: `PATCH`
- **URL**: `/api/v1/admin/users/:id/role` (Alias: `/admin/users/:id/role`)
- **Authorization**: `Bearer <token>`
- **Permission**: `user:role:update` (Roles: `ADMIN`, `SUPER_ADMIN`)
- **Path Parameter**: `id` (UUID)
- **Request Body**:
  ```json
  {
    "role": "TRAINER"
  }
  ```
- **Supported Roles**: `TRAINEE`, `TRAINER`, `ADMIN`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User role updated successfully",
    "data": {
      "id": "c1f72927-ff62-4217-a068-d05cbfa857c7",
      "role": "TRAINER",
      "updatedAt": "2026-09-07T14:50:00.000Z"
    }
  }
  ```
- **Audit Event**: `ROLE_CHANGED`
- **Session Effect**: All active refresh tokens are revoked immediately to force immediate re-issuance of JWT access tokens containing the updated role and permission matrix.
- **Errors**: `400 Bad Request` (Invalid role enum), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

## 8. Swagger / OpenAPI Documentation

All 6 endpoints are fully documented in `backend/src/docs/openapi.json` and interactive via Swagger UI:
- **Swagger UI URL**: `http://localhost:5000/api-docs`
- **Tag**: `Admin - User Management`
- **Authentication Scheme**: `bearerAuth` (`Authorization: Bearer <token>`)
- **Included Schemas**:
  - `AdminUserResponse`
  - `PaginationMeta`
  - `AdminUserListResponse`
  - `AdminUserSingleResponse`
  - `AdminUserStatusUpdateRequest`
  - `AdminUserRoleUpdateRequest`

---

## 9. Security

1. **Authentication Boundary**: All endpoints require a valid, non-expired Bearer JWT signed with `JWT_SECRET`.
2. **Server-Side RBAC**: Authorization is determined solely by verified server-side claims (`req.user.role` and `req.user.permissions`). Client-supplied headers, query parameters (`?role=ADMIN`), or body fields cannot bypass authorization.
3. **Data Sanitization**: Responses strictly omit sensitive credentials (`passwordHash`, JWT tokens, session hashes).
4. **Session Termination on Status Changes**: When accounts are `SUSPENDED`, `DEACTIVATED`, or `REJECTED`, all active refresh tokens in the database are revoked.
5. **Token Rotation on Role Changes**: Altering a user's role revokes existing refresh tokens, preventing stale permission exploitation.
6. **SQL & Query Injection Protection**: Database queries use Prisma parameterized prepared statements; search strings are sanitized and bounded.

---

## 10. Validation

All incoming request parameters, queries, and bodies are validated using Zod:
- `adminUserQuerySchema`: Validates query parameters (`search`, `role`, `status`, `department`, `page`, `limit`). Limits pagination to a maximum of 100 items per request.
- `adminUserIdParamSchema`: Enforces strict UUID v4 format.
- `adminUserStatusUpdateSchema`: Enforces valid `UserStatus` enum values.
- `adminUserRoleUpdateSchema`: Restricts role changes to supported platform roles (`TRAINEE`, `TRAINER`, `ADMIN`).
- Centralized error response formats validation failures with HTTP 400 Bad Request and descriptive field paths.

---

## 11. Error Handling

Errors are routed through the centralized `AppError` and `globalErrorHandler` middleware:
- `BadRequestError (400)`: Malformed UUID, unsupported query filters, invalid status/role enum strings.
- `UnauthorizedError (401)`: Missing, expired, or invalid Bearer JWT.
- `ForbiddenError (403)`: Authenticated caller lacks required role (`ADMIN`/`SUPER_ADMIN`) or permission (`user:read`, `user:approve`, `user:reject`, `user:role:update`).
- `NotFoundError (404)`: User ID does not exist in the database.
- Sensitive stack traces and database internals are suppressed in non-development environments.

---

## 12. Audit Logging

Administrative actions trigger structured audit logging integrated with the Winston logger and the PostgreSQL `audit_logs` table:

| Action | Audit Log Action String | Entity Type | Old/New Values Logged |
| :--- | :--- | :--- | :--- |
| User Approval | `USER_APPROVED` | `USER` | `{ status: oldStatus }` → `{ status: "APPROVED" }` |
| User Rejection | `USER_REJECTED` | `USER` | `{ status: oldStatus }` → `{ status: "REJECTED" }` |
| Status Suspension | `ACCOUNT_SUSPENDED` | `USER` | `{ status: oldStatus }` → `{ status: "SUSPENDED" }` |
| Other Status Change | `USER_STATUS_UPDATED` | `USER` | `{ status: oldStatus }` → `{ status: newStatus }` |
| Role Update | `ROLE_CHANGED` | `USER` | `{ role: oldRole }` → `{ role: newRole }` |

*Security Guard: Passwords, tokens, and cryptographic hashes are never written to audit logs.*

---

## 13. Testing

### 13.1 Automated Integration Test Suite (`backend/prisma/verify_user_management_api.ts`)
A dedicated 15-point real HTTP integration test suite verifies:
1. Swagger UI documentation availability (`GET /api-docs/`).
2. Unauthenticated request rejection (`401 Unauthorized`).
3. Non-admin authorization rejection (`403 Forbidden` for Trainees and Trainers).
4. Directory listing and database pagination (`page`, `limit`, `total`, `totalPages`).
5. Multi-dimensional filtering (`role=TRAINEE`, `status=APPROVED`).
6. Case-insensitive search on first name, last name, and email.
7. Query validation error handling (`role=SUPER_USER` rejected with 400).
8. Safe detail retrieval (`GET /admin/users/:id` without exposing password hashes).
9. Non-existent user handling (`404 Not Found`).
10. User approval (`PATCH /admin/users/:id/approve` + `USER_APPROVED` audit log).
11. User rejection (`PATCH /admin/users/:id/reject` + token revocation + `USER_REJECTED` audit log).
12. Account suspension (`PATCH /admin/users/:id/status` + token revocation + `ACCOUNT_SUSPENDED` audit log).
13. Role assignment (`PATCH /admin/users/:id/role` + token revocation + `ROLE_CHANGED` audit log).
14. Client privilege escalation spoofing rejection (`403 Forbidden`).
15. Root `/admin/users` alias routing.

### 13.2 Regression Verification (`backend/prisma/verify_rbac_api.ts`)
The 8-point RBAC test suite was re-executed, validating that Development 1 and 2 capabilities remain 100% operational.

---

## 14. Scalability

- **Database-Level Pagination**: Queries strictly paginate using PostgreSQL `LIMIT` and `OFFSET` inside a single Prisma transaction alongside `count(*)`, avoiding memory saturation.
- **Indexed Filter Dimensions**: The `users` table utilizes database indexes on `[email]`, `[organizationId]`, `[departmentId]`, `[role]`, and `[status]`.
- **Bounded Request Limits**: Maximum page limit is hard-capped at 100 to protect server memory.

---

## 15. Files Created / Modified

| Action | File Path | Purpose |
| :--- | :--- | :--- |
| **CREATED** | `backend/src/dto/admin-user.dto.ts` | Request/response DTOs for filtering, pagination, status, and role updates |
| **CREATED** | `backend/src/validators/admin-user.validation.ts` | Zod validation schemas for query parameters, ID params, status, and role |
| **CREATED** | `backend/src/services/admin-user.service.ts` | Business workflows for directory listing, approval, rejection, status, role, sessions, and audit |
| **CREATED** | `backend/src/controllers/admin-user.controller.ts` | HTTP controller handlers for administrative user endpoints |
| **CREATED** | `backend/src/routes/admin.routes.ts` | Route registration, middleware pipeline (`authenticate`, `requireRole`, `requirePermission`, `validate`) |
| **CREATED** | `backend/prisma/verify_user_management_api.ts` | 15-step automated HTTP integration verification suite |
| **CREATED** | `docs/user-management/README.md` | Feature architectural and functional specification |
| **MODIFIED** | `backend/src/repositories/user.repository.ts` | Added `findPaginatedUsers`, `updateUserStatus`, `updateUserRole`, and `createAuditLog` |
| **MODIFIED** | `backend/src/routes/index.ts` | Mounted `adminRouter` under `/admin` and updated service catalog |
| **MODIFIED** | `backend/src/index.ts` | Mounted root `/admin` alias for direct endpoint access and updated root catalog |
| **MODIFIED** | `backend/src/docs/openapi.json` | Comprehensive OpenAPI 3.0 documentation for all 6 endpoints, tag, and schemas |
| **MODIFIED** | `docs/api.md` | Added exhaustive documentation for the 6 Admin User Management endpoints |
| **MODIFIED** | `README.md` | Added User Management to the documentation index |

---

## 16. Git Information

- **Feature Branch**: `Zees/user-management`
- **Base Branch**: `Zees/rbac`
- **Status**: Tested, verified, and complete.

---

## 17. Future Improvements

- **Bulk User Actions**: Support bulk approval or status modification for cohort-based onboarding.
- **CSV / Excel Export**: Stream administrative user directories as CSV for institutional MoES reporting.
- **Department Transfer Workflow**: Formal multi-step transfer request and approval flow when trainee officers relocate between meteorological centers.
