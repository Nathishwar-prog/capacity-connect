# Assessment JSON Import Format Documentation (v1.0)
**Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)**
**Capacity Connect Enterprise LMS**

This document specifies the canonical JSON format for importing assessments into the Capacity Connect platform. Assessments imported via JSON are parsed, schema-validated, verified for pedagogical completeness, mapped to the course hierarchy, checked for duplicate questions, and persisted as **DRAFT** assessments in the existing Assessment Builder.

---

## 1. Top-Level Structure

Every imported file must be a single JSON object (arrays at root are rejected) specifying `schemaVersion: "1.0"`:

```json
{
  "schemaVersion": "1.0",
  "assessment": {
    "title": "Advanced Atmospheric Dynamics Assessment",
    "description": "Assessment covering atmospheric dynamics, vorticity, and NWP.",
    "instructions": "Answer all questions. Each question carries designated points.",
    "durationMinutes": 45,
    "passingPercentage": 70,
    "attemptsAllowed": 2,
    "shuffleQuestions": false,
    "shuffleOptions": false,
    "subject": "Atmospheric Dynamics",
    "course": {
      "courseId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "courseTitle": "Forecasters Training Course"
    },
    "module": {
      "moduleId": "7b85f64-5717-4562-b3fc-2c963f66afa7",
      "moduleTitle": "Advanced Atmospheric Dynamics & NWP"
    },
    "lesson": {
      "lessonId": "9c85f64-5717-4562-b3fc-2c963f66afa8",
      "lessonTitle": "Circulation Theorems and Pressure Systems"
    },
    "questions": [ ... ]
  }
}
```

### 1.1 Assessment Metadata Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `schemaVersion` | String | **Yes** | `"1.0"` | Must strictly equal `"1.0"`. |
| `assessment.title` | String | **Yes** | — | Title of the assessment (3 to 200 characters). |
| `assessment.description` | String | No | `null` | Comprehensive overview of the assessment scope. |
| `assessment.instructions` | String | No | `null` | Exam guidelines presented to trainees prior to starting. |
| `assessment.durationMinutes`| Integer | No | `null` | Timed evaluation duration (1 to 600 minutes). |
| `assessment.passingPercentage` | Number | **Yes** | `70` | Passing score threshold ($0$ to $100\%$). |
| `assessment.attemptsAllowed` | Integer | No | `1` | Max number of exam attempts permitted ($\ge 1$). |
| `assessment.shuffleQuestions` | Boolean | No | `false` | Whether question order should be randomized for trainees. |
| `assessment.shuffleOptions` | Boolean | No | `false` | Whether choice options should be randomized. |
| `assessment.subject` | String | No | `null` | Subject area (e.g., "Synoptic Meteorology", "Radar"). |
| `assessment.course` | Object | No | `null` | Course hierarchy mapping object (see Section 4). |
| `assessment.module` | Object | No | `null` | Module hierarchy mapping object (see Section 4). |
| `assessment.lesson` | Object | No | `null` | Lesson hierarchy mapping object (see Section 4). |
| `assessment.questions` | Array | **Yes** | — | Non-empty array of question objects (min 1). |

---

## 2. Supported Question Types

The assessment engine currently supports three canonical question types:
1. `SINGLE_CHOICE`
2. `MULTIPLE_CHOICE`
3. `TRUE_FALSE`

### 2.1 Single Choice (`SINGLE_CHOICE`)

Used for questions with several options and **exactly one** correct answer.

```json
{
  "externalId": "ATM-DYN-001",
  "questionType": "SINGLE_CHOICE",
  "question": "Which force primarily balances the horizontal pressure gradient force in unaccelerated geostrophic flow?",
  "options": [
    { "id": "A", "text": "Coriolis force" },
    { "id": "B", "text": "Centrifugal force" },
    { "id": "C", "text": "Frictional force" },
    { "id": "D", "text": "Buoyancy force" }
  ],
  "correctAnswer": {
    "type": "OPTION",
    "value": "A"
  },
  "explanation": "In geostrophic balance, the horizontal pressure gradient force is exactly balanced by the Coriolis force.",
  "points": 1,
  "difficulty": "MEDIUM",
  "tags": ["atmospheric-dynamics", "geostrophic-balance"],
  "competencies": ["Atmospheric Dynamics"]
}
```

