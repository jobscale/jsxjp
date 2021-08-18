const { Route } = require('./route');
const { apiRoute } = require('./apiRoute');
const { authRoute } = require('./authRoute');
const { accountRoute } = require('./accountRoute');
const { userRoute } = require('./userRoute');
const { templateRoute } = require('./templateRoute');
const { topController } = require('../controllers/topController');

class TopRoute extends Route {
  constructor() {
    super();
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
