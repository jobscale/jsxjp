import { Router } from 'express';
import { controller as templateController } from './controller.js';

const router = Router();
router.post('', templateController.load);

export const route = { router };

export default {
  route,
};
