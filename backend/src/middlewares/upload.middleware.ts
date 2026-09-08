import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { BadRequestError } from '../errors/app-error';
import { ResourceType } from '@prisma/client';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration with filename sanitization
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        // Sanitize original filename: remove path traversal characters (../, ..\) and non-alphanumeric chars
        const safeBasename = path.basename(file.originalname)
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.+/g, '.');
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(safeBasename);
        const nameWithoutExt = path.basename(safeBasename, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext.toLowerCase()}`);
    },
});

// Allowed MIME types & extensions by ResourceType
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    PDF: ['application/pdf'],
    PRESENTATION: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/octet-stream',
    ],
    DOCUMENT: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
    ],
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
};

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
    VIDEO: ['.mp4', '.webm', '.ogv', '.mov'],
    PDF: ['.pdf'],
    PRESENTATION: ['.ppt', '.pptx'],
    DOCUMENT: ['.doc', '.docx', '.txt', '.rtf'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const rawResourceType = req.body?.resourceType;
    if (!rawResourceType) {
        return cb(new BadRequestError('resourceType parameter is required before file payload'));
    }

    const resourceType = String(rawResourceType).toUpperCase();
    if (resourceType === ResourceType.LINK) {
        return cb(new BadRequestError('File upload is prohibited for LINK resource type'));
    }

    const allowedMimes = ALLOWED_MIME_TYPES[resourceType];
    const allowedExts = ALLOWED_EXTENSIONS[resourceType];

    if (!allowedMimes || !allowedExts) {
        return cb(new BadRequestError(`Unsupported or invalid resourceType: ${rawResourceType}`));
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    const mimeValid = allowedMimes.includes(mime);
    const extValid = allowedExts.includes(ext);

    if (!mimeValid && !extValid) {
        return cb(
            new BadRequestError(
                `File type mismatch. Ext '${ext}' or MIME '${file.mimetype}' is not allowed for resourceType '${resourceType}'`
            )
        );
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB maximum file size
    },
});

export default upload;
