import { Router } from 'express';
import { controller as accountController } from './controller.js';
import { validation as accountValidation } from './validation.js';

const router = Router();
router.post(
  '/password',
  accountValidation.password,
  accountController.password,
);

export const route = { router };

export default {
  route,
};
