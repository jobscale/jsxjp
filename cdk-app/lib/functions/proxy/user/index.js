import createHttpError from 'http-errors';
import { validation } from '../app/user/validation.js';
import { service } from '../app/user/service.js';
import { service as auth } from '../app/auth/service.js';

export class User {
  async register(req, res) {
    await validation.register(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    await service.register(req.body);
    res.json({ login: req.body.login });
  }

  async reset(req, res) {
    await validation.reset(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const item = await service.reset(req.body);
    res.json({ login: item.login });
  }

  async find(req, res) {
    const payload = await auth.decode(req.cookies?.token);
    if (payload.login !== 'alice') throw createHttpError(403);
    const rows = await service.find();
    res.json({ rows });
  }

  async remove(req, res) {
    const item = await service.remove({ key: req.body.id });
    res.json({ deletedAt: item.deletedAt });
  }
}

export const user = new User();
