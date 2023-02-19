const { Router } = require('express');
const { controller: userController } = require('./controller');
const { validation: userValidation } = require('./validation');

const router = Router();

router.get('', (...args) => userController.page(...args));
router.get('/register', (...args) => userController.page(...args));
router.post(
  '/register',
  (...args) => userValidation.register(...args),
  (...args) => userController.register(...args),
);
router.get('/reset', (...args) => userController.page(...args));
router.post(
  '/reset',
  (...args) => userValidation.reset(...args),
  (...args) => userController.reset(...args),
);

module.exports = {
  route: { router },
};
