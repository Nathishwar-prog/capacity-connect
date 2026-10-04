Objective
I need you to fully inspect, implement, fix, and verify the notification system across the entire Capacity Connect application.
Do not create a separate or duplicate notification architecture if notification-related backend models, APIs, services, hooks, components, or UI already exist.
First analyze the existing project structure, database schema, backend APIs, authentication/RBAC, Admin announcement functionality, header/navbar notification icon, and existing notification components.
Then integrate and complete the feature using the existing architecture and coding conventions.
The notification system must work end-to-end from Admin announcement → database → target users → notification badge → notification popup → notification details → mark as read → database deletion → UI removal.
The platform uses role-based access for Admin, Trainer, and Trainee, so notifications must respect authentication and recipient targeting.
1. First Analyze the Existing Implementation
Before changing anything, inspect:
- Prisma/database schema
- User model
- Role/RBAC implementation
- Admin announcement functionality
- Existing announcement tables/models
- Existing notification model/table
- Notification APIs/routes
- Notification service
- Notification hooks
- Header/navbar
- Notification bell icon
- Notification badge/count
- Notification dropdown/popover
- Notification modal/dialog
- Admin dashboard
- Trainer dashboard
- Trainee dashboard
- Existing authentication/session/JWT logic
- Existing API error handling
- Existing React Query/SWR/state management if present
Search the complete codebase for:
notification
notifications
announcement
announcements
markAsRead
readAt
unread
notificationCount
notificationBadge
bell

Determine whether notification functionality is:
- partially implemented
- duplicated
- broken
- disconnected from the database
- using mock/static data
- missing backend APIs
- missing frontend state updates
- missing recipient targeting
Do not blindly rewrite existing working code.
Reuse and improve the current implementation wherever possible.
2. Core Notification Flow
Implement this exact flow:
ADMIN CREATES ANNOUNCEMENT
        ↓
Announcement saved successfully
        ↓
Determine target audience
        ↓
Create notification records for eligible users
        ↓
Notification stored in database
        ↓
User opens application
        ↓
Notification API fetches user's notifications
        ↓
Bell icon displays unread count
        ↓
User clicks notification bell
        ↓
Notification panel/dropdown opens
        ↓
User sees notification list
        ↓
User clicks a notification
        ↓
Notification details popup/modal opens
        ↓
Full announcement message displayed
        ↓
"Mark as Read" button
        ↓
User clicks Mark as Read
        ↓
Notification deleted from database
        ↓
Notification removed immediately from UI
        ↓
Unread badge/count decreases
        ↓
If no notifications remain → empty state

This entire flow must work with real database data, not mock data.
3. Admin Announcement → Notification Integration
When an Admin creates an announcement, analyze the existing announcement creation logic.
Do not break the current announcement functionality.
After an announcement is successfully created:
Determine recipients based on the announcement audience.
Support the existing audience/targeting model in the project.
Possible targeting:
ALL_USERS
ALL_TRAINEES
ALL_TRAINERS
SPECIFIC_USERS

If the current project already uses different audience names, preserve those names instead of introducing unnecessary duplicates.
For example:
Announcement:
Title: "New Python Training Available"

Message:
"Python Advanced Training is now available..."

Target:
Trainees

Then create notification records only for eligible trainees.
Do not send the notification to Admin users unless the announcement explicitly targets them.
4. Notification Database Design
Inspect the existing Prisma schema first.
If a notification model already exists, reuse it and migrate only when necessary.
The model should conceptually support:
Notification
-------------------------
id
userId
announcementId
title
message
type
createdAt

If your existing architecture stores only announcementId and resolves the announcement separately, that is also acceptable.
The notification must always be associated with:
- recipient user
- originating announcement
- notification type
- creation timestamp
Use foreign-key relationships where appropriate.
For example:
User
  ↓
Notifications
  ↓
Announcement

Add proper indexes for:
userId
createdAt
announcementId

If appropriate, add a compound index such as:
(userId, createdAt)

