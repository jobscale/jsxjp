const createHttpError = require('http-errors');
const dayjs = require('dayjs');
const { createHash } = require('.');
const { connection } = require('../db');

const { ENV } = process.env;
const tableName = {
  dev: 'dev-user',
  test: 'dev-user',
}[ENV || 'dev'];

const showDate = (date, defaultValue) => (date ? dayjs(date).add(9, 'hours').toISOString()
.replace(/T/, ' ')
.replace(/\..*$/, '') : defaultValue);

class Service {
  async now() {
    return new Date().toISOString();
  }

  async find({ key }) {
    const db = await connection(tableName);
    return db.fetch({ key })
    .then(({ items }) => items.map(item => {
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
    const db = await connection(tableName);
    return db.fetch({ login })
    .then(({ items: [item] }) => {
      if (item) throw createHttpError(400);
      return db.put({
        login,
        deletedAt: 0,
        registerAt: new Date().toISOString(),
        hash: createHash(`${login}/${password}`),
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({ login })
    .then(({ items: [item] }) => {
      if (!item) throw createHttpError(400);
      return db.update({
        hash: createHash(`${login}/${password}`),
        deletedAt: 0,
      }, item.key).then(() => item);
    });
  }

  async remove({ key }) {
    if (!key) throw createHttpError(400);
    const db = await connection(tableName);
    return db.get(key)
    .then(data => {
      if (!data) throw createHttpError(400);
      if (data.deletedAt) return db.delete(data.key);
      return db.update({
        deletedAt: new Date().getTime(),
      }, data.key);
    });
  }
}

module.exports = {
  Service,
  service: new Service(),
};
