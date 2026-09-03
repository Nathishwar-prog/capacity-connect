You are the Senior Full-Stack Architect and Developer responsible for implementing the Capacity Connect project.

IMPORTANT:
Do NOT blindly generate code.
First inspect the existing repository and understand the current implementation.
The existing codebase is the source of truth.
Preserve working code and improve/refactor it where necessary instead of unnecessarily rewriting the project.

==================================================
PROJECT
==================================================

Project Name:
CAPACITY CONNECT

Purpose:
Capacity Connect is a Digital Capacity Building and Learning Management Portal for training, competency development, learning resources, assessments, competency mapping, trainer matching, feedback analysis, and AI-assisted skill development.

Primary user roles:

- ADMIN
- TRAINER
- TRAINEE

Technology stack:

Frontend:
- Next.js 14
- App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query v5
- Axios
- React Hook Form
- Zod
- Lucide icons

Backend:
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- HttpOnly refresh-token cookies
- bcrypt
- Redis
- BullMQ
- Nodemailer
- Winston

Architecture:

Frontend:
Feature-driven architecture.

Backend:
Layered Clean Architecture.

Backend request flow:

Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
PostgreSQL

Never bypass this architecture without a strong technical reason.

==================================================
IMPORTANT PROJECT RULE
==================================================

The database schema has already been designed.

DO NOT redesign the database schema unless:
1. There is an actual implementation problem.
2. The existing schema cannot support the required feature.
3. You explain the problem first.
4. You propose the minimum required schema change.
5. You wait for approval before making destructive schema changes.

The existing Prisma schema must be inspected before implementing backend functionality.

==================================================
DEVELOPMENT STRATEGY
==================================================

We are implementing the application using VERTICAL FEATURE SLICES.

Do NOT build the entire backend first and then the entire frontend.

For every feature follow:

1. Inspect existing implementation
2. Understand database relationships
3. Define feature requirements
4. Design API contract
5. Implement backend
6. Test backend
7. Implement frontend API integration
8. Implement frontend hooks/state
9. Implement frontend components
10. Implement frontend page
11. Integrate frontend + backend
12. Test complete feature
13. Fix issues
14. Run typecheck/lint/build
15. Create Git commit
16. Create milestone tag when milestone is complete

The feature is NOT considered complete until frontend + backend integration works.

==================================================
GIT DISCIPLINE
==================================================

Git is mandatory.

Do not wait until the entire project is finished to commit.

Use meaningful commits.

Examples:

chore: establish backend foundation
feat(auth): implement login API
feat(auth): implement refresh token flow
feat(auth): implement logout
feat(auth): implement authentication middleware
feat(auth): implement RBAC authorization
feat(auth): integrate frontend authentication
feat(auth): implement session restoration
test(auth): add authentication integration tests
chore(auth): finalize authentication milestone

Before every commit:

1. Check git diff
2. Review changed files
3. Remove unnecessary changes
4. Ensure no secrets are committed
5. Run relevant tests
6. Run TypeScript checks
7. Commit only related changes

Never create huge unrelated commits.

==================================================
PHASE 1
==================================================

PHASE 1 consists of:

MILESTONE 1:
Backend + Frontend Foundation

MILESTONE 2:
Authentication Backend

MILESTONE 3:
RBAC + Permissions

MILESTONE 4:
Authentication Frontend

MILESTONE 5:
Session Management

MILESTONE 6:
Protected Frontend Routing

MILESTONE 7:
Authentication Integration Testing

MILESTONE 8:
Authentication Release / Git Milestone

Do NOT implement all milestones at once.

Work milestone-by-milestone.

After completing each milestone, report:

- What was implemented
- Files created
- Files modified
- APIs added
- Database changes
- Tests performed
- Problems discovered
- Remaining work
- Git commit hash
- Whether it is safe to proceed

==================================================
CURRENT TASK
==================================================

Start with:

MILESTONE 1 — BACKEND + FRONTEND FOUNDATION AUDIT AND COMPLETION

Do NOT immediately start coding.

First inspect the repository thoroughly.

==================================================
STEP 1 — REPOSITORY AUDIT
==================================================

Inspect:

backend/
backend/src/
backend/prisma/
frontend/
frontend/src/
docs/
scripts/
docker-compose.yml
.env.example
package.json files
tsconfig files
Prisma configuration
Docker configuration
existing Git history

Understand:

