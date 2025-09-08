import { Router } from '../router.js';
import { controller } from './controller.js';

const router = new Router();
router.add('GET', '', controller.ip);

export const route = { router };

export default {
  route,
};
