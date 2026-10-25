import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { 
  inviteUserSchema, 
  updateUserRoleSchema, 
  updateUserStatusSchema,
  updateUserDetailsSchema 
} from './user.validator.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireTenant());

// List members of organization
router.get('/users', UserController.listUsers);

// Admin-only user management actions
router.post(
  '/invitations',
  requireRole(['ORG_ADMIN']),
  validateRequest(inviteUserSchema),
  UserController.invite
);

router.patch(
  '/users/:userId',
  requireRole(['ORG_ADMIN']),
  validateRequest(updateUserDetailsSchema),
  UserController.updateDetails
);

router.patch(
  '/users/:userId/role',
  requireRole(['ORG_ADMIN']),
  validateRequest(updateUserRoleSchema),
  UserController.updateRole
);

router.patch(
  '/users/:userId/status',
  requireRole(['ORG_ADMIN']),
  validateRequest(updateUserStatusSchema),
  UserController.updateStatus
);

export default router;
