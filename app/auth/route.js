const { Route } = require('../route');
const { authController } = require('./controller');
const { authValidation } = require('./validation');

class AuthRoute extends Route {
  constructor() {
    super();
    this.get(
      '/auth',
      (...args) => authController.index(...args),
    );
    this.post(
      '/auth/login',
      (...args) => authValidation.login(...args),
      (...args) => authController.login(...args),
    );
    this.use(
      '',
      (...args) => authController.verify(...args),
    );
    this.post(
      '/auth/logout',
      (...args) => authController.logout(...args),
    );
  }
}

module.exports = {
  AuthRoute,
  authRoute: new AuthRoute(),
};