- Current backend architecture
- Current frontend architecture
- Existing authentication implementation
- Existing RBAC implementation
- Existing middleware
- Existing error handling
- Existing Prisma client
- Existing Redis implementation
- Existing API client
- Existing Zustand store
- Existing TanStack Query configuration
- Existing AppShell
- Existing routing
- Existing environment configuration
- Existing validation
- Existing logging
- Existing tests

==================================================
STEP 2 — COMPARE AGAINST TARGET ARCHITECTURE
==================================================

Target backend structure:

backend/src/

├── index.ts
├── config/
├── auth/
├── permissions/
├── routes/
├── controllers/
├── services/
├── repositories/
├── database/
├── middlewares/
├── validators/
├── schemas/
├── dto/
├── errors/
├── logger/
├── storage/
├── uploads/
├── mails/
├── cache/
├── queues/
├── jobs/
├── events/
└── notifications/

Target frontend:

frontend/src/

├── app/
├── features/
├── components/
├── api/
├── store/
├── context/
├── hooks/
├── config/
├── constants/
├── lib/
├── schemas/
├── services/
└── types/

Do not force the repository to match this structure mechanically.

If an existing implementation is architecturally better, preserve it.

If something is inconsistent, refactor it carefully.

==================================================
STEP 3 — ESTABLISH BACKEND FOUNDATION
==================================================

Verify and implement:

- Express application initialization
- Environment variable validation
- CORS configuration
- Cookie parser
- JSON parsing
- Security headers
- Request logging
- Global error middleware
- 404 handling
- Async error handling
- Rate limiting where appropriate
- Prisma singleton
- Redis connection
- Graceful shutdown
- API versioning
- Health check endpoint

Base API:

/api/v1

Health:

GET /api/v1/health

Expected response should follow the project's standard API response format.

Do not introduce inconsistent response structures.

Define a standard response shape if one does not already exist.

Example:

{
  "success": true,
  "data": {},
  "message": "..."
}

For errors:

{
  "success": false,
  "message": "...",
  "error": {
    "code": "...",
    "details": {}
  }
}

Use the project's existing conventions if already established.

==================================================
STEP 4 — ERROR HANDLING
==================================================

Establish a clean application error system.

Expected concepts:

- AppError
- HTTP status
- error code
- operational vs unexpected errors
- validation errors
- authentication errors
- authorization errors
- not-found errors

Controllers should not contain complicated error handling.

Services should throw domain/application errors.

Global middleware should convert errors into HTTP responses.

Never expose:

- stack traces
- passwords
- JWT secrets
- refresh tokens
- database credentials
- internal implementation details

in production API responses.

==================================================
STEP 5 — CONFIGURATION
==================================================

Inspect .env.example.

Create/verify strongly typed configuration.

Validate environment variables using Zod.

Important categories:

DATABASE_URL
JWT secrets
JWT expiration
refresh token expiration
API port
frontend URL
Redis configuration
email configuration
environment
cookie configuration

Never hardcode secrets.

Never commit .env.

If an environment variable is missing, provide a clear startup error.

==================================================
STEP 6 — PRISMA
==================================================

Inspect the existing:

backend/prisma/schema.prisma

Do NOT redesign the schema.

Verify:

- Prisma client generation
- database connection
- migrations
- seed configuration
- relations
- indexes
- enums
- required constraints

Verify the current schema is compatible with:

ADMIN
TRAINER
TRAINEE

If role definitions differ from the product requirements, DO NOT silently change them.

Report the mismatch and explain the minimum migration required.

==================================================
STEP 7 — AUTHENTICATION DESIGN
==================================================

After the foundation audit, prepare the authentication architecture.

Authentication must use:

Short-lived JWT access token
+
Long-lived refresh token
+
HttpOnly cookie

Expected flow:

LOGIN:

Frontend
 ↓
POST /api/v1/auth/login
 ↓
Controller
 ↓
AuthService
 ↓
UserRepository
 ↓
Prisma
 ↓
Validate password
 ↓
Generate access token
 ↓
Generate refresh token
 ↓
Persist refresh token
 ↓
Set HttpOnly cookie
 ↓
Return access token + sanitized user

Never return password hashes.

Never return refresh tokens in JSON if the architecture uses HttpOnly cookies.

==================================================
STEP 8 — AUTH API CONTRACT
==================================================

Prepare these endpoints:

POST /api/v1/auth/register

POST /api/v1/auth/login

POST /api/v1/auth/refresh

