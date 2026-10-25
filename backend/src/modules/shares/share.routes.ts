import { Router } from 'express';
import { ShareController } from './share.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant } from '../../middleware/tenant.js';
import { validateRequest } from '../../middleware/validate.js';
import { createShareSchema, updateShareSchema } from './share.validator.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireTenant());

router.post('/', validateRequest(createShareSchema), ShareController.create);
router.get('/', ShareController.list);
router.patch('/:shareId', validateRequest(updateShareSchema), ShareController.update);
router.delete('/:shareId', ShareController.revoke);

export default router;
