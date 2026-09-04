import { Router } from '../router.js';
import { controller as authController } from './controller.js';
import { validation as authValidation } from './validation.js';

const router = new Router();
router.add('POST', '/login', [
  authValidation.login,
  authController.login,
]);
router.add('HEAD', '/sign', authController.sign);
router.add('POST', '/sign', authController.sign);
router.add('OPTIONS', '/totp', (req, res) => res.end());
router.add('POST', '/totp', [
  authValidation.totp,
  authController.totp,
]);
router.add('GET', '/logout', [
  authController.verify,
  authController.logout,
]);

export const route = { router };
export default { route };