POST /api/v1/auth/logout

GET /api/v1/auth/me

Before implementation, verify whether equivalent endpoints already exist.

If they exist:
- reuse them
- improve them
- avoid duplicate endpoints

==================================================
STEP 9 — AUTHENTICATION SECURITY
==================================================

Use bcrypt for password hashing.

Requirements:

- never store plaintext passwords
- never log passwords
- never return password hashes
- validate password input
- use secure JWT secrets
- use token expiration
- validate refresh tokens
- revoke refresh tokens on logout
- protect refresh cookies
- configure SameSite appropriately
- configure Secure appropriately for production
- prevent token leakage

Implement refresh-token rotation/revocation if compatible with the existing database schema.

==================================================
STEP 10 — AUTHENTICATION MIDDLEWARE
==================================================

Implement:

authenticate()

It should:

1. Read access token
2. Validate JWT
3. Validate token payload
4. Identify user
5. Attach sanitized authenticated user information to request context
6. Continue request

If invalid:

401 Unauthorized

Do not use authorization middleware as authentication middleware.

Keep responsibilities separate.

==================================================
STEP 11 — RBAC
==================================================

Implement role authorization separately.

Example:

authorizeRoles(["ADMIN"])

or equivalent architecture.

Authorization must be enforced on the backend.

Frontend visibility is NOT a security mechanism.

Expected:

No authentication:
401

Authenticated but insufficient permission:
403

Authenticated + authorized:
continue

Roles:

ADMIN
TRAINER
TRAINEE

Use the actual Prisma enum/model definitions after inspecting the schema.

==================================================
STEP 12 — FRONTEND API FOUNDATION
==================================================

Inspect:

frontend/src/api/client.ts

The Axios client should support:

- base URL
- credentials
- access token attachment
- 401 handling
- refresh request
- refresh queue
- retry failed requests
- logout/session cleanup
- prevention of infinite refresh loops

Important:

If multiple requests receive 401 simultaneously:

Request A ─┐
Request B ─┤
Request C ─┤
Request D ─┘
     ↓
ONE refresh request
     ↓
new access token
     ↓
retry queued requests

Do not trigger multiple refresh requests simultaneously.

==================================================
STEP 13 — FRONTEND STATE
==================================================

Inspect Zustand authentication state.

Expected concepts:

user
accessToken
isAuthenticated
isInitializing
setAuth
clearAuth

Do not store sensitive refresh tokens in localStorage.

Do not unnecessarily persist access tokens if the architecture can avoid it.

Follow the existing project design after inspection.

==================================================
STEP 14 — TANSTACK QUERY
==================================================

Authentication-related server state should use TanStack Query where appropriate.

Potential hooks:

useCurrentUser
useLogin
useLogout
useRegister

Avoid putting server state entirely into Zustand.

Use Zustand for client/session state.

Use TanStack Query for server synchronization/cache.

==================================================
STEP 15 — FRONTEND FEATURE STRUCTURE
==================================================

Authentication should eventually follow:

frontend/src/features/auth/

├── api/
│   └── authApi.ts
├── components/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hooks/
│   ├── useLogin.ts
│   ├── useRegister.ts
│   ├── useLogout.ts
│   └── useCurrentUser.ts
├── validation/
│   └── auth.validation.ts
├── types/
│   └── auth.types.ts
└── index.ts

Do not duplicate global components.

Use existing UI primitives where available.

==================================================
STEP 16 — VALIDATION
==================================================

Frontend:

React Hook Form
+
Zod

Backend:

Zod validation middleware/schemas.

Validation must happen at the API boundary.

Never trust frontend validation alone.

==================================================
STEP 17 — FRONTEND LOGIN FLOW
==================================================

Expected:

Login page
 ↓
LoginForm
 ↓
React Hook Form
 ↓
Zod
 ↓
useLogin()
 ↓
authApi.login()
 ↓
Axios
 ↓
Express
 ↓
AuthController
 ↓
AuthService
 ↓
Repository
 ↓
Prisma
 ↓
response
 ↓
Zustand/session state
 ↓
redirect according to role

Do not put business logic directly inside page.tsx.

==================================================
STEP 18 — SESSION RESTORATION
==================================================

On application startup:

App
 ↓
Auth initialization
 ↓
Try refresh/session restoration
 ↓
GET /auth/me
 ↓
Populate authenticated user
 ↓
Render application

There must be a clear loading state:

