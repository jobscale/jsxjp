const { Route } = require('../route');
const { userController } = require('./controller');
const { userValidation } = require('./validation');

class UserRoute extends Route {
  constructor() {
    super();
    this.get(
      '',
      (...args) => userController.page(...args),
    );
    this.get(
      '/register',
      (...args) => userController.page(...args),
    );
    this.post(
      '/register',
      (...args) => userValidation.register(...args),
      (...args) => userController.register(...args),
    );
    this.get(
      '/reset',
      (...args) => userController.page(...args),
    );
    this.post(
      '/reset',
      (...args) => userValidation.reset(...args),
      (...args) => userController.reset(...args),
    );
  }
}

module.exports = {
  UserRoute,
  userRoute: new UserRoute(),
};
