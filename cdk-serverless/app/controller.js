import { service } from './service.js';

export class Controller {
  page(req, res) {
    return service.now()
    .then(now => {
      res.end(now.toString());
    });
  }
}

export const controller = new Controller();
export default { Controller, controller };
