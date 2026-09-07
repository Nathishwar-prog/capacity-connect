# RBAC (Role-Based Access Control) — Capacity Connect

**Digital Capacity Building and Learning Management Portal**  
*Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)*  
*Component: M2 Development 2 — Backend RBAC*

---

## 1. Overview

Role-Based Access Control (RBAC) in Capacity Connect provides server-side authorization enforcement governing user actions across the platform. While Authentication (Development 1) verifies user identity and manages cryptographically signed sessions, RBAC ensures that authenticated identities possess the exact privileges necessary to perform requested operations on backend resources.

All access decisions are strictly evaluated on the server. Frontend UI rendering rules (e.g. conditional button rendering) exist solely for user experience and never serve as a security boundary.

---

## 2. Objective

The primary objectives of the backend authorization architecture are:
- **Server-Side Enforcement**: Protect all sensitive operations (such as approving users, authoring course modules, uploading learning materials, and inspecting executive analytics) from unauthorized invocation.
- **Privilege Separation**: Enforce strict boundaries among institutional administrators, domain trainers, and trainee officers.
- **Tamper Resistance**: Guarantee that client-supplied claims in the request body, query parameters, or arbitrary headers cannot escalate privileges or bypass authorization checks.
- **Auditability & Traceability**: Log unauthorized access attempts in the audit trail without revealing internal cryptographic material, tokens, or system internals.
- **Reusability**: Provide generic, scalable middleware guards (`requirePermission(...)`, `requireRole(...)`, `requireSelfOrRole(...)`) that can be adopted seamlessly by future modules without duplicating authorization logic.

---

## 3. Roles

Capacity Connect defines three core operational roles and a system governance role:

1. **Admin (`ADMIN`)**:
   - Institutional and departmental governance authority.
   - Responsibilities:
     - Manage users (review directory, approve/reject registrations, update roles).
     - Manage courses (author, update, and approve official curriculum).
     - Manage platform (inspect executive capacity metrics, audit logs, and institutional dashboards).

2. **Trainer (`TRAINER`)**:
   - Scientific instructors and subject-matter experts.
   - Responsibilities:
     - Manage own courses (design and update assigned course modules and lessons).
     - Upload learning resources (scientific literature, radar charts, manuals).
     - Create assessments (quizzes, evaluation rubrics).
     - Monitor own trainees (track progress and view instructor analytics).

3. **Trainee (`TRAINEE`)**:
   - Scientific, technical, operational, and administrative learners.
   - Responsibilities:
     - Browse approved course catalog and enroll.
     - Complete lessons and track competencies.
     - Take quizzes and assessments.
     - Trainees possess zero administrative, course-authoring, or platform governance permissions.

4. **Super Admin (`SUPER_ADMIN`)**:
   - Platform infrastructure administrator with unrestricted wildcard (`*`) bypass across all operations.

---

## 4. Permissions

The project authoritative sources strictly specify the following ten core permissions:

| Permission Key | Constant | Scope | Description |
| :--- | :--- | :--- | :--- |
| `user:read` | `Permissions.USER_READ` | User Governance | Read user directory and profile metadata |
| `user:approve` | `Permissions.USER_APPROVE` | User Governance | Approve pending user account registrations |
| `user:reject` | `Permissions.USER_REJECT` | User Governance | Reject unapproved or unauthorized user accounts |
| `user:role:update` | `Permissions.USER_ROLE_UPDATE` | User Governance | Update and assign roles to user accounts |
| `course:create` | `Permissions.COURSE_CREATE` | Curriculum | Author and structure new official courses |
| `course:update` | `Permissions.COURSE_UPDATE` | Curriculum | Edit and modify existing course syllabus and modules |
| `course:approve` | `Permissions.COURSE_APPROVE` | Curriculum | Formally verify, approve, and publish course content |
| `assessment:create` | `Permissions.ASSESSMENT_CREATE` | Evaluation | Design and publish assessment questions and quizzes |
| `resource:upload` | `Permissions.RESOURCE_UPLOAD` | Resources | Upload domain scientific and educational materials |
| `analytics:view` | `Permissions.ANALYTICS_VIEW` | Analytics | Inspect executive dashboard and skill gap analytics |

### Role-to-Permission Mapping Matrix

```
SUPER_ADMIN: [*] (Unrestricted Wildcard)

ADMIN:
├── user:read
├── user:approve
├── user:reject
├── user:role:update
├── course:create
├── course:update
├── course:approve
├── assessment:create
├── resource:upload
└── analytics:view

TRAINER:
├── course:create
├── course:update
├── assessment:create
├── resource:upload
└── analytics:view

TRAINEE:
└── (No administrative or content-authoring permissions)
```

*(Note: The mapping of roles to permissions is derived directly from the source role security models: Admin manages users, courses, and platform; Trainer manages own courses, uploads resources, and monitors trainees; Trainee enrolls, learns, and takes assessments).*

