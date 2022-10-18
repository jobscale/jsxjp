const { templateService } = require('./service');

class TemplateController {
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
