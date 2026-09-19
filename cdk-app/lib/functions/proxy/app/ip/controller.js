import { logger } from '@jobscale/create-logger';
import { service } from './service.js';

export class Controller {
  ip(req, res) {
    return service.ip(req)
    .then(globalIp => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(globalIp);
    })
    .catch(e => {
      logger.error({ message: e.cause?.message ?? e.cause ?? e.message });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.cause?.message ?? e.cause ?? e.message });
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
