import { Router } from 'express';
import { controller } from './controller.js';
import { controller as authController } from '../auth/controller.js';

const router = Router();
router.get('/:id', controller.redirect);
router.use('', authController.verify);
router.get('', (req, res) => res.send('i am shorten'));
router.post('/register', controller.register);
router.post('/find', controller.find);
router.post('/remove', controller.remove);

export const route = { router };

export default {
  route,
};
