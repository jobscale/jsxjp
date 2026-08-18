import createHttpError from 'http-errors';
import { validation } from '../../../../../app/account/validation.js';
import { service } from '../../../../../app/account/service.js';

export class Account {
  async password(req, res) {
    await validation.password(req, res);
    if (res.writableEnded) {
      throw createHttpError(res.statusCode, res.body.message);
    }
    const item = await service.password({
      password: req.body.password,
      token: req.cookies?.token,
    });
    return { login: item.key };
  }
}

export const account = new Account();