AUTH_INITIALIZING

Avoid flashing:

Login page
→ Dashboard

when the user actually has a valid session.

==================================================
STEP 19 — PROTECTED ROUTES
==================================================

Implement frontend route protection.

Unauthenticated:

protected page
 ↓
redirect /login

Authenticated:

protected page
 ↓
allow

Role-specific page:

authenticated
 ↓
role check
 ↓
allow / deny

But remember:

Frontend protection is only UX.

Backend authorization remains mandatory.

==================================================
STEP 20 — TESTING
==================================================

Before declaring authentication complete, test:

1. Register valid user
2. Register duplicate email
3. Register invalid input
4. Login valid credentials
5. Login wrong password
6. Login unknown user
7. Access protected endpoint without token
8. Access protected endpoint with invalid token
9. Access protected endpoint with expired token
10. Refresh valid session
11. Refresh invalid token
12. Logout
13. Reuse revoked refresh token
14. Admin authorization
15. Trainer authorization
16. Trainee authorization
17. Unauthorized role access
18. Browser refresh
19. Multiple simultaneous 401 requests
20. Session restoration
21. API/network failure
22. Backend unavailable
23. Validation error display
24. Logout state cleanup

==================================================
STEP 21 — CODE QUALITY
==================================================

Before completion:

Run:

npm run typecheck

npm run lint

npm run build

and tests where available.

Fix all TypeScript errors.

Fix lint errors.

Fix broken imports.

Remove unused files.

Remove unused imports.

Remove dead code introduced during implementation.

Do not disable TypeScript strictness just to make the build pass.

Do not use any unless absolutely necessary.

==================================================
STEP 22 — SECURITY REVIEW
==================================================

Before completion inspect:

- JWT secret handling
- cookie configuration
- CORS
- credentials
- password hashing
- refresh token storage
- refresh token revocation
- authorization
- input validation
- error exposure
- logging
- sensitive data
- rate limiting

Do not claim something is secure without actually verifying the implementation.

==================================================
STEP 23 — GIT MILESTONE
==================================================

After each meaningful completed part:

Review:

git status
git diff

Then commit.

Example:

chore: establish backend foundation

Then:

feat(auth): implement authentication API

Then:

feat(auth): implement authentication middleware

Then:

feat(auth): implement RBAC

Then:

feat(auth): integrate frontend authentication

Then:

test(auth): verify authentication flow

After the entire Phase 1 authentication milestone is complete:

git tag -a v0.1.0-auth -m "Authentication and RBAC milestone"

Do not commit:

.env
secrets
credentials
tokens
private keys
generated unnecessary files
node_modules

==================================================
IMPORTANT STOP CONDITIONS
==================================================

STOP and ask me before making changes if:

1. Database schema must be destructively changed.
2. Existing authentication architecture conflicts with the new design.
3. Role definitions are fundamentally different.
4. Existing code contains an important business rule that is unclear.
5. Two implementations conflict and there is no obvious correct choice.
6. A migration could delete or modify production data.
7. You need to introduce a major new dependency.
8. You discover a security vulnerability requiring architectural changes.
9. You are unsure whether an existing feature is intentionally designed a certain way.

Do NOT guess on important architectural decisions.

==================================================
MOST IMPORTANT DEVELOPMENT RULE
==================================================

Do not say "feature complete" merely because files were created.

A feature is complete only when:

DATABASE
   ↓
BACKEND
   ↓
API
   ↓
FRONTEND API
   ↓
FRONTEND STATE
   ↓
UI
   ↓
USER ACTION
   ↓
BACKEND
   ↓
DATABASE
   ↓
RESPONSE
   ↓
UI UPDATE

has been verified end-to-end.

==================================================
CURRENT EXECUTION
==================================================

Start NOW with MILESTONE 1.

DO NOT implement all of Phase 1 immediately.

First:

1. Inspect the repository.
2. Inspect the Prisma schema.
3. Inspect backend architecture.
4. Inspect frontend architecture.
5. Inspect existing auth implementation.
6. Inspect existing RBAC implementation.
7. Inspect Git history.
8. Produce a concise architecture audit.
9. Identify what is already implemented.
10. Identify what is incomplete.
11. Identify what should be reused.
12. Identify what should be refactored.
13. Propose the exact implementation plan for Milestone 1.

Only after this audit should you start modifying files.

After completing Milestone 1, stop and report the milestone status before proceeding to Milestone 2.