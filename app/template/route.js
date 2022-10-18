const { Router } = require('express');
const { templateController } = require('./controller');

class TemplateRoute {
  constructor() {
    const router = Router();
    router.post(
      '',
      (...args) => templateController.load(...args),
    );
    this.router = router;
  }
}

module.exports = {
  TemplateRoute,
  templateRoute: new TemplateRoute(),
};
