import { LessonContentType } from '@prisma/client';

export interface CreateModuleDto {
    title: string;
    description?: string;
    orderIndex?: number;
}

export interface UpdateModuleDto {
    title?: string;
    description?: string;
    orderIndex?: number;
}

export interface ModuleOrderInput {
    id: string;
    orderIndex: number;
}

export interface ReorderModulesDto {
    moduleOrders: ModuleOrderInput[];
}

export interface CreateLessonDto {
    title: string;
    description?: string;
    contentType?: LessonContentType;
    content?: string;
    resourceUrl?: string;
    durationMinutes?: number;
    orderIndex?: number;
    isPreview?: boolean;
}

export interface UpdateLessonDto {
    title?: string;
    description?: string;
    contentType?: LessonContentType;
    content?: string;
    resourceUrl?: string;
    durationMinutes?: number;
    orderIndex?: number;
    isPreview?: boolean;
}

export interface LessonOrderInput {
    id: string;
    orderIndex: number;
}

export interface ReorderLessonsDto {
    lessonOrders: LessonOrderInput[];
}

export interface AttachLessonResourceDto {
    resourceId: string;
}