---

## 5. Authentication → Authorization Flow

```
                      HTTP Request
                           │
                           ▼
          JWT Authentication Middleware (authenticate)
                           │
             [Verifies Bearer Access Token]
             [Rejects invalid/expired token -> 401]
                           │
                           ▼
                   Authenticated User
             [req.user payload attached: id, role, permissions]
                           │
                           ▼
       Backend Authorization Middleware (requirePermission)
                           │
             [Checks required permission against req.user.role / req.user.permissions]
             [Bypasses if SUPER_ADMIN or contains '*']
             [Rejects if missing permission -> 403 Forbidden]
                           │
                           ▼
                   Controller Handler
                           │
                           ▼
                     Service Layer
                           │
                           ▼
                    Repository Layer
                           │
                           ▼
                    Prisma / PostgreSQL
```

---

## 6. Backend Architecture

The RBAC implementation adheres strictly to the project's layered Clean Architecture:

```
Middleware (auth.middleware.ts: requirePermission, requireRole, requireSelfOrRole)
    │
    ▼
Service Layer (rbac.service.ts: RbacService)
    │  - Evaluates business permission logic (hasPermission)
    │  - Resolves hybrid user permissions (code matrix + DB fallback)
    │  - Authorizes user lifecycle status (APPROVED check)
    ▼
Repository Layer (rbac.repository.ts: RbacRepository)
    │  - Queries user role and status (getUserRoleAndStatus)
    │  - Resolves relational permissions from AppRole / RolePermissionMapping / AppPermission
    │  - Synchronizes source permissions to database (syncSourcePermissions)
    ▼
Database (Prisma Schema / PostgreSQL)
       - tables: users, roles, permissions, role_permissions
```

---

## 7. Permission Enforcement

Permissions are enforced through high-performance, declarative route middleware:

```typescript
// Example: Route protected with fine-grained permission
router.get(
  '/users',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  requirePermission(Permissions.USER_READ),
  asyncHandler(userController.getUserList),
);

// Example: Course creation protected with course:create
router.post(
  '/courses',
  requirePermission(Permissions.COURSE_CREATE),
  validate({ body: createCourseSchema }),
  asyncHandler(trainerController.createCourse),
);
```

### Enforcement Rules:
1. **Identity Confirmation**: Middleware checks if `req.user` exists. If not, immediately throws `401 UnauthorizedError`.
2. **Wildcard / Super Admin Bypass**: If `req.user.role === 'SUPER_ADMIN'` or `req.user.permissions` includes `'*'`, the request is immediately allowed.
3. **Evaluation**: Evaluates whether `permissionsMap[userRole]` or `req.user.permissions` contains the target permission.
4. **Denial**: If unauthorized, halts execution and passes `403 ForbiddenError` to the centralized error handler.

---

## 8. Security

### Why Frontend-Only Checks Are Insufficient:
- Any client can manipulate browser JavaScript, React state, or browser DevTools to display hidden buttons or forms.
- Attackers can issue raw HTTP requests directly via `curl`, Postman, or custom scripts, bypassing the UI entirely.
- Client-side state cannot be trusted. The server MUST independently verify that the caller is authenticated and authorized before executing any state-modifying or sensitive read query.

### Security Defenses Implemented:
- **No Client-Controlled Roles**: The server never reads role or permission values from `req.body`, `req.query`, or client headers (`x-role`). Only the server-verified JWT token payload (or active database lookup) establishes identity.
- **Fail-Closed Default**: Any request lacking explicit permission is rejected with `403 Forbidden`.
- **Sanitized Error Responses**: Unauthorized errors return generic messages (e.g. `Access denied. Missing required permission(s): user:read`) and never expose SQL queries, stack traces, or cryptographic secrets.

---

## 9. Error Handling

RBAC integrates directly into the centralized application error system (`src/errors/app-error.ts`):

- **Unauthenticated (HTTP 401)**:
  ```json
  {
    "success": false,
    "message": "Authentication credentials required",
    "errors": []
  }
  ```
- **Unauthorized / Forbidden (HTTP 403)**:
  ```json
  {
    "success": false,
    "message": "Access denied. Missing required permission(s): user:read",
    "errors": []
  }
  ```

---

## 10. Testing

RBAC is verified by two comprehensive automated test suites:

