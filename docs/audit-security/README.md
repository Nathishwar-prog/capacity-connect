# Audit & Security

## 1. Overview

The **Audit & Security** module of CAPACITY CONNECT provides a tamper-evident, security-hardened, and tenant-isolated audit logging subsystem tailored for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD) capacity-building ecosystem.

The system tracks security-sensitive administrative operations and organizational governance events across the platform without exposing credentials, cryptographic tokens, or session secrets. All audit entries are persisted in a centralized PostgreSQL relational store via Prisma ORM and exposed through an administrative REST API gateway protected by authentication, role-based access control (RBAC), and multi-tenant organization boundary enforcement.

---

## 2. Objective

Audit tracking in CAPACITY CONNECT exists to fulfill the following institutional objectives:
1. **Institutional Governance & Compliance**: Provide an immutable historical log of administrative actions (such as user onboarding approvals, role reassignments, and account suspensions) across MoES/IMD departments.
2. **Accountability**: Associate every sensitive state modification with an authenticated actor identity (`userId`), affected entity (`entityType`, `entityId`), request metadata (`ipAddress`, `userAgent`), and precise timestamps.
3. **Security Forensics**: Enable rapid detection and investigation of unauthorized access attempts, privilege escalations, or policy violations without storing sensitive user credentials.
4. **Tenant Isolation**: Ensure that administrators from one departmental institute (e.g., IMD, IITM, NCMRWF, INCOIS) only access audit records relevant to their designated organizational boundary.

---

## 3. Source-Defined Audit Events

The implementation strictly supports the **6 Source-Defined Audit Events** specified in the platform requirements:

| Event Name | Scope & Domain Meaning | Status in Existing Codebase |
| :--- | :--- | :--- |
| `USER_APPROVED` | Emitted when a pending user account is reviewed and granted active platform access by an administrator. | **IMPLEMENTED** (Integrated with `AdminUserService.approveUser` & `/admin/users/:id/approve`) |
| `USER_REJECTED` | Emitted when a pending registration is denied and active sessions revoked by an administrator. | **IMPLEMENTED** (Integrated with `AdminUserService.rejectUser` & `/admin/users/:id/reject`) |
| `ROLE_CHANGED` | Emitted when an administrator alters a user's role (e.g., `TRAINEE` to `TRAINER`), immediately revoking active sessions to enforce new claims. | **IMPLEMENTED** (Integrated with `AdminUserService.updateUserRole` & `/admin/users/:id/role`) |
| `ACCOUNT_SUSPENDED` | Emitted when an administrator places an account into `SUSPENDED` state, invalidating active refresh tokens. | **IMPLEMENTED** (Integrated with `AdminUserService.updateUserStatus` & `/admin/users/:id/status`) |
| `COURSE_APPROVAL` | Helper emitted when a meteorological training course curriculum submitted by a trainer is approved for institutional publication. | **AUDIT INFRASTRUCTURE READY / PENDING WORKFLOW** (Audit infrastructure and helper method `logCourseApproval` implemented; originating business workflow belongs to the Course Management / LMS module) |
| `CERTIFICATE_VERIFICATION` | Helper emitted when an uploaded professional certification or WMO competency credential is officially verified. | **AUDIT INFRASTRUCTURE READY / PENDING WORKFLOW** (Audit infrastructure and helper method `logCertificateVerification` implemented; originating business workflow belongs to the Certificate / Verification module) |

---

## 4. Architecture

The audit infrastructure strictly preserves the N-tier backend architecture:

```
HTTP Client / Admin Portal
         ↓
   [admin.routes.ts] / [audit.routes.ts]
         ↓ (authenticate, requireRole, requirePermission, validate)
   [audit.controller.ts]
         ↓
   [audit.service.ts] ──(Sanitization via AuditSanitizer)
         ↓
   [audit.repository.ts]
         ↓
   [Prisma Client]
         ↓
 PostgreSQL (audit_logs table)
```

### Module File Layout:
- **Constants**: `backend/src/constants/audit.constants.ts` (Source-defined actions, forbidden fields)
- **Sanitizer**: `backend/src/utils/audit-sanitizer.util.ts` (Deep recursive redaction engine)
- **Repository**: `backend/src/repositories/audit.repository.ts` (Isolated database queries and persistence)
- **Service**: `backend/src/services/audit.service.ts` (Business logic, tenant scoping, source event helpers)
- **Validation**: `backend/src/validators/audit.validation.ts` (Zod schemas for query parameters & ID validation)
- **Controller**: `backend/src/controllers/audit.controller.ts` (HTTP request mapping, context extraction)
- **Routes**: `backend/src/routes/audit.routes.ts` (Route definitions mounted at `/admin/audit-logs`)
- **Logger**: `backend/src/logger/winston.logger.ts` (Operational Winston logger, separate from database audit logs)

---

## 5. Database

The implementation reuses the existing `AuditLog` Prisma model without making unnecessary or destructive schema changes.

