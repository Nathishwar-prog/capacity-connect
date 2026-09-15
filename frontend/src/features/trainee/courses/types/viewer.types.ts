export interface ContentBlock {
  id: string;
  type:
    | 'paragraph'
    | 'heading'
    | 'bullet_list'
    | 'numbered_list'
    | 'callout'
    | 'example'
    | 'table'
    | 'quote'
    | 'code'
    | 'divider';
  content: any;
  position?: number;
  metadata?: Record<string, any>;
  sourceProvenance?: any;
}

export interface LessonOutlineItem {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  contentType: 'VIDEO' | 'PDF' | 'DOCUMENT' | 'QUIZ' | 'ARTICLE' | 'SIMULATION' | string;
  durationMinutes: number;
  orderIndex: number;
  isPreview?: boolean;
  resourceCount: number;
  isCompleted: boolean;
}

export interface AssessmentOutline {
  id: string;
  title: string;
  description?: string | null;
  subject?: string;
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  moduleId?: string | null;
  lessonId?: string | null;
  isCompleted?: boolean;
  passed?: boolean;
  score?: number | null;
  percentage?: number | null;
  attemptId?: string | null;
}

export interface ModuleOutline {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  durationMinutes: number;
  completedCount: number;
  totalCount: number;
  lessons: LessonOutlineItem[];
  assessments?: AssessmentOutline[];
}

export interface CourseMetadata {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  category: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
}

export interface CourseProgressSummary {
  enrollmentId: string | null;
  completedLessonIds: string[];
  completedLessonsCount: number;
  totalLessonsCount: number;
  progressPercentage: number;
  status: string;
}

export interface CourseOutlineData {
  course: CourseMetadata;
  modules: ModuleOutline[];
  progress: CourseProgressSummary;
}

export interface LessonResourceItem {
  id: string;
  title: string;
  description?: string | null;
  resourceType: string;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number;
  thumbnailUrl?: string | null;
}

export interface KnowledgeCheckOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: KnowledgeCheckOption[];
  explanation?: string;
}

export interface LessonDetailData {
  id: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description?: string | null;
  contentType: string;
  content?: string | null;
  resourceUrl?: string | null;
  durationMinutes: number;
  orderIndex: number;
  isPreview?: boolean;
  learningObjectives: string[];
  keyTakeaways: string[];
  knowledgeChecks?: KnowledgeCheckQuestion[];
  resources: LessonResourceItem[];
  isCompleted: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export interface CompleteLessonResponse {
  success: boolean;
  isCompleted: boolean;
  progressPercentage: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  enrollmentStatus?: string;
  isPreview?: boolean;
}
