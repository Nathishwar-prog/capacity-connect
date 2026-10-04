Objective
Upgrade the entire Admin Panel of Capacity Connect into a professional, production-ready administrative management system.
This implementation has two major goals:
1. Fix the Admin application layout
Make:
- Sidebar fixed
- Top header/navbar fixed
- Sidebar independently scrollable
- Main content independently scrollable
- Header never scrolls away
- Sidebar never moves when the main content scrolls
- Long sidebar menus must scroll inside the sidebar only
- Main content must never be hidden behind the fixed sidebar/header
2. Implement the complete Capacity Building section
Add/complete these Admin sidebar pages:
Capacity Building
├── Trainees
├── Trainers
└── Learning Resources

These must be fully functional management and analytics pages, not placeholder dashboards.
The Admin should get a clear organizational overview of:
- trainees
- trainers
- courses
- enrollments
- learning progress
- assessments
- competency development
- learning resources
- trainer workload
- trainee activity
- course performance
- platform learning activity
PART 1 — FIXED ADMIN LAYOUT
1. Analyze Existing Admin Layout First
Before changing anything, inspect:
AdminLayout
Sidebar
Navbar
Header
DashboardLayout
Navigation
MobileNavigation
Admin routes

Search for:
sidebar
navbar
header
layout
AdminLayout
DashboardLayout
navigation

Do not create another layout if one already exists.
Modify the existing layout architecture.
2. Desktop Layout
The Admin application should use this structure:
┌──────────────────────────────────────────────────────────┐
│                    FIXED TOP HEADER                      │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   FIXED      │                                           │
│   SIDEBAR    │          SCROLLABLE MAIN CONTENT          │
│              │                                           │
│   Internal   │                                           │
│   sidebar    │                                           │
│   scroll     │                                           │
│              │                                           │
│              │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘

3. Sidebar Requirements
Sidebar must be:
position: fixed;
left: 0;
top: 0;
height: 100vh;

or equivalent architecture using the existing layout system.
It must have:
Header/logo section
Navigation section
User/admin section

The navigation area should independently scroll.
For example:
Sidebar
┌───────────────────────┐
│ Capacity Connect      │
│ Admin                 │
├───────────────────────┤
│ Dashboard             │
│ Users                 │
│                       │
│ Capacity Building     │
│  Trainees             │
│  Trainers             │
│  Learning Resources   │
│                       │
│ Courses & Curriculum  │
│ Assessments           │
│ Analytics             │
│ Announcements         │
│ Notifications         │
│ Settings              │
│                       │
│       ↕ scroll        │
├───────────────────────┤
│ Admin Profile         │
│ Logout                │
└───────────────────────┘

4. Sidebar Independent Scrolling
This is critical.
If the sidebar menu becomes longer than the viewport:
Sidebar content
      ↓
Overflow
      ↓
Sidebar itself scrolls

The entire browser page must NOT scroll the sidebar.
Use the appropriate layout:
Sidebar:
height: 100vh
overflow-y: auto

Avoid:
body scroll → sidebar moves

The sidebar should remain visually fixed while its navigation contents scroll internally.
5. Main Content Scrolling
The main content area should be:
position/width adjusted for sidebar
height: calc(100vh - headerHeight)
overflow-y: auto

Only the main content should scroll vertically.
Example:
Header
██████████████████████████████████
       ↓ fixed

Sidebar │ Main Content
        │
        │  Dashboard
        │
        │  Analytics
        │
        │  Tables
        │
        │      ↕ scroll

6. Fixed Top Header
The Admin top header/navbar must remain fixed.
It should contain:
Page title / breadcrumb
Search if existing
Notifications
Admin profile
Theme/language controls if existing

The header should not disappear when the Admin scrolls.
Use the existing design system.
7. Prevent Layout Problems
Fix all common issues:
❌ content hidden behind sidebar
❌ content hidden behind header
❌ double scrollbar
❌ horizontal overflow
❌ sidebar scrolling with body
❌ header scrolling away
❌ mobile layout broken
❌ cards extending outside viewport

Desktop, tablet, and mobile must all work.
PART 2 — CAPACITY BUILDING SIDEBAR SECTION
Add/complete this section:
CAPACITY BUILDING
│
├── Trainees
├── Trainers
└── Learning Resources

