Objective
Modify the existing Admin → Courses & Curriculum module in the Capacity Connect application.
The Admin should NOT create courses or build course content from this page.
The Admin's responsibility is to:
1. View courses created by Trainers.
2. Review the complete course.
3. Inspect all modules, lessons, content, assessments, resources, prerequisites, etc.
4. Approve or reject the course.
5. Publish an approved course.
6. Control whether a course is visible in the Trainee Course Catalog.
Critical business rule
A course must never appear in the Trainee Course Catalog before Admin approval and publishing.
The intended workflow is:
TRAINER
   │
   │ Create Course
   │
   ▼
COURSE DRAFT
   │
   │ Trainer completes course
   │
   ▼
SUBMITTED FOR ADMIN REVIEW
   │
   ▼
ADMIN → Courses & Curriculum
   │
   ├── View Course
   ├── View Modules
   ├── View Lessons
   ├── View Content
   ├── View Assessments
   ├── View Resources
   └── View Course Metadata
   │
   ▼
ADMIN DECISION
   │
   ├───────────────┐
   │               │
   ▼               ▼
REJECT          APPROVE
   │               │
   ▼               ▼
Trainer fixes    APPROVED
course              │
                    ▼
                 PUBLISH
                    │
                    ▼
          TRAINEE COURSE CATALOG

1. First Analyze Existing Codebase
Before making any changes, inspect the complete existing implementation.
Search for:
course
courses
curriculum
module
modules
lesson
lessons
courseBuilder
course-builder
courseCatalog
catalog
publish
published
approval
approved
review
trainer
trainee
admin

Inspect:
Backend
- Course Prisma model
- Module model
- Lesson model
- Course resource model
- Assessment model
- Course enrollment model
- Course status fields
- Trainer ownership relationships
- Admin relationships
- Course APIs
- Catalog APIs
- Trainer course builder APIs
- Existing publish functionality
Frontend
- Admin dashboard
- Admin Courses & Curriculum page
- Trainer course builder
- Trainer course management
- Trainee course catalog
- Course detail page
- Course card components
- Course status badges
- Publish buttons
- Approval UI
Important
Do not create a duplicate course system.
If the existing project already has:
draft
submitted
published

or similar states, extend the existing architecture.
If the project currently has only a simple:
published: Boolean

then introduce a proper workflow status if necessary.
2. Change Admin Permissions
The current Admin Courses & Curriculum page must be redesigned.
REMOVE Admin course creation
The Admin should NOT have:
Create Course
Create New Course
Course Builder
Add Module
Add Lesson
Create Curriculum

on the Admin Courses & Curriculum page.
Remove or disable those actions from the Admin UI.
Also enforce this at the backend authorization level.
Do NOT merely hide the button.
An Admin must not be able to call a Trainer course-creation endpoint to create course content if the intended business rule prohibits it.
3. Admin Responsibility
The Admin Courses & Curriculum page becomes a Course Review & Publishing Management Center.
The page should allow Admin to:
View
- Course title
- Course thumbnail
- Description
- Trainer
- Category
- Difficulty
- Duration
- Skill/competency mapping
- Prerequisites
- Number of modules
- Number of lessons
- Number of assessments
- Number of resources
- Submission date
- Last updated date
- Current status
Actions
Depending on status:
View
Review
Approve
Reject
Publish
Unpublish

Do not show invalid actions for a particular state.
4. Course Status Workflow
Implement a clear state machine.
Recommended states:
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
PUBLISHED
UNPUBLISHED

If the existing schema already has equivalent statuses, reuse them.
Meaning
DRAFT
Trainer is still building the course.
Visible to:
Trainer
Admin

Not visible in Trainee Catalog.
SUBMITTED
Trainer has completed the course and submitted it for review.
Visible to:
Trainer
Admin

Not visible in Trainee Catalog.
UNDER_REVIEW
Admin is reviewing the course.
Visible to:
Admin
Trainer

Not visible in Trainee Catalog.
APPROVED
Admin has approved the course.
Visible to:
Admin
Trainer

Still not necessarily visible in Trainee Catalog until published.
PUBLISHED
Admin has explicitly published the course.
Visible to:
Admin
Trainer
Trainee

This is the only status that should make the course available in the normal trainee catalog.
REJECTED
Admin rejected the course.
Visible to:
Admin
Trainer

