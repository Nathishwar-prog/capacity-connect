# Resource Library Module Documentation

Welcome to the **Resource Library** module documentation for Capacity Connect (M3 — Development 4).

## Documentation Index

1. [01 — Resource Lifecycle & File Upload Specifications](./01_resource_lifecycle_and_upload.md)
2. [02 — Approval & Access Control (RBAC & IDOR)](./02_approval_and_access_control.md)
3. [03 — Course & Lesson Attachments](./03_course_and_lesson_attachments.md)

---

## Technical Summary
- **Backend Only Scope**: Express REST API endpoints registered under `/api/v1/resources`.
- **Supported File Types**: Video, PDF, Presentation, Document, Link, Image.
- **Upload Security**: Multer middleware with MIME type check and extension verification.
- **Testing**: 100% test pass rate with Jest automated tests (`resource.service.test.ts`) using canonical seed users (`admin@enterprise.com`, `alex.trainer@enterprise.com`, `user@enterprise.com`).
