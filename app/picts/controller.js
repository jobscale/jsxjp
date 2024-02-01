const createHttpError = require('http-errors');
const { service } = require('./service');
const { service: authService } = require('../auth/service');

class Controller {
  find(req, res) {
    const { cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.find({ login });
    })
    .then(({ images }) => {
      res.json({ images });
    })
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).send(e.message);
    });
  }

  image(req, res) {
    const { params: { type, fname }, cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.image({ login, type, fname });
    })
    .then(({ ContentType, buffer }) => {
      res.contentType(ContentType);
      buffer.pipe(res);
    })
    .catch(e => {
      if (!e.status) e.status = 404;
      res.status(e.status).send(e.message);
    });
  }

  upload(req, res) {
    const { files, cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.upload({ login, files });
    })
    .then(() => res.json({ ok: true }))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  remove(req, res) {
    const { body: { name }, cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (!login) throw createHttpError(403);
      return service.remove({ login, fname: name });
    })
    .then(() => res.json({ ok: true }))
    .catch(e => {
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

module.exports = {
  Controller,
  controller: new Controller(),
};