Do not duplicate announcement content unnecessarily if the existing architecture can safely reference the announcement.
5. Important Read Behavior
IMPORTANT:
For this project, "Mark as Read" means deleting the notification record from the database.
Do NOT implement:
isRead = true

as the final behavior if the requirement is deletion.
The required behavior is:
Unread notification exists in DB
        ↓
User opens notification
        ↓
User sees message
        ↓
User clicks "Mark as Read"
        ↓
DELETE notification from database
        ↓
Remove notification from frontend state

After deletion:
Notification should no longer appear

and:
Unread count should decrease

If the deleted notification was the last one:
Badge disappears
Empty notification state appears

6. Notification APIs
Inspect existing API architecture and implement the equivalent endpoints using the project's existing conventions.
At minimum, the system needs:
Get current user's notifications
GET /notifications

Return only notifications belonging to the authenticated user.
Never trust a userId supplied by the frontend.
Use the authenticated user's identity from the server-side session/JWT.
Get unread notification count
GET /notifications/unread-count

Return:
{
  "count": 3
}

If the existing API already returns notifications with unread information, avoid unnecessary duplicate requests.
Get notification details
If necessary:
GET /notifications/:id

But enforce:
notification.userId === authenticatedUser.id

A user must NEVER be able to view another user's notification by changing the notification ID.
Mark as read / delete notification
DELETE /notifications/:id

The backend must verify:
notification exists
AND
notification.userId === authenticatedUser.id

Then delete it.
Never allow:
DELETE /notifications/:id?userId=another-user

to delete another user's notification.
7. Security Requirements
This is extremely important.
Notifications contain potentially private organizational messages.
Implement server-side authorization.
For every notification request:
Authenticated user
        ↓
Get user ID from authentication context
        ↓
Query notification belonging to that user
        ↓
Perform operation

Never rely on:
req.body.userId

or:
req.query.userId

for authorization.
Prevent:
- IDOR
- cross-user notification access
- cross-role notification access
- unauthorized deletion
- unauthenticated notification access
Admin-only announcement creation must remain protected by Admin RBAC.
8. Notification Bell UI
Inspect the existing header/navbar.
There should be a notification bell icon.
Use the project's existing icon system. If using Lucide React, use:
Bell

The bell should display an unread badge.
Example:
🔔 3

But follow the existing application design system.
Badge behavior
If:
count = 0

hide the badge.
If:
count > 0

show the count.
For large values:
99+

instead of:
100
101
102

9. Notification Panel / Dropdown
When the user clicks the notification bell:
Open a polished notification dropdown/popover.
It should show:
Notifications

────────────────────

New Course Available
A new Python course is now available...
2 minutes ago

────────────────────

System Announcement
Assessment schedule has been updated...
1 hour ago

────────────────────

Use the existing UI system, preferably:
- shadcn/ui
- Radix primitives
- Tailwind CSS
- Lucide icons
if these are already used in the project.
Do not introduce another UI library unnecessarily.
10. Notification List
Each notification should display:
- notification title
- short message preview
- timestamp
- notification type/icon
- appropriate visual hierarchy
Example:
📢 New Training Announcement
Advanced Python training is now available.
5 minutes ago

Use a proper relative timestamp:
Just now
5 minutes ago
2 hours ago
Yesterday
3 days ago

If the project already has a date utility, reuse it.
11. Clicking a Notification
When the user clicks a notification:
Do NOT immediately delete it.
Instead:
Notification item
        ↓
Open notification details popup/modal

The popup should display:
Title
New Training Announcement

Full message
The Advanced Python Training course is now available.
You can start the course from your recommended learning section.

Metadata
For example:
From: Admin
Date: Oct 4, 2026

Only show metadata that actually exists in the database.
12. Notification Details Modal
Create a clean modal/dialog.
Example structure:
┌─────────────────────────────────────┐
│  New Training Announcement      ✕   │
│                                     │
│  A new training course has been     │
│  added to the learning platform.    │
│                                     │
│  Advanced Python Training is now    │
│  available for eligible trainees.  │
│                                     │
│  October 4, 2026                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Mark as Read            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

