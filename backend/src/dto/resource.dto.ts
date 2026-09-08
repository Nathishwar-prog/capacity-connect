import { ResourceType, ResourceStatus } from '@prisma/client';

export interface CreateResourceDto {
    title: string;
    description?: string;
    resourceType: ResourceType;
    url?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    organizationId: string;
    uploadedBy: string;
}

export interface CreateLinkResourceDto {
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string;
    organizationId: string;
    uploadedBy: string;
}

export interface UpdateResourceMetadataDto {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
}

export interface ResourceListQueryDto {
    skip?: number;
    take?: number;
    resourceType?: ResourceType;
    status?: ResourceStatus | ResourceStatus[];
    organizationId?: string;
    uploadedBy?: string;
    search?: string;
}

export interface ApproveResourceDto {
    resourceId: string;
    approvedBy: string;
}

export interface RejectResourceDto {
    resourceId: string;
    rejectedBy: string;
    reason?: string;
}

export interface ResourceResponseDto {
    id: string;
    uploadedBy: string;
    organizationId: string;
    title: string;
    description: string | null;
    resourceType: ResourceType;
    storageKey: string;
    url: string | null;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
    thumbnailUrl: string | null;
    status: ResourceStatus;
    createdAt: Date;
    updatedAt: Date;
    uploader?: {
        id: string;
        firstName: string;
        lastName: string | null;
        email: string;
    };
}
