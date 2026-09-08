# Course Management & Course Structure Documentation

## Module Overview
The **Course Management & Course Structure** module for CAPACITY CONNECT governs the full course lifecycle (Draft -> Submit -> Approve/Reject -> Publish -> Archive) and hierarchical curriculum construction (`Course -> Module -> Lesson -> Resource`) for domain-specific capacity building in MoES and IMD.

## Documentation Index

1. [**01. Course Lifecycle & Management**](01_course_lifecycle_and_management.md)
   - Course definition, metadata, prerequisites, and state transition workflows.
   - Course REST API endpoints (`GET /courses`, `POST /courses`, `PATCH /courses/:id`, `DELETE /courses/:id`, `/submit`, `/approve`, `/reject`, `/publish`).

2. [**02. Course Structure & Hierarchy**](02_course_structure_and_hierarchy.md)
   - Multi-tier structure design (`Course -> Module -> Lesson -> Resource`).
   - Lesson content types: `VIDEO`, `PDF`, `PPT`, `ARTICLE`, `QUIZ`, `LINK`, `DOCUMENT`.
   - Deterministic ordering & transactional reordering logic.
   - Resource attachments & full hierarchy aggregation endpoint (`GET /courses/:courseId/structure`).

3. [**03. Authorization & Testing**](03_authorization_and_testing.md)
   - User roles & RBAC permission matrix (SUPER_ADMIN, ADMIN, TRAINER, TRAINEE).
   - JWT authentication & database-backed identity verification.
   - Automated Jest unit & integration test coverage (52 test cases).
   - Postman manual testing procedures and OpenAPI 3.0 specification.
