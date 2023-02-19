const { Router } = require('express');
const { controller: authController } = require('./controller');
const { validation: authValidation } = require('./validation');

class Route {
  constructor() {
    const router = Router();
    router.get(
      '/auth',
      (...args) => authController.index(...args),
    );
    router.post(
      '/auth/login',
      (...args) => authValidation.login(...args),
      (...args) => authController.login(...args),
    );
    router.use(
      '',
      (...args) => authController.verify(...args),
    );
    router.post(
      '/auth/logout',
      (...args) => authController.logout(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
