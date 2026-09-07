import { ResourceService, UserContext } from '../services/resource.service';
import { ResourceRepository } from '../repositories/resource.repository';
import { CourseRepository } from '../repositories/course.repository';
import prisma from '../database/client';
import { ResourceType, ResourceStatus, Role } from '@prisma/client';
import { ForbiddenError, BadRequestError, NotFoundError } from '../errors/app-error';

describe('ResourceService Integration & Unit Test Suite', () => {
    let resourceService: ResourceService;
    let resourceRepo: ResourceRepository;
    let courseRepo: CourseRepository;

    let adminContext: UserContext;
    let trainerContext: UserContext;
    let traineeContext: UserContext;
    let courseId: string;
    let lessonId: string;

    const createdResourceIds: string[] = [];

    beforeAll(async () => {
        resourceRepo = new ResourceRepository();
        courseRepo = new CourseRepository();
        resourceService = new ResourceService(resourceRepo, courseRepo);

        // Fetch canonical seed users
        const [adminUser, trainerUser, traineeUser] = await Promise.all([
            prisma.user.findUnique({ where: { email: 'admin@enterprise.com' } }),
            prisma.user.findUnique({ where: { email: 'alex.trainer@enterprise.com' } }),
            prisma.user.findUnique({ where: { email: 'user@enterprise.com' } }),
        ]);

        if (!adminUser || !trainerUser || !traineeUser) {
            throw new Error('Canonical seed users not found in database! Ensure database is seeded.');
        }

        adminContext = {
            userId: adminUser.id,
            email: adminUser.email,
            role: Role.ADMIN,
            organizationId: adminUser.organizationId,
        };

        trainerContext = {
            userId: trainerUser.id,
            email: trainerUser.email,
            role: Role.TRAINER,
            organizationId: trainerUser.organizationId,
        };

        traineeContext = {
            userId: traineeUser.id,
            email: traineeUser.email,
            role: Role.TRAINEE,
            organizationId: traineeUser.organizationId,
        };

        // Fetch a seeded course and lesson for attachment testing
        const course = await prisma.course.findFirst({
            where: { trainerId: trainerUser.id },
            include: { modules: { include: { lessons: true } } },
        });

        if (!course || !course.modules[0]?.lessons[0]) {
            throw new Error('Seeded course or lesson not found for testing');
        }

        courseId = course.id;
        lessonId = course.modules[0].lessons[0].id;
    });

    afterAll(async () => {
        // Cleanup resources created during tests
        if (createdResourceIds.length > 0) {
            await prisma.lessonResource.deleteMany({
                where: { resourceId: { in: createdResourceIds } },
            });
            await prisma.courseResource.deleteMany({
                where: { resourceId: { in: createdResourceIds } },
            });
            await prisma.resource.deleteMany({
                where: { id: { in: createdResourceIds } },
            });
        }
        await prisma.$disconnect();
    });

    describe('1. Resource Creation & All 6 Resource Types', () => {
        it('1.1 Should allow Trainer to create a LINK resource (initial status: PENDING_APPROVAL)', async () => {
            const linkResource = await resourceService.createLinkResource(
                {
                    title: 'Interactive Python Docs Link',
                    description: 'Official Python documentation link',
                    url: 'https://docs.python.org/3/',
                },
                trainerContext
            );

            expect(linkResource).toBeDefined();
            expect(linkResource.resourceType).toBe(ResourceType.LINK);
            expect(linkResource.status).toBe(ResourceStatus.PENDING_APPROVAL);
            expect(linkResource.uploadedBy).toBe(trainerContext.userId);

            createdResourceIds.push(linkResource.id);
        });

        it('1.2 Should allow Admin to create a LINK resource (initial status: PUBLISHED)', async () => {
            const linkResource = await resourceService.createLinkResource(
                {
                    title: 'Admin Infrastructure Portal',
                    description: 'Link for admins',
                    url: 'https://portal.enterprise.com',
                },
                adminContext
            );

            expect(linkResource.status).toBe(ResourceStatus.PUBLISHED);
            createdResourceIds.push(linkResource.id);
        });

        it('1.3 Should support creating resources for VIDEO, PDF, PRESENTATION, DOCUMENT, and IMAGE', async () => {
            const types: Array<{ type: ResourceType; ext: string; mime: string }> = [
                { type: ResourceType.VIDEO, ext: 'mp4', mime: 'video/mp4' },
                { type: ResourceType.PDF, ext: 'pdf', mime: 'application/pdf' },
                { type: ResourceType.PRESENTATION, ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
                { type: ResourceType.DOCUMENT, ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
                { type: ResourceType.IMAGE, ext: 'png', mime: 'image/png' },
            ];

            for (const item of types) {
                const res = await resourceService.createResource(
                    {
                        title: `Test Resource ${item.type}`,
                        description: `Description for ${item.type}`,
                        resourceType: item.type,
                        url: `/uploads/sample-${item.type.toLowerCase()}.${item.ext}`,
                        fileName: `sample-${item.type.toLowerCase()}.${item.ext}`,
                        mimeType: item.mime,
                        fileSize: 1024 * 500,
                    },
                    trainerContext
                );

                expect(res).toBeDefined();
                expect(res.resourceType).toBe(item.type);
                expect(res.status).toBe(ResourceStatus.PENDING_APPROVAL);
                createdResourceIds.push(res.id);
            }
        });

        it('1.4 Should prevent Trainee from creating or uploading resources', async () => {
            await expect(
                resourceService.createLinkResource(
                    {
                        title: 'Trainee Unauthorized Link',
                        url: 'https://example.com',
                    },
                    traineeContext
                )
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('2. Approval & Rejection Workflow', () => {
        let pendingResourceId: string;

        beforeEach(async () => {
            const res = await resourceService.createLinkResource(
                {
                    title: 'Pending Review Material',
                    url: 'https://review.enterprise.com',
                },
                trainerContext
            );
            pendingResourceId = res.id;
            createdResourceIds.push(res.id);
        });

        it('2.1 Should allow Admin to approve a resource (PENDING_APPROVAL -> PUBLISHED)', async () => {
            const approved = await resourceService.approveResource(pendingResourceId, adminContext);
            expect(approved.status).toBe(ResourceStatus.PUBLISHED);
        });

        it('2.2 Should allow Admin to reject a resource (PENDING_APPROVAL -> REJECTED)', async () => {
            const rejected = await resourceService.rejectResource(pendingResourceId, 'Inappropriate material', adminContext);
            expect(rejected.status).toBe(ResourceStatus.REJECTED);
        });

        it('2.3 Should prevent Non-Admin from approving or rejecting resources', async () => {
            await expect(
                resourceService.approveResource(pendingResourceId, trainerContext)
            ).rejects.toThrow(ForbiddenError);

            await expect(
                resourceService.rejectResource(pendingResourceId, 'Reason', trainerContext)
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('3. Metadata Updates & IDOR Ownership Protection', () => {
        let resourceId: string;

        beforeAll(async () => {
            const res = await resourceService.createLinkResource(
                {
                    title: 'Original Title',
                    description: 'Original Description',
                    url: 'https://original.com',
                },
                trainerContext
            );
            resourceId = res.id;
            createdResourceIds.push(res.id);
        });

        it('3.1 Should allow Resource Owner to update metadata', async () => {
            const updated = await resourceService.updateMetadata(
                resourceId,
                {
                    title: 'Updated Title',
                    description: 'Updated Description',
                },
                trainerContext
            );

            expect(updated.title).toBe('Updated Title');
            expect(updated.description).toBe('Updated Description');
        });

        it('3.2 Should prevent non-owner Trainer from updating metadata (IDOR)', async () => {
            const anotherTrainerContext: UserContext = {
                userId: '00000000-0000-0000-0000-000000000000',
                email: 'other.trainer@enterprise.com',
                role: Role.TRAINER,
                organizationId: trainerContext.organizationId,
            };

            await expect(
                resourceService.updateMetadata(
                    resourceId,
                    { title: 'Hacked Title' },
                    anotherTrainerContext
                )
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('4. RBAC & Visibility Matrix', () => {
        let publishedResId: string;
        let pendingResId: string;

        beforeAll(async () => {
            const pub = await resourceService.createLinkResource(
                { title: 'Public Resource', url: 'https://public.com' },
                adminContext
            );
            publishedResId = pub.id;
            createdResourceIds.push(pub.id);

            const pend = await resourceService.createLinkResource(
                { title: 'Internal Draft', url: 'https://internal.com' },
                trainerContext
            );
            pendingResId = pend.id;
            createdResourceIds.push(pend.id);
        });

        it('4.1 Trainees should be able to access PUBLISHED resources', async () => {
            const res = await resourceService.getResourceById(publishedResId, traineeContext);
            expect(res.id).toBe(publishedResId);
        });

        it('4.2 Trainees should NOT be able to access PENDING_APPROVAL or DRAFT resources', async () => {
            await expect(
                resourceService.getResourceById(pendingResId, traineeContext)
            ).rejects.toThrow(ForbiddenError);
        });

        it('4.3 Trainees should only get PUBLISHED resources in list query', async () => {
            const list = await resourceService.listResources({}, traineeContext);
            expect(list.resources.every(r => r.status === ResourceStatus.PUBLISHED)).toBe(true);
        });
    });

    describe('5. Course & Lesson Attachments', () => {
        let publishedResourceId: string;
        let pendingResourceId: string;

        beforeAll(async () => {
            const pub = await resourceService.createLinkResource(
                { title: 'Course Attachment Resource', url: 'https://attach.com' },
                adminContext
            );
            publishedResourceId = pub.id;
            createdResourceIds.push(pub.id);

            const pend = await resourceService.createLinkResource(
                { title: 'Unapproved Attachment', url: 'https://unapproved.com' },
                trainerContext
            );
            pendingResourceId = pend.id;
            createdResourceIds.push(pend.id);
        });

        it('5.1 Should attach and detach a published resource to/from a Course', async () => {
            await expect(
                resourceService.attachToCourse(courseId, publishedResourceId, trainerContext)
            ).resolves.not.toThrow();

            const isAttached = await resourceRepo.isAttachedToCourse(courseId, publishedResourceId);
            expect(isAttached).toBe(true);

            await expect(
                resourceService.detachFromCourse(courseId, publishedResourceId, trainerContext)
            ).resolves.not.toThrow();

            const isStillAttached = await resourceRepo.isAttachedToCourse(courseId, publishedResourceId);
            expect(isStillAttached).toBe(false);
        });

        it('5.2 Should prevent attaching an unapproved resource to a Course for non-admin', async () => {
            await expect(
                resourceService.attachToCourse(courseId, pendingResourceId, trainerContext)
            ).rejects.toThrow(BadRequestError);
        });

        it('5.3 Should attach and detach a published resource to/from a Lesson', async () => {
            await expect(
                resourceService.attachToLesson(lessonId, publishedResourceId, trainerContext)
            ).resolves.not.toThrow();

            const isAttached = await resourceRepo.isAttachedToLesson(lessonId, publishedResourceId);
            expect(isAttached).toBe(true);

            await expect(
                resourceService.detachFromLesson(lessonId, publishedResourceId, trainerContext)
            ).resolves.not.toThrow();

            const isStillAttached = await resourceRepo.isAttachedToLesson(lessonId, publishedResourceId);
            expect(isStillAttached).toBe(false);
        });
    });
});
