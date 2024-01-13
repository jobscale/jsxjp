const createHttpError = require('http-errors');
const { logger } = require('@jobscale/logger');
const { service: userService } = require('./service');
const { service: authService } = require('../auth/service');

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

  find(req, res) {
    const { body: { id: key }, cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (login !== 'alice') throw createHttpError(403);
    })
    .then(() => userService.find({ key }))
    .then((rows) => {
      res.json({ rows });
    })
    .catch(e => {
      if (!e.statusCode) e.statusCode = 500;
      res.status(e.statusCode).json({ message: e.message });
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
