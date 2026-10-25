import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';

export class UserController {
  public static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const data = await UserService.listOrganizationUsers(organizationId);
      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const result = await UserService.inviteUser(organizationId, req.user!.id, req.body);
      return res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userId = String(req.params.userId);
      const { role } = req.body;
      const updated = await UserService.updateUserRole(organizationId, userId, role, req.user!.id);
      return res.status(200).json({
        status: 'success',
        data: { membership: updated },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userId = String(req.params.userId);
      const { status } = req.body;
      const updated = await UserService.updateUserStatus(organizationId, userId, status, req.user!.id);
      return res.status(200).json({
        status: 'success',
        data: { membership: updated },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async updateDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userId = String(req.params.userId);
      const updated = await UserService.updateUserDetails(
        organizationId,
        userId,
        req.body,
        req.user!.id
      );
      return res.status(200).json({
        status: 'success',
        data: { user: updated },
      });
    } catch (error) {
      return next(error);
    }
  }
}
