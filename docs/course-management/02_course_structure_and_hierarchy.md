# 02. Course Structure & Hierarchy

## 1. Overview & Hierarchy Architecture
The Course Structure module establishes a deterministic, multi-tier hierarchy:

```text
Course (Course)
 └── Modules (CourseModule, ordered by orderIndex)
      └── Lessons (Lesson, ordered by orderIndex)
           └── Attached Resources (LessonResource -> Resource)
```

## 2. Lesson Content Types
Each lesson represents a discrete learning item supporting multiple content types:
- **`VIDEO`**: Video streams or video CDN URLs.
- **`PDF`**: PDF documents and downloadable manuals.
- **`PPT`**: PowerPoint presentation slides (`.ppt`, `.pptx`).
- **`ARTICLE`**: Rich text or Markdown article content.
- **`QUIZ`**: In-line check-for-understanding quizzes.
- **`LINK`**: External reference URLs.
- **`DOCUMENT`**: General document files (Word, text files).

## 3. Database Models

### 3.1 `CourseModule`
- `id` (UUID): Primary key.
- `courseId` (UUID): Parent course reference.
- `title` (String), `description` (String).
- `orderIndex` (Int): Deterministic display position.

### 3.2 `Lesson`
- `id` (UUID): Primary key.
- `moduleId` (UUID): Parent module reference.
- `title` (String), `description` (String).
- `contentType` (`VIDEO`, `PDF`, `PPT`, `ARTICLE`, `QUIZ`, `LINK`, `DOCUMENT`).
- `content` (Text): Body content or HTML.
- `resourceUrl` (String): Link or CDN storage URL.
- `durationMinutes` (Int): Estimated completion time in minutes.
- `orderIndex` (Int): Deterministic display position.
- `isPreview` (Boolean): Flag allowing free preview before enrollment.

### 3.3 `LessonResource`
- Junction table with composite primary key `[lessonId, resourceId]`.

## 4. Reordering & Transaction Safety
Module and Lesson reordering execute inside atomic database transactions (`prisma.$transaction`):
- Accepts array of `{ id: string, orderIndex: number }`.
- Validates that all IDs belong to the parent course/module.
- Validates against duplicate IDs or duplicate order positions.
- Updates database deterministically without state corruption.

## 5. API Endpoints

### 5.1 Full Course Hierarchy
- **`GET /api/v1/courses/:courseId/structure`**
  - Aggregates full nested tree (Modules -> Lessons -> Resources).
  - Computes total module duration based on lesson `durationMinutes`.

### 5.2 Module Endpoints
- **`POST /api/v1/courses/:courseId/modules`**: Create Module
- **`GET /api/v1/courses/:courseId/modules`**: List Modules (ordered by `orderIndex`)
- **`GET /api/v1/courses/:courseId/modules/:moduleId`**: Get Module details
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId`**: Update Module
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId`**: Delete Module (cascades lessons)
- **`PATCH /api/v1/courses/:courseId/modules/reorder`**: Reorder Modules

### 5.3 Lesson Endpoints
- **`POST /api/v1/courses/:courseId/modules/:moduleId/lessons`**: Create Lesson (supports `PPT`, `VIDEO`, `PDF`, etc.)
- **`GET /api/v1/courses/:courseId/modules/:moduleId/lessons`**: List Lessons (ordered by `orderIndex`)
- **`GET /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Get Lesson details with attached resources
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Update Lesson
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId`**: Delete Lesson
- **`PATCH /api/v1/courses/:courseId/modules/:moduleId/lessons/reorder`**: Reorder Lessons

### 5.4 Resource Attachments
- **`POST /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId/resources`**: Attach resource (`resourceId`)
- **`DELETE /api/v1/courses/:courseId/modules/:moduleId/lessons/:lessonId/resources/:resourceId`**: Detach resource
