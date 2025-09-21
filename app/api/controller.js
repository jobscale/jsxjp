import { logger } from '@jobscale/logger';
import { service } from './service.js';
import { service as authService } from '../auth/service.js';

export class Controller {
  slack(req, res) {
    const { body } = req;
    return service.slack(body)
    .then(result => res.json(result))
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  email(req, res) {
    const { body: { subject, text } } = req;
    const to = [
      'jobscalespam@gmail.com',
      'jobscalespam@na-cat.com',
    ];
    return service.email({
      to: to.join(','),
      subject,
      text,
    })
    .then(result => res.json(result))
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  public(req, res) {
    return service.public()
    .then(result => res.end(result))
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).end();
    });
  }

  async subscription(req, res) {
    const { body, cookies: { token } } = req;
    const { login } = await authService.decode(token).catch(() => ({}));
    return service.subscription(body, login)
    .then(result => res.json(result))
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }

  hostname(req, res) {
    return service.hostname()
    .then(result => res.json(result))
    .catch(e => {
      logger.error({ message: e.toString() });
      if (!e.status) e.status = 500;
      res.status(e.status).json({ message: e.message });
    });
  }
}

export const controller = new Controller();

export default {
  Controller,
  controller,
};
