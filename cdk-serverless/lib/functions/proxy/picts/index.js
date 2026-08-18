import createHttpError from 'http-errors';
import { service as auth } from '../../../../../app/auth/service.js';
import { service } from '../../../../../app/picts/service.js';

export class Picts {
  async login(req) {
    const payload = await auth.decode(req.cookies?.token);
    if (!payload.login) throw createHttpError(403);
    return payload.login;
  }

  async upload(req) {
    const login = await this.login(req);
    await service.upload({ login, files: req.files || [] });
    return { ok: true };
  }

  async find(req) {
    const login = await this.login(req);
    const { images } = await service.find({ login });
    return { images };
  }

  async remove(req) {
    const login = await this.login(req);
    await service.remove({ login, fname: req.body?.name });
    return { ok: true };
  }

  async getData(req) {
    const login = await this.login(req);
    return service.getData({ login, list: req.body });
  }

  async putData(req) {
    const login = await this.login(req);
    await service.putData({ login, dataset: req.body });
    return { ok: true };
  }

  async image(req, res, type, fname) {
    const login = await this.login(req);
    const { ContentType, Body } = await service.image({ login, type, fname });
    const chunks = [];
    for await (const chunk of Body) chunks.push(chunk);
    res.headers.set('Content-Type', ContentType);
    return Buffer.concat(chunks);
  }
}

export const picts = new Picts();
