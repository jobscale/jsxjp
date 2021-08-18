const { Route } = require('./route');
const { authController } = require('../controllers/authController');
const { authValidation } = require('../validations/authValidation');

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
