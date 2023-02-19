const { Router } = require('express');
const { route: apiRoute } = require('./api/route');
const { route: authRoute } = require('./auth/route');
const { route: accountRoute } = require('./account/route');
const { route: userRoute } = require('./user/route');
const { route: templateRoute } = require('./template/route');
const { controller } = require('./controller');

class Route {
  constructor() {
    const router = Router();
    router.use(
      '/api',
      (...args) => apiRoute.router(...args),
    );
    router.use(
      '',
      (...args) => authRoute.router(...args),
    );
    router.use(
      '/account',
      (...args) => accountRoute.router(...args),
    );
    router.use(
      '/user',
      (...args) => userRoute.router(...args),
    );
    router.use(
      '/template',
      (...args) => templateRoute.router(...args),
    );
    router.get(
      '',
      (...args) => controller.page(...args),
    );
    this.router = router;
  }
}

module.exports = {
  Route,
  route: new Route(),
};
