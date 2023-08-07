const { Router } = require('express');
const { controller: authController } = require('./controller');
const { validation: authValidation } = require('./validation');

const router = Router();

router.get('/auth', (...args) => authController.index(...args));
router.post(
  '/auth/login',
  (...args) => authValidation.login(...args),
  (...args) => authController.login(...args),
);
router.use('', (...args) => authController.verify(...args));
router.get('/auth/logout', (...args) => authController.logout(...args));

module.exports = {
  route: { router },
};