The button must perform the real API deletion.
13. Mark as Read UX
When the user clicks:
Mark as Read

show a loading state:
Marking as read...

Disable the button temporarily to prevent duplicate requests.
On successful response:
DELETE /notifications/:id

Then immediately update frontend state.
The notification must disappear without requiring a page refresh.
Update:
notification list
unread count
notification badge
modal state

Example:
Before:
🔔 3

After deleting one:
🔔 2

If all are deleted:
🔔

with no badge.
14. Optimistic UI
If the project's data-fetching architecture supports optimistic updates:
User clicks Mark as Read
        ↓
Immediately remove notification from UI
        ↓
Send DELETE request
        ↓
If request fails:
restore notification
show error

Otherwise use a reliable mutation + refetch strategy.
Do not leave stale notification data visible after successful deletion.
15. Real-Time / Refresh Behavior
Analyze the existing architecture and implement the most appropriate mechanism.
At minimum:
- notification list should refresh when the user logs in
- notification count should load on application startup
- notification state should update after Admin creates an announcement
- notification state should update after marking as read
- notification state should remain correct after page refresh
If the application already uses:
WebSocket
Socket.IO
SSE
React Query
SWR
Redis

reuse the existing infrastructure.
Do not introduce WebSockets just for this feature if the project architecture does not require them.
If there is no real-time infrastructure, polling/refetching can be used where appropriate.
16. Admin Announcement Creation
After the Admin successfully creates an announcement:
Create Announcement
        ↓
Transaction
        ↓
Save announcement
        ↓
Resolve target users
        ↓
Create notifications
        ↓
Commit transaction

Prefer a database transaction so that announcement creation and notification generation remain consistent.
For example:
BEGIN TRANSACTION

Create announcement

Find eligible recipients

Create notification records

COMMIT

If notification creation fails, handle the transaction according to the project's consistency requirements rather than silently reporting success.
17. Bulk Notification Creation
If an announcement targets hundreds or thousands of users, do not implement an inefficient:
for (...) {
   await prisma.notification.create(...)
}

Use an appropriate bulk operation such as:
createMany

if supported by the current Prisma/database architecture.
Also consider duplicate protection.
An announcement should not accidentally create multiple identical notification records for the same user due to retries.
18. Duplicate Prevention
Design the notification creation process to be idempotent.
For example, if:
announcementId = A123
userId = U456

already has a notification, don't create another identical notification unless the business rules explicitly allow it.
Consider a unique constraint such as:
(userId, announcementId)

if it fits the existing notification lifecycle.
19. Empty State
If there are no notifications, display a polished empty state:
🔔

You're all caught up

No new notifications right now.

Do not display:
undefined
null
NaN

or an empty broken dropdown.
20. Loading State
When notifications are loading:
Notifications

Loading...

Prefer skeleton loaders if the project already uses them.
Do not make the interface appear broken while the API request is pending.
21. Error State
If fetching notifications fails:
Unable to load notifications.

Try again

If deleting fails:
Couldn't mark this notification as read.
Please try again.

Do not silently fail.
Do not remove the notification permanently from the UI if the backend deletion failed unless using an optimistic rollback strategy.
22. Role-Based Testing
Test all three roles:
Admin
Admin should be able to:
Create announcement
Select target audience
Publish announcement

Admin should NOT automatically receive the announcement unless targeted.
Trainer
Trainer should receive:
Trainer-targeted announcements
All-user announcements

according to the existing audience rules.
Trainer should NOT receive trainee-only announcements.
Trainee
Trainee should receive:
Trainee-targeted announcements
All-user announcements

according to the existing audience rules.
Trainee should NOT receive trainer-only announcements.
23. Cross-User Security Test
Create:
User A
User B

