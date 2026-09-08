# 02. Progress Tracking & Automatic Completion Calculation

## Overview

Progress tracking records lesson-by-lesson completions for enrolled learners and automatically aggregates the overall course completion percentage.

## Progress Auto-Calculation Engine

```text
                  Lesson Completion Trigger
            POST /enrollments/:id/lessons/:lessonId/progress
                                │
                                ▼
                   Upsert LessonProgress Record
               (completed: true, completedAt: now())
                                │
                                ▼
                     Count Completed Lessons
             (completedCount = count(completed == true))
                                │
                                ▼
                     Calculate Progress %
       progressPercentage = round((completedCount / totalLessons) * 100)
                                │
                                ▼
                     Evaluate State Machine
                 ┌──────────────┼──────────────┐
                 ▼              ▼              ▼
           (0 Completed)   (1+ Completed) (All Completed)
                 │              │              │
                 ▼              ▼              ▼
            [ ENROLLED ]  [ IN_PROGRESS ] [ COMPLETED ]
```

## Calculations & Edge Cases

1. **Percentage Calculation**:
   - `progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0`
2. **State Machine Transitions**:
   - **`IN_PROGRESS`**: Triggered when `completedCount > 0` or `progressPercentage > 0` and status is `ENROLLED`. Sets `startedAt` timestamp if previously null.
   - **`COMPLETED`**: Triggered when `completedCount === totalLessons` and `totalLessons > 0`. Sets `completedAt` timestamp to current system time.
3. **Dropped Guard**:
   - Updating progress on a `DROPPED` course throws `400 Bad Request`.
