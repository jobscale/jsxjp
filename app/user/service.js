const createHttpError = require('http-errors');
const { Deta } = require('deta');
const { createHash } = require('.');

const { ENV, DETA_PROJECT_KEY } = process.env;

const deta = Deta(DETA_PROJECT_KEY);
const db = deta.Base(`${ENV}-user`);

class Service {
  async now() {
    return new Date().toISOString();
  }

  findAll() {
    return db.fetch({ active: true })
    .then(({ items }) => items);
  }

  async register(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    await db.fetch({ login })
    .then(({ items }) => {
      if (items.length) throw createHttpError(400);
    });
    const hash = createHash(`${login}/${password}`);
    return db.put({
      login, hash, active: true,
    });
  }

  async reset(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    return db.fetch({ login })
    .then(({ items: [user] }) => {
      if (!user) throw createHttpError(400);
      user.hash = createHash(`${login}/${password}`);
      const { key } = user;
      delete user.key;
      return db.update(user, key);
    });
  }
}

module.exports = {
  Service,
  service: new Service(),
};
