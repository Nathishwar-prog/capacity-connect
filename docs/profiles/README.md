# Profiles Backend — Capacity Connect

**Digital Capacity Building and Learning Management Portal**  
*Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)*  
*Component: M2 Development 4 — Profiles Backend*

---

## 1. Overview

The Profiles Backend module provides the core data persistence, validation, business rules, and API gateway endpoints for managing professional portfolios across the MoES/IMD organizational ecosystem. Building upon **Development 1 (Authentication)**, **Development 2 (RBAC)**, and **Development 3 (User Management)**, this module enables Trainees and Trainers to govern their professional identities, academic qualifications, institutional work experience, competency skills, research interests, and verified certifications.

All profile interactions strictly preserve cryptographic Bearer JWT authentication, user identity derivation from validated session claims, zero client-driven privilege escalation, and institutional audit logging.

---

## 2. Scope

This development implements the backend API and data layer for:
- **Trainee Professional Profiles** (consumed by M4 — Trainee Professional Profile UI)
- **Trainer Professional Profiles** (consumed by M5 — Trainer Profile UI)

### Out-of-Scope Explicit Boundaries
- Frontend profile UI components (owned by M4 & M5)
- Competency mapping engines, skill gap calculators, and AI matching algorithms (owned by later project modules)
- Complete automated certificate verification authority infrastructure (owned by M2 Development 5 / external cryptographic services)

---

## 3. Trainee Profile

The Trainee profile encapsulates the learner's institutional and scientific background:

- **Personal Information**: Stored on the `User` identity model (`firstName`, `lastName`, `phone`, `avatarUrl`, `departmentId`, `organizationId`).
- **Qualifications**: Academic credentials (`Qualification` model) detailing degree, field of study, granting institution, start date, completion date, and research description.
- **Experience**: Institutional employment and project history (`WorkExperience` model) detailing organization/company name, job title, start date, end date, current employment flag, and responsibilities.
- **Skills**: Technical and domain competencies (`UserSkill` model) linked to the normalized `Skill` catalog with proficiency levels (1–5) and years of experience.
- **Interests**: Data-driven scientific interests array (`TraineeProfile.interests`) representing areas of specialization (e.g., Radar Meteorology, Numerical Modeling, Cyclone Tracking).
- **Certificates**: Accredited certificates (`Certificate` model) detailing certificate title, issuing body, credential identifier, issue date, expiration date, document URL, and verification status (`PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED`).
- **Profile Completion**: Dynamically calculated percentage score (0–100%) stored in `TraineeProfile.profileCompletion`.

---

## 4. Trainer Profile

The Trainer profile encapsulates the instructor's credentials and teaching domain:

- **Bio**: Comprehensive pedagogical and scientific biography (`TrainerProfile.bio`).
- **Designation**: Official scientific and institutional role (`TrainerProfile.designation`).
- **Experience**: Cumulative instructional/field experience in years (`TrainerProfile.yearsExperience`) accompanied by granular professional history (`WorkExperience` records).
- **Expertise**: Specific domain and competency expertise (`TrainerExpertise` model) referencing normalized `Skill` records with proficiency levels and instructional years.
- **Qualifications**: Academic degrees and pedagogical certifications (`Qualification` records).
- **Skills**: Technical and domain competencies (`UserSkill` records) mapped to the trainer identity.

---

## 5. Database Architecture

The module utilizes normalized PostgreSQL models via Prisma ORM:

```
User (Identity & Personal Information)
  ├── TraineeProfile (1-to-1) [designation, bio, interests[], profileCompletion]
  ├── TrainerProfile (1-to-1) [designation, organizationName, bio, yearsExperience]
  │     └── TrainerExpertise (1-to-many) ──► Skill (Normalized Catalog)
  ├── Qualifications (1-to-many) [degree, fieldOfStudy, institution, dates]
  ├── WorkExperiences (1-to-many) [companyName, jobTitle, isCurrent, dates]
  ├── UserSkills (1-to-many) ──► Skill (Normalized Catalog)
  ├── Certificates (1-to-many) [title, issuingOrg, credentialId, status]
  ├── Department (many-to-1)
  └── Organization (many-to-1)
```

No database schema migration was required because the enterprise schema already contains all required tables, relations, indexes, and constraints.

---

## 6. API Architecture

