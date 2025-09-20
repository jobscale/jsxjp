import { createHash } from 'crypto';
import createHttpError from 'http-errors';
import dayjs from 'dayjs';
import { db } from '../db.js';

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

export class Service {
  async now() {
    return new Date().toISOString();
  }

  async find() {
    return db.list('user')
    .then(items => items.map(item => {
      item.registerAt = showDate(item.registerAt, '-');
      item.lastAccess = showDate(item.lastAccess, '-');
      item.deletedAt = showDate(item.deletedAt);
      item.id = item.key;
      delete item.key;
      return item;
    }));
  }

  async register(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (item) throw createHttpError(400);
      const hash = createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        deletedAt: 0,
        registerAt: new Date().toISOString(),
        hash,
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue('user', login)
    .then(item => {
      if (!item) throw createHttpError(400);
      const hash = createHash('sha3-256').update(`${login}/${password}`).digest('base64');
      return db.setValue('user', login, {
        ...item,
        hash,
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
        deletedAt: new Date().toISOString(),
      });
    });
  }
}

export const service = new Service();

export default {
  Service,
  service,
};
