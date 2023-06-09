const createHttpError = require('http-errors');
const { auth } = require('.');
const { createHash } = require('../user');
const { connection } = require('../db');

const jwtSecret = 'node-express-ejs';

class Service {
  async now() {
    return new Date().toISOString();
  }

  async login(rest) {
    const { login, password } = rest;
    if (!login || !password) throw createHttpError(400);
    const ts = new Date().toISOString();
    const db = await connection();
    return db.fetch({
      login,
      hash: createHash(`${login}/${password}`),
      deletedAt: 0,
    })
    .then(({ items: [item] }) => {
      if (!item) throw createHttpError(401);
      const multiFactor = `0000${Math.floor(Math.random() * 100000)}`.slice(-5);
      return db.update({
        lastAccess: ts,
        multiFactor,
      }, item.key).then(() => ({
        multiFactor,
        token: auth.sign({ login, ts }, jwtSecret),
      }));
    });
  }

  async verify(token) {
    if (!token) throw createHttpError(400);
    if (!auth.verify(token, jwtSecret)) throw createHttpError(403);
  }
}

module.exports = {
  Service,
  service: new Service(),
};
