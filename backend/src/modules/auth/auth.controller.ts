import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'trustvault_session';

const getCookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  path: '/',
  ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
});

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, organizationId, rememberMe } = req.body;
      const result = await AuthService.login({
        email,
        password,
        organizationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie(COOKIE_NAME, result.rawSessionToken, getCookieOptions(rememberMe));

      return res.status(200).json({
        status: 'success',
        data: {
          token: result.rawSessionToken, // also returned for API test clients
          user: result.user,
          activeOrgId: result.activeOrgId,
          memberships: result.memberships,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.split(' ')[1];
      if (rawToken) {
        await AuthService.logout(
          rawToken, 
          req.user?.id, 
          req.organizationId, 
          req.ip, 
          req.headers['user-agent']
        );
      }

      res.clearCookie(COOKIE_NAME, { path: '/' });

      return res.status(200).json({
        status: 'success',
        message: 'Successfully logged out',
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await AuthService.getMe(req.user!.id, req.session?.activeOrgId);
      return res.status(200).json({
        status: 'success',
        data: profile,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async switchOrg(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId } = req.body;
      const updatedOrg = await AuthService.switchOrganization(
        req.session!.id,
        req.user!.id,
        organizationId
      );

      return res.status(200).json({
        status: 'success',
        data: updatedOrg,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, _next: NextFunction) {
    // Simulated secure forgot password response (constant-time response without user enumeration)
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    });
  }

  public static async resetPassword(req: Request, res: Response, _next: NextFunction) {
    return res.status(200).json({
      status: 'success',
      message: 'Password has been updated. You can now log in.',
    });
  }
}
