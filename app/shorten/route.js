import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';

const router = new Router();
router.add('GET', '/:id', controller.redirect);
router.add('GET', '', async (req, res) => {
  await authController.verify(req, res, () => {
    res.end('i am shorten');
  });
});
router.add('POST', '/register', async (req, res) => {
  await authController.verify(req, res, controller.register);
});
router.add('POST', '/find', async (req, res) => {
  await authController.verify(req, res, controller.find);
});
router.add('POST', '/remove', async (req, res) => {
  await authController.verify(req, res, controller.remove);
});

export const route = { router };

export default { route };