This section should represent the core organizational capacity-building management layer.
The existing platform is designed around training, competency development, learning resources, trainer matching, and continuous capacity building, so these pages should expose those operational relationships to Admin rather than functioning as isolated CRUD screens.  SIH 2026 (26075)
PART 3 — TRAINEES PAGE
Route example:
/admin/capacity-building/trainees

Use the project's existing routing convention if different.
This should become the central Admin trainee management and analytics page.
8. Trainee Overview Dashboard
At the top:
Trainees

Manage trainees, monitor learning progress,
competency development and course activity.

Add KPI cards:
┌──────────────────┐
│ Total Trainees   │
│      1,248       │
└──────────────────┘

┌──────────────────┐
│ Active Trainees  │
│       876        │
└──────────────────┘

┌──────────────────┐
│ New This Month   │
│       124        │
└──────────────────┘

┌──────────────────┐
│ Courses Enrolled │
│      3,482       │
└──────────────────┘

┌──────────────────┐
│ Avg Completion   │
│       68%        │
└──────────────────┘

All values must come from real database queries.
No hardcoded numbers.
9. Trainee Activity Overview
Add a learning activity section.
Show:
Daily / Weekly / Monthly Activity

Possible metrics:
- course enrollments
- lessons completed
- assessments attempted
- assessments completed
- revision sessions
- learning hours
- active learners
Provide filters:
7 Days
30 Days
90 Days
Custom

Use existing analytics/chart libraries if present.
Do not introduce unnecessary chart dependencies.
10. Trainee Progress Overview
Show:
Course Progress

Metrics:
Not Started
In Progress
Completed

Example:
Course Progress

Completed       ███████████████  42%
In Progress     ███████████████████  51%
Not Started     ███ 7%

Use real enrollment/progress data.
11. Competency Overview
Since Capacity Connect includes competency mapping and AI skill-gap analysis, Admin should be able to see an aggregated competency picture.
Show:
Top Competencies
Weak Competencies
Most Improved Competencies
Competency Gaps

Example:
Competency Overview

Python Programming        82%
Data Analysis             74%
Cloud Fundamentals       68%
Machine Learning          61%
Communication             88%

Do not expose private learner details unnecessarily in aggregate views.
12. Trainee Table
Add a professional data table.
Columns:
Trainee
Role
Department
Enrolled Courses
Completed Courses
Progress
Competency Score
Last Active
Status
Actions

Example:
┌───────────────────────────────────────────────┐
│ Trainee       Courses  Progress Last Active  │
│───────────────────────────────────────────────│
│ Arun          4        82%      2h ago       │
│ Priya         3        67%      Today        │
│ Rahul         5        91%      Yesterday    │
└───────────────────────────────────────────────┘

13. Trainee Search and Filters
Support:
Search by:
• Name
• Email
• Employee ID
• Department

Filters:
Status
Department
Role
Course
Progress
Activity
Registration date

Add:
Clear filters

14. Trainee Detail Page
Clicking a trainee should open:
/admin/capacity-building/trainees/:id

Show:
Profile
Name
Email
Role
Department
Registration date
Last active
Account status

Learning summary
Courses enrolled
Courses completed
Current courses
Assessments completed
Learning hours
Revision sessions

Course progress
Course
Progress
Assessment Score
Status
Last Activity

Competency
Show:
Current competency
Skill gaps
Improvement
At-risk areas

Activity timeline
Course enrolled
Lesson completed
Assessment completed
Revision completed
Course completed

15. Trainee Actions
Depending on existing permissions:
View Profile
View Learning Activity
View Enrollments
View Progress
Deactivate Account
Reactivate Account

Do not give Admin arbitrary access to modify learning evidence.
In particular, Admin should not manually manipulate competency scores or learning events if those are derived from the learning system. The revision architecture explicitly treats learning events as evidence and competency as a derived learner model. Adaptive_Competency_Based_Revis…
PART 4 — TRAINERS PAGE
Route:
/admin/capacity-building/trainers

This should be a Trainer Management + Trainer Performance Dashboard.
16. Trainer Overview KPIs
Show:
Total Trainers
Active Trainers
Courses Created
Published Courses
Pending Course Reviews
Total Assigned Trainees
Average Course Rating

Example:
┌────────────────┐
│ Total Trainers │
│      84        │
└────────────────┘

