import { logger } from '@jobscale/create-logger';
import { service } from './service.js';

export class Controller {
  ip(req, res) {
    service.ip(req)
    .then(globalIp => {
      res.setHeader('Content-Type', 'text/plain');
      res.end(globalIp);
    })
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
