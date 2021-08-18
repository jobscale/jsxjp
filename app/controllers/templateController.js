const { Controller } = require('./controller');
const { templateService } = require('../services/templateService');

class TemplateController extends Controller {
  load(req, res) {
    const { id } = req.body;
    templateService.now()
    .then(now => {
      const template = id.split('-').join('/');
      res.render(template, { now });
    });
  }
}

module.exports = {
  TemplateController,
  templateController: new TemplateController(),
};
