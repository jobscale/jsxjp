import createHttpError from 'http-errors';
import { service as auth } from '../../../../app/auth/service.js';
import { service } from '../../../../app/picts/service.js';

export class Picts {
  async login(req) {
    const payload = await auth.decode(req.cookies?.token);
    if (!payload.login) throw createHttpError(403);
    return payload.login;
  }

  async upload(req, res) {
    const login = await this.login(req);
    await service.upload({ login, files: req.files || [] });
    res.json({ ok: true });
  }

  async find(req, res) {
    const login = await this.login(req);
    const { images } = await service.find({ login });
    res.json({ images });
  }

  async remove(req, res) {
    const login = await this.login(req);
    await service.remove({ login, fname: req.body?.name });
    res.json({ ok: true });
  }

  async getData(req, res) {
    const login = await this.login(req);
    const result = await service.getData({ login, list: req.body });
    res.json(result);
  }

  async putData(req, res) {
    const login = await this.login(req);
    await service.putData({ login, dataset: req.body });
    res.json({ ok: true });
  }

  async image(req, res, type, fname) {
    const login = await this.login(req);
    const { ContentType, Body } = await service.image({ login, type, fname });
    const chunks = [];
    for await (const chunk of Body) chunks.push(chunk);
    res.headers.set('Content-Type', ContentType);
    res.end(Buffer.concat(chunks));
  }
}

export const picts = new Picts();
