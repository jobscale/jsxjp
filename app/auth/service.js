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
      active: true,
    })
    .then(({ items: [user] }) => {
      if (!user) throw createHttpError(401);
      return db.update({
        lastLogin: ts,
      }, user.key);
    })
    .then(() => auth.sign({ login, ts }, jwtSecret));
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
