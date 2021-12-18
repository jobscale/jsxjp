const { Route } = require('../route');
const { authController } = require('./controller');
const { authValidation } = require('./validation');

class AuthRoute extends Route {
  constructor() {
    super();
    this.get('/auth', authController.index);
    this.post('/auth/login', authValidation.login, authController.login);
    this.use('', authController.verify);
    this.post('/auth/logout', authController.logout);
  }
}

module.exports = {
  AuthRoute,
  authRoute: new AuthRoute(),
};
