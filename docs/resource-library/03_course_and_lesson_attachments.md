# 03 — Course & Lesson Attachments

## Attachment Models

Learning resources can be attached to **Courses** (`CourseResource`) and **Lessons** (`LessonResource`).

### Course Attachment Mapping
- Endpoint: `POST /api/v1/resources/courses/:courseId/attach/:resourceId`
- Detach Endpoint: `DELETE /api/v1/resources/courses/:courseId/detach/:resourceId`
- Rules:
  1. Course & Resource must belong to the user's organization.
  2. Trainer must be assigned as the trainer of the course (or Admin).
  3. Resource must be `PUBLISHED` prior to attaching (for Non-Admins).

### Lesson Attachment Mapping
- Endpoint: `POST /api/v1/resources/lessons/:lessonId/attach/:resourceId`
- Detach Endpoint: `DELETE /api/v1/resources/lessons/:lessonId/detach/:resourceId`
- Rules:
  1. Resource must exist and be `PUBLISHED`.
  2. Creates entry in `lesson_resources` join table.
