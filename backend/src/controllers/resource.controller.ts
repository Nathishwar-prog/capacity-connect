import { Request, Response, NextFunction } from 'express';
import { ResourceService, UserContext } from '../services/resource.service';
import {
    CreateLinkResourceSchema,
    CreateFileResourceSchema,
    UpdateResourceMetadataSchema,
    RejectResourceSchema,
    ResourceListQuerySchema,
} from '../validators/resource.validation';
import { BadRequestError, UnauthorizedError } from '../errors/app-error';
import { StatusCodes } from 'http-status-codes';

export class ResourceController {
    constructor(private resourceService: ResourceService) { }

    private getUserContext(req: Request): UserContext {
        if (!req.user || !req.user.userId || !req.user.role) {
            throw new UnauthorizedError('User authentication context missing');
        }

        // Default to request organization or fallback
        const organizationId = (req as any).userOrganizationId || (req.user as any).organizationId || 'org-demo-id';
        return {
            userId: req.user.userId,
            email: req.user.email,
            role: req.user.role as any,
            organizationId,
        };
    }

    public uploadFileResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.file) {
                throw new BadRequestError('No file uploaded in form data field "file"');
            }

            const context = this.getUserContext(req);
            const validated = CreateFileResourceSchema.parse(req.body);

            const fileUrl = `/uploads/${req.file.filename}`;

            const resource = await this.resourceService.createResource(
                {
                    title: validated.title,
                    description: validated.description,
                    resourceType: validated.resourceType,
                    url: fileUrl,
                    fileName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    fileSize: req.file.size,
                    thumbnailUrl: validated.thumbnailUrl,
                },
                context
            );

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Resource file uploaded successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public createLinkResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const validated = CreateLinkResourceSchema.parse(req.body);

            const resource = await this.resourceService.createLinkResource(
                {
                    title: validated.title,
                    description: validated.description,
                    url: validated.url,
                    thumbnailUrl: validated.thumbnailUrl,
                },
                context
            );

            res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Link resource created successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public getResourceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const resource = await this.resourceService.getResourceById(req.params.id, context);

            res.status(StatusCodes.OK).json({
                success: true,
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public listResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const query = ResourceListQuerySchema.parse(req.query);

            const result = await this.resourceService.listResources(query, context);

            res.status(StatusCodes.OK).json({
                success: true,
                data: result.resources,
                pagination: {
                    total: result.total,
                    skip: query.skip,
                    take: query.take,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    public updateMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const validated = UpdateResourceMetadataSchema.parse(req.body);

            const resource = await this.resourceService.updateMetadata(req.params.id, validated, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource metadata updated successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public approveResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const resource = await this.resourceService.approveResource(req.params.id, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource approved successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public rejectResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const body = RejectResourceSchema.parse(req.body || {});

            const resource = await this.resourceService.rejectResource(req.params.id, body.reason, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource rejected successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public publishResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const resource = await this.resourceService.publishResource(req.params.id, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource published successfully',
                data: resource,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            await this.resourceService.deleteResource(req.params.id, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    public attachToCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const { courseId, resourceId } = req.params;

            await this.resourceService.attachToCourse(courseId, resourceId, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource attached to course successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    public detachFromCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const { courseId, resourceId } = req.params;

            await this.resourceService.detachFromCourse(courseId, resourceId, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource detached from course successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    public attachToLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const { lessonId, resourceId } = req.params;

            await this.resourceService.attachToLesson(lessonId, resourceId, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource attached to lesson successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    public detachFromLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = this.getUserContext(req);
            const { lessonId, resourceId } = req.params;

            await this.resourceService.detachFromLesson(lessonId, resourceId, context);

            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Resource detached from lesson successfully',
            });
        } catch (error) {
            next(error);
        }
    };
}

export default ResourceController;
