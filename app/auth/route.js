const { Router } = require('express');
const { controller: authController } = require('./controller');
const { validation: authValidation } = require('./validation');

const router = Router();

router.post(
  '/auth/login',
  (...args) => authValidation.login(...args),
  (...args) => authController.login(...args),
);
router.post('/auth/sign', (...args) => authController.sign(...args));
router.post('/auth/totp', (...args) => authController.totp(...args));
router.options('/auth/totp', (req, res) => res.json(''));
router.use('', (...args) => authController.verify(...args));
router.get('/auth/logout', (...args) => authController.logout(...args));

module.exports = {
  route: { router },
};
