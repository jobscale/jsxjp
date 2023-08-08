const { logger } = require('@jobscale/logger');
const { service: userService } = require('./service');

class Controller {
  // res.render(view, options);

  register(req, res) {
    const { login, password } = req.body;
    userService.register({ login, password })
    .then(item => {
      res.json({ login: item.login });
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  reset(req, res) {
    const { login, password } = req.body;
    userService.reset({ login, password })
    .then(item => {
      res.json({ login: item.login });
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  remove(req, res) {
    const { id: key } = req.body;
    userService.remove({ key })
    .then(item => {
      res.json({ deletedAt: item.deletedAt });
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
