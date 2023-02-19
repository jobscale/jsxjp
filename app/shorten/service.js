const createHttpError = require('http-errors');
const { connection } = require('../db');

class Service {
  async register(rest) {
    const { html } = rest;
    if (!html) throw createHttpError(400);
    const db = await connection();
    return db.put({ html })
    .then(({ key: id }) => ({ id }));
  }

  async redirect(rest) {
    const { id: key } = rest;
    const db = await connection();
    return db.get(key)
    .then(({ html }) => ({ html }));
  }
}

module.exports = {
  Service,
  service: new Service(),
};
