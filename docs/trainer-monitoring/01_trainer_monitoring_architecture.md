# 01. Trainer Monitoring Architecture & Endpoint Specification

## Layered Architecture
The module follows enterprise layered separation of concerns:

```
[ HTTP Request ] 
       │
       ▼
[ auth.middleware.ts ]  ---> Authenticate JWT & Enforce RBAC (TRAINER / ADMIN)
       │
       ▼
[ trainer-monitoring.routes.ts ]  ---> Endpoint definition & schema validation
       │
       ▼
[ trainer-monitoring.controller.ts ] ---> Request parsing & HTTP response formatting
       │
       ▼
[ trainer-monitoring.service.ts ]    ---> Business logic & IDOR ownership verification
       │
       ▼
[ trainer-monitoring.repository.ts ] ---> Prisma database queries & metric aggregation
       │
       ▼
[ PostgreSQL / Prisma Client ]
```

---

## API Endpoints

### 1. `GET /api/v1/trainer/monitoring/overview`
- **Description**: Retrieves high-level monitoring metrics and authorized course list summaries.
- **Access**: `TRAINER`, `ADMIN`, `SUPER_ADMIN`.
- **Response**:
```json
{
  "success": true,
  "message": "Trainer monitoring overview retrieved successfully",
  "data": {
    "metrics": {
      "totalAuthorizedCourses": 3,
      "totalEnrolledTrainees": 25,
      "totalAssessments": 8,
      "averageProgressPercentage": 68.4,
      "completionRate": 44.0,
      "totalAttempts": 30,
      "totalPassedAttempts": 26,
      "passRate": 86.67
    },
    "courses": [ ... ]
  }
}
```

### 2. `GET /api/v1/trainer/monitoring/trainees`
- **Description**: Returns paginated list of trainees enrolled in authorized courses.
- **Query Parameters**: `courseId`, `status`, `completionStatus`, `search`, `page`, `limit`, `sortBy`, `sortOrder`.

### 3. `GET /api/v1/trainer/monitoring/courses/:courseId`
- **Description**: Detailed metrics and trainee progress list for a specific course. Enforces IDOR course ownership check.

### 4. `GET /api/v1/trainer/monitoring/courses/:courseId/trainees/:traineeId`
- **Description**: Comprehensive monitoring record for an individual trainee in a course. Returns lesson progress breakdown and assessment participation scores.

### 5. `GET /api/v1/trainer/monitoring/assessments`
- **Description**: Queries assessment attempt records across authorized courses. Returns scores, percentages, and pass/fail indicators (`PASS` / `FAIL`).