```prisma
model AuditLog {
  id             String   @id @default(uuid())
  organizationId String?
  userId         String?
  action         String
  entityType     String
  entityId       String?
  oldValues      Json?
  newValues      Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  user         User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([organizationId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Key Properties:
- `organizationId`: Maintains tenant association for strict departmental isolation.
- `userId`: Nullable foreign key referencing the administrator or system actor performing the action.
- `action`: Name of the security or business event (e.g., `USER_APPROVED`, `ROLE_CHANGED`).
- `entityType`: The business entity affected (`USER`, `COURSE`, `CERTIFICATE`).
- `entityId`: Unique identifier of the affected entity.
- `oldValues` & `newValues`: JSON snapshots of prior and modified states, passed through recursive sanitization.
- `ipAddress` & `userAgent`: Contextual telemetry extracted from HTTP headers.

---

## 6. Security

### 6.1 Authentication
All audit query endpoints require a valid, non-expired Bearer JWT Access Token validated by `authenticate` middleware.

### 6.2 Role-Based Access Control (RBAC)
Audit log inspection is restricted to administrative roles:
- `ADMIN`: Authorized to view audit logs scoped to their assigned organization.
- `SUPER_ADMIN`: Unrestricted platform governance with cross-organizational audit viewing capabilities.
- `TRAINEE` and `TRAINER` accounts are strictly barred with `403 Forbidden`.

### 6.3 Permission Checks
Audit endpoints enforce the `user:read` (or `analytics:view`) permission, mapped to administrative roles in `backend/src/permissions/index.ts`.

### 6.4 Organization Tenant Isolation
- When an `ADMIN` queries audit logs via `GET /api/v1/admin/audit-logs`, `AuditService` automatically overrides any filter `organizationId` with the admin's database-verified `organizationId`.
- When an `ADMIN` requests a log by ID (`GET /api/v1/admin/audit-logs/:id`), the query enforces `organizationId = requester.organizationId`. If the log belongs to a different organization, the API returns `404 Not Found`, preventing tenant enumeration.
- `SUPER_ADMIN` accounts retain global governance access across all organizations.

---

## 7. Sensitive Data Protection

**MANDATORY RULE**: Under no circumstances does CAPACITY CONNECT persist or log sensitive authentication credentials, tokens, or cryptographic secrets.

### Absolute Redaction List:
- `password` / `passwordHash`
- `jwt` / `accessToken` / `refreshToken`
- `apiKey` / `api_key` / `clientSecret` / `privateKey`
- `authorization` headers
- `cookie` contents

### Implementation Mechanism (`AuditSanitizer`):
The `AuditSanitizer.sanitize()` utility performs deep recursive traversals over all data payloads before database persistence or application logging:
1. **Key-based Detection**: Any key matching keywords (`password`, `token`, `jwt`, `apiKey`, etc.) has its value immediately replaced with `[REDACTED]`.
2. **Value-based String Pattern Detection**:
   - String values matching Bearer token signatures (`^Bearer\s+[A-Za-z0-9-_=.]+`) are sanitized to `Bearer [REDACTED]`.
   - String values matching JWT segment patterns (three base64url segments starting with `ey`) are sanitized to `[REDACTED]`.

---

## 8. Audit Events Generation

| Action | Emitting Service / Controller | Trigger Workflow | Old / New Values Captured |
| :--- | :--- | :--- | :--- |
| `USER_APPROVED` | `AdminUserService.approveUser` | Admin approves pending user registration via `PATCH /admin/users/:id/approve` or status update | `oldValues: { status: "PENDING" }`<br>`newValues: { status: "APPROVED" }` |
| `USER_REJECTED` | `AdminUserService.rejectUser` | Admin denies registration via `PATCH /admin/users/:id/reject` | `oldValues: { status: "PENDING" }`<br>`newValues: { status: "REJECTED" }` |
| `ACCOUNT_SUSPENDED` | `AdminUserService.updateUserStatus` | Admin changes status to `SUSPENDED` via `PATCH /admin/users/:id/status` | `oldValues: { status: "APPROVED" }`<br>`newValues: { status: "SUSPENDED" }` |
| `ROLE_CHANGED` | `AdminUserService.updateUserRole` | Admin updates role via `PATCH /admin/users/:id/role` | `oldValues: { role: "TRAINEE" }`<br>`newValues: { role: "TRAINER" }` |
| `COURSE_APPROVAL` | `AuditService.logCourseApproval` | Curriculum review helper | `oldValues: { status: "PENDING_APPROVAL" }`<br>`newValues: { status: "PUBLISHED" }` |
| `CERTIFICATE_VERIFICATION` | `AuditService.logCertificateVerification` | Credential verification helper | `oldValues: { status: "PENDING" }`<br>`newValues: { status: "VERIFIED" }` |

---

## 9. API Documentation

### 9.1 List Audit Logs
- **Method**: `GET`
- **URL**: `/api/v1/admin/audit-logs`
- **Authorization**: `Bearer <token>` (Roles: `ADMIN`, `SUPER_ADMIN`; Permission: `user:read`)
- **Query Parameters**:
  - `page` (integer, default: 1): Pagination index
  - `limit` (integer, default: 20, max: 100): Page size
  - `action` (string, optional): Filter by source-defined action
  - `entityType` (string, optional): Filter by entity type (`USER`, `COURSE`, `CERTIFICATE`)
  - `entityId` (string, optional): Target entity ID
  - `userId` (uuid, optional): Filter by actor user UUID
  - `startDate` (ISO 8601 string, optional): Minimum creation timestamp
  - `endDate` (ISO 8601 string, optional): Maximum creation timestamp
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Audit logs retrieved successfully",
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "organizationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "userId": "095bec5d-572d-479a-9106-105a78f89273",
        "action": "USER_APPROVED",
        "entityType": "USER",
        "entityId": "95399184-63b2-42b8-8fe1-6faf1f118a9a",
        "oldValues": { "status": "PENDING" },
        "newValues": { "status": "APPROVED" },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0",
        "createdAt": "2026-09-07T12:00:00.000Z",
        "user": {
          "id": "095bec5d-572d-479a-9106-105a78f89273",
          "firstName": "Super",
          "lastName": "Admin",
          "email": "admin@capacityconnect.io",
          "role": "ADMIN"
        },
        "organization": {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "name": "India Meteorological Department",
          "code": "IMD"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

### 9.2 Retrieve Single Audit Record
- **Method**: `GET`
- **URL**: `/api/v1/admin/audit-logs/:id`
- **Authorization**: `Bearer <token>` (Roles: `ADMIN`, `SUPER_ADMIN`; Permission: `user:read`)
- **Path Parameter**: `id` (UUID format, required)
- **Response (200 OK)**: Single audit log DTO
- **Errors**: `400 Bad Request` (invalid UUID), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (non-existent or belongs to another tenant)

---

## 10. Swagger / OpenAPI

All audit endpoints and schemas are registered in the OpenAPI 3.0.0 specification file (`backend/src/docs/openapi.json`):
- Tag: `Admin - Audit & Security`
- Endpoints:
  - `GET /admin/audit-logs`
  - `GET /admin/audit-logs/{id}`
- Schemas:
  - `AuditLogResponse`
  - `PaginatedAuditLogsResponse`
- Swagger UI route: Accessible at `/api-docs/` with complete interactive execution support.

---

## 11. Error Handling

Audit operations adhere to the centralized error architecture:
- **`UnauthorizedError` (401)**: Missing, malformed, or expired access token.
- **`ForbiddenError` (403)**: Non-administrative role attempting to access audit data (`TRAINEE` or `TRAINER`).
- **`NotFoundError` (404)**: Requested audit log ID does not exist or belongs to another organization under tenant isolation.
- **`BadRequestError` / `ZodError` (400 / 422)**: Invalid query parameter types, invalid ISO 8601 date formats, or malformed UUIDs.

---

## 12. Testing

A dedicated test suite was executed against a live PostgreSQL test database:
- **`prisma/verify_audit_security.ts`**:
  - Validates `AuditSanitizer` redacting passwords, passwordHash, JWTs, refresh tokens, and API keys.
  - Validates direct persistence of audit logs with organization association and metadata.
  - Validates generation of `USER_APPROVED`, `USER_REJECTED`, `ROLE_CHANGED`, and `ACCOUNT_SUSPENDED` via live HTTP requests.
  - Validates infrastructure helper methods for `COURSE_APPROVAL` and `CERTIFICATE_VERIFICATION`.
  - Validates RBAC rejecting unauthenticated (401) and Trainee (403) callers.
  - Validates multi-tenant organization boundary enforcement (Admin A cannot view Org B audit records).
  - Validates query filtering by action, limit, pagination, and invalid UUID rejection.
- **`prisma/verify_swagger_audit.ts`**:
  - Validates `/api-docs/` Swagger UI page availability (HTTP 200).
  - Validates presence of audit paths and component schemas in `openapi.json`.
  - Executes live HTTP query to `/api/v1/admin/audit-logs` with valid Admin token.
- **Regression Testing**:
  - `verify_user_management_api.ts` (15/15 tests passing)
  - `verify_profiles_api.ts` (45/45 assertions passing)

---

## 13. Limitations / Pending Integrations

- **`COURSE_APPROVAL`**: The audit infrastructure and service methods (`AuditService.logCourseApproval`) are fully implemented and tested. However, the end-to-end Course Management approval workflow is owned by the upcoming Course Management / LMS module. Once that module's admin course review workflow is implemented, it will invoke `AuditService.logCourseApproval`.
- **`CERTIFICATE_VERIFICATION`**: The audit infrastructure and service methods (`AuditService.logCertificateVerification`) are fully implemented and tested. However, the administrative Certificate Verification workflow is owned by the upcoming institutional Certificate system. Once implemented, it will invoke `AuditService.logCertificateVerification`.
- **No Fabricated Workflows**: In accordance with project instructions, fake course approval or certificate verification workflows were not invented; only the clean, reusable audit infrastructure and integration hooks were established.
