import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './document.service.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class DocumentController {
  public static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file was uploaded');
      }

      const organizationId = req.organizationId!;
      const document = await DocumentService.uploadDocument(
        organizationId,
        req.user!.id,
        {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        {
          title: req.body.title || req.file.originalname,
          description: req.body.description,
        }
      );

      return res.status(201).json({
        status: 'success',
        data: { document },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const result = await DocumentService.listDocuments(
        organizationId,
        req.user!.id,
        req.membership!.role,
        req.query as any
      );

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const { document, hasPermission, isOwner, share } = await DocumentService.checkDocumentPermission(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role,
        'VIEW'
      );

      if (!hasPermission) {
        throw new NotFoundError('Document not found or inaccessible');
      }

      return res.status(200).json({
        status: 'success',
        data: {
          document,
          isOwner,
          sharePermission: share?.permission || (isOwner ? 'OWNER' : req.membership!.role),
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async download(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const { stream, filename, mimeType, size } = await DocumentService.authorizeAndGetDownloadStream(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role,
        req.ip,
        req.headers['user-agent']
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', size);
      // Clean filename for header
      const safeFilename = filename.replace(/[^\w.-]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

      stream.pipe(res);
    } catch (error) {
      return next(error);
    }
  }

  public static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const { stream, filename, mimeType, size } = await DocumentService.authorizeAndGetPreviewStream(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role,
        req.ip,
        req.headers['user-agent']
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', size);
      const safeFilename = filename.replace(/[^\w.-]/g, '_');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

      stream.pipe(res);
    } catch (error) {
      return next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      const updated = await DocumentService.updateDocument(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role,
        req.body
      );

      return res.status(200).json({
        status: 'success',
        data: { document: updated },
      });
    } catch (error) {
      return next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const documentId = String(req.params.documentId);
      await DocumentService.deleteDocument(
        organizationId,
        documentId,
        req.user!.id,
        req.membership!.role
      );

      return res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