Not visible in Trainee Catalog.
Trainer should be able to edit it and resubmit.
UNPUBLISHED
Previously published course has been removed from the public/trainee catalog.
Visible to:
Admin
Trainer

Not visible to new trainees in catalog.
5. Critical Catalog Rule
This is the most important backend requirement.
The Trainee Course Catalog must only query published courses.
Do NOT implement filtering only in React.
Bad:
courses.filter(course => course.status === "PUBLISHED")

while the API returns every course.
Instead, enforce it in the backend/database query.
For example:
GET /courses/catalog

must internally query:
WHERE status = PUBLISHED

or the equivalent existing status field.
Therefore:
DRAFT          ❌
SUBMITTED      ❌
UNDER_REVIEW   ❌
APPROVED       ❌
REJECTED       ❌
UNPUBLISHED    ❌
PUBLISHED      ✅

This prevents unpublished courses from accidentally becoming accessible through direct API requests.
6. Trainer Workflow
Ensure the Trainer workflow becomes:
Trainer Login
     ↓
Trainer Dashboard
     ↓
Course Builder
     ↓
Create Course
     ↓
Add Modules
     ↓
Add Lessons
     ↓
Add Content
     ↓
Add Assessments
     ↓
Add Resources
     ↓
Configure Course Metadata
     ↓
Save Draft
     ↓
Complete Course
     ↓
Submit for Admin Review

When Trainer clicks:
Submit for Review

the course status becomes:
SUBMITTED

The Trainer should no longer be able to make uncontrolled structural changes while the course is under review.
If editing while under review is allowed, define the behavior clearly. Prefer:
SUBMITTED
→ Admin reviews
→ Reject
→ Trainer edits
→ Resubmit

7. Admin Courses Page UI
Redesign the Admin page around course review.
Suggested structure:
Courses & Curriculum
Manage, review and publish trainer-created courses.

┌─────────────────────────────────────────────┐
│ Search courses...       Status ▼   Category ▼│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Course                                      │
│ Advanced Python Programming                 │
│                                             │
│ Trainer: John Doe                           │
│ 8 Modules • 42 Lessons • 3 Assessments      │
│                                             │
│ Status: SUBMITTED                           │
│ Submitted: 2 hours ago                      │
│                                             │
│ [View Course] [Review]                      │
└─────────────────────────────────────────────┘

Add status filters:
All
Submitted
Under Review
Approved
Published
Rejected
Unpublished

8. Dashboard Statistics
At the top of the Admin page, show useful course-review metrics.
For example:
┌───────────────┐
│ Total Courses │
│      48       │
└───────────────┘

┌────────────────┐
│ Pending Review │
│       7        │
└────────────────┘

┌─────────────┐
│ Approved    │
│     12      │
└─────────────┘

┌─────────────┐
│ Published   │
│     29      │
└─────────────┘

These numbers must come from the database.
Do not hardcode them.
9. Admin Course Review Page
When Admin clicks:
Review

open a dedicated course review page.
For example:
/admin/courses/:courseId/review

Use the existing routing conventions if different.
The page should provide a complete read-only view.
10. Course Overview
Show:
Course Title
Description
Thumbnail
Trainer
Category
Difficulty
Duration
Language
Prerequisites
Learning Objectives
Target Audience
Skills
Competencies

Also show:
Course Status
Created Date
Updated Date
Submitted Date

11. Module & Lesson Review
This is extremely important.
The Admin must be able to inspect the entire course structure.
Example:
Course
│
├── Module 1 — Python Fundamentals
│   ├── Lesson 1 — Introduction
│   ├── Lesson 2 — Variables
│   ├── Lesson 3 — Data Types
│   └── Assessment
│
├── Module 2 — Control Flow
│   ├── Lesson 1 — Conditions
│   ├── Lesson 2 — Loops
│   └── Assessment
│
└── Module 3 — Functions
    ├── Lesson 1 — Functions
    ├── Lesson 2 — Parameters
    └── Assessment

