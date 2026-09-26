import { logger } from '@jobscale/create-logger';
import { service } from './service.js';

export class Controller {
  password(req, res) {
    const { body: { password }, cookies: { token } } = req;
    return service.password({ password, token })
    .then(item => {
      res.json({ login: item.key });
    })
    .catch(e => {
      logger.error(e.cause?.message ?? e.cause ?? e.message);
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
