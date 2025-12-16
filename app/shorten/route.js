import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';

const router = new Router();
router.add('GET', '/:id', controller.redirect);
router.add('GET', '', [
  authController.verify,
  (req, res) => {
    res.end('i am shorten');
  },
]);
router.add('POST', '/register', [
  authController.verify,
  controller.register,
]);
router.add('POST', '/find', [
  authController.verify,
  controller.find,
]);
router.add('POST', '/remove', [
  authController.verify,
  controller.remove,
]);

export const route = { router };

export default { route };
