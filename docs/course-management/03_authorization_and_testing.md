# 03. Authorization & Testing

## 1. Authentication & JWT Identity Verification
All endpoints require JWT Bearer authentication. The authentication middleware (`auth.middleware.ts`):
1. Verifies the `Authorization: Bearer <token>` HTTP header.
2. Extracts user identity and looks up record in database (`user` table).
3. Verifies account status (`status === APPROVED`).
4. Attaches `id`, `email`, `role`, `organizationId`, and `permissions` to `req.user`.

> **Security Requirement**: Authentication accepts only stored email identities matching database user records.

## 2. Authorization Permission Matrix

| Permission | SUPER_ADMIN | ADMIN | TRAINER | TRAINEE | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `courses:read` | ✅ | ✅ | ✅ | ✅ (Published only) | View courses and full structure hierarchy |
| `courses:create` | ✅ | ✅ | ✅ | ❌ | Create course shell in `DRAFT` status |
| `courses:update` | ✅ | ✅ | ✅ (Own courses) | ❌ | Modify course, create/update/delete modules and lessons, reorder structure, attach resources |
| `courses:archive` | ✅ | ✅ | ✅ (Own courses) | ❌ | Soft-delete course (status -> `ARCHIVED`) |
| `courses:submit` | ❌ | ❌ | ✅ (Own courses) | ❌ | Submit course for review (status -> `PENDING_APPROVAL`) |
| `courses:approve` | ✅ | ✅ | ❌ | ❌ | Approve pending course (status -> `PUBLISHED`) |
| `courses:reject` | ✅ | ✅ | ❌ | ❌ | Reject pending course (status -> `REJECTED`) |
| `courses:publish` | ✅ | ✅ | ❌ | ❌ | Direct publish course |

## 3. Structure Modification Lock Rules
- **Editable Statuses**: `DRAFT`, `REJECTED`.
- **Locked Statuses**: `PENDING_APPROVAL`, `PUBLISHED`, `ARCHIVED`. Attempting to modify structure or reorder items in locked courses returns `409 Conflict`.

## 4. Automated Jest Testing Suite

### 4.1 Running Automated Tests
```bash
cd backend
npx jest backend/src/__tests__
```

### 4.2 Automated Test Coverage (52 Passing Tests)
- `backend/src/__tests__/course-structure.service.test.ts` (28 tests):
  - Module CRUD & reordering (TC-001 - TC-030)
  - Lesson CRUD, content types including `VIDEO`, `PDF`, `PPT` (TC-031 - TC-080)
  - Lesson reordering & resource attachment (TC-081 - TC-095)
  - Full course structure tree generation & duration calculation (TC-096 - TC-110)
  - Role-based authorization & ownership checks (TC-111 - TC-130)
  - Hierarchical mismatch validation & error codes (TC-131 - TC-155)
- `backend/src/__tests__/course.service.test.ts` (24 tests):
  - Course lifecycle state machine (Draft -> Submit -> Approve -> Publish -> Archive)

## 5. Manual Postman Testing
The OpenAPI 3.0 specification for Postman testing is maintained at:
`docs/Postman_Testing/CourseManagement.json`

### Manual Test Execution Steps:
1. Start backend server: `npm run dev` (`http://localhost:5000/api/v1`).
2. Login via `POST /api/v1/auth/login` to retrieve JWT access token.
3. Include header `Authorization: Bearer <accessToken>` in all subsequent calls.
4. Execute course creation, module creation, lesson creation (with `PPT`, `VIDEO`, `PDF` content types), reordering, and structure retrieval.
