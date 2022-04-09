const { Route } = require('../route');
const { apiController } = require('./controller');
const { apiValidation } = require('./validation');

class ApiRoute extends Route {
  constructor() {
    super();
    this.post(
      '/slack',
      (...args) => apiValidation.slack(...args),
      (...args) => apiController.slack(...args),
    );
    this.post(
      '/hostname',
      (...args) => apiController.hostname(...args),
    );
  }
}

module.exports = {
  ApiRoute,
  apiRoute: new ApiRoute(),
};
