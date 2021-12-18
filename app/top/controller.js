const { Controller } = require('../controller');
const { topService } = require('./service');

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
