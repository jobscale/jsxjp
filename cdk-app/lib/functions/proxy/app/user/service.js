import crypto from 'crypto';
import createHttpError from 'http-errors';
import { db } from '../db.js';
import { formatTimestamp } from '../timestamp.js';

export class Service {
  async now() {
    return formatTimestamp();
  }

  async find() {
    return db.list('user')
    .then(items => items.map(item => {
      item.id = item.key;
      delete item.key;
      delete item.hash;
      if (!item.role) item.role = 'guest';
      return item;
    }));
  }

  async register(rest) {
    const { login, password, role } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (item) throw createHttpError(400);
      const hash = crypto.createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        registerAt: formatTimestamp(),
        hash,
        role,
        deletedAt: 0,
      });
    });
  }

  async reset(rest) {
    const { login, password, role } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (!item) throw createHttpError(400);
      const hash = crypto.createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        ...item,
        hash,
        role,
        deletedAt: 0,
      }, item.key).then(() => item);
    });
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    return db.getValue('user', key)
    .then(item => {
      if (!item) throw createHttpError(400);
      if (item.deletedAt) return db.deleteValue('user', key);
      return db.setValue('user', key, {
        ...item,
        deletedAt: formatTimestamp(),
      });
    });
  }
}

export const service = new Service();
export default { Service, service };
