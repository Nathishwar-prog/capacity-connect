import { Resource, ResourceStatus, ResourceType, Role } from '@prisma/client';
import { IResourceRepository } from '../repositories/resource.repository';
import { ICourseRepository } from '../repositories/course.repository';
import {
    CreateResourceDto,
    CreateLinkResourceDto,
    UpdateResourceMetadataDto,
    ResourceListQueryDto,
} from '../dto/resource.dto';
import {
    NotFoundError,
    BadRequestError,
    ForbiddenError,
} from '../errors/app-error';

export interface UserContext {
    userId: string;
    email: string;
    role: Role;
    organizationId: string;
}

export class ResourceService {
    constructor(
        private resourceRepo: IResourceRepository,
        private courseRepo: ICourseRepository,
    ) { }

    public async createResource(
        dto: Omit<CreateResourceDto, 'uploadedBy' | 'organizationId'>,
        context: UserContext
    ): Promise<Resource> {
        // Enforce role permission
        if (context.role === Role.TRAINEE) {
            throw new ForbiddenError('Trainees are not authorized to upload or create resources');
        }

        // Determine initial status: Admin uploaded -> PUBLISHED directly, Trainer uploaded -> PENDING_APPROVAL
        const initialStatus =
            context.role === Role.ADMIN || context.role === Role.SUPER_ADMIN
                ? ResourceStatus.PUBLISHED
                : ResourceStatus.PENDING_APPROVAL;

        const resource = await this.resourceRepo.create({
            ...dto,
            uploadedBy: context.userId,
            organizationId: context.organizationId,
        });

        // Set status based on user role
        return this.resourceRepo.updateStatus(resource.id, initialStatus);
    }

    public async createLinkResource(
        dto: Omit<CreateLinkResourceDto, 'uploadedBy' | 'organizationId'>,
        context: UserContext
    ): Promise<Resource> {
        if (context.role === Role.TRAINEE) {
            throw new ForbiddenError('Trainees are not authorized to create link resources');
        }

        const initialStatus =
            context.role === Role.ADMIN || context.role === Role.SUPER_ADMIN
                ? ResourceStatus.PUBLISHED
                : ResourceStatus.PENDING_APPROVAL;

        const resource = await this.resourceRepo.create({
            title: dto.title,
            description: dto.description,
            resourceType: ResourceType.LINK,
            url: dto.url,
            thumbnailUrl: dto.thumbnailUrl,
            uploadedBy: context.userId,
            organizationId: context.organizationId,
        });

        return this.resourceRepo.updateStatus(resource.id, initialStatus);
    }

    public async getResourceById(id: string, context: UserContext): Promise<Resource> {
        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        // Organization isolation check
        if (context.role !== Role.SUPER_ADMIN && resource.organizationId !== context.organizationId) {
            throw new ForbiddenError('You cannot access resources outside your organization');
        }

        // Trainee access rule: Must be PUBLISHED
        if (context.role === Role.TRAINEE && resource.status !== ResourceStatus.PUBLISHED) {
            throw new ForbiddenError('Trainees can only access published resources');
        }

        // Trainer access rule: Must be owner, admin, or PUBLISHED
        if (
            context.role === Role.TRAINER &&
            resource.uploadedBy !== context.userId &&
            resource.status !== ResourceStatus.PUBLISHED
        ) {
            throw new ForbiddenError('Trainers can only view their own resources or published resources');
        }

        return resource;
    }

    public async listResources(
        query: ResourceListQueryDto,
        context: UserContext
    ): Promise<{ resources: Resource[]; total: number }> {
        const listQuery: ResourceListQueryDto = {
            ...query,
            organizationId: context.role === Role.SUPER_ADMIN ? query.organizationId : context.organizationId,
        };

        // Trainee query restriction: Force status = PUBLISHED
        if (context.role === Role.TRAINEE) {
            listQuery.status = ResourceStatus.PUBLISHED;
        }

        return this.resourceRepo.findAll(listQuery);
    }

    public async updateMetadata(
        id: string,
        dto: UpdateResourceMetadataDto,
        context: UserContext
    ): Promise<Resource> {
        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        // Ownership or Admin guard
        if (
            context.role !== Role.SUPER_ADMIN &&
            context.role !== Role.ADMIN &&
            resource.uploadedBy !== context.userId
        ) {
            throw new ForbiddenError('You can only update your own resources');
        }

        return this.resourceRepo.updateMetadata(id, dto);
    }

