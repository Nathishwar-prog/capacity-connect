import prisma from '../database/client';
import { Resource, ResourceStatus } from '@prisma/client';
import { CreateResourceDto, UpdateResourceMetadataDto, ResourceListQueryDto } from '../dto/resource.dto';

export interface IResourceRepository {
    findById(id: string): Promise<Resource | null>;
    findAll(params: ResourceListQueryDto): Promise<{ resources: Resource[]; total: number }>;
    create(data: CreateResourceDto): Promise<Resource>;
    updateMetadata(id: string, data: UpdateResourceMetadataDto): Promise<Resource>;
    updateStatus(id: string, status: ResourceStatus): Promise<Resource>;
    softDelete(id: string): Promise<Resource>;
    attachToCourse(courseId: string, resourceId: string): Promise<void>;
    detachFromCourse(courseId: string, resourceId: string): Promise<void>;
    isAttachedToCourse(courseId: string, resourceId: string): Promise<boolean>;
    attachToLesson(lessonId: string, resourceId: string): Promise<void>;
    detachFromLesson(lessonId: string, resourceId: string): Promise<void>;
    isAttachedToLesson(lessonId: string, resourceId: string): Promise<boolean>;
}

export class ResourceRepository implements IResourceRepository {
    public async findById(id: string): Promise<Resource | null> {
        return prisma.resource.findFirst({
            where: { id, deletedAt: null },
            include: {
                uploader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    public async findAll(params: ResourceListQueryDto): Promise<{ resources: Resource[]; total: number }> {
        const { skip = 0, take = 20, resourceType, status, organizationId, uploadedBy, search } = params;

        const where: any = {
            deletedAt: null,
        };

        if (organizationId) where.organizationId = organizationId;
        if (uploadedBy) where.uploadedBy = uploadedBy;
        if (resourceType) where.resourceType = resourceType;

        if (status) {
            if (Array.isArray(status)) {
                where.status = { in: status };
            } else {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { fileName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [resources, total] = await Promise.all([
            prisma.resource.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploader: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.resource.count({ where }),
        ]);

        return { resources, total };
    }

    public async create(data: CreateResourceDto): Promise<Resource> {
        return prisma.resource.create({
            data: {
                title: data.title,
                description: data.description,
                resourceType: data.resourceType,
                storageKey: data.url || data.fileName || `resources/${Date.now()}`,
                url: data.url,
                fileName: data.fileName,
                mimeType: data.mimeType,
                fileSize: data.fileSize ? BigInt(data.fileSize) : null,
                thumbnailUrl: data.thumbnailUrl,
                status: ResourceStatus.DRAFT,
                uploadedBy: data.uploadedBy,
                organizationId: data.organizationId,
            },
        });
    }

    public async updateMetadata(id: string, data: UpdateResourceMetadataDto): Promise<Resource> {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;

        return prisma.resource.update({
            where: { id },
            data: updateData,
        });
    }

    public async updateStatus(id: string, status: ResourceStatus): Promise<Resource> {
        return prisma.resource.update({
            where: { id },
            data: { status },
        });
    }

    public async softDelete(id: string): Promise<Resource> {
        return prisma.resource.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: ResourceStatus.ARCHIVED,
            },
        });
    }

    public async attachToCourse(courseId: string, resourceId: string): Promise<void> {
        await prisma.courseResource.upsert({
            where: {
                courseId_resourceId: { courseId, resourceId },
            },
            create: { courseId, resourceId },
            update: {},
        });
    }

    public async detachFromCourse(courseId: string, resourceId: string): Promise<void> {
        await prisma.courseResource.deleteMany({
            where: { courseId, resourceId },
        });
    }

    public async isAttachedToCourse(courseId: string, resourceId: string): Promise<boolean> {
        const count = await prisma.courseResource.count({
            where: { courseId, resourceId },
        });
        return count > 0;
    }

    public async attachToLesson(lessonId: string, resourceId: string): Promise<void> {
        await prisma.lessonResource.upsert({
            where: {
                lessonId_resourceId: { lessonId, resourceId },
            },
            create: { lessonId, resourceId },
            update: {},
        });
    }

    public async detachFromLesson(lessonId: string, resourceId: string): Promise<void> {
        await prisma.lessonResource.deleteMany({
            where: { lessonId, resourceId },
        });
    }

    public async isAttachedToLesson(lessonId: string, resourceId: string): Promise<boolean> {
        const count = await prisma.lessonResource.count({
            where: { lessonId, resourceId },
        });
        return count > 0;
    }
}

export default ResourceRepository;
