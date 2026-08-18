import createHttpError from 'http-errors';
import { service as auth } from '../../../../../app/auth/service.js';
import { service } from '../../../../../app/shorten/service.js';

export class Shorten {
  async verify(req) {
    return auth.decode(req.cookies?.token);
  }

  async register(req) {
    await this.verify(req);
    const { html } = req.body || {};
    if (!html) throw createHttpError(400);
    return service.register({ html });
  }

  async find(req) {
    const payload = await this.verify(req);
    if (payload.login !== 'alice') throw createHttpError(403);
    const rows = await service.find();
    return { rows };
  }

  async remove(req) {
    await this.verify(req);
    const rows = await service.remove({ key: req.body?.id });
    return { rows };
  }

  async redirect(id) {
    const { html } = await service.redirect({ id });
    return { redirect: html };
  }
}

export const shorten = new Shorten();