### Trainee Endpoints (`/api/v1/trainee/*`)
- `GET /api/v1/trainee/profile`: Retrieve own comprehensive trainee profile
- `PATCH /api/v1/trainee/profile`: Update own personal info, designation, bio, and interests
- `GET /api/v1/trainee/skills`: List trainee's mapped skills
- `POST /api/v1/trainee/skills`: Add a skill to trainee profile
- `DELETE /api/v1/trainee/skills/:skillId`: Remove skill from trainee profile
- `GET /api/v1/trainee/skills/available`: Browse available platform skill catalog
- `GET /api/v1/trainee/qualifications`: List trainee qualifications
- `POST /api/v1/trainee/qualifications`: Add qualification
- `PUT /api/v1/trainee/qualifications/:id`: Update qualification
- `DELETE /api/v1/trainee/qualifications/:id`: Delete qualification
- `GET /api/v1/trainee/experience`: List trainee work experience entries
- `POST /api/v1/trainee/experience`: Add work experience
- `PUT /api/v1/trainee/experience/:id`: Update work experience
- `DELETE /api/v1/trainee/experience/:id`: Delete work experience
- `GET /api/v1/trainee/certificates`: List trainee certificates
- `POST /api/v1/trainee/certificates`: Register certificate
- `DELETE /api/v1/trainee/certificates/:id`: Delete certificate

### Trainer Endpoints (`/api/v1/trainer/*`)
- `GET /api/v1/trainer/profile`: Retrieve own trainer profile with expertise, history, and metrics
- `PATCH /api/v1/trainer/profile`: Update trainer bio, designation, organization, and years of experience
- `POST /api/v1/trainer/expertise`: Add trainer expertise skill
- `DELETE /api/v1/trainer/expertise/:skillId`: Remove trainer expertise skill
- `GET /api/v1/trainer/qualifications`: List trainer qualifications
- `POST /api/v1/trainer/qualifications`: Add qualification
- `PUT /api/v1/trainer/qualifications/:id`: Update qualification
- `DELETE /api/v1/trainer/qualifications/:id`: Delete qualification
- `GET /api/v1/trainer/experience`: List trainer work experience entries
- `POST /api/v1/trainer/experience`: Add work experience
- `PUT /api/v1/trainer/experience/:id`: Update work experience
- `DELETE /api/v1/trainer/experience/:id`: Delete work experience
- `GET /api/v1/trainer/skills`: List trainer skills
- `POST /api/v1/trainer/skills`: Add skill
- `DELETE /api/v1/trainer/skills/:skillId`: Remove skill
- `GET /api/v1/trainer/certificates`: List trainer certificates
- `POST /api/v1/trainer/certificates`: Register certificate
- `DELETE /api/v1/trainer/certificates/:id`: Delete certificate

---

## 7. Authentication

All profile operations require a valid cryptographic Bearer JWT access token:
- Validated via `authenticate` middleware in `backend/src/auth/auth.middleware.ts`.
- Extracts `userId`, `email`, `role`, and `permissions` directly from the token payload.
- Injects `req.user` into the Express request lifecycle.
- Unauthenticated requests are rejected immediately with HTTP `401 Unauthorized`.

---

## 8. Authorization

Authorization enforces the project's RBAC framework:
- **Trainee Isolation**: Trainee profile routes are protected by `requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN])`.
- **Trainer Isolation**: Trainer profile routes are protected by `requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN])`.
- **Strict Ownership**: Self-service endpoints derive `userId` solely from `req.user!.userId`. Client-supplied user identifiers in bodies or queries are ignored.
- **Cross-Account Prevention**: When updating or deleting qualifications, experience, or certificates by ID, the repository verifies that `userId` matches the record's owning `userId`. Any cross-user mutation is rejected with HTTP `404 Not Found` (to avoid resource enumeration) or HTTP `403 Forbidden`.

---

## 9. Validation

Incoming request bodies, route parameters, and query parameters are validated with **Zod** using `validate({ body, params, query })` middleware before any service or repository invocation:
- `updateTraineeProfileSchema`: Validates personal details, designation, bio, and array of interests.
- `createQualificationSchema` & `updateQualificationSchema`: Validates degrees, institutions, and date formats.
- `createWorkExperienceSchema` & `updateWorkExperienceSchema`: Validates company names, titles, and dates.
- `addUserSkillSchema`: Enforces either `skillId` (UUID) or `skillName` with proficiency levels between 1 and 5.
- `createCertificateSchema`: Validates titles, issuing bodies, dates, and certificate URLs.
- Date logic: End dates cannot precede start dates.

---

## 10. DTOs

Database models are never leaked directly to HTTP clients:
- `PersonalInfoDto`: Sanitized personal details without authentication credentials.
- `TraineeProfileResponseDto`: Comprehensive trainee profile with related sub-collections and completion percentage.
- `TrainerProfileResponseDto`: Comprehensive trainer profile with expertise, qualifications, history, and teaching stats.
- `QualificationResponseDto`, `WorkExperienceResponseDto`, `UserSkillResponseDto`, `CertificateResponseDto`: Normalized response models with ISO-8601 timestamps.
- Zero exposure of `passwordHash`, refresh tokens, JWTs, or internal database metadata.

---

## 11. Repository

Implemented in `backend/src/repositories/profile.repository.ts`:
- Responsible strictly for Prisma queries, transactions, and data projection.
- Enforces database-level ownership filtering on mutations (`where: { id, userId }`).
- Executes atomic updates across `User` and `TraineeProfile` in Prisma transactions.
- Provides skill discovery and search querying.
- Records audit entries in `audit_logs`.

