import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/register', [
  authController.verify,
  validation.register,
  controller.register,
]);
router.add('POST', '/reset', [
  authController.verify,
  validation.reset,
  controller.reset,
]);
router.add('POST', '/find', [authController.verify, controller.find]);
router.add('POST', '/remove', [authController.verify, controller.remove]);

export const route = { router };
export default { route };