┌────────────────────┐
│ Active Trainers    │
│       67           │
└────────────────────┘

┌────────────────────┐
│ Published Courses  │
│       142          │
└────────────────────┘

┌────────────────────┐
│ Assigned Trainees  │
│      1,248         │
└────────────────────┘

17. Trainer-to-Trainee Overview
This is one of the most important requested features.
Admin should clearly see:
Trainer
↓
Number of trainees
↓
Courses
↓
Course performance

Example:
Trainer              Trainees   Courses   Rating
──────────────────────────────────────────────────
John Mathew             84         6       4.8
Priya Sharma             62         4       4.7
Arun Kumar               118        8       4.6

18. Trainer Workload
Show trainer workload:
Assigned Trainees
Active Courses
Pending Assessments
Pending Feedback
Course Completion Rate

Add workload indicators:
Low
Normal
High
Overloaded

This allows Admin to identify trainers who may need workload balancing.
19. Trainer Course Performance
Show:
Courses created
Courses submitted
Courses approved
Courses rejected
Courses published

This connects directly with the course approval workflow.
Example:
Trainer
      ↓
Draft Courses
      ↓
Submitted
      ↓
Approved
      ↓
Published

Admin should be able to see where courses are getting stuck.
20. Trainer Performance
Useful metrics:
Average course rating
Trainee completion rate
Average assessment performance
Trainee engagement
Course drop-off rate
Feedback score

Use data only if those metrics exist in the current database.
If a metric cannot currently be calculated reliably, do not invent it.
Instead display:
Data unavailable

and identify the missing data source.
21. Trainer Detail Page
Route:
/admin/capacity-building/trainers/:id

Show:
Trainer Profile
Name
Email
Expertise
Department
Experience
Joined Date
Status

Course Portfolio
Course
Status
Trainees
Completion
Rating

Assigned Trainees
Trainee
Course
Progress
Last Active
Performance

Trainer Activity
Course created
Course submitted
Assessment created
Resource uploaded
Feedback received

Performance Analytics
Course Completion
Assessment Performance
Trainee Satisfaction
Course Ratings

22. Trainer-Trainee Relationship
If the database already supports explicit trainer assignments, show:
Trainer
   ↓
Assigned Trainees

If no explicit assignment relationship exists, do not fabricate it from course ownership.
Instead clearly distinguish:
Course learners

from:
Assigned trainees

This is important for data accuracy.
PART 5 — LEARNING RESOURCES PAGE
Route:
/admin/capacity-building/learning-resources

This should become the Admin's central Learning Resource Management & Analytics page.
23. Resource Overview
Show KPIs:
Total Resources
Published Resources
Pending Review
Resources Added This Month
Most Used Resource
Resource Types

Resource types:
PDF
Video
Document
Presentation
Link
Quiz
Assessment
Other

Use the types that already exist in the project.
24. Resource Management Table
Columns:
Resource
Type
Course
Module
Created By
Status
Usage
Uploaded Date
Last Updated
Actions

Example:
Python Fundamentals PDF
PDF
Python Course
Module 1
John Mathew
Published
328 views
Oct 2

25. Resource Filters
Support:
Search
Resource Type
Course
Module
Trainer
Status
Date
Usage

26. Resource Detail
Click resource:
/admin/capacity-building/learning-resources/:id

Show:
Resource preview
Title
Description
Type
Course
Module
Uploaded by
Created date
Updated date
Status
Usage statistics

If the resource is previewable, provide a proper preview.
For PDFs:
PDF Preview

For videos:
Video Preview

For links:
Open Resource

Do not expose private files without authorization.
27. Resource Usage Analytics
Show:
Total Views
Unique Learners
Course Usage
Completion/Interaction
Average Engagement

Only show metrics that can be derived from existing data.
If resource interaction tracking does not exist, implement the necessary tracking rather than displaying fake statistics.
28. Most Used Resources
Add:
Most Used Learning Resources

Example:
1. Python Fundamentals PDF       842 uses
2. ML Introduction Video         716 uses
3. SQL Cheat Sheet               603 uses

This helps Admin understand which resources are actually useful.
29. Resource Quality / Review
If resources have approval requirements, support:
Pending Review
Approved
Rejected
Published
Archived

Do not make every uploaded resource automatically public if the existing business workflow requires review.
Use the same governance principle as courses:
Created
→ Reviewed
→ Approved
→ Available

