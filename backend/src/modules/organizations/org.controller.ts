import { Request, Response, NextFunction } from 'express';
import { OrgService } from './org.service.js';

export class OrgController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgs = await OrgService.listOrganizations(req.user!.id, req.user!.isSuperAdmin);
      return res.status(200).json({
        status: 'success',
        data: { organizations: orgs },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await OrgService.createOrganization(req.body, req.user!.id);
      return res.status(201).json({
        status: 'success',
        data: { organization: org },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = String(req.params.organizationId);
      const org = await OrgService.getOrganization(organizationId);
      return res.status(200).json({
        status: 'success',
        data: { organization: org },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = String(req.params.organizationId);
      const org = await OrgService.updateOrganization(
        organizationId, 
        req.body,
        req.user?.id
      );
      return res.status(200).json({
        status: 'success',
        data: { organization: org },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = String(req.params.organizationId);
      const stats = await OrgService.getDashboardStats(organizationId);
      return res.status(200).json({
        status: 'success',
        data: { stats },
      });
    } catch (error) {
      return next(error);
    }
  }
}
