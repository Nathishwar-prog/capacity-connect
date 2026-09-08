import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../auth/auth.middleware';
import { Permissions } from '../permissions';
import { upload } from '../middlewares/upload.middleware';
import { ResourceController } from '../controllers/resource.controller';
import { ResourceService } from '../services/resource.service';
import { ResourceRepository } from '../repositories/resource.repository';
import { CourseRepository } from '../repositories/course.repository';
import { Role } from '@prisma/client';

const resourceRepo = new ResourceRepository();
const courseRepo = new CourseRepository();
const resourceService = new ResourceService(resourceRepo, courseRepo);
const resourceController = new ResourceController(resourceService);

const router = Router();

// All routes require authentication
router.use(authenticate);

// List resources
router.get(
    '/',
    requirePermission(Permissions.RESOURCES_READ),
    resourceController.listResources
);

// Create link resource
router.post(
    '/link',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_CREATE),
    resourceController.createLinkResource
);

// Upload file resource
router.post(
    '/upload',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_CREATE),
    upload.single('file'),
    resourceController.uploadFileResource
);

// Get single resource by ID
router.get(
    '/:id',
    requirePermission(Permissions.RESOURCES_READ),
    resourceController.getResourceById
);

// Update resource metadata
router.patch(
    '/:id',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_UPDATE),
    resourceController.updateMetadata
);

// Delete/Archive resource
router.delete(
    '/:id',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_DELETE),
    resourceController.deleteResource
);

// Approve resource (Admin only)
router.patch(
    '/:id/approve',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_APPROVE),
    resourceController.approveResource
);

// Reject resource (Admin only)
router.patch(
    '/:id/reject',
    requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_APPROVE),
    resourceController.rejectResource
);

// Publish resource
router.patch(
    '/:id/publish',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    requirePermission(Permissions.RESOURCES_PUBLISH),
    resourceController.publishResource
);

// Course & Lesson Attachments
router.post(
    '/courses/:courseId/attach/:resourceId',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    resourceController.attachToCourse
);

router.delete(
    '/courses/:courseId/detach/:resourceId',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    resourceController.detachFromCourse
);

router.post(
    '/lessons/:lessonId/attach/:resourceId',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    resourceController.attachToLesson
);

router.delete(
    '/lessons/:lessonId/detach/:resourceId',
    requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
    resourceController.detachFromLesson
);

export default router;
