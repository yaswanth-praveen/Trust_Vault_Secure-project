import { prisma } from '../../utils/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { DocumentService } from '../documents/document.service.js';
import { AuditService } from '../audit/audit.service.js';

export class ShareService {
  /**
   * Grants a document share permission to a user or the entire organization.
   */
  public static async createShare(
    organizationId: string,
    documentId: string,
    sharedByUserId: string,
    userRole: string,
    data: {
      grantedToUserId?: string;
      permission: 'VIEW' | 'DOWNLOAD' | 'EDIT_METADATA' | 'SHARE' | 'MANAGE_PERMISSIONS';
      expiresAt?: string;
    }
  ) {
    const { document, hasPermission } = await DocumentService.checkDocumentPermission(
      organizationId,
      documentId,
      sharedByUserId,
      userRole,
      'SHARE'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to share this document');
    }

    // If sharing with a specific user, verify user belongs to the same organization!
    if (data.grantedToUserId) {
      const recipientMembership = await prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: data.grantedToUserId,
          },
        },
      });

      if (!recipientMembership) {
        throw new BadRequestError('Recipient is not a member of this organization');
      }
    }

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    const share = await prisma.documentShare.create({
      data: {
        documentId,
        organizationId,
        grantedToUserId: data.grantedToUserId || null,
        sharedByUserId,
        permission: data.permission,
        expiresAt,
      },
      include: {
        grantedToUser: {
          select: { id: true, fullName: true, email: true },
        },
        sharedByUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    await AuditService.record({
      organizationId,
      actorId: sharedByUserId,
      action: 'DOCUMENT_SHARED',
      resourceType: 'DOCUMENT_SHARE',
      resourceId: share.id,
      outcome: 'SUCCESS',
      metadata: {
        documentId,
        documentTitle: document.title,
        grantedToUserId: data.grantedToUserId || 'ORGANIZATION_WIDE',
        permission: data.permission,
        expiresAt: expiresAt?.toISOString(),
      },
    });

    return share;
  }

  /**
   * Retrieves all shares for a document categorized by active, expired, or revoked.
   */
  public static async listShares(
    organizationId: string,
    documentId: string,
    userId: string,
    userRole: string
  ) {
    const { hasPermission } = await DocumentService.checkDocumentPermission(
      organizationId,
      documentId,
      userId,
      userRole,
      'VIEW'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have access to view this document shares');
    }

    const shares = await prisma.documentShare.findMany({
      where: {
        documentId,
        organizationId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        grantedToUser: {
          select: { id: true, fullName: true, email: true },
        },
        sharedByUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const now = new Date();

    return shares.map(share => {
      let status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' = 'ACTIVE';
      if (share.revokedAt) {
        status = 'REVOKED';
      } else if (share.expiresAt && share.expiresAt < now) {
        status = 'EXPIRED';
      }

      return {
        ...share,
        status,
      };
    });
  }

  /**
   * Update share permission or expiration date.
   */
  public static async updateShare(
    organizationId: string,
    shareId: string,
    userId: string,
    userRole: string,
    data: {
      permission?: 'VIEW' | 'DOWNLOAD' | 'EDIT_METADATA' | 'SHARE' | 'MANAGE_PERMISSIONS';
      expiresAt?: string | null;
    }
  ) {
    const share = await prisma.documentShare.findFirst({
      where: { id: shareId, organizationId },
    });

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    const { hasPermission } = await DocumentService.checkDocumentPermission(
      organizationId,
      share.documentId,
      userId,
      userRole,
      'MANAGE_PERMISSIONS'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to modify this share');
    }

    const updatePayload: any = {};
    if (data.permission) updatePayload.permission = data.permission;
    if (data.expiresAt !== undefined) {
      updatePayload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const updated = await prisma.documentShare.update({
      where: { id: shareId },
      data: updatePayload,
    });

    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_SHARE_UPDATED',
      resourceType: 'DOCUMENT_SHARE',
      resourceId: shareId,
      outcome: 'SUCCESS',
      metadata: updatePayload,
    });

    return updated;
  }

  /**
   * Revoke a document share immediately.
   */
  public static async revokeShare(
    organizationId: string,
    shareId: string,
    userId: string,
    userRole: string
  ) {
    const share = await prisma.documentShare.findFirst({
      where: { id: shareId, organizationId },
      include: { document: true },
    });

    if (!share) {
      throw new NotFoundError('Share not found');
    }

    const { hasPermission } = await DocumentService.checkDocumentPermission(
      organizationId,
      share.documentId,
      userId,
      userRole,
      'SHARE'
    );

    if (!hasPermission) {
      throw new ForbiddenError('You do not have permission to revoke this share');
    }

    const revoked = await prisma.documentShare.update({
      where: { id: shareId },
      data: { revokedAt: new Date() },
    });

    await AuditService.record({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_SHARE_REVOKED',
      resourceType: 'DOCUMENT_SHARE',
      resourceId: shareId,
      outcome: 'SUCCESS',
      metadata: {
        documentId: share.documentId,
        documentTitle: share.document.title,
        revokedFromUserId: share.grantedToUserId,
      },
    });

    return revoked;
  }
}
