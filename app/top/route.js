const { Route } = require('../route');
const { apiRoute } = require('../api/route');
const { authRoute } = require('../auth/route');
const { accountRoute } = require('../account/route');
const { userRoute } = require('../user/route');
const { templateRoute } = require('../template/route');
const { topController } = require('./controller');

class TopRoute extends Route {
  constructor() {
    super();
    this.use(
      '/ex-api',
      (...args) => apiRoute.router(...args),
    );
    this.use(
      '/api',
      (...args) => apiRoute.router(...args),
    );
    this.use(
      '',
      (...args) => authRoute.router(...args),
    );
    this.use(
      '/account',
      (...args) => accountRoute.router(...args),
    );
    this.use(
      '/user',
      (...args) => userRoute.router(...args),
    );
    this.use(
      '/template',
      (...args) => templateRoute.router(...args),
    );
    this.get(
      '',
      (...args) => topController.page(...args),
    );
  }
}

module.exports = {
  TopRoute,
  topRoute: new TopRoute(),
};
