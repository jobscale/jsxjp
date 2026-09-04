import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/password', [
  authController.verify,
  validation.password,
  controller.password,
]);

export const route = { router };
export default { route };
