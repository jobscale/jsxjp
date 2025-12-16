import { Router } from '../router.js';
import { controller as authController } from './controller.js';
import { validation as authValidation } from './validation.js';

const router = new Router();
router.add('POST', '/auth/login', [
  authValidation.login,
  authController.login,
]);
router.add('HEAD', '/auth/sign', authController.sign);
router.add('POST', '/auth/sign', authController.sign);
router.add('OPTIONS', '/auth/totp', (req, res) => res.end());
router.add('POST', '/auth/totp', [
  authValidation.totp,
  authController.totp,
]);
router.add('GET', '/auth/logout', [
  authController.verify,
  authController.logout,
]);

export const route = { router };

export default { route };
