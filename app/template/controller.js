const { service: templateService } = require('./service');

class Controller {
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
  Controller,
  controller: new Controller(),
};