Only implement this if it fits the current resource architecture.
PART 6 — CROSS-MODULE ADMIN OVERVIEW
Create useful cross-module analytics.
Admin should be able to understand:
Trainees
     ↕
Courses
     ↕
Trainers
     ↕
Learning Resources
     ↕
Assessments
     ↕
Competencies

30. Capacity Building Overview
On the main Capacity Building section or dashboard, show:
Total Trainees
Total Trainers
Active Courses
Published Courses
Learning Resources
Active Learners
Course Completion
Average Competency

Then:
Learning Activity

with:
Enrollments
Lessons Completed
Assessments
Revision Sessions

31. Top Courses
Show:
Most Enrolled
Most Completed
Highest Rated
Highest Assessment Performance

Do not calculate a metric unless the underlying data supports it.
32. At-Risk / Attention Required
Create an Admin attention panel.
Potential sections:
Courses Pending Approval
Trainers With High Workload
Courses With Low Completion
Resources Pending Review
Inactive Trainees
Courses With High Drop-off

This should become an action-oriented Admin dashboard, not just statistics.
Example:
Needs Attention

🔴 7 courses awaiting review
🟠 3 trainers have high trainee workload
🟡 42 trainees inactive for 14+ days
🟡 5 courses have low completion rates

[Review Now]

Thresholds should be configurable where possible.
33. Recent Activity
Add a unified activity feed:
Recent Activity

Trainer submitted "Advanced Python"
2 minutes ago

Trainee completed "Machine Learning Basics"
15 minutes ago

Admin published "Cloud Fundamentals"
1 hour ago

New resource uploaded
2 hours ago

Use real activity records.
If the platform already has an audit log/activity system, reuse it.
PART 7 — DATA ACCURACY
Critical Rule
Do not create fake analytics.
Every dashboard number must come from:
Database
→ Service
→ API
→ UI

Not:
Hardcoded mock values

Search for existing:
mockData
dummyData
sampleData
staticStats
fakeStats

and remove them from production Admin views.
If a required metric cannot be calculated from the current schema, tell me exactly:
Metric:
Why unavailable:
Required data:
Recommended schema/event:

Do not silently fabricate it.
PART 8 — PERFORMANCE
These pages may contain large datasets.
Implement:
- server-side pagination
- database filtering
- database sorting
- indexed queries
- debounced search
- aggregation queries for KPIs
- appropriate caching if existing infrastructure supports it
Avoid loading:
10,000 trainees
+
all courses
+
all activity

into the browser.
PART 9 — RBAC
Admin-only pages must be protected at both:
Frontend
Navigation/routes should not appear to unauthorized roles.
Backend
Every API must verify:
authenticated user
+
ADMIN role

Do not rely only on frontend route protection.
PART 10 — Responsive Design
The fixed layout must work on:
Desktop
Laptop
Tablet
Mobile

On mobile:
☰

opens the sidebar as a drawer.
When the drawer is open:
Main content interaction

should be appropriately controlled.
The desktop fixed sidebar behavior must not create a broken mobile layout.
PART 11 — UX Requirements
Use the existing Capacity Connect design system.
Prefer:
- shadcn/ui
- Tailwind CSS
- Lucide React
- existing chart library
- existing table/data-table components
if already installed.
Do not add another component library unnecessarily.
Use:
- skeleton loaders
- empty states
- error states
- confirmation dialogs
- tooltips
- pagination
- breadcrumbs
- consistent status badges
PART 12 — Important Empty States
Every page must have a proper empty state.
Example:
No trainees
No trainees found.

Try changing your filters.

No trainers
No trainers found.

No resources
No learning resources available.

No activity
No recent activity.

Never show broken blank screens.
PART 13 — Loading & Error States
Every data-driven section must handle:
Loading
Success
Empty
Error

Example:
Loading trainees...

or skeletons.
Error:
Unable to load trainee data.

[Try Again]

Do not let API failures crash the complete Admin page.
PART 14 — Search / Filter URL State
Where appropriate, persist:
search
status
department
course
date
page

in URL query parameters.
Example:
/admin/capacity-building/trainees?status=active&page=2

