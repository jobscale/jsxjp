import { service } from './service.js';

export class Controller {
  page(req, res) {
    service.now()
    .then(now => {
      res.render('', { now });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
