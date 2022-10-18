const { Router } = require('express');
const { accountController } = require('./controller');
const { accountValidation } = require('./validation');

class AccountRoute {
  constructor() {
    const router = Router();
    router.get(
      '/password',
      (...args) => accountController.password(...args),
    );
    router.post(
      '/password',
      (...args) => accountValidation.password(...args),
      (...args) => accountController.password(...args),
    );
    this.router = router;
  }
}

module.exports = {
  AccountRoute,
  accountRoute: new AccountRoute(),
};
