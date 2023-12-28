const { Router } = require('express');
const { controller } = require('./controller');

class Route {
  constructor() {
    const router = Router();
    router.use(
      '',
      (...args) => controller.ip(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
