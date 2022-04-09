const { Route } = require('../route');
const { templateController } = require('./controller');

class TemplateRoute extends Route {
  constructor() {
    super();
    this.post(
      '',
      (...args) => templateController.load(...args),
    );
  }
}

module.exports = {
  TemplateRoute,
  templateRoute: new TemplateRoute(),
};
