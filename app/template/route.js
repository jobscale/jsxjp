import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '', [
  validation.load,
  controller.load,
]);

export const route = { router };

export default { route };
