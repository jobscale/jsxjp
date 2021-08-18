const { Route } = require('./route');
const { apiController } = require('../controllers/apiController');
const { apiValidation } = require('../validations/apiValidation');

class ApiRoute extends Route {
  constructor() {
    super();
    this.post('/slack', apiValidation.slack, apiController.slack);
  }
}

module.exports = {
  ApiRoute,
  apiRoute: new ApiRoute(),
};