**Validation Rules:**
- `options`: At least 2 options required.
- Option IDs must be unique within the question.
- Option text cannot be empty or whitespace only.
- `correctAnswer.type`: Must equal `"OPTION"`.
- `correctAnswer.value`: Must be a string exactly referencing one of the option `id`s.

---

### 2.2 Multiple Choice / Multi-Select (`MULTIPLE_CHOICE`)

Used for questions where **one or more** choices are correct.

```json
{
  "externalId": "ATM-DYN-002",
  "questionType": "MULTIPLE_CHOICE",
  "question": "Which of the following physical mechanisms contribute directly to baroclinic cyclogenesis in mid-latitudes?",
  "options": [
    { "id": "A", "text": "Strong horizontal temperature advection" },
    { "id": "B", "text": "Upper-tropospheric positive vorticity advection" },
    { "id": "C", "text": "Uniform barotropic temperature distribution" },
    { "id": "D", "text": "Vertical wind shear via thermal wind balance" }
  ],
  "correctAnswer": {
    "type": "OPTIONS",
    "value": ["A", "B", "D"]
  },
  "explanation": "Baroclinic cyclogenesis requires baroclinicity (horizontal temperature gradients giving vertical wind shear), upper-level divergence, and thermal advection.",
  "points": 2,
  "difficulty": "HARD",
  "tags": ["synoptic-meteorology", "cyclogenesis"],
  "competencies": ["Synoptic Meteorology"]
}
```

**Validation Rules:**
- `options`: At least 2 options required.
- `correctAnswer.type`: Must equal `"OPTIONS"`.
- `correctAnswer.value`: Array of strings containing at least 1 option ID.
- No duplicate option IDs allowed in `value` (e.g. `["A", "A"]` is rejected).
- Every referenced option ID must exist in `options`.

---

### 2.3 True / False (`TRUE_FALSE`)

Used for binary factual statements.

```json
{
  "externalId": "ATM-DYN-003",
  "questionType": "TRUE_FALSE",
  "question": "The Coriolis parameter f is equal to zero at the equator and reaches its maximum value at the geographical poles.",
  "correctAnswer": {
    "type": "BOOLEAN",
    "value": true
  },
  "explanation": "The Coriolis parameter is computed as f = 2*omega*sin(phi). At latitude 0 (equator), sin(0) = 0 so f = 0. At the poles, sin(90) = 1, giving its maximum.",
  "points": 1,
  "difficulty": "EASY",
  "tags": ["coriolis-parameter"],
  "competencies": ["Atmospheric Dynamics"]
}
```

**Validation Rules:**
- `correctAnswer.type`: Must equal `"BOOLEAN"`.
- `correctAnswer.value`: Must be strict boolean `true` or `false`. Arbitrary strings such as `"yes"`, `"no"`, `"1"`, `"correct"` are strictly rejected.
- `options` may be omitted; the system automatically normalizes options to `True` and `False`.

---

## 3. Explanations & Quality Standards

Every question **MUST** include an `explanation`. The explanation explains why the correct answer is valid.

### Rejection of Placeholder Text
The importer automatically rejects placeholder explanations:
- `""` (Empty string)
- `"N/A"`, `"n/a"`, `"NA"`
- `"TODO"`, `"TBD"`
- `"None"`, `"Null"`, `"Pending"`
- Strings shorter than 5 characters

When an explanation fails this check, the validation report points directly to `assessment.questions[i].explanation` with error code `INVALID_EXPLANATION`.

---

## 4. Course, Module, and Lesson Hierarchy Mapping

Assessments may be mapped to the existing learning hierarchy:
```
Course
 └── Module
      └── Lesson
           └── Assessment
```

### Hierarchy Rules:
1. **Course Mapping**:
   - Provide `course.courseId` (UUID) or `course.courseTitle`.
   - The backend validates that the course exists.
   - **Security / RBAC**: The authenticated trainer must own the course (`course.trainerId === user.id`), unless the user has administrative privileges (`ADMIN` or `SUPER_ADMIN`). Cross-trainer course mapping attempts are rejected.
