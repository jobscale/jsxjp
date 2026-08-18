import { validation } from '../../../../app/api/validation.js';
import { service } from '../../../../app/api/service.js';
import { service as auth } from '../../../../app/auth/service.js';

const notificationAddress = [
  'jobscalespam@gmail.com',
  'jobscalespam@na-cat.com',
].join(',');

export class Api {
  async slack(req, res) {
    await validation.slack(req, res);
    return service.slack(req.body);
  }

  async email(req, res) {
    await validation.email(req, res);
    const { subject, text } = req.body;
    return service.email({ to: notificationAddress, subject, text });
  }

  async webPush(req, res) {
    await validation.webPush(req, res);
    return service.webPush(req.body);
  }

  async sendmail(req, res) {
    await validation.sendmail(req, res);
    const { secret, digit, content } = req.body;
    return service.sendmail({
      secret,
      digit,
      content: { ...content, to: notificationAddress },
    });
  }

  async subscription(req, res) {
    await validation.subscription(req, res);
    const { body } = req;
    const host = req.headers.get('host');
    const { login } = await auth.decode(req.cookies?.token).catch(() => ({}));
    return service.subscription({ ...body, host }, login);
  }

  getNumber() {
    return service.getNumber();
  }

  public() {
    return service.public();
  }

  hostname() {
    return service.hostname();
  }

  speed(req, res) {
    res.headers.set('Content-Type', 'application/octet-stream');
    return service.speed({ timestamp: req.body });
  }
}

export const api = new Api();
