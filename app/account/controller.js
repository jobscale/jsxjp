import { service } from './service.js';

export class Controller {
  password(req, res) {
    const { body } = req;
    const { password } = body;
    const { token } = req.cookies;
    return service.password({ password, token })
    .then(item => {
      res.json({ login: item.login });
    })
    .catch(e => {
      if (!e.status) e.status = 503;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
