const { Route } = require('../route');
const { templateController } = require('./controller');

class TemplateRoute extends Route {
  constructor() {
    super();
    this.post('', templateController.load);
  }
}

module.exports = {
  TemplateRoute,
  templateRoute: new TemplateRoute(),
};