Create a notification for User A.
Then attempt:
User B → GET notification/UserANotificationID

Expected:
403 Forbidden

or:
404 Not Found

depending on the project's security conventions.
User B must not be able to:
- read User A's notification
- delete User A's notification
- modify User A's notification
24. Database Verification
After Admin creates an announcement, verify the database.
Example:
Announcement
id: A1
target: TRAINEES

Users:
Trainee 1
Trainee 2
Trainer 1

Expected:
Notification
Trainee 1 → A1
Trainee 2 → A1

No notification for:
Trainer 1

unless the announcement targets them.
After Trainee 1 clicks Mark as Read:
Trainee 1 → A1 notification deleted
Trainee 2 → A1 notification remains

This is critical.
25. Frontend State Consistency
Make sure these always remain synchronized:
Database
   ↕
API
   ↕
Frontend notification state
   ↕
Notification badge
   ↕
Notification dropdown
   ↕
Notification modal

Avoid situations where:
DB = 2 notifications
UI = 5 notifications
Badge = 0

or:
notification deleted in DB
but still displayed in UI

26. Authentication Edge Cases
Handle:
Logged out user
Notification API should reject unauthorized requests.
Session expired
Do not crash the UI.
Handle authentication failure according to the existing auth architecture.
User switches account
Clear previous user's notification state.
A previous user's notifications must NEVER remain visible after another user logs in.
27. Pagination
Inspect the expected scale of the application.
If the notification list can become large, implement pagination or a reasonable limit:
GET /notifications?limit=20

Then optionally:
Load more

or infinite scrolling.
Do not load thousands of notification records into the browser unnecessarily.
28. Performance
Optimize:
- notification count query
- notification list query
- database indexes
- bulk notification creation
- frontend caching
- unnecessary API calls
The notification badge should not trigger excessive requests on every render.
If React Query/SWR already exists, use it properly.
29. Notification Types
Inspect the existing project and preserve existing notification types.
If the system supports notification types, structure them consistently:
ANNOUNCEMENT
COURSE
ASSESSMENT
REVISION
SYSTEM

Do not create types that are not required by the existing business logic.
For announcements, use:
ANNOUNCEMENT

30. Do Not Break Existing Features
This is a critical requirement.
While implementing notifications, verify that you do not break:
- Admin dashboard
- Admin announcement creation
- Trainer dashboard
- Trainee dashboard
- Authentication
- RBAC
- Course recommendations
- Skill-gap analyzer
- Course enrollment
- Assessments
- Revision engine
- Course progress
- Trainer matching
- Existing navigation
The platform's learning workflow depends on interconnected services, so notification implementation must be additive and properly integrated.
The project's overall architecture includes role-based access, competency mapping, AI skill-gap analysis, personalized learning, trainer matching, and smart revision; therefore notification changes must not bypass or weaken these existing access-control boundaries.  SIH 2026 (26075)
31. UI/UX Requirements
The notification UI should look production-ready.
Use the existing Capacity Connect design system.
Requirements:
- responsive
- accessible
- keyboard navigable
- proper focus management
- proper modal behavior
- clear typography hierarchy
- consistent spacing
- Lucide icons if already used
- shadcn/ui components if already used
- dark/light theme compatibility if supported
- mobile-friendly
Do not create a completely different visual style.
32. Accessibility
Ensure:
Bell button → aria-label="Notifications"

The badge should not be the only indication of notification state.
Modal:
- keyboard accessible
- ESC closes modal
- focus trapped appropriately
- screen-reader-friendly title
- accessible buttons
33. Testing
After implementation, test the complete flow.
Test 1 — Admin announcement
Login as Admin
↓
Create announcement
↓
Target Trainees
↓
Publish

Verify notification records are created.
Test 2 — Trainee notification
Login as Trainee
↓
Open notification bell

Expected:
Unread badge visible
Notification visible

Test 3 — Notification details
Click notification

Expected:
Modal opens
Full message displayed
Mark as Read button visible

