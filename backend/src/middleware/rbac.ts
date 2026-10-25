import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';

export type RoleType = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DOCUMENT_MANAGER' | 'STANDARD_USER' | 'AUDITOR';

/**
 * Ensures user has one of the required roles.
 */
export const requireRole = (allowedRoles: RoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    // Super Admin platform role check
    if (allowedRoles.includes('SUPER_ADMIN') && req.user.isSuperAdmin) {
      return next();
    }

    // Organization-level role check
    if (!req.membership) {
      return next(new ForbiddenError('No active organization role assigned'));
    }

    if (allowedRoles.includes(req.membership.role)) {
      return next();
    }

    return next(new ForbiddenError(`Permission denied: Action requires one of [${allowedRoles.join(', ')}] roles`));
  };
};

/**
 * Require Super Admin platform role explicitly.
 */
export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isSuperAdmin) {
    return next(new ForbiddenError('Access denied: Super Admin privileges required'));
  }
  return next();
};
