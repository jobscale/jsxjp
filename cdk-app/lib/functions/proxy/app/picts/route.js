import { Router } from '../router.js';
import { controller } from './controller.js';

const router = new Router();
router.add('POST', '/upload', [
  controller.upload,
]);
router.add('POST', '/find', [
  controller.find,
]);
router.add('POST', '/remove', [
  controller.remove,
]);
router.add('POST', '/getData', [
  controller.getData,
]);
router.add('POST', '/putData', [
  controller.putData,
]);
router.add('GET', '/:type/:fname', [
  controller.image,
]);
router.add('GET', '', [
  (req, res) => {
    res.writeHead(404);
    res.end('404 NotFound');
  },
]);

export const route = { router };
export default { route };