Test 4 — Mark as read
Click Mark as Read

Expected:
API DELETE succeeds
DB record deleted
Modal closes
Notification disappears
Badge decreases

Test 5 — Refresh
Refresh page

Expected:
Deleted notification does not return

Test 6 — Multiple notifications
Create:
Notification A
Notification B
Notification C

Mark B as read.
Expected:
A remains
B removed
C remains
badge = 2

Test 7 — Role targeting
Verify:
ALL_USERS → all eligible users
TRAINEES → trainees only
TRAINERS → trainers only

Test 8 — Security
Attempt cross-user notification access and deletion.
Expected:
Access denied

Test 9 — Duplicate prevention
Trigger the same announcement creation flow/retry.
Verify duplicate notifications are not unintentionally created.
Test 10 — Empty state
Delete/read all notifications.
Expected:
You're all caught up

and no badge.
34. API + Database + UI Verification
After implementation, don't stop at compiling the application.
Verify all three layers:
DATABASE
✓ records created correctly
✓ correct recipients
✓ indexes/relations valid
✓ deletion works

BACKEND
✓ authentication
✓ authorization
✓ APIs
✓ announcement integration
✓ error handling
✓ transaction/bulk creation

FRONTEND
✓ bell
✓ badge
✓ dropdown
✓ notification list
✓ modal
✓ mark as read
✓ state synchronization
✓ loading/error/empty states

35. Final Codebase Audit
After implementing the feature, search the complete codebase again for:
notification
notifications
announcement
markAsRead
isRead
readAt

Identify:
- duplicate implementations
- dead code
- mock notification data
- hardcoded notification counts
- unused notification components
- incorrect API calls
- stale state
- TODOs
- console errors
- broken imports
Remove or consolidate obsolete code where appropriate.
Do not leave two competing notification systems in the project.
36. Final Acceptance Criteria
The implementation is complete only when all of these are true:
[✓] Admin can create announcements
[✓] Announcement target audience is respected
[✓] Notifications are generated automatically
[✓] Notifications are stored in DB
[✓] Correct users receive correct notifications
[✓] Unauthorized users cannot access notifications
[✓] Notification bell works
[✓] Unread badge works
[✓] Notification list works
[✓] Notification details popup works
[✓] Full announcement message is displayed
[✓] Mark as Read button works
[✓] Mark as Read deletes notification from DB
[✓] Deleted notification disappears from UI
[✓] Badge count updates correctly
[✓] Empty state works
[✓] Loading state works
[✓] Error state works
[✓] Refresh preserves correct state
[✓] Multiple notifications work independently
[✓] Duplicate notifications are prevented
[✓] Role-based targeting works
[✓] Cross-user access is blocked
[✓] Mobile UI works
[✓] Existing application features remain intact
[✓] No mock/static notification data remains
[✓] No hardcoded notification count remains
[✓] No console/runtime errors remain

Final instruction to the AI agent
Do not just tell me what needs to be implemented. Actually inspect the existing codebase and implement the complete feature.
First understand the existing architecture.
Then:
Analyze
→ Identify existing notification implementation
→ Reuse existing architecture
→ Fix incomplete/broken parts
→ Implement missing backend functionality
→ Implement missing frontend functionality
→ Connect Admin announcements to notifications
→ Implement database deletion on Mark as Read
→ Implement real-time frontend state synchronization
→ Verify RBAC/security
→ Test all roles
→ Test database behavior
→ Test API behavior
→ Test UI behavior
→ Fix all discovered issues
→ Final audit

At the end, provide a concise implementation report containing:
1. What already existed
2. What was missing/broken
3. Files changed
4. Database/schema changes
5. API changes
6. Frontend changes
7. Admin announcement integration
8. Security/RBAC implementation
9. Tests performed
10. Any remaining issues
Do not claim the notification system is complete unless the actual Admin → DB → User → Bell → Popup → Mark as Read → DB deletion → UI removal flow has been verified end-to-end.