const { Router } = require('express');
const { controller: userController } = require('./controller');
const { validation: userValidation } = require('./validation');

const router = Router();
router.post(
  '/register',
  userValidation.register,
  userController.register,
);
router.post(
  '/reset',
  userValidation.reset,
  userController.reset,
);
router.post(
  '/find',
  userController.find,
);
router.post(
  '/remove',
  userController.remove,
);

module.exports = {
  route: { router },
};