Admin should be able to expand/collapse modules.
12. Lesson Content Review
When Admin opens a lesson, show the actual content.
Depending on what the existing platform supports:
- text
- rich text
- videos
- PDFs
- images
- code examples
- links
- downloadable resources
The Admin should be able to view, but not edit the course content from the review interface.
This is an approval interface, not a course builder.
13. Assessment Review
If the course contains assessments, Admin should be able to inspect them.
Show:
Assessment
│
├── Question
├── Question Type
├── Options
├── Correct Answer
├── Explanation
├── Marks
└── Difficulty

Do not allow Admin to modify Trainer-created assessment content unless the existing business rules explicitly require it.
14. Course Completeness Validation
Before allowing Admin to approve a course, run validation.
Check:
Course title exists
Description exists
Trainer exists
Category exists
Learning objectives exist
At least one module exists
Modules have valid lessons
Lessons contain required content
Assessments are valid
Required resources exist
Prerequisites are valid
Competency mappings are valid

If the course is incomplete:
Cannot Approve

Show exactly what is missing.
Example:
Course cannot be approved.

Missing:
• Module 3 has no lessons
• Learning objectives are empty
• Assessment 2 has no correct answer
• Competency mapping is incomplete

Do not let Admin approve an invalid course.
15. Approve Course
Admin should have a clear:
Approve Course

button.
Before approval, optionally show a confirmation dialog:
Approve Course?

This course has been reviewed and will become eligible
for publishing.

[Cancel] [Approve]

After approval:
SUBMITTED
    ↓
APPROVED

Record:
approvedAt
approvedBy

if these fields do not already exist.
16. Publish Course
Approval and publishing should be two distinct operations.
This is important.
Do not automatically make a course visible to trainees immediately after clicking Approve if the business workflow requires an explicit publish step.
Workflow:
SUBMITTED
   ↓
APPROVE
   ↓
APPROVED
   ↓
PUBLISH
   ↓
PUBLISHED
   ↓
TRAINEE CATALOG

Admin sees:
Status: APPROVED

[Publish Course]

When clicked:
APPROVED → PUBLISHED

Only then should the course appear in the trainee catalog.
17. Publish Confirmation
Before publishing:
Publish Course?

This course will become visible to eligible trainees
in the Course Catalog.

[Cancel] [Publish Course]

After successful publishing:
Course published successfully.

Update UI without requiring a full page reload if possible.
18. Reject Course
Admin must be able to reject a submitted course.
Button:
Reject Course

Open dialog:
Reject Course

Reason for rejection:
┌──────────────────────────────────┐
│ Please add more content to       │
│ Module 2 and fix the assessment. │
└──────────────────────────────────┘

[Cancel] [Reject Course]

The rejection reason must be stored.
For example:
rejectionReason
rejectedAt
rejectedBy

if appropriate.
Status:
SUBMITTED
   ↓
REJECTED

19. Trainer Rejection Feedback
When a Trainer's course is rejected, Trainer should be able to see:
Status: Rejected

Admin Feedback:
"Please add more content to Module 2
and fix Assessment 3."

Then:
Edit Course

should become available.
After changes:
Resubmit for Review

and status becomes:
REJECTED
   ↓
DRAFT
   ↓
SUBMITTED

or the equivalent workflow supported by the current architecture.
20. Course Visibility Rules
Implement one centralized course visibility policy.
Admin
Can see:
All courses

according to authorization.
Trainer
Can see:
Own courses

including:
Draft
Submitted
Under Review
Approved
Rejected
Published

as appropriate.
Trainee
Course Catalog can see:
PUBLISHED only

This rule must be enforced server-side.
21. Direct URL Protection
This is critical.
Suppose a course is:
status = DRAFT

A trainee must NOT be able to access:
/courses/123

simply by manually entering the URL.
The backend course-detail endpoint must verify publication/visibility.
Example:
Trainee requests course 123
        ↓
Is course published?
        ↓
YES → return course
NO  → return 404/403

Do not rely only on frontend routing guards.
22. Enrollment Protection
Also inspect the enrollment API.
A trainee must not be able to enroll in:
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
UNPUBLISHED

courses.
Only:
PUBLISHED

courses should be eligible for normal trainee enrollment.
23. Recommendation Engine Integration
This is especially important for the existing Capacity Connect workflow.
The AI skill-gap analyzer/recommendation engine should not recommend unpublished courses.
The recommendation query must only consider:
status = PUBLISHED

Example:
Skill Gap Analyzer
        ↓
