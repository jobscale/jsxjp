const { Router } = require('express');
const { controller: userController } = require('./controller');
const { validation: userValidation } = require('./validation');

const router = Router();

router.post(
  '/register',
  (...args) => userValidation.register(...args),
  (...args) => userController.register(...args),
);
router.post(
  '/reset',
  (...args) => userValidation.reset(...args),
  (...args) => userController.reset(...args),
);
router.post(
  '/find',
  (...args) => userController.find(...args),
);
router.post(
  '/remove',
  (...args) => userController.remove(...args),
);

module.exports = {
  route: { router },
};
