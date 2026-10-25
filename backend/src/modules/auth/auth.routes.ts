import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  switchOrgSchema 
} from './auth.validator.js';

const router = Router();

router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Authenticated routes
router.use(authenticate);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getMe);
router.post('/switch-org', validateRequest(switchOrgSchema), AuthController.switchOrg);

export default router;
