import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';

const router = new Router();
router.add('POST', '/upload', [
  authController.verify,
  controller.upload,
]);
router.add('POST', '/find', [
  authController.verify,
  controller.find,
]);
router.add('POST', '/remove', [
  authController.verify,
  controller.remove,
]);
router.add('POST', '/getData', [
  authController.verify,
  controller.getData,
]);
router.add('POST', '/putData', [
  authController.verify,
  controller.putData,
]);
router.add('GET', '/:type/:fname', [
  authController.verify,
  controller.image,
]);
router.add('GET', '', [
  authController.verify,
  (req, res) => {
    res.writeHead(404);
    res.end('404 NotFound');
  },
]);

export const route = { router };

export default { route };
