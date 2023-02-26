const path = require('path');
const { logger } = require('@jobscale/logger');
const { service: userService } = require('./service');

class Controller {
  async page(req, res) {
    const { url } = req;
    const view = path.join('user', url);
    const options = {
      now: await userService.now(),
    };
    switch (view) {
    case 'user/':
      options.title = 'Users';
      options.items = await userService.findAll();
      res.render(view, options);
      break;
    default:
      res.render(view, options);
      break;
    }
  }

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
    const { id } = req.body;
    userService.remove({ id })
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
