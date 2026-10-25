import path from 'path';
import { prisma } from '../../utils/prisma.js';
import { StorageService } from './storage.service.js';
import { storageConfig } from '../../config/storage.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';

export interface UploadFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export class DocumentService {
  /**
   * Upload a new confidential document to the vault.
   */
  public static async uploadDocument(
    organizationId: string,
    uploaderId: string,
    file: UploadFileInput,
    metadata: { title: string; description?: string }
  ) {
    // Validate MIME type
    if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError(`Unsupported file format (${file.mimetype}). Allowed types include PDF, DOCX, XLSX, TXT, CSV, PNG, JPG.`);
    }

    // Validate file size
    if (file.size > storageConfig.maxFileSizeBytes) {
      throw new BadRequestError(`File size exceeds limit (${storageConfig.maxFileSizeBytes / 1024 / 1024}MB)`);
    }

    const extension = path.extname(file.originalname).toLowerCase().replace('.', '') || 'bin';
    const storageKey = StorageService.generateStorageKey(organizationId, extension);

    // Persist file into private disk vault
    const { fileHashSha256, fileSizeBytes } = await StorageService.saveFile(storageKey, file.buffer);

    // Save document record in PostgreSQL
    const document = await prisma.document.create({
      data: {
        organizationId,
        uploaderId,
        title: metadata.title,
        description: metadata.description || null,
        originalFilename: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        fileSizeBytes,
        fileHashSha256,
      },
      include: {
        uploader: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Record audit event
    await AuditService.record({
      organizationId,
      actorId: uploaderId,
      action: 'DOCUMENT_UPLOAD',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      metadata: {
        title: document.title,
        filename: document.originalFilename,
        sizeBytes: document.fileSizeBytes,
        sha256: document.fileHashSha256,
      },
    });

    return document;
  }

  /**
   * Evaluates user permissions for a document.
   */
  public static async checkDocumentPermission(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string,
    requiredAction: 'VIEW' | 'DOWNLOAD' | 'EDIT_METADATA' | 'SHARE' | 'MANAGE_PERMISSIONS'
  ) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId, // Strict tenant boundary
      },
      include: {
        uploader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found in this organization');
    }

    // Admins and Document Managers have full organizational access
    if (userRole === 'ORG_ADMIN' || userRole === 'DOCUMENT_MANAGER') {
      return { document, hasPermission: true, isOwner: document.uploaderId === userId };
    }

    // Owner has full access to their own uploaded document
    if (document.uploaderId === userId) {
      return { document, hasPermission: true, isOwner: true };
    }

    // For Standard Users, evaluate active document shares
    const now = new Date();
    const activeShare = await prisma.documentShare.findFirst({
      where: {
        documentId,
        organizationId,
        revokedAt: null,
        OR: [
          { grantedToUserId: userId },
          { grantedToUserId: null }, // Org-wide share
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeShare) {
      return { document, hasPermission: false, isOwner: false };
    }

    // Check specific permission levels
    const permissionLevels: Record<string, string[]> = {
      VIEW: ['VIEW', 'DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS'],
      DOWNLOAD: ['DOWNLOAD', 'EDIT_METADATA', 'SHARE', 'MANAGE_PERMISSIONS'],
      EDIT_METADATA: ['EDIT_METADATA', 'MANAGE_PERMISSIONS'],
      SHARE: ['SHARE', 'MANAGE_PERMISSIONS'],
      MANAGE_PERMISSIONS: ['MANAGE_PERMISSIONS'],
    };

    const allowed = permissionLevels[requiredAction]?.includes(activeShare.permission);

    return { document, hasPermission: Boolean(allowed), isOwner: false, share: activeShare };
  }

  /**
   * List documents with filtering, search, and pagination.
   */
  public static async listDocuments(
    organizationId: string,
    userId: string,
    userRole: string,
    filters: {
      search?: string;
      mimeType?: string;
      uploaderId?: string;
      isArchived?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      isArchived: filters.isArchived ?? false,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { originalFilename: { contains: filters.search } },
      ];
    }

    if (filters.mimeType) {
      where.mimeType = filters.mimeType;
    }

    if (filters.uploaderId) {
      where.uploaderId = filters.uploaderId;
    }

    // Standard Users: Only see documents they own or have active shares for
    if (userRole === 'STANDARD_USER') {
      const now = new Date();
      where.AND = [
        {
          OR: [
            { uploaderId: userId },
            {
              shares: {
                some: {
                  revokedAt: null,
                  OR: [
                    { grantedToUserId: userId },
                    { grantedToUserId: null },
                  ],
                  AND: [
                    {
                      OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ];
    }

    const orderBy: any = {};
    const sortField = filters.sortBy || 'createdAt';
    orderBy[sortField] = filters.sortOrder || 'desc';

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          uploader: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: {
              shares: {
                where: {
                  revokedAt: null,
                  OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                  ],
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      documents: documents.map(d => ({
        ...d,
        activeSharesCount: d._count.shares,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Authorize and prepare document download stream.
   */
  public static async authorizeAndGetDownloadStream(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { document, hasPermission } = await this.checkDocumentPermission(
      organizationId,
      documentId,
      userId,
      userRole,
      'DOWNLOAD'
    );

    if (!hasPermission) {
      // Record unauthorized download attempt
      await AuditService.record({
        organizationId,
        actorId: userId,
        action: 'DOCUMENT_DOWNLOAD_UNAUTHORIZED',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        outcome: 'FAILURE',
        ipAddress,
        userAgent,
        metadata: { title: document.title },
      }).catch(() => {});

      throw new ForbiddenError('You do not have permission to download this document');
    }

    const { stream, size } = StorageService.getFileStream(document.storageKey);

    // Record successful download audit event
    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_DOWNLOAD',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      ipAddress,
      userAgent,
      metadata: {
        title: document.title,
        filename: document.originalFilename,
        sizeBytes: size,
      },
    });

    return {
      stream,
      filename: document.originalFilename,
      mimeType: document.mimeType,
      size,
    };
  }

  /**
   * Authorize preview of document.
   */
  public static async authorizeAndGetPreviewStream(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { document, hasPermission } = await this.checkDocumentPermission(
      organizationId,
      documentId,
      userId,
      userRole,
      'VIEW'
    );

    if (!hasPermission) {
      await AuditService.record({
        organizationId,
        actorId: userId,
        action: 'DOCUMENT_VIEW_UNAUTHORIZED',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        outcome: 'FAILURE',
        ipAddress,
        userAgent,
      }).catch(() => {});

      throw new ForbiddenError('You do not have permission to view this document');
    }

    const { stream, size } = StorageService.getFileStream(document.storageKey);

    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_PREVIEW',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      ipAddress,
      userAgent,
    });

    return {
      stream,
      filename: document.originalFilename,
      mimeType: document.mimeType,
      size,
    };
  }

  /**
   * Update document metadata.
   */
  public static async updateDocument(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string,
    data: { title?: string; description?: string; isArchived?: boolean }
  ) {
    const { document, hasPermission } = await this.checkDocumentPermission(
      organizationId,
      documentId,
      userId,
      userRole,
      'EDIT_METADATA'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to edit this document');
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data,
    });

    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_UPDATED',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      outcome: 'SUCCESS',
      metadata: data,
    });

    return updated;
  }

  /**
   * Delete or archive document.
   */
  public static async deleteDocument(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string
  ) {
    const { document, hasPermission } = await this.checkDocumentPermission(
      organizationId,
      documentId,
      userId,
      userRole,
      'MANAGE_PERMISSIONS'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to delete this document');
    }

    // Delete file from disk
    await StorageService.deleteFile(document.storageKey);

    // Delete record from database (cascade deletes shares)
    await prisma.document.delete({
      where: { id: documentId },
    });

    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_DELETED',
      resourceType: 'DOCUMENT',
      resourceId: documentId,
      outcome: 'SUCCESS',
      metadata: {
        title: document.title,
        filename: document.originalFilename,
      },
    });

    return { success: true };
  }
}
