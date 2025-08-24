import { Router } from 'express';
import { controller } from './controller.js';

const router = Router();
router.use('', controller.ip);

export const route = { router };

export default {
  route,
};
