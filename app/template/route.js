import { Router } from '../router.js';
import { controller } from './controller.js';

const router = new Router();
router.add('POST', '', controller.load);

export const route = { router };

export default {
  route,
};
