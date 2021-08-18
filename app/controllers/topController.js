const { Controller } = require('./controller');
const { topService } = require('../services/topService');

class TopController extends Controller {
  page(req, res) {
    topService.now()
    .then(now => {
      res.render('', { now });
    });
  }
}

module.exports = {
  TopController,
  topController: new TopController(),
};
