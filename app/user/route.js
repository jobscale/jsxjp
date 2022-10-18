const { Router } = require('express');
const { userController } = require('./controller');
const { userValidation } = require('./validation');

class UserRoute {
  constructor() {
    const router = Router();
    router.get(
      '',
      (...args) => userController.page(...args),
    );
    router.get(
      '/register',
      (...args) => userController.page(...args),
    );
    router.post(
      '/register',
      (...args) => userValidation.register(...args),
      (...args) => userController.register(...args),
    );
    router.get(
      '/reset',
      (...args) => userController.page(...args),
    );
    router.post(
      '/reset',
      (...args) => userValidation.reset(...args),
      (...args) => userController.reset(...args),
    );
    this.router = router;
  }
}

module.exports = {
  UserRoute,
  userRoute: new UserRoute(),
};
