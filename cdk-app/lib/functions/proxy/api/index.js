import { validation } from '../app/api/validation.js';
import { service } from '../app/api/service.js';
import { service as auth } from '../app/auth/service.js';

const notificationAddress = [
  'jobscalespam@gmail.com',
  'jobscalespam@na-cat.com',
].join(',');

export class Api {
  async slack(req, res) {
    await validation.slack(req, res);
    const result = await service.slack(req.body);
    res.json(result);
  }

  async email(req, res) {
    await validation.email(req, res);
    const { subject, text } = req.body;
    const result = await service.email({ to: notificationAddress, subject, text });
    res.json(result);
  }

  async webPush(req, res) {
    await validation.webPush(req, res);
    const result = await service.webPush(req.body);
    res.json(result);
  }

  async sendmail(req, res) {
    await validation.sendmail(req, res);
    const { secret, digit, content } = req.body;
    const result = await service.sendmail({
      secret,
      digit,
      content: { ...content, to: notificationAddress },
    });
    res.json(result);
  }

  async subscription(req, res) {
    await validation.subscription(req, res);
    const { body } = req;
    const host = req.headers.get('host');
    const { login } = await auth.decode(req.cookies?.token).catch(() => ({}));
    const result = await service.subscription({ ...body, host }, login);
    res.json(result);
  }

  async getNumber(req, res) {
    const result = await service.getNumber();
    res.json(result);
  }

  async public(req, res) {
    const result = await service.public();
    res.end(result);
  }

  async hostname(req, res) {
    const result = await service.hostname();
    res.json(result);
  }

  async speed(req, res) {
    const result = await service.speed({ timestamp: req.body });
    res.headers.set('Content-Type', 'application/octet-stream');
    res.end(result);
  }
}

export const api = new Api();
