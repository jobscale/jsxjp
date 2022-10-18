const { Router } = require('express');
const { apiRoute } = require('./api/route');
const { authRoute } = require('./auth/route');
const { accountRoute } = require('./account/route');
const { userRoute } = require('./user/route');
const { templateRoute } = require('./template/route');
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
