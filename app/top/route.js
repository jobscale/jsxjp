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
    this.use('/ex-api', apiRoute.router);
    this.use('/api', apiRoute.router);
    this.use('', authRoute.router);
    this.use('/account', accountRoute.router);
    this.use('/user', userRoute.router);
    this.use('/template', templateRoute.router);
    this.get('', topController.page);
  }
}

module.exports = {
  TopRoute,
  topRoute: new TopRoute(),
};
