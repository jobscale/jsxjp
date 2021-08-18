const { Route } = require('./route');
const { accountController } = require('../controllers/accountController');
const { accountValidation } = require('../validations/accountValidation');

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