---

## 12. Service

Implemented in `backend/src/services/profile.service.ts`:
- Encapsulates profile business logic and validation.
- Computes dynamic profile completion scores:
  - Base account: 20%
  - Department configured: +20%
  - Designation present: +20%
  - At least 1 qualification: +15%
  - At least 1 skill: +15%
  - Bio / interests present: +10%
  - Capped at 100%
- Enforces date consistency rules (e.g., end dates after start dates).
- Dispatches audit events (`TRAINEE_PROFILE_UPDATED`, `QUALIFICATION_ADDED`, etc.).

---

## 13. Controller

Implemented in `backend/src/controllers/profile.controller.ts`:
- Thin HTTP handlers extracting `req.user.userId`, `req.body`, `req.params`, and `req.query`.
- Dispatches execution to `ProfileService`.
- Formats uniform responses using `ResponseHelper.success` (HTTP 200) and `ResponseHelper.created` (HTTP 201).

---

## 14. Swagger / OpenAPI

Exhaustive OpenAPI 3.0 documentation:
- **Location**: `backend/src/docs/openapi.json`
- **Interactive UI**: Tested and live at `/api-docs`
- **Security Scheme**: `bearerAuth` configured on all endpoints.
- **Coverage**: Every Trainee and Trainer profile endpoint is documented with path parameters, query parameters, request schemas, response schemas, and error codes (400, 401, 403, 404).

---

## 15. Security

- [x] Strict JWT authentication required on all profile endpoints
- [x] RBAC enforcement (`TRAINEE` / `TRAINER` / `ADMIN` / `SUPER_ADMIN`)
- [x] Session-derived user identity prevents arbitrary user ID spoofing
- [x] Ownership checks on all sub-collection mutations (`userId` matching)
- [x] Zod validation against malformed inputs and script injections
- [x] Safe DTOs strip `passwordHash`, tokens, and internal secrets
- [x] Institutional audit logging of all profile mutations

---

## 16. Testing

An automated HTTP integration test suite is implemented in `backend/prisma/verify_profiles_api.ts`. It spins up an ephemeral HTTP server and verifies:
1. Trainee profile retrieval (`GET /api/v1/trainee/profile`)
2. Trainee profile update (`PATCH /api/v1/trainee/profile`) with profile completion calculation
3. Trainee qualifications CRUD operations (`GET`, `POST`, `PUT`, `DELETE /api/v1/trainee/qualifications`)
4. Trainee work experience CRUD operations (`GET`, `POST`, `PUT`, `DELETE /api/v1/trainee/experience`)
5. Trainee skills management (`GET`, `POST`, `DELETE /api/v1/trainee/skills`)
6. Trainee certificates management (`GET`, `POST`, `DELETE /api/v1/trainee/certificates`)
7. Available skills catalog browsing (`GET /api/v1/trainee/skills/available`)
8. Trainer profile retrieval and update (`GET`, `PATCH /api/v1/trainer/profile`)
9. Trainer qualifications, experience, and skills sub-collections (`/api/v1/trainer/*`)
10. Cross-user modification prevention (Trainee A cannot modify Trainee B's qualifications)
11. Authentication and authorization guard rejection (HTTP 401 & 403)
12. Validation failure rejection (HTTP 400)

---

## 17. Future Integration

The profile data layer is structured to feed future analytical and matching modules:
- **Competency Engine**: Can consume normalized `UserSkill` records and proficiency levels to map to institutional competency frameworks.
- **Skill Gap Engine**: Can compare trainee profile skills against required course competencies.
- **Course Recommendation**: Can leverage `TraineeProfile.interests`, department, and skill gaps to suggest tailored MoES training modules.
- **Trainer Matching**: Can query `TrainerProfile` and `TrainerExpertise` to match instructors with incoming course prerequisites and organizational requirements.

---

## 18. Files Created / Modified

### Files Created
- `backend/src/dto/profile.dto.ts`
- `backend/src/validators/profile.validation.ts`
- `backend/src/repositories/profile.repository.ts`
- `backend/src/services/profile.service.ts`
- `backend/src/controllers/profile.controller.ts`
- `backend/scripts/update_openapi_profiles.js`
- `backend/prisma/verify_profiles_api.ts`
- `docs/profiles/README.md`

### Files Modified
- `backend/src/routes/trainee.routes.ts`
- `backend/src/routes/trainer.routes.ts`
- `backend/src/routes/index.ts`
- `backend/src/validators/validate.middleware.ts`
- `backend/src/docs/openapi.json`
- `docs/api.md`
- `README.md`

---

## 19. Git Information

- **Branch**: `Zees/profiles-backend`
- **Commits**:
  - `feat: implement trainee and trainer profiles backend with qualifications, experience, skills, and certificates`
  - `docs: update openapi specification, api reference, and profiles documentation`
  - `test: add automated profile api integration verification suite`
