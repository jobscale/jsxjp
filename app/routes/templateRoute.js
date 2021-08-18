const { Route } = require('./route');
const { templateController } = require('../controllers/templateController');

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
