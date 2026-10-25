import { prisma } from '../../utils/prisma.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { generateSecureToken, hashPassword } from '../../utils/crypto.js';
import { AuditService } from '../audit/audit.service.js';

export class UserService {
  public static async listOrganizationUsers(organizationId: string) {
    const memberships = await prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return {
      members: memberships.map(m => ({
        membershipId: m.id,
        userId: m.user.id,
        fullName: m.user.fullName,
        email: m.user.email,
        role: m.role,
        membershipStatus: m.status,
        userStatus: m.user.status,
        joinedAt: m.joinedAt,
      })),
      invitations: pendingInvitations,
    };
  }

  public static async inviteUser(
    organizationId: string,
    inviterUserId: string,
    data: { email: string; fullName: string; role: 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR' }
  ) {
    const normalizedEmail = data.email.toLowerCase();

    // Check if user is already a member
    const existingMembership = await prisma.organizationMembership.findFirst({
      where: {
        organizationId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMembership) {
      throw new ConflictError('User is already a member of this organization');
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const tempPasswordHash = await hashPassword(generateSecureToken(16));
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: data.fullName,
          passwordHash: tempPasswordHash,
          status: 'ACTIVE',
        },
      });
    }

    // Create membership directly
    const membership = await prisma.organizationMembership.create({
      data: {
        organizationId,
        userId: user.id,
        role: data.role,
        status: 'ACTIVE',
      },
    });

    // Create invitation record for tracking
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        role: data.role,
        token,
        expiresAt,
        status: 'ACCEPTED', // Created directly
        invitedByUserId: inviterUserId,
      },
    });

    // Record audit event
    await AuditService.record({
      organizationId,
      actorId: inviterUserId,
      action: 'USER_INVITED',
      resourceType: 'USER',
      resourceId: user.id,
      outcome: 'SUCCESS',
      metadata: {
        email: normalizedEmail,
        role: data.role,
        membershipId: membership.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: data.role,
      },
      invitationToken: token,
    };
  }

  public static async updateUserRole(
    organizationId: string,
    targetUserId: string,
    newRole: 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR',
    actorUserId: string
  ) {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('User membership not found in this organization');
    }

    const previousRole = membership.role;
    const updated = await prisma.organizationMembership.update({
      where: { id: membership.id },
      data: { role: newRole },
    });

    await AuditService.record({
      organizationId,
      actorId: actorUserId,
      action: 'ROLE_CHANGED',
      resourceType: 'USER',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      metadata: {
        previousRole,
        newRole,
      },
    });

    return updated;
  }

  public static async updateUserStatus(
    organizationId: string,
    targetUserId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    actorUserId: string
  ) {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError('User membership not found in this organization');
    }

    const updated = await prisma.organizationMembership.update({
      where: { id: membership.id },
      data: { status },
    });

    await AuditService.record({
      organizationId,
      actorId: actorUserId,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'USER',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      metadata: {
        previousStatus: membership.status,
        newStatus: status,
      },
    });

    return updated;
  }

  public static async updateUserDetails(
    organizationId: string,
    targetUserId: string,
    data: {
      fullName?: string;
      email?: string;
      role?: 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR';
      password?: string;
    },
    actorUserId: string
  ) {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundError('User membership not found in this organization');
    }

    const previousData = {
      fullName: membership.user.fullName,
      email: membership.user.email,
      role: membership.role,
    };

    // If email is changing, check uniqueness
    if (data.email && data.email.toLowerCase() !== membership.user.email.toLowerCase()) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing && existing.id !== targetUserId) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    // Update user properties
    const userUpdatePayload: any = {};
    if (data.fullName) userUpdatePayload.fullName = data.fullName;
    if (data.email) userUpdatePayload.email = data.email.toLowerCase();
    if (data.password && data.password.trim().length > 0) {
      userUpdatePayload.passwordHash = await hashPassword(data.password.trim());
    }

    if (Object.keys(userUpdatePayload).length > 0) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: userUpdatePayload,
      });
    }

    // Update membership role if changed
    if (data.role && data.role !== membership.role) {
      await prisma.organizationMembership.update({
        where: { id: membership.id },
        data: { role: data.role },
      });
    }

    // Sanitize metadata for audit trail: NEVER record plaintext passwords
    const sanitizedUpdated: Record<string, any> = {};
    if (data.fullName) sanitizedUpdated.fullName = data.fullName;
    if (data.email) sanitizedUpdated.email = data.email.toLowerCase();
    if (data.role) sanitizedUpdated.role = data.role;
    if (data.password && data.password.trim().length > 0) {
      sanitizedUpdated.passwordReset = true;
    }

    // Record tamper-evident audit trail event
    await AuditService.record({
      organizationId,
      actorId: actorUserId,
      action: 'USER_DETAILS_UPDATED',
      resourceType: 'USER',
      resourceId: targetUserId,
      outcome: 'SUCCESS',
      metadata: {
        previous: previousData,
        updated: sanitizedUpdated,
      },
    });

    return {
      userId: targetUserId,
      fullName: data.fullName || membership.user.fullName,
      email: data.email || membership.user.email,
      role: data.role || membership.role,
    };
  }
}
