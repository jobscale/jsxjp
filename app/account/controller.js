const { service: accountService } = require('./service');

class Controller {
  password(req, res) {
    const { body } = req;
    const { password } = body;
    const { token } = req.cookies;
    accountService.password({ password, token })
    .then(item => {
      res.json({ login: item.login });
    })
    .catch(e => {
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
