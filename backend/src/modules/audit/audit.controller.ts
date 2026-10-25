import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { NotFoundError } from '../../utils/errors.js';

export class AuditController {
  public static async listEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const result = await AuditService.listEvents(organizationId, req.query as any);
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const eventId = String(req.params.eventId);
      const event = await AuditService.getEventById(organizationId, eventId);
      if (!event) {
        throw new NotFoundError('Audit event not found');
      }
      return res.status(200).json({
        status: 'success',
        data: { event },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const csv = await AuditService.exportEventsCsv(organizationId);

      // Audit the export action
      await AuditService.record({
        organizationId,
        actorId: req.user?.id,
        action: 'AUDIT_EXPORT_CSV',
        resourceType: 'AUDIT_TRAIL',
        resourceId: organizationId,
        outcome: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { exportedAt: new Date().toISOString() },
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="trustvault-audit-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  }

  public static async verifyChain(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const result = await AuditService.verifyChain(organizationId);

      // Audit the verification action
      await AuditService.record({
        organizationId,
        actorId: req.user?.id,
        action: 'AUDIT_CHAIN_VERIFICATION',
        resourceType: 'AUDIT_TRAIL',
        resourceId: organizationId,
        outcome: result.isValid ? 'SUCCESS' : 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: {
          totalEvents: result.totalEvents,
          lastSequence: result.lastSequenceNumber,
          isValid: result.isValid,
          errorReason: result.errorReason,
        },
      });

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}
