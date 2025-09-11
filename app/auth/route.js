import { Router } from '../router.js';
import { controller as authController } from './controller.js';
import { validation as authValidation } from './validation.js';

const router = new Router();
router.add('POST', '/auth/login', async (req, res) => {
  await authValidation.login(req, res, authController.login);
});
router.add('HEAD', '/auth/sign', authController.sign);
router.add('POST', '/auth/sign', authController.sign);
router.add('OPTIONS', '/auth/totp', (req, res) => res.end());
router.add('POST', '/auth/totp', async (req, res) => {
  await authValidation.totp(req, res, authController.totp);
});
router.add('GET', '/auth/logout', async (req, res) => {
  await authController.verify(req, res, authController.logout);
});

export const route = { router };

export default {
  route,
};
