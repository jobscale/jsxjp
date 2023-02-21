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
    .then(({ items }) => items.map(item => {
      delete item.key;
      return item;
    }));
  }

  async register(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ login })
    .then(({ items: [user] }) => {
      if (user) throw createHttpError(400);
      return db.put({
        login,
        hash: createHash(`${login}/${password}`),
        active: true,
      });
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const db = await connection();
    return db.fetch({ login })
    .then(({ items: [user] }) => {
      if (!user) throw createHttpError(400);
      return db.update({
        hash: createHash(`${login}/${password}`),
      }, user.key).then(() => user);
    });
  }
}

module.exports = {
  Service,
  service: new Service(),
};
