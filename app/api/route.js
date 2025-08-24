import { Router } from 'express';
import { controller as apiController } from './controller.js';
import { validation as apiValidation } from './validation.js';

const router = Router();
router.post(
  '/slack',
  apiValidation.slack,
  apiController.slack,
);
router.post(
  '/email',
  apiValidation.email,
  apiController.email,
);
router.post(
  '/hostname',
  apiController.hostname,
);

export const route = { router };

export default {
  route: { router },
};
