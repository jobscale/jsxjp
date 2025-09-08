import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/password', async (req, res) => {
  await validation.password(req, res, controller.password);
});

export const route = { router };

export default {
  route,
};
