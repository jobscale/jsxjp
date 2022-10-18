const { Router } = require('express');
const { apiRoute } = require('./api/route');
const { authRoute } = require('./auth/route');
const { accountRoute } = require('./account/route');
const { userRoute } = require('./user/route');
const { templateRoute } = require('./template/route');
const { topController } = require('./controller');

class TopRoute {
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
      (...args) => topController.page(...args),
    );
    this.router = router;
  }
}

module.exports = {
  TopRoute,
  topRoute: new TopRoute(),
};
