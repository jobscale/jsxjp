import { service as templateService } from './service.js';

export class Controller {
  load(req, res) {
    const { id } = req.body;
    templateService.now()
    .then(now => {
      const template = id.split('-').join('/');
      res.render(template, { now });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
