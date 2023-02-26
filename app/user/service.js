const createHttpError = require('http-errors');
const { createHash } = require('.');
const { connection } = require('../db');

class Service {
  async now() {
    return new Date().toISOString();
  }

  async findAll() {
    const db = await connection();
    return db.fetch()
    .then(({ items }) => items);
  }

  async register(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ login })
    .then(({ items: [item] }) => {
      if (item) throw createHttpError(400);
      return db.put({
        login,
        deletedAt: '',
        registerAt: new Date().toISOString(),
        hash: createHash(`${login}/${password}`),
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ login })
    .then(({ items: [item] }) => {
      if (!item) throw createHttpError(400);
      return db.update({
        hash: createHash(`${login}/${password}`),
      }, item.key).then(() => item);
    });
  }
}

module.exports = {
  Service,
  service: new Service(),
};
