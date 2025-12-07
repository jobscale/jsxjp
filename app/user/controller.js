import createHttpError from 'http-errors';
import { logger } from '@jobscale/logger';
import { service as authService } from '../auth/service.js';
import { service } from './service.js';

export class Controller {
  register(req, res) {
    const { login, password } = req.body;
    return service.register({ login, password })
    .then(() => {
      res.json({ login });
    })
    .catch(e => {
      logger.info({ message: e.toString() });
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }

  reset(req, res) {
    const { login, password } = req.body;
    return service.reset({ login, password })
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
    const { cookies: { token } } = req;
    return authService.decode(token)
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
    return service.remove({ key })
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

export const controller = new Controller();

export default { Controller, controller };
