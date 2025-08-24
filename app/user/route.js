import { Router } from 'express';
import { controller as userController } from './controller.js';
import { validation as userValidation } from './validation.js';

const router = Router();
router.post(
  '/register',
  userValidation.register,
  userController.register,
);
router.post(
  '/reset',
  userValidation.reset,
  userController.reset,
);
router.post(
  '/find',
  userController.find,
);
router.post(
  '/remove',
  userController.remove,
);

export const route = { router };

export default {
  route,
};
