# REST API Endpoint Reference — Capacity Connect

This guide details authentication schemes, request/response payload formats, error codes, and access controls for all implemented Phase 1 endpoints.

---

## 1. System Health & Diagnostics

### 1.1 Health Check & Neon Database Ping
- **Route**: `GET /api/v1/health`
- **Access**: Public
- **Description**: Verifies backend server health, environment mode, uptime, and Neon PostgreSQL database connectivity.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Service is healthy",
    "data": {
      "status": "UP",
      "timestamp": "2026-09-02T22:00:00.000Z",
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

## 2. Authentication Scheme

All protected endpoints require a short-lived (15 min) JWT Access Token sent in the standard HTTP `Authorization` Bearer header:

```http
Authorization: Bearer <access_token>
```

Long-lived (7 day) Refresh Tokens are stored and exchanged securely via an **HttpOnly, Secure, SameSite=Strict** cookie:
- **Cookie Name**: `refreshToken`
- **Scoped Path**: `/api/v1/auth`

---

## 3. Authentication Endpoints (`/api/v1/auth/*`)

### 3.1 User Registration
- **Route**: `POST /api/v1/auth/register`
- **Access**: Public
- **Description**: Registers a new user account, initializes the appropriate role-specific profile (`TraineeProfile` or `TrainerProfile`), sets default organization affiliation, and logs a security audit event.
- **Request Body**:
  ```json
  {
    "email": "jane.doe@enterprise.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+1-555-0199",
    "role": "TRAINEE"
  }
  ```
  *Allowed roles: `TRAINEE`, `TRAINER`, `ADMIN` (Defaults to `TRAINEE`)*.
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
          "organizationId": "org-uuid",
          "organizationName": "Capacity Connect Demo Organization",
          "departmentId": null,
          "email": "jane.doe@enterprise.com",
          "firstName": "Jane",
          "lastName": "Doe",
          "role": "TRAINEE",
          "status": "APPROVED",
          "permissions": ["courses:read", "assessments:take"],
          "createdAt": "2026-09-02T22:00:00.000Z"
        }
      }
    }
    ```

### 3.2 User Login
- **Route**: `POST /api/v1/auth/login`
- **Access**: Public
- **Description**: Authenticates email and password with bcrypt, generates an access token + rotated refresh token, records `lastLoginAt`, and logs an audit trail event.
- **Request Body**:
  ```json
  {
    "email": "jane.doe@enterprise.com",
    "password": "SecurePassword123!"
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
        "user": { ... }
      }
    }
    ```

### 3.3 Token Refresh & Rotation
- **Route**: `POST /api/v1/auth/refresh`
- **Access**: Public (Requires `refreshToken` HttpOnly cookie or request body)
- **Description**: Verifies the refresh token hash against PostgreSQL, immediately revokes the old token, issues a newly hashed replacement token (single-use rotation), and issues a fresh 15-minute access token.
- **Response (200 OK)**:
  - Sets rotated `refreshToken` HttpOnly cookie.
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

### 3.4 Logout
- **Route**: `POST /api/v1/auth/logout`
- **Access**: Public / Authenticated
- **Description**: Revokes active refresh token in database and clears the `refreshToken` cookie.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logout successful"
  }
  ```

### 3.5 Current User Session Identity
- **Route**: `GET /api/v1/auth/me`
- **Access**: Authenticated (Bearer Token)
- **Description**: Fetches current user profile, organization name, role, permissions, and associated trainee/trainer profile summary.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Current user profile retrieved successfully",
    "data": {
      "id": "uuid-v4",
      "organizationId": "org-uuid",
      "organizationName": "Capacity Connect Demo Organization",
      "departmentId": null,
      "email": "jane.doe@enterprise.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "TRAINEE",
      "status": "APPROVED",
      "permissions": ["courses:read", "assessments:take"],
      "traineeProfile": {
        "id": "profile-uuid",
        "designation": null,
        "bio": null,
        "interests": [],
        "profileCompletion": 10
      }
    }
  }
  ```

---

## 4. User Directory & Management Endpoints (`/api/v1/users/*`)

All user endpoints require authentication (`Bearer <token>`).

### 4.1 List Users Directory
- **Route**: `GET /api/v1/users`
- **Access**: `ADMIN` or `SUPER_ADMIN`
- **Query Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 20)
  - `search` (optional)
  - `role` (optional: `SUPER_ADMIN`, `ADMIN`, `TRAINER`, `TRAINEE`)

### 4.2 Create New User
- **Route**: `POST /api/v1/users`
- **Access**: `ADMIN` or `SUPER_ADMIN`
- **Request Body**: `CreateUserDto`

### 4.3 Get User By ID
- **Route**: `GET /api/v1/users/:id`
- **Access**: Self (`req.user.userId === req.params.id`) OR `ADMIN` / `SUPER_ADMIN`

### 4.4 Update User By ID
- **Route**: `PATCH /api/v1/users/:id`
- **Access**: Self (`req.user.userId === req.params.id`) OR `ADMIN` / `SUPER_ADMIN`
- **Request Body**: `UpdateUserDto`

### 4.5 Delete User
- **Route**: `DELETE /api/v1/users/:id`
- **Access**: `SUPER_ADMIN`

---

## 5. Standard Error Format

All error responses strictly adhere to the uniform envelope:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": []
}
```

| HTTP Status | Error Type | Trigger Scenario |
| :--- | :--- | :--- |
| **400 Bad Request** | Validation Error | Payload failed Zod schema check |
| **401 Unauthorized** | Authentication Error | Missing, expired, or invalid token |
| **403 Forbidden** | Authorization Error | Role or permission insufficient |
| **404 Not Found** | Resource Missing | Target entity does not exist |
| **409 Conflict** | Duplicate Resource | Email already registered |
| **500 Internal Server** | System Error | Unexpected operational or database error |
