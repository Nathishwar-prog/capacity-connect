import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { BadRequestError } from '../errors/app-error';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const safeBasename = path.basename(file.originalname)
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.+/g, '.');
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(safeBasename);
        const nameWithoutExt = path.basename(safeBasename, ext);
        cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext.toLowerCase()}`);
    },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    const allowedExts = ['.docx', '.pdf', '.doc'];
    const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/octet-stream', // Often sent by browsers for binary docs
    ];

    if (!allowedExts.includes(ext) && !allowedMimes.includes(mime)) {
        return cb(
            new BadRequestError(
                `Unsupported file type '${ext}'. Please upload a valid Microsoft Word (.docx) or Adobe PDF (.pdf) file.`
            )
        );
    }

    cb(null, true);
};

export const courseDocumentUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});

export default courseDocumentUpload;
