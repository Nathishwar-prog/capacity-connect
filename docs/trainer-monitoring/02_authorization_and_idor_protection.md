# 02. Authorization, RBAC & IDOR Protection

## Security Matrix
The Trainer Monitoring API module strictly enforces security at three distinct barriers:

| Role | Access to Overview | Access to Trainees List | Access to Specific Course Monitoring | Access to Assessment Scores | Data Scope |
|---|---|---|---|---|---|
| **SUPER_ADMIN** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted | Global System Wide |
| **ADMIN** | ✅ Granted | ✅ Granted | ✅ Granted | ✅ Granted | Global / Organization Wide |
| **TRAINER** | ✅ Granted | ✅ Granted | ✅ Granted (IDOR Enforced) | ✅ Granted (IDOR Enforced) | Owned / Assigned Courses Only |
| **TRAINEE** | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | None |

---

## IDOR Ownership Protection
Insecure Direct Object Reference (IDOR) attacks are prevented at the Service Layer.

Before executing queries for a specific `courseId`, the service layer calls:
```typescript
const isAuthorized = await this.repository.isCourseAuthorized(courseId, userId, isAdmin);
if (!isAuthorized) {
  throw new ForbiddenError(`Access denied. You are not authorized to monitor course ${courseId}.`);
}
```

This guarantees that even if a trainer attempts to access another trainer's course ID via URL tampering (e.g. `/api/v1/trainer/monitoring/courses/other-trainer-course-id`), the API immediately responds with `403 Forbidden`.

---

## Canonical Seed Testing Accounts
- **Trainer**: `alex.trainer@enterprise.com` / `Password123!`
- **Admin**: `admin@enterprise.com` / `Password123!`
- **Trainee**: `user@enterprise.com` / `Password123!`
