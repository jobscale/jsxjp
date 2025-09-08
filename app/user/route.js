import { Router } from '../router.js';
import { controller } from './controller.js';
import { validation } from './validation.js';

const router = new Router();
router.add('POST', '/register', async (req, res) => {
  await validation.register(req, res, controller.register);
});
router.add('POST', '/reset', async (req, res) => {
  await validation.reset(req, res, controller.reset);
});
router.add('POST', '/find', controller.find);
router.add('POST', '/remove', controller.remove);

export const route = { router };

export default {
  route,
};
