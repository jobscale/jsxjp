const { Router } = require('express');
const { controller } = require('./controller');
const { controller: authController } = require('../auth/controller');

const router = Router();
router.get('/:id', controller.redirect);
router.use('', authController.verify);
router.get('', (req, res) => res.send('i am shorten'));
router.post('/register', controller.register);
router.post('/find', controller.find);
router.post('/remove', controller.remove);

module.exports = {
  route: { router },
};
