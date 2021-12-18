const { Route } = require('../route');
const { accountController } = require('./controller');
const { accountValidation } = require('./validation');

class AccountRoute extends Route {
  constructor() {
    super();
    this.get('/password', accountController.password);
    this.post('/password', accountValidation.password, accountController.password);
  }
}

module.exports = {
  AccountRoute,
  accountRoute: new AccountRoute(),
};
