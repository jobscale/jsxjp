const { Router } = require('express');
const { controller: accountController } = require('./controller');
const { validation: accountValidation } = require('./validation');

class Route {
  constructor() {
    const router = Router();
    router.post(
      '/password',
      (...args) => accountValidation.password(...args),
      (...args) => accountController.password(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