### 1. Permission Guard & Boundary Verification (`backend/prisma/verify_rbac.ts`)
- Tests all 10 source permissions individually against `ADMIN`, `TRAINER`, `TRAINEE`, and `SUPER_ADMIN`.
- Verifies that `ADMIN` is permitted for all 10 source permissions.
- Verifies that `TRAINER` is granted trainer permissions (`course:create`, `course:update`, `assessment:create`, `resource:upload`, `analytics:view`) and denied admin permissions (`user:read`, `user:approve`, `user:reject`, `user:role:update`, `course:approve`).
- Verifies that `TRAINEE` is denied all 10 source permissions with `403 Forbidden`.
- Verifies client spoofing injection resistance (client passing `role: 'ADMIN'` in body/query is rejected).
- Verifies `RbacService` and `RbacRepository` relational database queries.
- Verifies `requireSelfOrRole` guard for self-service vs admin operations.
- **Result**: `ALL 20 RBAC SOURCE PERMISSION & SECURITY TESTS PASSED!`

### 2. Real HTTP API Integration Test Suite (`backend/prisma/verify_rbac_api.ts`)
- Spins up a real HTTP Express server on an ephemeral port.
- Verifies unauthenticated request rejection (401).
- Verifies Trainee token rejection on `GET /api/v1/users` (403).
- Verifies Trainee privilege escalation spoofing in query & body rejected (403).
- Verifies Trainer token rejection on `GET /api/v1/users` (403).
- Verifies Trainer token authorized on `GET /api/v1/trainer/analytics` (200).
- Verifies Admin token authorized on `GET /api/v1/users` (200).
- Verifies Admin token authorized on `GET /api/v1/dashboard/admin` (200).
- Verifies Trainee token blocked from `GET /api/v1/dashboard/admin` (403).
- **Result**: `ALL 8 REAL HTTP RBAC API INTEGRATION TESTS PASSED!`

---

## 11. API Integration

Existing protected backend endpoints modified to enforce source-defined RBAC:

| Route | Method | Required Role | Required Permission |
| :--- | :--- | :--- | :--- |
| `/api/v1/users` | `GET` | `ADMIN`, `SUPER_ADMIN` | `user:read` |
| `/api/v1/trainer/courses` | `POST` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | `course:create` |
| `/api/v1/trainer/courses/:courseId` | `PATCH` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | `course:update` |
| `/api/v1/trainer/assessments` | `POST` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | `assessment:create` |
| `/api/v1/trainer/analytics` | `GET` | `TRAINER`, `ADMIN`, `SUPER_ADMIN` | `analytics:view` |
| `/api/v1/dashboard/admin` | `GET` | `ADMIN`, `SUPER_ADMIN` | `analytics:view` |

---

## 12. Scalability

Future modules (such as User Management, Course Authoring, Assessments, and Resource Repositories) can guard endpoints simply by importing:
```typescript
import { requirePermission, Permissions } from '../auth/auth.middleware';

router.post('/resources', requirePermission(Permissions.RESOURCE_UPLOAD), ...);
```
Adding new permissions in the future requires only:
1. Adding the key to `Permissions` in `backend/src/permissions/index.ts`.
2. Mapping the permission to appropriate roles in `permissionsMap`.
3. Running `rbacService.syncPermissions()` to persist the definition into the database.

No middleware rewrites or controller refactoring is required.

---

## 13. Files Created / Modified

### Created:
- `backend/src/repositories/rbac.repository.ts` — Relational database repository for roles, permissions, and DB synchronization.
- `backend/src/services/rbac.service.ts` — Business service for permission resolution and user authorization.
- `backend/prisma/verify_rbac_api.ts` — Real HTTP integration test suite for RBAC.
- `docs/rbac/README.md` — Exhaustive RBAC documentation.

### Modified:
- `backend/src/permissions/index.ts` — Added source permissions (`SOURCE_PERMISSIONS`), standardized permissions map.
- `backend/src/auth/auth.middleware.ts` — Exported permissions and enhanced guard consistency.
- `backend/src/routes/user.routes.ts` — Integrated `requirePermission(Permissions.USER_READ)`.
- `backend/src/routes/trainer.routes.ts` — Integrated `course:create`, `course:update`, `assessment:create`, `analytics:view`.
- `backend/src/routes/dashboard.routes.ts` — Integrated `analytics:view` on `/admin`.
- `backend/src/repositories/auth.repository.ts` — Added timeout resiliency for interactive transactions over remote connections.
- `backend/src/index.ts` — Exported `app` and `server` for integration testing.
- `backend/prisma/verify_rbac.ts` — Expanded to test all 10 source permissions, role boundaries, and attacks.
- `docs/api.md` — Updated with standardized authorization and permission specifications.
- `README.md` — Updated documentation index with RBAC reference.

---

## 14. Git Information

- **Branch**: `Zees/rbac`
- **Base Branch**: `Zees/authentication` / `main`
- **Component**: Backend RBAC + Role-Based Access Control (M2 Development 2)

---

## 15. Future Improvements

- Dynamic custom role creation via admin portal UI (when M2 Development 3 is implemented).
- Temporary role delegation (e.g. Acting Scientist/Administrator delegation for leave periods).
- Organization-scoped tenant permissions for multi-institute governance.