    public async approveResource(id: string, context: UserContext): Promise<Resource> {
        // Privileged operation check
        if (context.role !== Role.ADMIN && context.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only Administrators can approve resources');
        }

        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        if (resource.status !== ResourceStatus.PENDING_APPROVAL && resource.status !== ResourceStatus.DRAFT) {
            throw new BadRequestError(`Cannot approve resource in '${resource.status}' status`);
        }

        return this.resourceRepo.updateStatus(id, ResourceStatus.PUBLISHED);
    }

    public async rejectResource(id: string, _reason: string | undefined, context: UserContext): Promise<Resource> {
        if (context.role !== Role.ADMIN && context.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only Administrators can reject resources');
        }

        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        if (resource.status !== ResourceStatus.PENDING_APPROVAL && resource.status !== ResourceStatus.DRAFT) {
            throw new BadRequestError(`Cannot reject resource in '${resource.status}' status`);
        }

        return this.resourceRepo.updateStatus(id, ResourceStatus.REJECTED);
    }

    public async publishResource(id: string, context: UserContext): Promise<Resource> {
        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        if (
            context.role !== Role.SUPER_ADMIN &&
            context.role !== Role.ADMIN &&
            resource.uploadedBy !== context.userId
        ) {
            throw new ForbiddenError('You can only publish resources you own');
        }

        return this.resourceRepo.updateStatus(id, ResourceStatus.PUBLISHED);
    }

    public async deleteResource(id: string, context: UserContext): Promise<Resource> {
        const resource = await this.resourceRepo.findById(id);
        if (!resource) {
            throw new NotFoundError('Resource not found');
        }

        if (
            context.role !== Role.SUPER_ADMIN &&
            context.role !== Role.ADMIN &&
            resource.uploadedBy !== context.userId
        ) {
            throw new ForbiddenError('You can only delete resources you own');
        }

        return this.resourceRepo.softDelete(id);
    }

    public async attachToCourse(courseId: string, resourceId: string, context: UserContext): Promise<void> {
        const [course, resource] = await Promise.all([
            this.courseRepo.findById(courseId),
            this.resourceRepo.findById(resourceId),
        ]);

        if (!course) throw new NotFoundError('Course not found');
        if (!resource) throw new NotFoundError('Resource not found');

        // Organization boundary
        if (context.role !== Role.SUPER_ADMIN && course.organizationId !== context.organizationId) {
            throw new ForbiddenError('Course belongs to a different organization');
        }

        // Ownership guard
        if (
            context.role !== Role.SUPER_ADMIN &&
            context.role !== Role.ADMIN &&
            course.trainerId !== context.userId
        ) {
            throw new ForbiddenError('You can only attach resources to courses you teach');
        }

        // Publication guard
        if (
            context.role !== Role.ADMIN &&
            context.role !== Role.SUPER_ADMIN &&
            resource.status !== ResourceStatus.PUBLISHED
        ) {
            throw new BadRequestError('Only published resources can be attached to a course');
        }

        await this.resourceRepo.attachToCourse(courseId, resourceId);
    }

    public async detachFromCourse(courseId: string, resourceId: string, context: UserContext): Promise<void> {
        const course = await this.courseRepo.findById(courseId);
        if (!course) throw new NotFoundError('Course not found');

        if (
            context.role !== Role.SUPER_ADMIN &&
            context.role !== Role.ADMIN &&
            course.trainerId !== context.userId
        ) {
            throw new ForbiddenError('You can only detach resources from courses you teach');
        }

        await this.resourceRepo.detachFromCourse(courseId, resourceId);
    }

    public async attachToLesson(lessonId: string, resourceId: string, context: UserContext): Promise<void> {
        const resource = await this.resourceRepo.findById(resourceId);
        if (!resource) throw new NotFoundError('Resource not found');

        if (
            context.role !== Role.ADMIN &&
            context.role !== Role.SUPER_ADMIN &&
            resource.status !== ResourceStatus.PUBLISHED
        ) {
            throw new BadRequestError('Only published resources can be attached to a lesson');
        }

        await this.resourceRepo.attachToLesson(lessonId, resourceId);
    }

    public async detachFromLesson(lessonId: string, _resourceId: string, _context: UserContext): Promise<void> {
        await this.resourceRepo.detachFromLesson(lessonId, _resourceId);
    }
}

export default ResourceService;
