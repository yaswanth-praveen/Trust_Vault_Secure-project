import { prisma } from '../../utils/prisma.js';
import { 
  verifyPassword, 
  generateSecureToken, 
  hashSessionToken,
  hashPassword
} from '../../utils/crypto.js';
import { UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { AuditService } from '../audit/audit.service.js';

export class AuthService {
  /**
   * Authenticate user, issue secure session token, and record audit event.
   */
  public static async login(params: {
    email: string;
    password: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { email: params.email.toLowerCase() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(params.password, user.passwordHash);

    if (!isPasswordValid) {
      // Find default or requested organization to log failed attempt
      const targetOrg = params.organizationId || user.memberships[0]?.organizationId;
      if (targetOrg) {
        await AuditService.record({
          organizationId: targetOrg,
          actorId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resourceType: 'SESSION',
          outcome: 'FAILURE',
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: { email: params.email, reason: 'Invalid credentials' },
        }).catch(() => {});
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account has been deactivated. Contact an administrator.');
    }

    // Determine active organization
    let activeOrgId: string | null = null;
    if (params.organizationId) {
      const membership = user.memberships.find(m => m.organizationId === params.organizationId);
      if (!membership && !user.isSuperAdmin) {
        throw new ForbiddenError('You are not an active member of this organization');
      }
      activeOrgId = params.organizationId;
    } else if (user.memberships.length > 0) {
      activeOrgId = user.memberships[0].organizationId;
    }

    // Create session
    const rawSessionToken = generateSecureToken(32);
    const tokenHash = hashSessionToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        token: tokenHash,
        userId: user.id,
        activeOrgId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        expiresAt,
      },
    });

    // Record successful audit event if organization is known
    if (activeOrgId) {
      await AuditService.record({
        organizationId: activeOrgId,
        actorId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        resourceType: 'SESSION',
        outcome: 'SUCCESS',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      }).catch(() => {});
    }

    return {
      rawSessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeOrgId,
      memberships: user.memberships.map(m => ({
        id: m.id,
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  /**
   * Terminate active session and clear cookie.
   */
  public static async logout(sessionToken: string, userId?: string, orgId?: string, ip?: string, ua?: string) {
    const hashed = hashSessionToken(sessionToken);
    await prisma.session.deleteMany({
      where: { token: hashed },
    });

    if (orgId && userId) {
      await AuditService.record({
        organizationId: orgId,
        actorId: userId,
        action: 'AUTH_LOGOUT',
        resourceType: 'SESSION',
        outcome: 'SUCCESS',
        ipAddress: ip,
        userAgent: ua,
      }).catch(() => {});
    }
  }

  /**
   * Get current authenticated user details and active tenant profile.
   */
  public static async getMe(userId: string, activeOrgId?: string | null) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const activeMembership = user.memberships.find(m => m.organizationId === activeOrgId) || user.memberships[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
        status: user.status,
      },
      activeOrganization: activeMembership ? {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
        role: activeMembership.role,
      } : null,
      memberships: user.memberships.map(m => ({
        id: m.id,
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  /**
   * Switch the active organization context for the current session.
   */
  public static async switchOrganization(sessionId: string, userId: string, targetOrgId: string) {
    const membership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: targetOrgId,
          userId,
        },
      },
      include: { organization: true },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!membership && !user?.isSuperAdmin) {
      throw new ForbiddenError('You are not an active member of the requested organization');
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { activeOrgId: targetOrgId },
    });

    return {
      organizationId: targetOrgId,
      organizationName: membership?.organization.name,
      role: membership?.role || 'ORG_ADMIN',
    };
  }
}
