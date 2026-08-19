import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/hub', [
  validation.hub,
  controller.hub,
]);
router.add('POST', '/putHub', [
  validation.putHub,
  controller.putHub,
]);
router.add('POST', '/putPerson', [
  validation.putPerson,
  controller.putPerson,
]);
router.add('POST', '/removePerson', [
  validation.removePerson,
  controller.removePerson,
]);

export const route = { router };

export default { route };
