import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { listAuditEventsSchema } from './audit.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireTenant());
router.use(requireRole(['AUDITOR', 'ORG_ADMIN']));

router.get('/', validateRequest(listAuditEventsSchema), AuditController.listEvents);
router.get('/export', AuditController.exportCsv);
router.post('/verify', AuditController.verifyChain);
router.get('/:eventId', AuditController.getEvent);

export default router;
