const { service } = require('./service');

class Controller {
  page(req, res) {
    service.now()
    .then(now => {
      res.render('', { now });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
