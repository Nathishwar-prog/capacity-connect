import { z } from 'zod';
import { ResourceType, ResourceStatus } from '@prisma/client';

export const CreateLinkResourceSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    resourceType: z.literal(ResourceType.LINK),
    url: z.string().url('Invalid URL format').refine((val) => {
        return val.startsWith('http://') || val.startsWith('https://');
    }, 'URL must use HTTP or HTTPS protocol'),
    thumbnailUrl: z.string().url('Invalid thumbnail URL format').optional(),
});

export const CreateFileResourceSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    resourceType: z.nativeEnum(ResourceType).refine((val) => val !== ResourceType.LINK, {
        message: 'For LINK resource type, use link creation endpoint without file payload',
    }),
    thumbnailUrl: z.string().url('Invalid thumbnail URL format').optional(),
});

export const UpdateResourceMetadataSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters').optional(),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    thumbnailUrl: z.string().url('Invalid thumbnail URL format').optional(),
});

export const RejectResourceSchema = z.object({
    reason: z.string().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

export const ResourceListQuerySchema = z.object({
    skip: z.coerce.number().min(0).optional().default(0),
    take: z.coerce.number().min(1).max(100).optional().default(20),
    resourceType: z.nativeEnum(ResourceType).optional(),
    status: z.union([z.nativeEnum(ResourceStatus), z.array(z.nativeEnum(ResourceStatus))]).optional(),
    search: z.string().optional(),
});
