import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from './document.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { 
  uploadDocumentSchema, 
  updateDocumentSchema, 
  listDocumentsSchema 
} from './document.validator.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.use(authenticate);
router.use(requireTenant());

// List documents
router.get('/', validateRequest(listDocumentsSchema), DocumentController.list);

// Upload document (Standard Users, Document Managers, and Org Admins)
router.post(
  '/upload',
  upload.single('file'),
  validateRequest(uploadDocumentSchema),
  DocumentController.upload
);

// Document specific endpoints
router.get('/:documentId', DocumentController.getById);
router.get('/:documentId/download', DocumentController.download);
router.get('/:documentId/preview', DocumentController.preview);

router.patch(
  '/:documentId',
  validateRequest(updateDocumentSchema),
  DocumentController.update
);

router.delete('/:documentId', DocumentController.delete);

export default router;
