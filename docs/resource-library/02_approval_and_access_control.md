# 02 — Approval & Access Control (RBAC & IDOR)

## Authorization Matrix

| Operation | TRAINEE | TRAINER | ADMIN / SUPER_ADMIN |
|---|---|---|---|
| List Resources | View `PUBLISHED` only | View Own + `PUBLISHED` | View All (Org isolated) |
| Get Resource by ID | View `PUBLISHED` only | View Own + `PUBLISHED` | View Any in Org |
| Create Link / File | ❌ Forbidden | ✅ (Status: `PENDING_APPROVAL`) | ✅ (Status: `PUBLISHED`) |
| Update Metadata | ❌ Forbidden | ✅ Own Resources Only | ✅ Any Resource in Org |
| Delete Resource | ❌ Forbidden | ✅ Own Resources Only | ✅ Any Resource in Org |
| Approve / Reject | ❌ Forbidden | ❌ Forbidden | ✅ Exclusive Admin Action |
| Publish Resource | ❌ Forbidden | ✅ Own Resources | ✅ Any Resource in Org |

---

## Canonical Database Test Accounts (Section 39)

Testing strictly requires the canonical seeded database users:

- **ADMIN**: `admin@enterprise.com`
- **TRAINER**: `alex.trainer@enterprise.com`
- **TRAINEE**: `user@enterprise.com`

---

## IDOR Ownership Enforcement
`ResourceService` verifies resource ownership before mutation operations (`updateMetadata`, `deleteResource`, `publishResource`). Attempts to mutate resources owned by another user return HTTP 403 `ForbiddenError`.