This makes the Admin interface easier to navigate and share.
PART 15 — Security & Privacy
Admin dashboards contain sensitive organizational information.
Ensure:
- authenticated access
- Admin authorization
- server-side authorization
- no cross-user data leakage
- no exposed private resource URLs
- no sensitive information in frontend logs
- no unauthorized trainee profile access
PART 16 — Integration With Existing Platform
Verify that the new pages integrate correctly with:
Courses & Curriculum
Course approval/publishing
Trainer dashboard
Trainee dashboard
Course Catalog
Assessments
Skill Gap Analyzer
Course Recommendations
Trainer Matching
Revision Engine
Notifications
Learning Resources

For example:
Trainer creates course
        ↓
Admin sees pending review
        ↓
Admin approves/publishes
        ↓
Course appears in catalog
        ↓
Trainees enroll
        ↓
Trainee progress appears in Admin
        ↓
Trainer sees learner activity
        ↓
Competency/learning events update
        ↓
Revision engine uses learning evidence

The adaptive revision architecture specifically expects learning interactions to become learning events and update competency/memory models, so Admin analytics should not modify those underlying learning events directly. Adaptive_Competency_Based_Revis…
PART 17 — Final Acceptance Criteria
Do not consider the implementation complete until all of these are verified:
LAYOUT
[✓] Sidebar fixed
[✓] Header fixed
[✓] Sidebar independently scrollable
[✓] Main content independently scrollable
[✓] No double scrollbar
[✓] No content hidden behind header
[✓] No content hidden behind sidebar
[✓] Responsive mobile drawer works

TRAINEES
[✓] Trainee KPI dashboard
[✓] Trainee search
[✓] Trainee filters
[✓] Trainee table
[✓] Trainee detail page
[✓] Course progress
[✓] Competency overview
[✓] Learning activity
[✓] Enrollment overview
[✓] Activity timeline
[✓] Real database values

TRAINERS
[✓] Trainer KPI dashboard
[✓] Trainer search
[✓] Trainer filters
[✓] Trainer table
[✓] Trainer detail page
[✓] Trainer course portfolio
[✓] Trainer-to-trainee overview
[✓] Trainer workload
[✓] Course performance
[✓] Trainer activity
[✓] Real database values

LEARNING RESOURCES
[✓] Resource KPI dashboard
[✓] Resource table
[✓] Resource search
[✓] Resource filters
[✓] Resource detail
[✓] Resource preview where supported
[✓] Resource usage analytics
[✓] Resource type breakdown
[✓] Real database values

CROSS-MODULE
[✓] Capacity Building overview
[✓] Course overview
[✓] Activity feed
[✓] Attention-required section
[✓] Course/trainer/trainee relationships
[✓] Existing course publishing workflow integrated
[✓] Notification integration preserved

SECURITY
[✓] Admin-only routes protected
[✓] APIs protected
[✓] No cross-user data leakage
[✓] No unauthorized resource access

QUALITY
[✓] No mock statistics
[✓] No hardcoded counts
[✓] Loading states
[✓] Error states
[✓] Empty states
[✓] Responsive UI
[✓] No console errors
[✓] No broken routes
[✓] No duplicate layout implementation

Final instruction to the AI agent
Do not treat this as a UI-only redesign.
First inspect the existing database, APIs, layouts, components, RBAC, and business logic.
Then implement the feature end-to-end:
Existing Admin Layout
        ↓
Fixed Sidebar + Fixed Header
        ↓
Capacity Building
        ├── Trainees
        │     ├── Overview
        │     ├── Search/Filter
        │     ├── Details
        │     ├── Progress
        │     ├── Competency
        │     └── Activity
        │
        ├── Trainers
        │     ├── Overview
        │     ├── Trainer → Trainee Mapping
        │     ├── Workload
        │     ├── Course Performance
        │     ├── Details
        │     └── Activity
        │
        └── Learning Resources
              ├── Overview
              ├── Resource Management
              ├── Search/Filter
              ├── Preview
              ├── Usage Analytics
              └── Details

        ↓
Courses & Curriculum
        ↓
Course Approval
        ↓
Course Publishing
        ↓
Trainee Catalog
        ↓
Learning Activity
        ↓
Admin Analytics

Most importantly, build this around the real relationships in the existing database. Do not invent relationships, trainer assignments, competency scores, resource usage, or performance metrics that the database cannot support. Where data is missing, identify the exact schema/event needed instead of displaying fake numbers.