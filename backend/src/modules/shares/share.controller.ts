import { Request, Response, NextFunction } from 'express';
import { ShareService } from './share.service.js';

export class ShareController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const share = await ShareService.createShare(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role,
        req.body
      );

      return res.status(201).json({
        status: 'success',
        data: { share },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const shares = await ShareService.listShares(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role
      );

      return res.status(200).json({
        status: 'success',
        data: { shares },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const shareId = String(req.params.shareId);
      const updated = await ShareService.updateShare(
        organizationId,
        shareId,
        req.user!.id,
        req.membership!.role,
        req.body
      );

      return res.status(200).json({
        status: 'success',
        data: { share: updated },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const shareId = String(req.params.shareId);
      await ShareService.revokeShare(
        organizationId,
        shareId,
        req.user!.id,
        req.membership!.role
      );

      return res.status(200).json({
        status: 'success',
        message: 'Share revoked successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
