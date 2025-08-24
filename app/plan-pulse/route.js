import { Router } from 'express';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = Router();
router.post(
  '/hub',
  validation.hub,
  controller.hub,
);
router.post(
  '/putHub',
  validation.putHub,
  controller.putHub,
);
router.post(
  '/putPerson',
  validation.putPerson,
  controller.putPerson,
);
router.post(
  '/removePerson',
  validation.removePerson,
  controller.removePerson,
);

export const route = { router };

export default {
  route,
};
