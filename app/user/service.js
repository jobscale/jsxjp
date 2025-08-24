import createHttpError from 'http-errors';
import dayjs from 'dayjs';
import { createHash } from './index.js';
import { db } from '../db.js';

const { ENV } = process.env;

const tableName = {
  stg: 'stg-user',
  dev: 'user',
  test: 'user',
}[ENV];

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

export class Service {
  async now() {
    return new Date().toISOString();
  }

  async find() {
    return db.list(tableName)
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
    return db.getValue(tableName, login)
    .then(item => {
      if (item) throw createHttpError(400);
      return db.setValue(tableName, login, {
        deletedAt: 0,
        registerAt: new Date().toISOString(),
        hash: createHash(`${login}/${password}`),
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.getValue(tableName, login)
    .then(item => {
      if (!item) throw createHttpError(400);
      return db.setValue(tableName, login, {
        ...item,
        hash: createHash(`${login}/${password}`),
        deletedAt: 0,
      }, item.key).then(() => item);
    });
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    return db.getValue(tableName, key)
    .then(item => {
      if (!item) throw createHttpError(400);
      if (item.deletedAt) return db.deleteValue(tableName, key);
      return db.setValue(tableName, key, {
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
