import { createHash } from 'crypto';
import createHttpError from 'http-errors';
import { auth } from '../auth/index.js';
import { db } from '../db.js';

export class Service {
  async password(rest) {
    const { password, token } = rest;
    if (!token || !password) throw createHttpError(400);
    const { login } = auth.decode(token);
    if (!login) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (!item) throw createHttpError(400);
      const hash = createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, { ...item, hash })
      .then(user => user);
    });
  }
}

export const service = new Service();

export default { Service, service };
