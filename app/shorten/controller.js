import createHttpError from 'http-errors';
import { service } from './service.js';
import { service as authService } from '../auth/service.js';

export class Controller {
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
    const { cookies: { token } } = req;
    authService.decode(token)
    .then(payload => {
      const { login } = payload;
      if (login !== 'alice') throw createHttpError(403);
    })
    .then(() => service.find())
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

export const controller = new Controller();

export default {
  Controller,
  controller,
};
