const createHttpError = require('http-errors');
const { auth } = require('../auth');
const { createHash } = require('../user');
const { connection } = require('../db');

class Service {
  async password(rest) {
    const { password, token } = rest;
    if (!token || !password) throw createHttpError(400);
    const { login } = auth.decode(token);
    if (!login) throw createHttpError(400);
    const db = await connection();
    return db.fetch({
      login, active: true,
    })
    .then(({ items: [user] }) => {
      if (!user) throw createHttpError(400);
      user.hash = createHash(`${login}/${password}`);
      const { key } = user;
      delete user.key;
      return db.update(user, key)
      .then(() => user);
    });
  }
}

module.exports = {
  Service,
  service: new Service(),
};
