import createHttpError from 'http-errors';
import { service as auth } from '../app/auth/service.js';
import { service } from '../app/shorten/service.js';

export class Shorten {
  async verify(req) {
    return auth.decode(req.cookies?.token);
  }

  async register(req, res) {
    await this.verify(req);
    const { html } = req.body || {};
    if (!html) throw createHttpError(400);
    const result = await service.register({ html });
    res.json(result);
  }

  async find(req, res) {
    const payload = await this.verify(req);
    if (payload.login !== 'alice') throw createHttpError(403);
    const rows = await service.find();
    res.json({ rows });
  }

  async remove(req, res) {
    await this.verify(req);
    const rows = await service.remove({ key: req.body?.id });
    res.json({ rows });
  }

  async redirect(req, res) {
    const { http: { path: httpPath } } = req.requestContext;
    const id = httpPath.slice('/s/'.length);
    const { html } = await service.redirect({ id });
    res.setHeader('Location', html);
    res.status(307).end('');
  }
}

export const shorten = new Shorten();
