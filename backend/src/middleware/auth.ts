import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { hashSessionToken } from '../utils/crypto.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  status: string;
}

export interface UserMembership {
  id: string;
  organizationId: string;
  role: 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR';
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: {
        id: string;
        token: string;
        userId: string;
        activeOrgId: string | null;
        expiresAt: Date;
      };
      organizationId?: string;
      membership?: UserMembership;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let rawToken = req.cookies?.trustvault_session;

    // Optional Bearer token header support for automated testing & API clients
    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.split(' ')[1];
    }

    if (!rawToken) {
      throw new UnauthorizedError('Authentication required: No active session');
    }

    const hashedToken = hashSessionToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isSuperAdmin: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    // Check session expiration
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new UnauthorizedError('Session expired. Please log in again.');
    }

    // Check account status
    if (session.user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is deactivated or suspended');
    }

    req.user = session.user;
    req.session = {
      id: session.id,
      token: session.token,
      userId: session.userId,
      activeOrgId: session.activeOrgId,
      expiresAt: session.expiresAt,
    };

    // If an active organization is associated with the session, set it
    if (session.activeOrgId) {
      req.organizationId = session.activeOrgId;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