2. **Module Mapping**:
   - Provide `module.moduleId` or `module.moduleTitle`.
   - The backend verifies that the module belongs to the linked course (`module.courseId === course.id`).
3. **Lesson Mapping**:
   - Provide `lesson.lessonId` or `lesson.lessonTitle`.
   - The backend verifies that the lesson belongs to the linked module (`lesson.moduleId === module.id`).
4. **Title-Based Disambiguation**:
   - If IDs are omitted and matching titles are ambiguous (e.g. two courses have the same name), the importer emits an `AMBIGUOUS_MAPPING` error and requires explicit UUID specification.

---

## 5. Duplicate Question Detection

The importer runs automated duplication analysis:
1. **Exact Duplicate**:
   - Matches questions with identical `externalId` or identical normalized question prompt (`q.toLowerCase().replace(/[^a-z0-9]/g, '')`).
   - Flagged with code `EXACT_DUPLICATE`.
2. **Potential Duplicate**:
   - Computes token-based Jaccard similarity across question prompts.
   - If similarity $\ge 0.75$, flagged with severity `WARNING` and code `POTENTIAL_DUPLICATE`:
     `Question 12 may duplicate Question 4: "..."`
   - Warnings do **not** block import; the trainer can review and proceed.

---

## 6. Validation Error Codes & Resolution

| Error Code | Severity | Description & Resolution |
|---|---|---|
| `UNSUPPORTED_VERSION` | ERROR | Schema version is not `"1.0"`. Update `schemaVersion` to `"1.0"`. |
| `INVALID_JSON_SYNTAX` | ERROR | File is not valid JSON. Validate with a JSON linter before uploading. |
| `MISSING_QUESTION_TEXT` | ERROR | Question prompt is empty or too short. Provide prompt $\ge 3$ characters. |
| `INSUFFICIENT_OPTIONS` | ERROR | Less than 2 options provided for multiple choice question. |
| `DUPLICATE_OPTION_ID` | ERROR | Two options share the same identifier (e.g. two option "A"s). Ensure option IDs are unique. |
| `INVALID_OPTION_REFERENCE`| ERROR | `correctAnswer.value` references an option ID that does not exist. |
| `DUPLICATE_CORRECT_ANSWER`| ERROR | `correctAnswer.value` array contains duplicate option IDs (e.g. `["A", "A"]`). |
| `MISSING_EXPLANATION` | ERROR | The `explanation` field is missing or empty. Every question must have an explanation. |
| `INVALID_EXPLANATION` | ERROR | Explanation contains placeholder text (e.g., "TODO", "N/A"). Provide substantive explanation. |
| `FORBIDDEN_COURSE_ACCESS` | ERROR | The trainer does not own the specified course. IDOR protection prevented assignment. |
| `INVALID_MODULE_MAPPING` | ERROR | The module does not belong to the selected course. |
| `INVALID_LESSON_MAPPING` | ERROR | The lesson does not belong to the selected module. |
| `AMBIGUOUS_MAPPING` | ERROR | Multiple courses or modules match the title. Use explicit UUID instead. |
| `POTENTIAL_DUPLICATE` | WARNING | Question prompt is highly similar to another question. Review before publishing. |

---

## 7. Import Lifecycle & Transaction Safety

1. **Upload & File Validation**:
   Client validates file extension (`.json`), MIME type, and file size ($\le 5\text{MB}$).
2. **Backend Validation (`POST /api/v1/trainer/assessments/import/validate`)**:
   Backend validates schema, answer references, explanations, hierarchy, and duplicates. Returns structured report.
3. **Trainer Preview**:
   UI renders validation badges, summary counts, question type breakdown, and full preview cards.
4. **Trainer Confirmation (`POST /api/v1/trainer/assessments/import/confirm`)**:
   Server re-validates payload and executes an atomic PostgreSQL transaction:
   - Creates `Assessment` (status: `DRAFT`).
   - Creates `AssessmentQuestion`s and `QuestionOption`s preserving exact JSON order.
   - Creates `AuditLog` entry tracking `importId`, `fileName`, and `questionCount`.
   - On ANY failure: entire transaction rolls back cleanly.
5. **Assessment Builder**:
   Trainer is redirected to the assessment in the Assessment Builder for editing, preview, and explicit publication.
