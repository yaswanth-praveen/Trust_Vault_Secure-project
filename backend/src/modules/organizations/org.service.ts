import { prisma } from '../../utils/prisma.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';

export class OrgService {
  public static async listOrganizations(userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) {
      return prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              memberships: true,
              documents: true,
              auditEvents: true,
            },
          },
        },
      });
    }

    return prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        _count: {
          select: {
            memberships: true,
            documents: true,
          },
        },
      },
    });
  }

  public static async createOrganization(data: { name: string; slug: string }, creatorUserId: string) {
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('An organization with this slug already exists');
    }

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
      },
    });

    // Record initial Genesis audit event for the newly created organization
    await AuditService.record({
      organizationId: org.id,
      actorId: creatorUserId,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'ORGANIZATION',
      resourceId: org.id,
      outcome: 'SUCCESS',
      metadata: { name: org.name, slug: org.slug },
    });

    return org;
  }

  public static async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            memberships: true,
            documents: true,
            shares: true,
            auditEvents: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    return org;
  }

  public static async updateOrganization(
    orgId: string, 
    data: { name?: string; status?: 'ACTIVE' | 'SUSPENDED' },
    actorId?: string
  ) {
    const org = await prisma.organization.update({
      where: { id: orgId },
      data,
    });

    await AuditService.record({
      organizationId: orgId,
      actorId,
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'ORGANIZATION',
      resourceId: orgId,
      outcome: 'SUCCESS',
      metadata: data,
    });

    return org;
  }

  public static async getDashboardStats(orgId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      recentUploads,
      activeShares,
      totalUsers,
      recentAuditActivities,
      failedAccessAttempts,
      latestCheckpoint
    ] = await Promise.all([
      prisma.document.count({
        where: { organizationId: orgId, isArchived: false },
      }),
      prisma.document.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.documentShare.count({
        where: {
          organizationId: orgId,
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
      prisma.organizationMembership.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),
      prisma.auditEvent.findMany({
        where: { organizationId: orgId },
        orderBy: { sequenceNumber: 'desc' },
        take: 6,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.auditEvent.count({
        where: {
          organizationId: orgId,
          outcome: 'FAILURE',
        },
      }),
      prisma.auditChainCheckpoint.findFirst({
        where: { organizationId: orgId },
        orderBy: { verifiedAt: 'desc' },
      }),
    ]);

    return {
      totalDocuments,
      recentUploads,
      activeShares,
      totalUsers,
      failedAccessAttempts,
      auditIntegrityStatus: latestCheckpoint ? latestCheckpoint.status : 'PENDING_FIRST_VERIFY',
      lastVerifiedAt: latestCheckpoint ? latestCheckpoint.verifiedAt : null,
      recentAuditActivities,
    };
  }
}
