const createHttpError = require('http-errors');
const { auth } = require('../auth');
const { createHash } = require('../user');
const { connection } = require('../db');

const { ENV } = process.env;
const tableName = `${ENV || 'dev'}-user`;

class Service {
  async password(rest) {
    const { password, token } = rest;
    if (!token || !password) throw createHttpError(400);
    const { login } = auth.decode(token);
    if (!login) throw createHttpError(400);
    const db = await connection(tableName);
    return db.fetch({
      login, deletedAt: 0,
    })
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
