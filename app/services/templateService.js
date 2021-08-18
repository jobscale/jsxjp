const { Service } = require('./service');

class TemplateService extends Service {
}

module.exports = {
  TemplateService,
  templateService: new TemplateService(),
};
