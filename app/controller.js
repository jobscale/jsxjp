const { topService } = require('./service');

class TopController {
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
