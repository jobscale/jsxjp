import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/register', [
  validation.register,
  controller.register,
]);
router.add('POST', '/reset', [
  validation.reset,
  controller.reset,
]);
router.add('POST', '/find', controller.find);
router.add('POST', '/remove', controller.remove);

export const route = { router };

export default { route };
