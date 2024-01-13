const createHttpError = require('http-errors');
const { service } = require('./service');
const { service: authService } = require('../auth/service');

class Controller {
  register(req, res) {
    const { html } = req.body;
    if (!html) {
      const { message } = createHttpError(400);
      res.status(400).json({ message });
      return;
    }

    service.register({ html })
    .then(({ id }) => res.json({ id }))
    .catch(e => {
      if (!e.statusCode) e.statusCode = 500;
      res.status(e.statusCode).json({ message: e.message });
    });
  }

  redirect(req, res) {
    const { id } = req.params;
    if (!id) {
      const { message } = createHttpError(400);
      res.status(400).json({ message });
      return;
    }

    service.redirect({ id })
    .then(({ html }) => {
      res.redirect(html);
    })
    .catch(e => {
      if (!e.statusCode) e.statusCode = 500;
      res.status(e.statusCode).json({ message: e.message });
    });
  }

  find(req, res) {
    const { body: { id: key }, cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (login !== 'alice') throw createHttpError(403);
    })
    .then(() => service.find({ key }))
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
    service.remove({ key })
    .then((rows) => {
      res.json({ rows });
    })
    .catch(e => {
      if (!e.statusCode) e.statusCode = 500;
      res.status(e.statusCode).json({ message: e.message });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
