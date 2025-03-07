const { Router } = require('express');
const { controller: authController } = require('./controller');
const { validation: authValidation } = require('./validation');

const router = Router();
router.post(
  '/auth/login',
  authValidation.login,
  authController.login,
);
router.post('/auth/sign', authController.sign);
router.options('/auth/totp', (req, res) => res.json());
router.post(
  '/auth/totp',
  authValidation.totp,
  authController.totp,
);
router.use('', authController.verify);
router.get('/auth/logout', authController.logout);

module.exports = {
  route: { router },
};
