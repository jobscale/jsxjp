import createHttpError from 'http-errors';
import { validation } from '../../../../../app/user/validation.js';
import { service } from '../../../../../app/user/service.js';
import { service as auth } from '../../../../../app/auth/service.js';

export class User {
  async register(req, res) {
    await validation.register(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    await service.register(req.body);
    return { login: req.body.login };
  }

  async reset(req, res) {
    await validation.reset(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const item = await service.reset(req.body);
    return { login: item.login };
  }

  async find(req) {
    const payload = await auth.decode(req.cookies?.token);
    if (payload.login !== 'alice') throw createHttpError(403);
    const rows = await service.find();
    return { rows };
  }

  async remove(req) {
    const item = await service.remove({ key: req.body.id });
    return { deletedAt: item.deletedAt };
  }
}

export const user = new User();
