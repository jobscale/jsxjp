const { Route } = require('../route');
const { apiController } = require('./controller');
const { apiValidation } = require('./validation');

class ApiRoute extends Route {
  constructor() {
    super();
    this.post('/slack', apiValidation.slack, apiController.slack);
    this.post('/hostname', apiController.hostname);
  }
}

module.exports = {
  ApiRoute,
  apiRoute: new ApiRoute(),
};
