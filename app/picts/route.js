import { Router } from 'express';
import multer from 'multer';
import { controller } from './controller.js';
import { controller as authController } from '../auth/controller.js';

const upload = multer();
const router = Router();
router.use('', authController.verify);
router.post('/upload', upload.array('files'), controller.upload);
router.post('/find', controller.find);
router.post('/remove', controller.remove);
router.get('/:type/:fname', controller.image);
router.post('/getData', controller.getData);
router.post('/putData', controller.putData);
router.get('', (req, res) => res.status(404).send('not found'));

export const route = { router };

export default {
  route,
};
