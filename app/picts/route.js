import { Router } from '../router.js';
import { controller as authController } from '../auth/controller.js';
import { controller } from './controller.js';

const router = new Router();
router.add('POST', '/upload', async (req, res) => {
  await authController.verify(req, res, async () => {
    await controller.upload(req, res);
  });
});
router.add('POST', '/find', async (req, res) => {
  await authController.verify(req, res, controller.find);
});
router.add('POST', '/remove', async (req, res) => {
  await authController.verify(req, res, controller.remove);
});
router.add('POST', '/getData', async (req, res) => {
  await authController.verify(req, res, controller.getData);
});
router.add('POST', '/putData', async (req, res) => {
  await authController.verify(req, res, controller.putData);
});
router.add('GET', '/:type/:fname', async (req, res) => {
  await authController.verify(req, res, controller.image);
});
router.add('GET', '', async (req, res) => {
  await authController.verify(req, res, () => {
    res.writeHead(404);
    res.end('404 NotFound');
  });
});

export const route = { router };

export default {
  route,
};
