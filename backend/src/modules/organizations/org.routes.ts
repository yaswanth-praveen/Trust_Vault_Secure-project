import { Router } from 'express';
import { OrgController } from './org.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { requireRole, requireSuperAdmin } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { createOrgSchema, updateOrgSchema } from './org.validator.js';

const router = Router();

router.use(authenticate);

// List organizations
router.get('/', OrgController.list);

// Create organization (Super Admin only)
router.post('/', requireSuperAdmin, validateRequest(createOrgSchema), OrgController.create);

// Organization specific operations (enforce tenant isolation)
router.get('/:organizationId', requireTenant({ allowSuperAdminBypass: true }), OrgController.getById);

router.patch(
  '/:organizationId',
  requireTenant({ allowSuperAdminBypass: true }),
  requireRole(['SUPER_ADMIN', 'ORG_ADMIN']),
  validateRequest(updateOrgSchema),
  OrgController.update
);

router.get('/:organizationId/stats', requireTenant(), OrgController.getStats);

export default router;
