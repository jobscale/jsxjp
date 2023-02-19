const { Router } = require('express');
const { controller: templateController } = require('./controller');

class Route {
  constructor() {
    const router = Router();
    router.post(
      '',
      (...args) => templateController.load(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
