# Authentication

## 1. Overview

Capacity Connect is a government-oriented Digital Capacity Building and Learning Management Portal for the Ministry of Earth Sciences (MoES) and the India Meteorological Department (IMD).

Authentication serves as the foundational security infrastructure for the entire Capacity Connect ecosystem. Unlike generic open-enrollment platforms, Capacity Connect enforces an enterprise administrative approval lifecycle. Public self-registration provisions a `TRAINEE` account in `PENDING` state. Access to portal resources and token issuance requires explicit administrative approval by an authorized administrator (`ADMIN` or `SUPER_ADMIN`) alongside email verification.

## 2. Objective

Provide secure, auditable, and resilient authentication infrastructure that:
- Guarantees zero unapproved access to domain courses, meteorology training modules, and capacity-building resources.
- Protects user credentials with salt-rounded bcrypt hashing (never storing or transmitting plain text).
- Manages authenticated client sessions with cryptographically signed JSON Web Tokens (short-lived Access Tokens) and single-use rotating Refresh Tokens persisted as SHA-256 hashes in PostgreSQL.
- Safeguards refresh tokens inside hardened, `HttpOnly`, `SameSite=Lax` cookies scoped exclusively to the `/api/v1/auth` pathway.
- Enables tamper-proof, time-limited Email Verification via signed JWTs dispatched via Nodemailer.
- Enforces strict privilege escalation prevention by locking registration to `Role.TRAINEE`.
- Logs comprehensive security audit trails (`USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_BLOCKED_PENDING`, `EMAIL_VERIFIED`, `LOGOUT`) without leaking passwords, tokens, or cryptographic secrets.

## 3. User Roles

The platform defines three primary operational user roles and a root governance role:

1. **Trainee (`TRAINEE`)**:
   - Scientific, technical, operational, and administrative officers of MoES/IMD enrolled in capacity building programs.
   - Permitted public self-registration via `/api/v1/auth/signup` or `/api/v1/auth/register`.
   - Accounts are created in `PENDING` status awaiting admin approval.

2. **Trainer (`TRAINER`)**:
   - Meteorological domain experts, course instructors, and assessment evaluators.
   - Provisioned by administrators through internal governance processes.

3. **Administrator (`ADMIN`)**:
   - MoES/IMD organizational unit administrators responsible for trainee onboarding, approving registrations, managing departments, and supervising capacity metrics.

4. **Super Administrator (`SUPER_ADMIN`)**:
   - System architects and root infrastructure administrators possessing unrestricted platform governance permissions.

## 4. Authentication Flow

```
Signup (POST /api/v1/auth/signup or /register)
   │
   ▼
Account Created (status: PENDING, emailVerified: false)
   │
   ├──► Email Verification Dispatched (24-hour signed token sent via Nodemailer)
   │
   ▼
Pending Administrative Approval (Login blocked: 401 Unauthorized)
   │
   ▼
Admin Approval (Admin evaluates & approves account via PATCH /api/v1/users/:id -> status: APPROVED)
   │
   ▼
Email Verification Completed (POST /api/v1/auth/verify-email -> emailVerified: true)
   │
   ▼
Login (POST /api/v1/auth/login)
   │  (Credentials validated + status verified === APPROVED)
   ▼
Access Token Issued (15m expiration, Bearer Authorization Header)
   │
   ▼
Refresh Token Issued (7d expiration, single-use rotating, HttpOnly Cookie)
   │
   ├──► Authenticated Requests (GET /api/v1/auth/me)
   ├──► Session Rotation (POST /api/v1/auth/refresh)
   └──► Session Revocation (POST /api/v1/auth/logout -> revokedAt set in DB)
```

## 5. Architecture

The authentication subsystem strictly adheres to the enterprise layered architecture:

