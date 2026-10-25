import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { AuditService } from '../modules/audit/audit.service.js';

/**
 * Enforces strict multi-tenant isolation.
 * Verifies that the authenticated user belongs to the requested organization.
 * Never trusts client headers for role or tenant escalation.
 */
export const requireTenant = (options?: { allowSuperAdminBypass?: boolean }) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Priority 1: Check route parameter organizationId
      const paramOrgId = Array.isArray(req.params.organizationId) 
        ? req.params.organizationId[0] 
        : req.params.organizationId;

      let targetOrgId: string | undefined = paramOrgId || req.organizationId || req.session?.activeOrgId || undefined;

      // Priority 2: Fallback to query or body only if explicitly allowed, but validated against DB
      if (!targetOrgId && req.query.organizationId) {
        targetOrgId = String(req.query.organizationId);
      }

      if (!targetOrgId) {
        // Find user's first active membership if not set
        const defaultMembership = await prisma.organizationMembership.findFirst({
          where: {
            userId: req.user.id,
            status: 'ACTIVE',
            organization: { status: 'ACTIVE' },
          },
          include: { organization: true },
        });

        if (!defaultMembership && !req.user.isSuperAdmin) {
          throw new ForbiddenError('User is not an active member of any organization');
        }

        if (defaultMembership) {
          targetOrgId = defaultMembership.organizationId;
        }
      }

      // Super Admin bypass for platform-level management routes (e.g. org listing)
      if (req.user.isSuperAdmin && options?.allowSuperAdminBypass && !targetOrgId) {
        return next();
      }

      if (!targetOrgId) {
        throw new ForbiddenError('No organization context identified');
      }

      // Verify the organization exists and is ACTIVE
      const org = await prisma.organization.findUnique({
        where: { id: targetOrgId },
      });

      if (!org) {
        throw new NotFoundError('Organization not found');
      }

      if (org.status !== 'ACTIVE' && !req.user.isSuperAdmin) {
        throw new ForbiddenError('Organization is suspended');
      }

      // Verify user membership in this organization
      const membership = await prisma.organizationMembership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: targetOrgId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        // If super admin has explicit bypass requested, allow with virtual admin membership
        if (req.user.isSuperAdmin && options?.allowSuperAdminBypass) {
          req.organizationId = targetOrgId;
          req.membership = {
            id: 'super-admin-virtual',
            organizationId: targetOrgId,
            role: 'ORG_ADMIN',
            status: 'ACTIVE',
          };
          return next();
        }

        // Security violation: Cross-tenant access attempt!
        await AuditService.record({
          organizationId: targetOrgId,
          actorId: req.user.id,
          action: 'SECURITY_CROSS_TENANT_ATTEMPT',
          resourceType: 'ORGANIZATION',
          resourceId: targetOrgId,
          outcome: 'FAILURE',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            path: req.originalUrl,
            method: req.method,
            reason: 'User attempted to access an organization they do not belong to',
          },
        }).catch(() => {});

        throw new ForbiddenError('Cross-tenant access prohibited: You do not belong to this organization');
      }

      if (membership.status !== 'ACTIVE') {
        throw new ForbiddenError('Your membership in this organization is not active');
      }

      req.organizationId = targetOrgId;
      req.membership = {
        id: membership.id,
        organizationId: membership.organizationId,
        role: membership.role as any,
        status: membership.status,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
