const { Route } = require('../route');
const { accountController } = require('./controller');
const { accountValidation } = require('./validation');

class AccountRoute extends Route {
  constructor() {
    super();
    this.get(
      '/password',
      (...args) => accountController.password(...args),
    );
    this.post(
      '/password',
      (...args) => accountValidation.password(...args),
      (...args) => accountController.password(...args),
    );
  }
}

module.exports = {
  AccountRoute,
  accountRoute: new AccountRoute(),
};
