import { Router } from 'express';
import { controller as authController } from './controller.js';
import { validation as authValidation } from './validation.js';

const router = Router();
router.post(
  '/auth/login',
  authValidation.login,
  authController.login,
);
router.post('/auth/sign', authController.sign);
router.options('/auth/totp', (req, res) => res.json());
router.post(
  '/auth/totp',
  authValidation.totp,
  authController.totp,
);
router.use('', authController.verify);
router.get('/auth/logout', authController.logout);

export const route = { router };

export default {
  route,
};