Missing Skill
        ↓
Course Recommendation Search
        ↓
ONLY PUBLISHED COURSES
        ↓
Recommended Course

Draft and pending-review courses must never appear as recommendations.
This keeps the recommendation flow consistent with the trainee catalog.
24. Trainer Matching Integration
If the trainer matching/recommendation system uses course data, verify that it does not expose unpublished course information to trainees.
Published courses only should participate in trainee-facing course/trainer recommendations unless the existing business logic explicitly requires otherwise.
25. Notifications Integration
Integrate this workflow with the notification system you implemented previously.
When Admin approves a course:
Trainer
   ↓
Notification
"Your course has been approved."

When Admin rejects:
Trainer
   ↓
Notification
"Your course has been rejected."

Include the rejection reason.
When Admin publishes:
Trainer
   ↓
Notification
"Your course has been published."

Optionally, if the existing announcement/notification architecture supports it, eligible trainees can receive a course publication notification.
Do not create a separate notification architecture.
Reuse the existing notification system.
26. Audit Trail
Course approval is an administrative action, so record it.
Where appropriate, maintain:
createdBy
submittedAt
approvedBy
approvedAt
rejectedBy
rejectedAt
publishedBy
publishedAt
unpublishedBy
unpublishedAt

If the project already has an audit-log system, use it.
Example:
Course History

Oct 4, 2026 — Trainer submitted course
Oct 4, 2026 — Admin approved course
Oct 4, 2026 — Admin published course

This is valuable for debugging and demonstration.
27. Unpublish
Admin should be able to unpublish an already published course.
Workflow:
PUBLISHED
    ↓
UNPUBLISH
    ↓
UNPUBLISHED

After unpublishing:
❌ Course disappears from trainee catalog
❌ Course cannot be newly enrolled in
❌ Course should not be recommended

Existing learner progress/enrollments should not be blindly deleted.
Preserve existing enrollment/progress according to the current application rules.
28. Avoid Breaking Existing Trainee Data
When changing course visibility:
Do not delete:
- course progress
- assessment attempts
- enrollment history
- completion records
- certificates
- learning events
Changing publication status must only control availability/visibility.
This is particularly important because the platform's adaptive learning and revision architecture relies on learner activity and historical learning events. The revision design explicitly treats learning events as immutable evidence and uses them to update competency and learning models. Adaptive_Competency_Based_Revis…
29. API Authorization Matrix
Implement and verify something equivalent to:
Action	Admin	Trainer	Trainee
Create course	❌	✅	❌
Edit own draft	❌	✅	❌
Submit course	❌	✅	❌
View submitted course	✅	Own	❌
Approve course	✅	❌	❌
Reject course	✅	❌	❌
Publish course	✅	❌	❌
Unpublish course	✅	❌	❌
View published catalog	✅	✅	✅
Enroll	❌	❌	✅


Adapt this matrix if the existing business requirements contain additional permissions, but Admin course creation must be removed.
30. Backend Validation
Do not trust the frontend status.
Bad:
course.status = "PUBLISHED";

from the client.
The backend must enforce:
Only Admin
        ↓
Can approve
        ↓
Can publish

And publishing should require:
course is APPROVED
AND
course passes validation

A course must not be directly changed:
DRAFT → PUBLISHED

through a normal API request.
The valid transition should be:
DRAFT
→ SUBMITTED
→ UNDER_REVIEW
→ APPROVED
→ PUBLISHED

with rejection/unpublish branches.
31. Database Consistency
Use the existing Prisma architecture.
Avoid introducing redundant fields such as:
isPublished
published
isApproved
approvalStatus
courseStatus

all representing the same concept.
Prefer a single authoritative status where possible:
status

with timestamps/actor IDs for audit information.
For example:
status: CourseStatus

and:
approvedAt
approvedBy
publishedAt
publishedBy

32. Course Catalog Query
Audit every API that exposes courses to trainees.
Search for:
getCourses
listCourses
catalog
recommendedCourses
courseRecommendations
searchCourses
enrollCourse
courseDetails

Make sure unpublished courses cannot leak through any of them.
The following must all respect publication status:
Course Catalog
Search
Recommendations
Skill-gap recommendations
Trainer/course recommendations
Enrollment
Course detail
Related courses

