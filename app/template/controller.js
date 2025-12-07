import { logger } from '@jobscale/logger';
import { service } from './service.js';

export class Controller {
  load(req, res) {
    const { id } = req.body;
    return service.load(id)
    .then(html => {
      res.end(html);
    })
    .catch(e => {
      logger.error(e.message);
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