```
HTTP Request
     │
     ▼
Rate Limiting Middleware (authRateLimiter: 30 req / 15 min per IP)
     │
     ▼
Authentication Middleware (where applicable: Bearer JWT validation)
     │
     ▼
Zod Input Validation (validate({ body: schema }))
     │
     ▼
Controller (AuthController: thin HTTP boundary, extracts params/cookies, formats responses)
     │
     ▼
Service (AuthService: business logic, credential comparison, lifecycle status checks, audit triggers)
     │
     ▼
Repository (AuthRepository: database operations, transactions, token hashing, audit log persistence)
     │
     ▼
Prisma ORM Client
     │
     ▼
PostgreSQL (Neon Serverless DB)
```

## 6. Backend Implementation

The authentication backend is organized across modular, single-responsibility files:

- **Repository**: [auth.repository.ts](file:///d:/capacity-connect/backend/src/repositories/auth.repository.ts)
  - Implements `IAuthRepository` for user queries, transactional registration, token rotation, and audit logs.
- **Service**: [auth.service.ts](file:///d:/capacity-connect/backend/src/services/auth.service.ts)
  - Contains core authentication business workflows, credential checking, lifecycle enforcement, and email verification.
- **Controller**: [auth.controller.ts](file:///d:/capacity-connect/backend/src/controllers/auth.controller.ts)
  - Thin HTTP boundary translating requests to service calls and utilizing `ResponseHelper` for standard responses.
- **Routes**: [auth.routes.ts](file:///d:/capacity-connect/backend/src/routes/auth.routes.ts)
  - Route declarations with rate limiting and schema validation middleware.
- **Token Utilities**: [token.utils.ts](file:///d:/capacity-connect/backend/src/auth/token.utils.ts)
  - Access token JWT generation/verification, refresh token generation/verification, email verification token handling, and HttpOnly cookie management.
- **Password Utilities**: [password.utils.ts](file:///d:/capacity-connect/backend/src/auth/password.utils.ts)
  - Bcrypt hashing (salt rounds = 10) and secure timing-safe password comparison.
- **Validators**: [auth.validation.ts](file:///d:/capacity-connect/backend/src/validators/auth.validation.ts)
  - Zod schemas validating `registerSchema`, `loginSchema`, `refreshTokenSchema`, `verifyEmailSchema`, and `resendVerificationSchema`.
- **Data Transfer Objects**: [auth.dto.ts](file:///d:/capacity-connect/backend/src/dto/auth.dto.ts)
  - Strongly typed contracts: `RegisterDto`, `LoginDto`, `RefreshTokenDto`, `VerifyEmailDto`, `ResendVerificationDto`, `AuthUserDto`, `RegisterResponseDto`, `AuthResponseDto`.

---

## 7. API Documentation

### 7.1 Signup / Public Registration
- **Method**: `POST`
- **URL**: `/api/v1/auth/signup` (Alias: `/api/v1/auth/register`)
- **Authorization**: Public
- **Request**:
  ```json
  {
    "email": "trainee.sharma@imd.gov.in",
    "password": "Password123!",
    "firstName": "Ramesh",
    "lastName": "Sharma",
    "phone": "+91-9876543210",
    "organizationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "departmentId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Registration successful. Your account is pending administrative approval. A verification link has been dispatched to your email.",
    "data": {
      "message": "Registration successful. Your account is pending administrative approval. A verification link has been dispatched to your email.",
      "requiresApproval": true,
      "user": {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "organizationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "organizationName": "Ministry of Earth Sciences & India Meteorological Department",
        "departmentId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "departmentName": "National Weather Forecasting Centre (NWFC)",
        "email": "trainee.sharma@imd.gov.in",
        "firstName": "Ramesh",
        "lastName": "Sharma",
        "phone": "+91-9876543210",
        "avatarUrl": null,
        "role": "TRAINEE",
        "status": "PENDING",
        "emailVerified": false,
        "permissions": ["courses:read", "assessments:take", "resources:read"],
        "lastLoginAt": null,
        "createdAt": "2026-09-06T14:30:00.000Z",
        "updatedAt": "2026-09-06T14:30:00.000Z",
        "traineeProfile": {
          "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
          "designation": "Trainee",
          "bio": "Continuous learning member.",
          "interests": [],
          "profileCompletion": 0
        },
        "trainerProfile": null
      }
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid validation schema (weak password, missing email, invalid UUID).
  - `409 Conflict`: An account with this email address already exists.
  - `429 Too Many Requests`: Exceeded 30 requests per 15 minutes.
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.2 User Login
- **Method**: `POST`
- **URL**: `/api/v1/auth/login`
- **Authorization**: Public
- **Request**:
  ```json
  {
    "email": "trainee.sharma@imd.gov.in",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  - Sets Cookie: `refreshToken=<token>; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=604800`
  - Body:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "organizationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "organizationName": "Ministry of Earth Sciences & India Meteorological Department",
        "departmentId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "departmentName": "National Weather Forecasting Centre (NWFC)",
        "email": "trainee.sharma@imd.gov.in",
        "firstName": "Ramesh",
        "lastName": "Sharma",
        "phone": "+91-9876543210",
        "avatarUrl": null,
        "role": "TRAINEE",
        "status": "APPROVED",
        "emailVerified": true,
        "permissions": ["courses:read", "assessments:take", "resources:read"],
        "lastLoginAt": "2026-09-06T14:35:00.000Z",
        "createdAt": "2026-09-06T14:30:00.000Z",
        "updatedAt": "2026-09-06T14:35:00.000Z",
        "traineeProfile": {
          "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
          "designation": "Meteorological Officer",
          "bio": "Atmospheric observation officer.",
          "interests": ["Radar Meteorology"],
          "profileCompletion": 100
        },
        "trainerProfile": null
      }
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: "Invalid email or password" (when credentials do not match).
  - `401 Unauthorized`: "Your account is awaiting administrative approval" (when status is `PENDING`).
  - `401 Unauthorized`: "Your registration request could not be approved" (when status is `REJECTED`).
  - `401 Unauthorized`: "Your account is currently unavailable. Please contact your administrator" (when status is `SUSPENDED` or `DEACTIVATED`).
  - `429 Too Many Requests`: Exceeded rate limit.
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.3 Refresh Access Token
- **Method**: `POST`
- **URL**: `/api/v1/auth/refresh`
- **Authorization**: Public (Cookie-based or Bearer / Body payload)
- **Request**:
  - Automatically sends `refreshToken` via HttpOnly cookie, OR via body:
  ```json
  {
    "refreshToken": "<refresh-jwt-token>"
  }
  ```
- **Response** (`200 OK`):
  - Rotates Cookie: `refreshToken=<new-refresh-token>; Path=/api/v1/auth; HttpOnly; SameSite=Lax`
  - Body:
  ```json
  {
    "success": true,
    "message": "Access token refreshed successfully",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: "No refresh token provided".
  - `401 Unauthorized`: "Refresh token has expired or been revoked".
  - `401 Unauthorized`: "User account is inactive or not approved".
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.4 Email Verification
- **Method**: `POST`
- **URL**: `/api/v1/auth/verify-email`
- **Authorization**: Public
- **Request**:
  ```json
  {
    "token": "<signed-email-verification-jwt>"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Email verified successfully."
  }
  ```
- **Errors**:
  - `400 Bad Request`: "Email verification token is invalid or has expired".
  - `400 Bad Request`: "Verification token does not match any registered account".
  - `429 Too Many Requests`: Exceeded rate limit.
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.5 Resend Email Verification
- **Method**: `POST`
- **URL**: `/api/v1/auth/resend-verification`
- **Authorization**: Public
- **Request**:
  ```json
  {
    "email": "trainee.sharma@imd.gov.in"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "If an account associated with this email exists, a verification email has been sent."
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid email format.
  - `429 Too Many Requests`: Exceeded rate limit.
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.6 Logout
- **Method**: `POST`
- **URL**: `/api/v1/auth/logout`
- **Authorization**: Public (Accepts cookie or body refreshToken)
- **Request**:
  - Can be empty body when using HttpOnly cookie, or:
  ```json
  {
    "refreshToken": "<refresh-jwt-token>"
  }
  ```
- **Response** (`200 OK`):
  - Clears `refreshToken` cookie.
  - Body:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```
- **Errors**: None (idempotent; always clears cookie and revokes matching active token).
- **Pagination**: Not applicable
- **Filters**: Not applicable

### 7.7 Current User Profile (`/me`)
- **Method**: `GET`
- **URL**: `/api/v1/auth/me`
- **Authorization**: Authenticated (`Authorization: Bearer <access-token>`)
- **Request**: No body
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Authenticated user profile retrieved successfully",
    "data": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "organizationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "organizationName": "Ministry of Earth Sciences & India Meteorological Department",
      "departmentId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "departmentName": "National Weather Forecasting Centre (NWFC)",
      "email": "trainee.sharma@imd.gov.in",
      "firstName": "Ramesh",
      "lastName": "Sharma",
      "phone": "+91-9876543210",
      "avatarUrl": null,
      "role": "TRAINEE",
      "status": "APPROVED",
      "emailVerified": true,
      "permissions": ["courses:read", "assessments:take", "resources:read"],
      "lastLoginAt": "2026-09-06T14:35:00.000Z",
      "createdAt": "2026-09-06T14:30:00.000Z",
      "updatedAt": "2026-09-06T14:35:00.000Z",
      "traineeProfile": {
        "id": "d4e5f6a7-b8c9-0123-def1-234567890123",
        "designation": "Meteorological Officer",
        "bio": "Atmospheric observation officer.",
        "interests": ["Radar Meteorology"],
        "profileCompletion": 100
      },
      "trainerProfile": null
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: "Access token is missing or malformed" / "Invalid or expired authentication credentials".
  - `404 Not Found`: "Authenticated user profile not found".
- **Pagination**: Not applicable
- **Filters**: Not applicable

---

## 8. Security

Authentication handles security-sensitive assets and enforces multi-layered controls:

1. **Password Hashing**:
   - Implemented with bcrypt with a work factor of 10 salt rounds.
   - Salt generation is unique per password. Plaintext passwords are never persisted.
2. **Zero Secret Leakage**:
   - Passwords and password hashes are omitted from all DTOs and API responses.
   - Winston logger explicitly ignores passwords, JWTs, refresh tokens, and credentials.
3. **Cryptographic Token Storage**:
   - Refresh tokens are hashed using SHA-256 before insertion into the PostgreSQL database.
   - A compromised database backup does not reveal usable refresh tokens.
4. **Single-Use Refresh Token Rotation**:
   - Every refresh operation immediately revokes the consumed token and issues a new token pair in a single database transaction.
   - Replay attempts on revoked tokens are blocked with `401 Unauthorized`.
5. **HttpOnly Cookies**:
   - Refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies scoped to `/api/v1/auth` to prevent cross-site scripting (XSS) token extraction.
6. **Rate Limiting**:
   - Public auth endpoints (`/register`, `/signup`, `/login`, `/refresh`, `/verify-email`, `/resend-verification`) are rate-limited to 30 requests per 15 minutes per client IP via an express sliding-window limiter.
7. **Privilege Escalation Prevention**:
   - Self-registration is strictly hardcoded to `Role.TRAINEE`. Any client-supplied role is discarded.

## 9. Validation

All requests are validated at the route boundary using Zod schemas before reaching controllers:
- `registerSchema`: Email format, password complexity (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char), non-empty firstName, optional UUIDs for organization/department.
- `loginSchema`: Non-empty email, valid format, non-empty password.
- `verifyEmailSchema`: Minimum 10 characters string for signed JWT token.
- `resendVerificationSchema`: Valid email format.
- Validation failures are intercepted by `validate.middleware.ts` returning standard `400 Bad Request` format.

## 10. Error Handling

Centralized error handling via `globalErrorHandler` and custom `AppError` classes:
- Operational exceptions return standardized JSON payloads:
  ```json
  {
    "success": false,
    "message": "<Safe, sanitized message>",
    "errors": "<Validation issues if applicable>"
  }
  ```
- In production, internal unhandled server errors mask stack traces and return generic `Internal Server Error`.

## 11. Testing

The authentication module is covered by automated verification test suites:
- **Lifecycle Integrity Suite (`prisma/verify_auth.ts`)**:
  - Test 1: User Registration in `PENDING` state with no token issuance.
  - Test 2: Duplicate registration rejection (`409 Conflict`).
  - Test 3: Login blocked for `PENDING` accounts (`401 Unauthorized`).
  - Test 4: Email verification flow (tampered token rejection, valid verification, resend verification).
  - Test 5: Invalid password login rejection (`401 Unauthorized`).
  - Test 6: Unknown email login rejection (`401 Unauthorized`).
  - Test 7: Admin approval simulation (`status: APPROVED`).
  - Test 8: Login succeeds for approved accounts, issuing Access & Refresh tokens.
  - Test 9: Access token signature, expiration, and payload integrity.
  - Test 10: Refresh token rotation.
  - Test 11: Revoked refresh token replay prevention.
  - Test 12: Authenticated profile retrieval (`GET /auth/me`) with safe DTO verification.
  - Test 13: Logout and token invalidation in database.
  - Test 14: Security audit log verification.
- **Regression Suite (`prisma/verify_phase1_integration.ts`)**:
  - 24/24 integration tests passing with 100% success rate.

## 12. Scalability

- **Database Connection Pooling**: Utilizes Prisma with Neon PostgreSQL connection pooling.
- **Repository Pattern Abstraction**: `AuthRepository` isolates queries, allowing caching layers (e.g. Redis) to be introduced seamlessly.
- **Stateless Access Tokens**: Verification of JWT access tokens requires zero database queries.
- **Single-Table Session Management**: The `refresh_tokens` table is indexed on `userId` and `tokenHash`, supporting high concurrent session traffic.

## 13. Files Created/Modified

### Backend
- `backend/src/repositories/auth.repository.ts` (NEW: Data access layer for authentication)
- `backend/src/services/auth.service.ts` (MODIFIED: Implements PENDING approval flow, email verification, decoupled repository)
- `backend/src/controllers/auth.controller.ts` (MODIFIED: Endpoints for signup, verify-email, resend-verification)
- `backend/src/routes/auth.routes.ts` (MODIFIED: Added /signup alias, /verify-email, /resend-verification)
- `backend/src/routes/index.ts` (MODIFIED: Updated API catalog)
- `backend/src/auth/token.utils.ts` (MODIFIED: Added email verification token utilities)
- `backend/src/auth/auth.middleware.ts` (MODIFIED: Fixed import reference lint error)
- `backend/src/validators/auth.validation.ts` (MODIFIED: Added email verification schemas)
- `backend/src/dto/auth.dto.ts` (MODIFIED: Added verification and registration response DTOs)
- `backend/.prettierrc` (MODIFIED: Added endOfLine: auto for Windows compatibility)
- `backend/prisma/verify_auth.ts` (MODIFIED: Updated to test complete approval lifecycle)
- `backend/prisma/verify_phase1_integration.ts` (MODIFIED: Aligned with PENDING lifecycle)

### Frontend
- `frontend/src/features/auth/types/auth.types.ts` (MODIFIED: Defined RegisterResponse and AuthResponse)
- `frontend/src/features/auth/api/authApi.ts` (MODIFIED: Updated register return type)
- `frontend/src/features/auth/hooks/useRegister.ts` (MODIFIED: Handles PENDING account redirect)

### Documentation
- `docs/authentication/README.md` (NEW: Exhaustive authentication documentation)
- `docs/api.md` (MODIFIED: Updated authentication endpoint catalog and schemas)

## 14. Git Information

- **Branch**: `feature/authentication`
- **Base Branch**: `main`
- **Component**: Backend Authentication + Session Management (M2 Development 1)

## 15. Future Improvements

1. **Multi-Factor Authentication (MFA / 2FA)**:
   - TOTP-based authentication for privileged roles (`ADMIN`, `SUPER_ADMIN`).
2. **SSO / Parichay Integration**:
   - Integration with Government of India single sign-on (Parichay / MeriPehchaan) for MoES/IMD employees.
3. **Redis Session Blacklisting**:
   - Optional distributed token blacklisting for instant revocation of access tokens prior to natural 15m expiration.