33. UI Status Badges
Use clear status badges:
DRAFT
SUBMITTED
UNDER REVIEW
APPROVED
REJECTED
PUBLISHED
UNPUBLISHED

Use the existing design system rather than introducing arbitrary colors/styles.
The status should be immediately understandable to the Admin.
34. Final Testing
Perform an actual end-to-end test.
Test A — Trainer creates course
Trainer
↓
Create course
↓
Add modules
↓
Add lessons
↓
Save

Expected:
Course = DRAFT

Trainee:
Cannot see course

Test B — Trainer submits
Trainer
↓
Submit for Review

Expected:
Course = SUBMITTED

Trainee:
Cannot see course

Test C — Admin reviews
Admin
↓
Courses & Curriculum
↓
View submitted course
↓
Open course
↓
Inspect modules
↓
Inspect lessons
↓
Inspect assessments

Everything should be visible/read-only.
Test D — Admin rejects
Admin
↓
Reject
↓
Enter reason

Expected:
Course = REJECTED
Trainer receives notification
Trainee cannot see course

Test E — Trainer fixes and resubmits
Trainer
↓
View rejection reason
↓
Edit course
↓
Fix issues
↓
Resubmit

Expected:
Course = SUBMITTED

Test F — Admin approves
Admin
↓
Review
↓
Approve

Expected:
Course = APPROVED

But:
Trainee Catalog = NOT VISIBLE

This test is critical.
Test G — Admin publishes
Admin
↓
Publish

Expected:
Course = PUBLISHED

Now:
Trainee Catalog = VISIBLE

Test H — Direct URL protection
Before publishing:
Trainee → /courses/courseId

Expected:
404 / Not Available

After publishing:
Trainee → /courses/courseId

Expected:
Course opens successfully

Test I — Recommendation protection
Before publishing:
Skill Gap → Course Recommendation

Expected:
Course NOT recommended

After publishing:
Skill Gap → Course Recommendation

Expected:
Course can be recommended

Test J — Unpublish
Admin
↓
Unpublish

Expected:
Course disappears from catalog
Course no longer recommended
Course cannot receive new enrollment
Existing learner data remains intact

35. Final Acceptance Criteria
Do not consider this feature complete until:
[✓] Admin cannot create courses
[✓] Admin cannot access Trainer course builder
[✓] Trainer can create courses
[✓] Trainer can create modules
[✓] Trainer can create lessons
[✓] Trainer can submit courses
[✓] Admin sees submitted courses
[✓] Admin can view complete course structure
[✓] Admin can inspect modules
[✓] Admin can inspect lessons
[✓] Admin can inspect assessments
[✓] Admin can approve courses
[✓] Admin can reject courses
[✓] Rejection reason is stored
[✓] Trainer can see rejection reason
[✓] Trainer can fix and resubmit
[✓] Admin can publish approved courses
[✓] Admin can unpublish published courses
[✓] Only published courses appear in trainee catalog
[✓] Unpublished courses cannot be accessed by direct URL
[✓] Unpublished courses cannot be enrolled in
[✓] Unpublished courses are excluded from recommendations
[✓] Course status is enforced server-side
[✓] RBAC is enforced server-side
[✓] Approval/publishing actions are auditable
[✓] Existing enrollments/progress are preserved
[✓] Notifications integrate with course approval/rejection/publishing
[✓] No mock course data is used
[✓] No hardcoded course counts are used
[✓] No existing Trainer/Trainee workflow is broken

Final instruction
Do not simply redesign the Admin UI. Implement the complete workflow across database, backend APIs, authorization, Admin UI, Trainer workflow, Trainee catalog, course recommendations, enrollment, notifications, and direct URL protection.
Before making changes, inspect the current implementation and reuse existing models/components/services wherever possible.
After implementation, run the complete workflow:
Trainer Creates
      ↓
Draft
      ↓
Trainer Submits
      ↓
Admin Reviews
      ↓
Approve / Reject
      ↓
Approved
      ↓
Admin Publishes
      ↓
Published
      ↓
Trainee Catalog
      ↓
Recommendation Engine
      ↓
Trainee Enrollment

The single most important rule:
If course.status !== PUBLISHED, the course must not be exposed through any trainee-facing catalog, search, recommendation, enrollment, or normal course-access API.