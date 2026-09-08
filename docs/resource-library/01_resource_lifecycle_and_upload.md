# 01 — Resource Lifecycle & File Upload Specifications

## Overview
The **Resource Library** module of Capacity Connect enables uploading, storing, and organizing learning materials supporting 6 core resource types:

1. **VIDEO**: MP4, WebM, QuickTime (`.mp4`, `.webm`, `.mov`)
2. **PDF**: Portable Document Format (`.pdf`)
3. **PRESENTATION**: PowerPoint presentation decks (`.ppt`, `.pptx`, `.pdf`)
4. **DOCUMENT**: Word documents and text (`.doc`, `.docx`, `.txt`)
5. **LINK**: External web URLs & data portals (`http://`, `https://`)
6. **IMAGE**: PNG, JPEG, SVG, WebP (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`)

---

## Resource Lifecycle & Status Transitions

```
 [Trainer Upload] ──> PENDING_APPROVAL ──(Admin Approve)──> PUBLISHED
                           │
                    (Admin Reject)
                           ▼
                        REJECTED

 [Admin Upload] ────────> PUBLISHED ──(Archive/Delete)──> DELETED (Soft-delete)
```

1. **DRAFT / PENDING_APPROVAL**:
   - Resources uploaded by `TRAINER` role start in `PENDING_APPROVAL` status.
   - Visible only to the uploading trainer, Admins, and Super Admins.
2. **PUBLISHED**:
   - Approved resources or resources uploaded directly by `ADMIN` or `SUPER_ADMIN`.
   - Visible to `TRAINEE` users and eligible for course & lesson attachments.
3. **REJECTED**:
   - Resources rejected by Administrators with feedback reasons.
4. **ARCHIVED / DELETED**:
   - Soft-deleted resources (`deletedAt IS NOT NULL`) hidden from standard queries.

---

## Storage & Security Middleware Architecture

- Files are uploaded using `multer` to `storage/uploads/`.
- Strict file type and MIME type validation ensures only permitted file extensions are accepted.
- Files are assigned sanitized, collision-resistant unique timestamps and filenames.
