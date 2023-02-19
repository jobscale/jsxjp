const { Router } = require('express');
const { controller: apiController } = require('./controller');
const { validation: apiValidation } = require('./validation');

class Route {
  constructor() {
    const router = Router();
    router.post(
      '/slack',
      (...args) => apiValidation.slack(...args),
      (...args) => apiController.slack(...args),
    );
    router.post(
      '/hostname',
      (...args) => apiController.hostname(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
